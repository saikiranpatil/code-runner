import { useState } from "react"
import {
    Play,
    Clock3,
    MemoryStick,
    Terminal,
    AlertCircle,
    Loader2,
    CheckCircle2,
    XCircle,
    ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup
} from "@/components/ui/resizable"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import CodeEditor from "@/common/components/code-editor"
import { LANGUAGES } from "@/common/constants"
import type { Language } from "@/common/constants"
import useExecution from "@/hooks/useExecution"

// ─── Dummy problem data ───────────────────────────────────────────────────────

const DUMMY_PROBLEM = {
    id: 1,
    title: "Two Sum",
    difficulty: "Easy" as const,
    tags: ["Array", "Hash Table"],
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
        {
            id: 1,
            input: "nums = [2,7,11,15], target = 9",
            output: "[0,1]",
            explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
        },
        {
            id: 2,
            input: "nums = [3,2,4], target = 6",
            output: "[1,2]",
            explanation: "Because nums[1] + nums[2] == 6, we return [1, 2].",
        },
        {
            id: 3,
            input: "nums = [3,3], target = 6",
            output: "[0,1]",
            explanation: undefined,
        },
    ],
    constraints: [
        "2 ≤ nums.length ≤ 10⁴",
        "-10⁹ ≤ nums[i] ≤ 10⁹",
        "-10⁹ ≤ target ≤ 10⁹",
        "Only one valid answer exists.",
    ],
    hints: [
        "A really brute force way would be to search for all possible pairs of numbers but that would be too slow.",
        "Try to use a hash map to reduce time complexity.",
    ],
}

const DIFFICULTY_STYLES = {
    Easy: "text-green-500 bg-green-500/10",
    Medium: "text-yellow-500 bg-yellow-500/10",
    Hard: "text-red-500 bg-red-500/10",
} as const

// ─── Status badge ─────────────────────────────────────────────────────────────

function RunStatusBadge({ status }: { status: ReturnType<typeof useExecution>["status"] }) {
    const map = {
        idle: null,
        submitting: (
            <Badge variant="secondary">
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Submitting…
            </Badge>
        ),
        waiting: (
            <Badge variant="secondary">
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                In queue…
            </Badge>
        ),
        running: (
            <Badge variant="secondary">
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Running…
            </Badge>
        ),
        done: null,
        error: (
            <Badge variant="destructive">
                <XCircle className="mr-1 h-3 w-3" />
                Submission failed
            </Badge>
        ),
        timeout: (
            <Badge variant="destructive">
                <Clock3 className="mr-1 h-3 w-3" />
                Timed out
            </Badge>
        ),
    } as const
    return map[status] ?? null
}

// ─── Output panel ─────────────────────────────────────────────────────────────

