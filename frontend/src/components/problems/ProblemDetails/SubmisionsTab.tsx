import type { JSX } from "react"

import { Clock3, MemoryStick } from "lucide-react"

import type { SubmissionEntity } from "@/api/problem/problem"
import VerdictBadge from "@/components/problems/ProblemDetails/components/VerdictBadge"
import { Separator } from "@/components/ui/separator"

interface SubmissionListItem
    extends Pick<SubmissionEntity, "id" | "verdict" | "language"> {
    runtime: string
    memory: string
    time: string
}

const DUMMY_SUBMISSIONS: SubmissionListItem[] = [
    { id: "1", verdict: "ACCEPTED", language: "javascript", runtime: "72ms", memory: "42.3MB", time: "2 hours ago" },
    { id: "2", verdict: "WRONG_ANSWER", language: "javascript", runtime: "—", memory: "—", time: "3 hours ago" },
    { id: "3", verdict: "TIME_LIMIT_EXCEEDED", language: "python", runtime: "—", memory: "—", time: "1 day ago" },
]

export default function SubmissionsTab(): JSX.Element {
    return (
        <div className="space-y-2 p-4">
            {DUMMY_SUBMISSIONS.map((sub) => (
                <div
                    key={sub.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3 text-xs transition-colors hover:bg-muted/40"
                >
                    <VerdictBadge verdict={sub.verdict} />
                    <span className="text-muted-foreground">{sub.language}</span>
                    <Separator orientation="vertical" className="h-3.5" />
                    <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock3 className="h-3 w-3" /> {sub.runtime}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                        <MemoryStick className="h-3 w-3" /> {sub.memory}
                    </span>
                    <span className="ml-auto text-muted-foreground/60">{sub.time}</span>
                </div>
            ))}
        </div>
    )
}
