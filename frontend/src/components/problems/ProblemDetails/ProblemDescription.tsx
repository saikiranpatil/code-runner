import { type JSX } from "react"

import type { Difficulty, ProblemEntity } from "@/api/problem/problem"

import { CheckCircle2, ChevronRight, Flame, Hash, Zap } from "lucide-react"
import { FaSeedling } from "react-icons/fa";

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import InlineMarkdown from "@/components/problems/ProblemDetails/components/InlineMarkdown"

interface DifficultyConfig {
    label: string
    className: string
    Icon: React.ComponentType<{ className?: string }>
}

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
    EASY: { label: "Easy", className: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", Icon: FaSeedling },
    MEDIUM: { label: "Medium", className: "text-amber-500 bg-amber-500/10 border-amber-500/20", Icon: Zap },
    HARD: { label: "Hard", className: "text-red-500 bg-red-500/10 border-red-500/20", Icon: Flame },
}

export default function ProblemDescription({ problem }: { problem: ProblemEntity }): JSX.Element {
    const diff = DIFFICULTY_CONFIG[problem?.difficulty ?? "EASY"];
    return (
        <div className="space-y-6 p-5 text-sm">
            <div className="space-y-2.5">
                <div className="flex flex-wrap items-start gap-2">
                    <div className="flex items-baseline gap-1.5">
                        <h1 className="text-base font-semibold leading-tight">{problem.title}</h1>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${diff.className}`}>
                        <diff.Icon className="h-3 w-3" />
                        {diff.label}
                    </span>
                    {problem.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="rounded-md text-xs font-normal">
                            {tag}
                        </Badge>
                    ))}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        {problem.acceptanceRate}% acceptance
                    </span>
                    <span className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {problem.totalSubmissions} submissions
                    </span>
                </div>
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-3 leading-relaxed text-foreground/80">
                {problem.description.split("\n\n").map((para, i) => (
                    <p key={i}><InlineMarkdown text={para} /></p>
                ))}
            </div>

            {/* Examples */}
            <div className="space-y-4">
                {problem.examples.map((ex, idx) => (
                    <div key={idx} className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Example {idx + 1}
                        </p>
                        <div className="rounded-lg border border-border bg-muted/30 p-4 font-mono text-xs space-y-1.5">
                            <div>
                                <span className="font-semibold text-foreground">Input:</span>
                                <span className="ml-2 text-muted-foreground">{ex.input}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-foreground">Output:</span>
                                <span className="ml-2 text-muted-foreground">{ex.output}</span>
                            </div>
                            {ex.explanation && (
                                <div className="border-t border-border/50 pt-1.5 font-sans text-muted-foreground">
                                    <span className="font-semibold font-mono">Explanation:</span>{" "}{ex.explanation}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Constraints */}
            <div className="space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Constraints</p>
                <ul className="space-y-1.5 rounded-lg border border-border bg-muted/30 p-4">
                    {problem.constraints?.split(/\\n|\n/)
                        .map(c => c.replace(/`([^`]+)`/g, "$1").replace(/^-\s*/, "").trim())
                        .filter(Boolean)
                        .map((c, i) => (
                            <li key={i} className="flex items-start gap-2 font-mono text-xs text-muted-foreground">
                                <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/50" />
                                {c}
                            </li>
                        ))}
                </ul>
            </div>
        </div>
    )
}