function OutputPanel({
    status,
    submitError,
    result,
}: Pick<ReturnType<typeof useExecution>, "status" | "submitError" | "result">) {
    if (status === "submitting" || status === "waiting" || status === "running") {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-7 w-7 animate-spin" />
                <span className="text-sm">
                    {status === "submitting"
                        ? "Submitting code…"
                        : status === "waiting"
                            ? "Waiting in queue…"
                            : "Executing…"}
                </span>
            </div>
        )
    }

    if (status === "error") {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-destructive">
                <AlertCircle className="h-6 w-6" />
                <p className="text-sm font-medium">{submitError ?? "An error occurred."}</p>
            </div>
        )
    }

    if (status === "timeout") {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-destructive">
                <Clock3 className="h-6 w-6" />
                <p className="text-sm font-medium">Execution timed out waiting for a result.</p>
                <p className="text-xs text-muted-foreground">
                    The server may still be processing. Try again.
                </p>
            </div>
        )
    }

    if (status === "idle" || !result) {
        return (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Run your code to see the output here.
            </div>
        )
    }

    if (result.state === "failed") {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-destructive">
                <XCircle className="h-6 w-6" />
                <p className="text-sm font-medium">Execution failed</p>
                {result.error && (
                    <pre className="mt-2 max-w-xl rounded bg-muted px-3 py-2 text-xs">
                        {result.error}
                    </pre>
                )}
            </div>
        )
    }

    const r = result.result
    if (!r) return null

    const succeeded = r.exitCode === 0 && !r.timedOut && !r.oomKilled

    return (
        <div className="flex h-full flex-col gap-3 p-3">
            {/* Metadata row */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
                {succeeded ? (
                    <Badge variant="outline" className="border-green-500 text-green-500">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Accepted
                    </Badge>
                ) : (
                    <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3" />
                        {r.timedOut
                            ? "Time Limit Exceeded"
                            : r.oomKilled
                                ? "Memory Limit Exceeded"
                                : "Runtime Error"}
                    </Badge>
                )}

                <Badge variant="secondary" className="gap-1">
                    <Terminal className="h-3 w-3" />
                    Exit code: {r.exitCode ?? "—"}
                </Badge>

                {r.timedOut && (
                    <Badge variant="destructive" className="gap-1">
                        <Clock3 className="h-3 w-3" /> Timed out
                    </Badge>
                )}
                {r.oomKilled && (
                    <Badge variant="destructive" className="gap-1">
                        <MemoryStick className="h-3 w-3" /> OOM killed
                    </Badge>
                )}
                {r.outputLimitHit && (
                    <Badge variant="secondary" className="gap-1">
                        Output truncated
                    </Badge>
                )}
            </div>

            <Separator />

            {/* Stdout / Stderr tabs */}
            <Tabs defaultValue="stdout" className="flex min-h-0 flex-1 flex-col">
                <TabsList className="w-fit">
                    <TabsTrigger value="stdout">
                        Output
                        {r.stdout && (
                            <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
                                ✓
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="stderr">
                        Errors
                        {r.stderr && (
                            <span className="ml-1 rounded-full bg-destructive/20 px-1.5 py-0.5 text-[10px] text-destructive">
                                !
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="stdout" className="min-h-0 flex-1">
                    <ScrollArea className="h-full">
                        {r.stdout ? (
                            <pre className="whitespace-pre-wrap break-all p-2 font-mono text-xs leading-relaxed">
                                {r.stdout}
                            </pre>
                        ) : (
                            <p className="p-3 text-xs text-muted-foreground">No output.</p>
                        )}
                    </ScrollArea>
                </TabsContent>

                <TabsContent value="stderr" className="min-h-0 flex-1">
                    <ScrollArea className="h-full">
                        {r.stderr ? (
                            <pre className="whitespace-pre-wrap break-all p-2 font-mono text-xs leading-relaxed text-destructive">
                                {r.stderr}
                            </pre>
                        ) : (
                            <p className="p-3 text-xs text-muted-foreground">No errors.</p>
                        )}
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        </div>
    )
}

// ─── Problem description panel ────────────────────────────────────────────────

function ProblemDescription() {
    const [showHints, setShowHints] = useState<number[]>([])

    const toggleHint = (i: number) =>
        setShowHints((prev) =>
            prev.includes(i) ? prev.filter((h) => h !== i) : [...prev, i]
        )

    return (
        <div className="space-y-5 p-4 text-sm">
            {/* Title + meta */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{DUMMY_PROBLEM.id}.</span>
                    <h1 className="text-base font-semibold">{DUMMY_PROBLEM.title}</h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${DIFFICULTY_STYLES[DUMMY_PROBLEM.difficulty]}`}
                    >
                        {DUMMY_PROBLEM.difficulty}
                    </span>
                    {DUMMY_PROBLEM.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                        </Badge>
                    ))}
                </div>
            </div>

            <Separator />

            {/* Description */}
            <div className="leading-relaxed text-foreground/80">
                {DUMMY_PROBLEM.description.split("\n\n").map((para, i) => (
                    <p key={i} className="mb-3 last:mb-0">
                        {para.split(/(`[^`]+`|\*\*[^*]+\*\*)/).map((part, j) => {
                            if (part.startsWith("`") && part.endsWith("`"))
                                return (
                                    <code key={j} className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                                        {part.slice(1, -1)}
                                    </code>
                                )
                            if (part.startsWith("**") && part.endsWith("**"))
                                return <strong key={j}>{part.slice(2, -2)}</strong>
                            return part
                        })}
                    </p>
                ))}
            </div>

            {/* Examples */}
            <div className="space-y-4">
                {DUMMY_PROBLEM.examples.map((ex) => (
                    <div key={ex.id} className="space-y-2">
                        <p className="font-medium">Example {ex.id}:</p>
                        <div className="rounded-md bg-muted/50 p-3 font-mono text-xs space-y-1">
                            <div>
                                <span className="font-semibold">Input:</span> {ex.input}
                            </div>
                            <div>
                                <span className="font-semibold">Output:</span> {ex.output}
                            </div>
                            {ex.explanation && (
                                <div className="pt-1 text-muted-foreground font-sans">
                                    <span className="font-semibold font-mono">Explanation:</span>{" "}
                                    {ex.explanation}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Constraints */}
            <div className="space-y-2">
                <p className="font-medium">Constraints:</p>
                <ul className="space-y-1">
                    {DUMMY_PROBLEM.constraints.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <ChevronRight className="mt-0.5 h-3 w-3 shrink-0" />
                            <code>{c}</code>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Hints */}
            {DUMMY_PROBLEM.hints.length > 0 && (
                <div className="space-y-2">
                    <p className="font-medium">Hints:</p>
                    {DUMMY_PROBLEM.hints.map((hint, i) => (
                        <div key={i} className="rounded-md border">
                            <button
                                onClick={() => toggleHint(i)}
                                className="flex w-full items-center justify-between px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <span>Hint {i + 1}</span>
                                <ChevronRight
                                    className={`h-3 w-3 transition-transform ${showHints.includes(i) ? "rotate-90" : ""}`}
                                />
                            </button>
                            {showHints.includes(i) && (
                                <div className="border-t px-3 py-2 text-xs text-muted-foreground">
                                    {hint}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Problem() {
    const [language, setLanguage] = useState<Language>(LANGUAGES[0].value)
    const [code, setCode] = useState("")
    const { execute, reset, status, isRunning, submitError, result } = useExecution()

    const handleRun = () => {
        execute({ code, language })
    }

    return (
        <ResizablePanelGroup
            orientation="horizontal"   // ← was "orientation" which broke the layout
            className="h-full"
        >
            {/* ── Left: problem description ── */}
            <ResizablePanel defaultSize={40} minSize={25}>
                <Tabs defaultValue="description" className="flex h-full flex-col">
                    <TabsList className="shrink-0 rounded-none border-b px-2 justify-start">
                        <TabsTrigger value="description" className="text-xs">
                            Description
                        </TabsTrigger>
                        <TabsTrigger value="submissions" className="text-xs">
                            Submissions
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="description" className="min-h-0 flex-1 mt-0">
                        <ScrollArea className="h-full">
                            <ProblemDescription />
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="submissions" className="min-h-0 flex-1 mt-0">
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                            No submissions yet.
                        </div>
                    </TabsContent>
                </Tabs>
            </ResizablePanel>

            <ResizableHandle />

            {/* ── Right: editor + output ── */}
            <ResizablePanel defaultSize={60} minSize={30}>
                <ResizablePanelGroup orientation="vertical">  {/* ← same fix here */}
                    {/* Editor panel */}
                    <ResizablePanel defaultSize={60} minSize={30}>
                        <div className="flex h-full flex-col">
                            {/* Toolbar */}
                            <div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
                                <Select
                                    value={language}
                                    onValueChange={(v) => setLanguage(v as Language)}
                                >
                                    <SelectTrigger className="w-36" size="sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {LANGUAGES.map((l) => (
                                                <SelectItem key={l.value} value={l.value}>
                                                    {l.label}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>

                                <div className="flex items-center gap-2">
                                    <RunStatusBadge status={status} />
                                    <Button
                                        size="sm"
                                        onClick={handleRun}
                                        disabled={isRunning || !code.trim()}
                                        loading={isRunning}
                                    >
                                        <Play className="mr-1 h-3.5 w-3.5" />
                                        Run
                                    </Button>
                                </div>
                            </div>

                            <div className="min-h-0 flex-1">
                                <CodeEditor language={language} onCodeChange={setCode} />
                            </div>
                        </div>
                    </ResizablePanel>

                    <ResizableHandle />

                    {/* Output panel */}
                    <ResizablePanel defaultSize={40} minSize={20}>
                        <div className="flex h-full flex-col">
                            <div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
                                <span className="text-xs font-medium text-muted-foreground">
                                    Output
                                </span>
                                {status !== "idle" && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs"
                                        onClick={reset}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>
                            <div className="min-h-0 flex-1">
                                <OutputPanel
                                    status={status}
                                    submitError={submitError}
                                    result={result}
                                />
                            </div>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}