import type { ExecutionResponse } from "@/api/execution/execution"
import type { SubmissionVerdict } from "@/api/problem/problem"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import {
    CheckCircle2, ChevronDown, ChevronRight,
    Clock3, Loader2, MemoryStick, Terminal, XCircle,
} from "lucide-react"
import { useState, type JSX } from "react"
import VerdictBadge from "./components/VerdictBadge"
import type { ExecStatus } from "../Problems"
import { cn } from "@/lib/utils"

interface OutputPanelProps {
    status: ExecStatus
    result: ExecutionResponse | null
    customInput: string
    onCustomInputChange: (value: string) => void
}

type TCResult = NonNullable<ExecutionResponse["testCaseResults"]>[number]

function TestCaseRow({ index, tc }: { index: number; tc: TCResult }): JSX.Element {
    const [open, setOpen] = useState(false)
    const passed = tc.verdict === "ACCEPTED"

    return (
        <div className={cn(
            "rounded-lg border overflow-hidden transition-colors",
            passed ? "border-emerald-500/20" : "border-red-500/20",
        )}>
            <button
                onClick={() => setOpen(v => !v)}
                className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors",
                    passed
                        ? "bg-emerald-500/5 hover:bg-emerald-500/10"
                        : "bg-red-500/5 hover:bg-red-500/10",
                )}
            >
                {passed
                    ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    : <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />}

                <span className="font-medium flex-1">Case {index + 1}</span>

                <VerdictBadge verdict={tc.verdict as SubmissionVerdict} />

                <span className="flex items-center gap-1 text-muted-foreground ml-2">
                    <Clock3 className="h-3 w-3" />
                    {tc.executionTimeMs} ms
                </span>

                {tc.memoryUsedMb != null && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                        <MemoryStick className="h-3 w-3" />
                        {tc.memoryUsedMb.toFixed(1)} MB
                    </span>
                )}

                {open
                    ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
            </button>

            {open && (
                <div className="px-3 py-3 space-y-2.5 border-t border-border/50 bg-background/50">
                    {tc.stdout ? (
                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">stdout</p>
                            <pre className="whitespace-pre-wrap break-all rounded-lg border border-border bg-muted/30 p-2.5 font-mono text-xs leading-relaxed">
                                {tc.stdout}
                            </pre>
                        </div>
                    ) : (
                        <p className="text-xs italic text-muted-foreground/60">No stdout.</p>
                    )}

                    {tc.stderr && (
                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wide text-destructive">stderr</p>
                            <pre className="whitespace-pre-wrap break-all rounded-lg border border-destructive/20 bg-destructive/5 p-2.5 font-mono text-xs leading-relaxed text-destructive">
                                {tc.stderr}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
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
            {/* ── Tab bar ── */}
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
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                            {result.passedCount}/{result.totalCount} passed
                        </span>
                        <VerdictBadge verdict={result.verdict as SubmissionVerdict} />
                    </div>
                )}
            </div>

            {/* ── Output tab ── */}
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

                    ) : (
                        <div className="space-y-4 p-4">
                            {/* Summary card */}
                            <div className={cn(
                                "flex items-center justify-between rounded-lg border p-3.5",
                                result.verdict === "ACCEPTED"
                                    ? "border-emerald-500/20 bg-emerald-500/5"
                                    : "border-red-500/20 bg-red-500/5",
                            )}>
                                <div className="flex items-center gap-2.5">
                                    {result.verdict === "ACCEPTED"
                                        ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        : <XCircle className="h-4 w-4 text-red-500" />}
                                    <div>
                                        <p className={cn(
                                            "text-sm font-semibold",
                                            result.verdict === "ACCEPTED" ? "text-emerald-500" : "text-red-500",
                                        )}>
                                            {result.passedCount} / {result.totalCount} test cases passed
                                        </p>
                                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                            <Clock3 className="h-3 w-3" />
                                            {result.executionTimeMs} ms total runtime
                                        </p>
                                    </div>
                                </div>
                                <VerdictBadge verdict={result.verdict as SubmissionVerdict} />
                            </div>

                            {/* Per-test-case rows */}
                            {result.testCaseResults?.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Test Cases
                                    </p>
                                    <div className="space-y-1.5">
                                        {result.testCaseResults.map((tc, i) => (
                                            <TestCaseRow key={tc.testCaseId} index={i} tc={tc} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </ScrollArea>
            </TabsContent>

            {/* ── Custom input tab ── */}
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