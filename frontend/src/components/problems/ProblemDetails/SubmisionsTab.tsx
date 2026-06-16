import type { JSX } from "react"
import { Clock3, FileX } from "lucide-react"
import type { SubmissionEntity } from "@/api/problem/problem"
import VerdictBadge from "@/components/problems/ProblemDetails/components/VerdictBadge"
import { Separator } from "@/components/ui/separator"
import { useQuery } from "@tanstack/react-query"
import query from "@/utils/request/query"
import problemApi from "@/api/problem/problemApi"
import { Spinner } from "@/components/ui/spinner"

interface SubmissionsTabProps {
    problemId: string
}

export default function SubmissionsTab({ problemId }: SubmissionsTabProps): JSX.Element {
    const { data: submissions, isLoading } = useQuery({
        queryKey: ["GetSubmissions", problemId],
        queryFn: query(problemApi.getSubmissions, { pathParams: { id: problemId } }),
        enabled: !!problemId,
    });

    if (isLoading) {
        return (
            <div className="flex h-48 items-center justify-center">
                <Spinner size="md" />
            </div>
        )
    }

    if (!submissions || submissions.length === 0) {
        return (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
                <FileX className="h-8 w-8 opacity-40" />
                <p className="text-sm">No submissions yet</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col">
            {submissions.map((submission, i) => (
                <div key={submission.id}>
                    {i > 0 && <Separator />}
                    <SubmissionRow submission={submission} />
                </div>
            ))}
        </div>
    )
}

function SubmissionRow({ submission }: { submission: SubmissionEntity }): JSX.Element {
    const date = new Date(submission.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })

    return (
        <div className="flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-muted/40">
            <div className="flex items-center gap-3">
                <VerdictBadge verdict={submission.verdict} />
                <span className="capitalize text-muted-foreground">{submission.language}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>
                    {submission.passedCount}/{submission.totalCount} passed
                </span>
                <span className="flex items-center gap-1">
                    <Clock3 className="h-3 w-3" />
                    {submission.executionTimeMs} ms
                </span>
                <span>{date}</span>
            </div>
        </div>
    )
}