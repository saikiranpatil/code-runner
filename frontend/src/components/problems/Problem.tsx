import { useState } from "react"

import {
    Play,
    Check,
    Clock3,
    MemoryStick,
    Terminal,
    ChevronRight,
    AlertCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import CodeEditor from "@/common/components/code-editor"

import { useMutation } from "@tanstack/react-query"
import { LANGUAGES } from "@/common/constants"

interface ExecutionResult {
    stdout: string
    stderr: string
    exitCode: number
    timedOut: boolean
    oomKilled: boolean
    outputLimitHit: boolean
}

export default function Problem() {
    const [code, setCode] = useState('console.log("hello from js")');
    const [language, setLanguage] = useState("javascript");
    const [resultsActiveTab, setResultsActiveTab] = useState<"results" | "testcases" | "console">("results");
    const executeCodeMutation = useMutation<ExecutionResult, Error>({
        mutationFn: async () => {
            // 1. Submit job
            const response = await fetch("/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, language }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }

            const { jobId } = await response.json();

            // 2. Poll for result
            const TIMEOUT_MS = 30_000;
            const started = Date.now();

            return new Promise<ExecutionResult>((resolve, reject) => {
                const interval = setInterval(async () => {
                    if (Date.now() - started > TIMEOUT_MS) {
                        clearInterval(interval);
                        return reject(new Error("Timed out waiting for result"));
                    }

                    try {
                        const res = await fetch(`/execute/${jobId}`);
                        if (!res.ok) throw new Error(`Poll error: ${res.status}`);

                        const data = await res.json(); // { state, result, error }

                        if (data.state === "completed") {
                            clearInterval(interval);
                            resolve(data.result); // data.result is your ExecutionResult
                        } else if (data.state === "failed") {
                            clearInterval(interval);
                            reject(new Error(data.error || "Execution failed"));
                        }
                        // else: still waiting (active/waiting/delayed), keep polling
                    } catch (err) {
                        clearInterval(interval);
                        reject(err);
                    }
                }, 1000);
            });
        },

        onSuccess: (data) => {
            setResultsActiveTab("results");
            console.log("Execution Result:", data);
        },

        onError: (error) => {
            setResultsActiveTab("results");
            console.error(error.message);
        },
    });

    const responseData = executeCodeMutation.data;

    const isSuccess = responseData && responseData.exitCode === 0 && !responseData.timedOut && !responseData.oomKilled;
    const isRuntimeError = responseData && responseData.exitCode !== 0;

    return (
        <div className="h-[calc(100vh-56px)]">
            <ResizablePanelGroup orientation="horizontal">
                <ResizablePanel defaultSize={38} minSize={28}>
                    <div className="flex h-full flex-col border-r border-border bg-sidebar">
                        <div className="border-b border-sidebar-border px-5 py-4">
                            <div className="mb-3 flex items-center gap-2">
                                <Badge className="font-heading">MEDIUM</Badge>
                                <span className="font-heading text-xs text-chart-2">SOLVED BY 128K</span>
                            </div>

                            <h1 className="font-heading text-xl font-semibold">Sliding Window Maximum</h1>

                            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Arrays</span>
                                <ChevronRight className="h-3 w-3" />
                                <span>Queue</span>
                                <ChevronRight className="h-3 w-3" />
                                <span>Sliding Window</span>
                            </div>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="space-y-8 p-6">
                                <section className="space-y-4">
                                    <h2 className="font-heading text-sm uppercase tracking-wide text-muted-foreground">Problem</h2>
                                    <p className="leading-7 text-muted-foreground">
                                        Given an integer array nums and a sliding window of size k, return the maximum value inside every valid contiguous window.
                                    </p>
                                </section>

                                <section className="space-y-4">
                                    <div className="rounded-2xl border border-border bg-card p-5">
                                        <div className="mb-4 flex items-center justify-between">
                                            <h3 className="font-heading text-sm">Example 1</h3>
                                            <Badge variant="outline">Public</Badge>
                                        </div>
                                        <div className="space-y-3 font-heading text-sm">
                                            <p>nums = [1,3,-1,-3,5,3,6,7]</p>
                                            <p>k = 3</p>
                                            <Separator />
                                            <p>Output = [3,3,5,5,6,7]</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="font-heading text-sm uppercase tracking-wide text-muted-foreground">Constraints</h2>
                                    <div className="rounded-2xl border border-border bg-card p-5 font-heading text-sm text-muted-foreground">
                                        <ul className="space-y-2">
                                            <li>1 ≤ nums.length ≤ 10⁵</li>
                                            <li>-10⁴ ≤ nums[i] ≤ 10⁴</li>
                                            <li>1 ≤ k ≤ nums.length</li>
                                        </ul>
                                    </div>
                                </section>
                            </div>
                        </ScrollArea>
                    </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={62}>
                    <ResizablePanelGroup orientation="vertical">
                        <ResizablePanel defaultSize={60} minSize={30}>
                            <div className="flex h-full flex-col">
                                <div className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
                                    <div className="flex items-center gap-3">
                                        <Select value={language} onValueChange={(value) => setLanguage(value)}>
                                            <SelectTrigger className="w-32.5 rounded-xl">
                                                <SelectValue placeholder="Language" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectGroup>
                                                    {LANGUAGES.map(({ label, value }) => (
                                                        <SelectItem value={value}>{label}</SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Button
                                        onClick={() => executeCodeMutation.mutate()}
                                        disabled={executeCodeMutation.isPending}
                                        className="rounded-xl gap-2 font-medium"
                                        size="sm"
                                    >
                                        <Play className="h-3.5 w-3.5 fill-current" />
                                        {executeCodeMutation.isPending ? "Running..." : "Run Code"}
                                    </Button>
                                </div>

                                <div className="flex-1 bg-zinc-950 dark:bg-zinc-950">
                                    <CodeEditor initialCode={code} onCodeChange={setCode} language={language} />
                                </div>
                            </div>
                        </ResizablePanel>

                        <ResizableHandle withHandle />

                        <ResizablePanel defaultSize={40} minSize={20}>
                            <div className="flex h-full flex-col bg-background">
                                <Tabs
                                    value={resultsActiveTab}
                                    onValueChange={(val) => setResultsActiveTab(val as any)}
                                    className="flex h-full flex-col"
                                >
                                    <div className="flex h-12 items-center justify-between border-b border-border px-4 bg-muted/40">
                                        <TabsList className="bg-transparent h-auto p-0 gap-1">
                                            <TabsTrigger value="results" className="data-[state=active]:bg-background rounded-lg text-xs h-8">
                                                Test Results
                                            </TabsTrigger>
                                            <TabsTrigger value="testcases" className="data-[state=active]:bg-background rounded-lg text-xs h-8">
                                                Custom Input
                                            </TabsTrigger>
                                        </TabsList>
                                    </div>

                                    <div className="flex-1 p-4 overflow-auto">
                                        <TabsContent value="results" className="mt-0 h-full">
                                            {executeCodeMutation.isPending && (
                                                <div className="flex h-full items-center justify-center gap-2 text-muted-foreground text-sm">
                                                    <Clock3 className="h-4 w-4 animate-spin" />
                                                    Executing your solution isolatedly...
                                                </div>
                                            )}

                                            {executeCodeMutation.isError && (
                                                <div className="flex items-center gap-2 text-destructive border border-destructive/20 bg-destructive/10 p-3 rounded-xl text-sm">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <span>{executeCodeMutation.error.message}</span>
                                                </div>
                                            )}

                                            {!executeCodeMutation.isPending && responseData && (
                                                <div className="space-y-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {isSuccess && (
                                                            <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border-emerald-500/20 rounded-lg gap-1 px-2.5 py-1 text-xs">
                                                                <Check className="h-3 w-3" /> Success (Exit 0)
                                                            </Badge>
                                                        )}
                                                        {isRuntimeError && (
                                                            <Badge variant="destructive" className="rounded-lg gap-1 px-2.5 py-1 text-xs">
                                                                <AlertCircle className="h-3 w-3" /> Runtime Error (Exit {responseData.exitCode})
                                                            </Badge>
                                                        )}
                                                        {responseData.timedOut && (
                                                            <Badge variant="destructive" className="rounded-lg gap-1 px-2.5 py-1 text-xs">
                                                                <Clock3 className="h-3 w-3" /> Time Limit Exceeded
                                                            </Badge>
                                                        )}
                                                        {responseData.oomKilled && (
                                                            <Badge variant="destructive" className="rounded-lg gap-1 px-2.5 py-1 text-xs">
                                                                <MemoryStick className="h-3 w-3" /> Out Of Memory
                                                            </Badge>
                                                        )}
                                                        {responseData.outputLimitHit && (
                                                            <Badge variant="destructive" className="rounded-lg gap-1 px-2.5 py-1 text-xs">
                                                                <Terminal className="h-3 w-3" /> Output Limit Exceeded
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {responseData.stdout && (
                                                        <div className="space-y-1.5">
                                                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Standard Output</span>
                                                            <pre className="rounded-xl border border-border bg-muted/50 p-4 font-mono text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                                                                {responseData.stdout}
                                                            </pre>
                                                        </div>
                                                    )}

                                                    {responseData.stderr && (
                                                        <div className="space-y-1.5">
                                                            <span className="text-xs font-semibold uppercase tracking-wider text-destructive">Standard Error</span>
                                                            <pre className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 font-mono text-sm leading-relaxed text-destructive whitespace-pre-wrap">
                                                                {responseData.stderr}
                                                            </pre>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {!executeCodeMutation.isPending && !responseData && !executeCodeMutation.isError && (
                                                <div className="flex h-full flex-col items-center justify-center text-muted-foreground text-center p-6">
                                                    <Terminal className="h-8 w-8 mb-2 stroke-[1.5]" />
                                                    <p className="text-sm font-medium">No execution active</p>
                                                    <p className="text-xs text-muted-foreground/70 max-w-60 mt-1">Write code and run it to view terminal stdout and evaluation metrics here.</p>
                                                </div>
                                            )}
                                        </TabsContent>

                                        <TabsContent value="testcases" className="mt-0 h-full">
                                            <div className="text-xs text-muted-foreground">
                                                Provide static mock arguments or automated test runners inputs here.
                                            </div>
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            </div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}