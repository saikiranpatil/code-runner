import { useState, type JSX } from "react"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import VerdictBadge from "./components/VerdictBadge"
import type { ExecStatus } from "../Problems"
import type { SubmitResult, RunResult, RunTestCaseResult, TestCaseResult } from "@/api/execution/execution"
import type { SubmissionVerdict } from "@/api/problem/problem"

interface OutputPanelProps {
    status: ExecStatus
    runResult: RunResult | null
    judgeResult: SubmitResult | null
}

export default function OutputPanel({
    status,
    runResult,
    judgeResult,
}: OutputPanelProps): JSX.Element {
    if (status === "running" || status === "submitting") {
        return (
            <div className="flex h-full items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">
                    {status === "running" ? "Running test cases…" : "Judging submission…"}
                </span>
            </div>
        )
    }

    if (status === "error") {
        return (
            <div className="flex h-full items-center justify-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                <span className="text-sm">Something went wrong. Please try again.</span>
            </div>
        )
    }

    if (runResult) {
        return <RunResultPanel result={runResult} />
    }

    if (judgeResult) {
        return <JudgeResultPanel result={judgeResult} />
    }

    return (
        <div className="flex h-full items-center justify-center text-muted-foreground">
            <p className="text-sm">Click Run to test against sample cases, or Submit to judge.</p>
        </div>
    )
}

function RunResultPanel({ result }: { result: RunResult }): JSX.Element {
    const [tab, setTab] = useState("0")
    const { testCaseResults, passedCount, totalCount, verdict } = result

    if (testCaseResults.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                <p className="text-sm">No visible test cases for this problem.</p>
            </div>
        )
    }

    return (
        <div className="flex h-full flex-col gap-3 p-4">
            <div className="flex items-center gap-3">
                <VerdictBadge verdict={verdict as SubmissionVerdict} />
                <span className="text-sm text-muted-foreground">
                    {passedCount}/{totalCount} passed
                </span>
            </div>

            <Tabs value={tab} onValueChange={setTab} className="flex flex-1 flex-col overflow-hidden">
                <TabsList className="w-fit shrink-0">
                    {testCaseResults.map((tc, i) => (
                        <TabsTrigger
                            key={tc.testCaseId}
                            value={String(i)}
                            className={cn(tc.verdict !== "ACCEPTED" && "text-destructive data-[state=active]:text-destructive")}
                        >
                            Case {i + 1}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {testCaseResults.map((tc, i) => (
                    <TabsContent key={tc.testCaseId} value={String(i)} className="flex-1 overflow-hidden">
                        <ScrollArea className="h-full pr-2">
                            <TestCaseDetail tc={tc} />
                        </ScrollArea>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    )
}

function TestCaseDetail({ tc }: { tc: RunTestCaseResult }): JSX.Element {
    return (
        <div className="space-y-3 pb-4 text-sm">
            <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Input</p>
                <pre className="rounded-md bg-muted px-3 py-2 font-mono text-xs leading-relaxed">
                    {tc.input || "(empty)"}
                </pre>
            </div>
            <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Expected Output</p>
                <pre className="rounded-md bg-muted px-3 py-2 font-mono text-xs leading-relaxed">
                    {tc.expectedOutput || "(empty)"}
                </pre>
            </div>
            <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Your Output</p>
                <pre
                    className={cn(
                        "rounded-md px-3 py-2 font-mono text-xs leading-relaxed",
                        tc.verdict === "ACCEPTED"
                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                            : "bg-destructive/10 text-destructive",
                    )}
                >
                    {tc.stdout || "(empty)"}
                </pre>
            </div>
            {tc.stderr && (
                <div>
                    <p className="mb-1 text-xs font-medium text-destructive">Stderr</p>
                    <pre className="rounded-md bg-destructive/10 px-3 py-2 font-mono text-xs leading-relaxed text-destructive">
                        {tc.stderr}
                    </pre>
                </div>
            )}
            <p className="text-xs text-muted-foreground">Runtime: {tc.executionTimeMs} ms</p>
        </div>
    )
}

function JudgeResultPanel({ result }: { result: SubmitResult }): JSX.Element {
    const { verdict, passedCount, totalCount, executionTimeMs, testCaseResults } = result
    const firstFailed: TestCaseResult | undefined = testCaseResults[0]

    return (
        <div className="flex h-full flex-col gap-4 p-4">
            <div className="flex items-center gap-3">
                <VerdictBadge verdict={verdict as SubmissionVerdict} />
                <span className="text-sm text-muted-foreground">
                    {passedCount}/{totalCount} test cases · {executionTimeMs} ms
                </span>
            </div>

            {verdict === "ACCEPTED" && (
                <div className="flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Congratulations! All test cases passed.</span>
                </div>
            )}

            {firstFailed && verdict !== "ACCEPTED" && (
                <div className="space-y-3 text-sm">
                    <p className="text-xs font-medium text-muted-foreground">First failing test case:</p>
                    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                        <div className="flex items-center gap-2">
                            <VerdictBadge verdict={firstFailed.verdict as SubmissionVerdict} />
                            <span className="text-xs text-muted-foreground">{firstFailed.executionTimeMs} ms</span>
                        </div>
                        {firstFailed.stdout !== undefined && (
                            <div>
                                <p className="mb-1 text-xs font-medium text-muted-foreground">Your Output</p>
                                <pre className="rounded bg-muted px-2 py-1.5 font-mono text-xs">
                                    {firstFailed.stdout || "(empty)"}
                                </pre>
                            </div>
                        )}
                        {firstFailed.stderr && (
                            <div>
                                <p className="mb-1 text-xs font-medium text-destructive">Error</p>
                                <pre className="rounded bg-destructive/10 px-2 py-1.5 font-mono text-xs text-destructive">
                                    {firstFailed.stderr}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}