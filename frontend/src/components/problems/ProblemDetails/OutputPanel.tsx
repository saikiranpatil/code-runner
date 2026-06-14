import type { ExecResult, ExecStatus } from "@/api/execution/execution"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, Clock3, Loader2, MemoryStick, Terminal, XCircle } from "lucide-react"
import { useState, type JSX } from "react"
import VerdictBadge from "./components/VerdictBadge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"

interface OutputPanelProps {
    status: ExecStatus
    result: ExecResult | null
    customInput: string
    onCustomInputChange: (value: string) => void
}

export default function OutputPanel({
    status,
    result,
    customInput,
    onCustomInputChange,
}: OutputPanelProps): JSX.Element {
    const [activeTab, setActiveTab] = useState<string>("output")

    const isLoading = status === "running" || status === "submitting"

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
            {/* Tab bar */}
            <div className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-muted/20 px-3">
                <TabsList className="h-auto gap-0.5 bg-transparent p-0">
                    <TabsTrigger
                        value="output"
                        className="h-7 rounded-lg px-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-none"
                    >
                        Test Results
                    </TabsTrigger>
                    <TabsTrigger
                        value="custom"
                        className="h-7 rounded-lg px-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-none"
                    >
                        Custom Input
                    </TabsTrigger>
                </TabsList>

                {result && status === "done" && (
                    <div className="flex items-center gap-1.5">
                        {result.verdict === "ACCEPTED" ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-emerald-500">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Accepted
                            </span>
                        ) : result.verdict ? (
                            <VerdictBadge verdict={result.verdict} />
                        ) : null}
                    </div>
                )}
            </div>

            {/* Output tab */}
            <TabsContent value="output" className="min-h-0 flex-1 mt-0">
                <ScrollArea className="h-full">
                    {isLoading ? (
                        <div className="flex h-32 flex-col items-center justify-center gap-2.5 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="text-xs">
                                {status === "submitting" ? "Submitting…" : "Running against test cases…"}
                            </span>
                        </div>
                    ) : !result ? (
                        <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
                            <Terminal className="h-6 w-6 stroke-[1.5]" />
                            <div className="text-center">
                                <p className="text-xs font-medium">No results yet</p>
                                <p className="text-xs text-muted-foreground/60">Run your code to see output here</p>
                            </div>
                        </div>
                    ) : result.state === "failed" ? (
                        <div className="p-4">
                            <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 p-3.5">
                                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-destructive">Execution failed</p>
                                    {result.error && (
                                        <pre className="whitespace-pre-wrap font-mono text-xs text-destructive/80">
                                            {result.error}
                                        </pre>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3 p-4">
                            {/* Summary row */}
                            <div className="flex flex-wrap items-center gap-2">
                                {result.timedOut && (
                                    <span className="flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500">
                                        <Clock3 className="h-3 w-3" /> Time Limit Exceeded
                                    </span>
                                )}
                                {result.oomKilled && (
                                    <span className="flex items-center gap-1 rounded-md border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-500">
                                        <MemoryStick className="h-3 w-3" /> Memory Limit Exceeded
                                    </span>
                                )}
                                {result.outputLimitHit && (
                                    <span className="flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                        <Terminal className="h-3 w-3" /> Output truncated
                                    </span>
                                )}
                                <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                                    Exit code: <code className="font-mono">{result.exitCode ?? "—"}</code>
                                </span>
                            </div>

                            {/* Stdout */}
                            {result.stdout ? (
                                <div className="space-y-1.5">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">stdout</p>
                                    <pre className="min-h-8 whitespace-pre-wrap break-all rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs leading-relaxed">
                                        {result.stdout}
                                    </pre>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">stdout</p>
                                    <p className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground/60 italic">
                                        No output.
                                    </p>
                                </div>
                            )}

                            {/* Stderr */}
                            {result.stderr && (
                                <div className="space-y-1.5">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-destructive">stderr</p>
                                    <pre className="whitespace-pre-wrap break-all rounded-lg border border-destructive/20 bg-destructive/5 p-3 font-mono text-xs leading-relaxed text-destructive">
                                        {result.stderr}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                </ScrollArea>
            </TabsContent>

            {/* Custom input tab */}
            <TabsContent value="custom" className="min-h-0 flex-1 mt-0 p-4">
                <div className="flex h-full flex-col gap-2">
                    <p className="text-xs text-muted-foreground">
                        Provide a custom stdin to test against. The format must match the problem's input spec.
                    </p>
                    <Textarea
                        value={customInput}
                        onChange={(e) => onCustomInputChange(e.target.value)}
                        placeholder={"2 7 11 15\n9"}
                        className="flex-1 resize-none rounded-lg font-mono text-xs"
                        spellCheck={false}
                    />
                </div>
            </TabsContent>
        </Tabs>
    )
}
