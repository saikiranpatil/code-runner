import type { SubmissionVerdict } from "@/api/problem/problem"
import { AlertCircle, CheckCircle2, Clock3, MemoryStick, XCircle } from "lucide-react"
import type { JSX } from "react"

interface VerdictConfig {
    label: string
    className: string
    Icon: React.ComponentType<{ className?: string }>
}

const VERDICT_CONFIG: Record<SubmissionVerdict, VerdictConfig> = {
    ACCEPTED: { label: "Accepted", className: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", Icon: CheckCircle2 },
    WRONG_ANSWER: { label: "Wrong Answer", className: "text-red-500 bg-red-500/10 border-red-500/20", Icon: XCircle },
    TIME_LIMIT_EXCEEDED: { label: "TLE", className: "text-amber-500 bg-amber-500/10 border-amber-500/20", Icon: Clock3 },
    MEMORY_LIMIT_EXCEEDED: { label: "MLE", className: "text-purple-500 bg-purple-500/10 border-purple-500/20", Icon: MemoryStick },
    RUNTIME_ERROR: { label: "Runtime Error", className: "text-red-500 bg-red-500/10 border-red-500/20", Icon: AlertCircle },
    COMPILATION_ERROR: { label: "Compile Error", className: "text-red-500 bg-red-500/10 border-red-500/20", Icon: AlertCircle },
    INTERNAL_ERROR: { label: "Internal Error", className: "text-muted-foreground bg-muted border-border", Icon: AlertCircle },
}

export default function VerdictBadge({ verdict }: { verdict: SubmissionVerdict }): JSX.Element {
    const cfg = VERDICT_CONFIG[verdict] ?? VERDICT_CONFIG.INTERNAL_ERROR
    return (
        <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${cfg.className}`
        }>
            <cfg.Icon className="h-3 w-3" />
            {cfg.label}
        </span>
    )
}