import { useState, type ChangeEvent, type FC } from "react"
import {
  Search,
  ChevronRight,
  CheckCircle2,
  Circle,
  Tag,
  BookOpen,
  Zap,
  Flame,
  Leaf,
  X,
  HelpCircle,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import problemApi from "@/api/problem/problemApi"
import query from "@/utils/request/query"
import type { Difficulty, ProblemEntity } from "@/api/problem/problem"
import { Spinner } from "../ui/spinner"

type DifficultyFilter = Difficulty | "ALL"

const DIFFICULTIES: DifficultyFilter[] = ["ALL", "EASY", "MEDIUM", "HARD"]

const ALL_TAGS: string[] = [
  "array", "hash-table", "string", "dynamic-programming",
  "two-pointers", "binary-search", "tree", "graph",
  "depth-first-search", "breadth-first-search", "stack",
  "linked-list", "sorting", "divide-and-conquer",
  "union-find", "monotonic-stack", "recursion",
]

const PER_PAGE = 15

export type SupportedLanguage = "javascript" | "typescript" | "python" | "cpp" | "java"

export type SubmissionVerdict =
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "TIME_LIMIT_EXCEEDED"
  | "MEMORY_LIMIT_EXCEEDED"
  | "RUNTIME_ERROR"
  | "COMPILATION_ERROR"
  | "INTERNAL_ERROR"

export interface ProblemExample {
  input: string
  output: string
  explanation?: string
}

export interface SimilarProblem {
  title: string
  slug: string
  difficulty: Difficulty
}

export interface ProblemListItem {
  id: string
  number: number
  title: string
  slug: string
  difficulty: Difficulty
  tags: string[]
  acceptance: number
  solved: boolean
}

export interface Problem {
  id: string
  number: number
  title: string
  slug: string
  difficulty: Difficulty
  tags: string[]
  acceptance: number
  totalSubmissions: number
  description: string
  constraints: string[]
  examples: ProblemExample[]
  hints: string[]
  similar: SimilarProblem[]
}

/** Raw single-run result returned by the execution endpoint */
export interface ExecutionResult {
  exitCode: number
  timedOut: boolean
  oomKilled: boolean
  outputLimitHit: boolean
  stdout: string
  stderr: string
}

/** Discriminated union for the full output panel state */
export type OutputState =
  | { state: "completed"; verdict?: SubmissionVerdict } & ExecutionResult
  | { state: "failed"; error?: string }

/** Status of an in-flight execution request */
export type ExecStatus = "idle" | "running" | "submitting" | "done" | "error"

export interface SubmissionRecord {
  id: number
  verdict: SubmissionVerdict
  language: SupportedLanguage
  runtime: string
  memory: string
  time: string
}

export interface LanguageOption {
  label: string
  value: SupportedLanguage
}

interface DifficultyConfig {
  label: string
  className: string
  Icon: LucideIcon
}

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  EASY: { label: "Easy", className: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", Icon: Leaf },
  MEDIUM: { label: "Medium", className: "text-amber-500 bg-amber-500/10 border-amber-500/20", Icon: Zap },
  HARD: { label: "Hard", className: "text-red-500 bg-red-500/10 border-red-500/20", Icon: Flame },
}

// ─── Sub-components ────────────────────────────────────────────────────────────

interface DifficultyBadgeProps {
  difficulty: Difficulty
}

const DifficultyBadge: FC<DifficultyBadgeProps> = ({ difficulty }) => {
  const { label, className } = DIFFICULTY_CONFIG[difficulty]
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

interface AcceptanceBarProps {
  value: number
}

const AcceptanceBar: FC<AcceptanceBarProps> = ({ value }) => {
  const color =
    value >= 60 ? "bg-emerald-500" : value >= 40 ? "bg-amber-500" : "bg-red-500"
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{value.toFixed(1)}%</span>
    </div>
  )
}

// ─── Stats bar ─────────────────────────────────────────────────────────────────

interface StatsBarProps {
  problems: ProblemEntity[]
}

const StatsBar: FC<StatsBarProps> = ({ problems }) => {
  const total = problems.length
  const solved = problems.filter((p) => p.status === "SOLVED").length

  const byDiff = (d: Difficulty) => problems.filter((p) => p.difficulty === d)
  const easy = byDiff("EASY")
  const medium = byDiff("MEDIUM")
  const hard = byDiff("HARD")

  const stats: Array<{ label: string; solved: number; total: number; color: string }> = [
    { label: "Easy", solved: easy.filter((p) => p.status === "SOLVED").length, total: easy.length, color: "text-emerald-500" },
    { label: "Medium", solved: medium.filter((p) => p.status === "SOLVED").length, total: medium.length, color: "text-amber-500" },
    { label: "Hard", solved: hard.filter((p) => p.status === "SOLVED").length, total: hard.length, color: "text-red-500" },
  ]

  const circumference = 2 * Math.PI * 22
  const progress = circumference * (1 - solved / Math.max(total, 1))

  return (
    <div className="flex items-center gap-6 rounded-xl border border-border bg-card px-5 py-3.5">
      {/* Progress ring */}
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
        <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="22" fill="none" strokeWidth="5" className="stroke-muted" />
          <circle
            cx="28" cy="28" r="22" fill="none" strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            className="stroke-primary transition-all duration-500"
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-xs font-semibold tabular-nums">{solved}/{total}</span>
      </div>

      <Separator orientation="vertical" className="h-10" />

      <div className="flex gap-5">
        {stats.map(({ label, solved: s, total: t, color }) => (
          <div key={label} className="space-y-0.5">
            <p className={`text-xs font-medium ${color}`}>{label}</p>
            <p className="text-sm font-semibold tabular-nums">
              {s}
              <span className="text-xs font-normal text-muted-foreground">/{t}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="ml-auto hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
        <BookOpen className="h-3.5 w-3.5" />
        <span>{total} problems</span>
      </div>
    </div>
  )
}

// ─── Tag filter ────────────────────────────────────────────────────────────────

interface TagFilterProps {
  selected: string[]
  onChange: (tags: string[]) => void
}

const TagFilter: FC<TagFilterProps> = ({ selected, onChange }) => {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? ALL_TAGS : ALL_TAGS.slice(0, 10)

  const toggle = (tag: string) =>
    onChange(
      selected.includes(tag)
        ? selected.filter((t) => t !== tag)
        : [...selected, tag],
    )

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Tag className="h-3 w-3" /> Tags
      </div>
      <div className="flex flex-wrap gap-1.5">
        {visible.map((tag) => {
          const active = selected.includes(tag)
          return (
            <button
              key={tag}
              onClick={() => toggle(tag)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${active
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
            >
              {tag}
            </button>
          )
        })}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="rounded-lg border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
        >
          {expanded ? "Show less" : `+${ALL_TAGS.length - 10} more`}
        </button>
      </div>
    </div>
  )
}

// ─── Problem row ───────────────────────────────────────────────────────────────

interface ProblemRowProps {
  problem: ProblemEntity
  index: number
}

const ProblemRow: FC<ProblemRowProps> = ({ problem, index }) => {
  const { title, slug, difficulty, tags, acceptanceRate, status } = problem
  const number = index + 1;
  const isEven = index % 2 === 0

  return (
    <Link
      to={`/problems/${slug}`}
      className={`group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/50 ${isEven ? "bg-background" : "bg-muted/20"
        }`}
    >
      {/* Solved indicator */}
      <div className="flex w-5 shrink-0 items-center justify-center">
        {status === "SOLVED" && (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        )}
        {status === "ATTEMPTED" && (
          <HelpCircle className="h-4 w-4 text-amber-500" />
        )}
        {status === "UNATTEMPTED" && (
          <Circle className="h-4 w-4 text-muted-foreground/30" />
        )}

      </div>

      {/* Number */}
      <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {number}.
      </span>

      {/* Title */}
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium transition-colors group-hover:text-primary">
          {title}
        </span>
      </div>

      {/* Tags */}
      <div className="hidden items-center gap-1.5 xl:flex" style={{ width: "12rem" }}>
        {tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground"
          >
            {tag}
          </span>
        ))}
        {tags.length > 2 && (
          <span className="text-xs text-muted-foreground/60">+{tags.length - 2}</span>
        )}
      </div>

      {/* Acceptance */}
      <div className="hidden shrink-0 sm:block" style={{ width: "8rem" }}>
        <AcceptanceBar value={acceptanceRate} />
      </div>

      {/* Difficulty */}
      <div className="shrink-0" style={{ width: "5rem" }}>
        <DifficultyBadge difficulty={difficulty} />
      </div>

      {/* Chevron */}
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
    </Link>
  )
}

// ─── Empty state ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  onReset: () => void
}

const EmptyState: FC<EmptyStateProps> = ({ onReset }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
    <div className="rounded-full border border-border bg-muted/30 p-4">
      <Search className="h-6 w-6 text-muted-foreground" />
    </div>
    <div className="space-y-1">
      <p className="text-sm font-medium">No problems found</p>
      <p className="text-xs text-muted-foreground">Try adjusting your filters or search query.</p>
    </div>
    <Button variant="outline" size="sm" onClick={onReset} className="mt-1 gap-1.5 rounded-xl">
      <X className="h-3.5 w-3.5" /> Clear filters
    </Button>
  </div>
)

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ProblemsPage() {
  const [search, setSearch] = useState<string>("")
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("ALL")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [page, setPage] = useState<number>(1)

  const { data: problemsResponse, isLoading } = useQuery({
    queryKey: ["getProblemsList", page, selectedTags, search],
    queryFn: query(problemApi.list, {
      queryParams: {
        difficulty: difficulty !== "ALL" ? difficulty : undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        page,
        limit: 50,
      },
    }),
  })

  const { problems } = problemsResponse || { problems: [], total: 0 };

  const filtered = problems.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase())
    const matchDiff = difficulty === "ALL" || p.difficulty === difficulty
    const matchTags = selectedTags.length === 0 || selectedTags.every((t) => p.tags.includes(t))
    return matchSearch && matchDiff && matchTags
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const hasActiveFilters = search !== "" || difficulty !== "ALL" || selectedTags.length > 0

  const resetFilters = () => {
    setSearch("")
    setDifficulty("ALL")
    setSelectedTags([])
    setPage(1)
  }

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const handleDifficultyChange = (v: string) => {
    if (v) {
      setDifficulty(v as DifficultyFilter)
      setPage(1)
    }
  }

  const handleTagsChange = (tags: string[]) => {
    setSelectedTags(tags)
    setPage(1)
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-56px)] max-w-6xl flex-col gap-5 px-4 py-5 lg:px-6">
      {/* Stats */}
      <StatsBar problems={problems} />

      {/* Filters */}
      <div className="flex flex-col gap-3">
        {/* Search + sort */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search problems…"
              value={search}
              onChange={handleSearchChange}
              className="h-9 rounded-xl pl-9 text-sm"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); setPage(1) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Difficulty toggle */}
        <div className="flex items-center justify-between gap-3">
          <ToggleGroup
            type="single"
            value={difficulty}
            onValueChange={handleDifficultyChange}
            className="gap-1"
          >
            {DIFFICULTIES.map((d) => {
              const cfg = d === "ALL" ? null : DIFFICULTY_CONFIG[d]
              return (
                <ToggleGroupItem
                  key={d}
                  value={d}
                  size="sm"
                  className="h-8 rounded-xl px-3 text-xs font-medium"
                >
                  {cfg && <cfg.Icon className={`mr-1.5 h-3 w-3 ${cfg.className.split(" ")[0]}`} />}
                  {d === "ALL" ? "All" : cfg?.label}
                </ToggleGroupItem>
              )
            })}
          </ToggleGroup>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" /> Clear all
            </button>
          )}
        </div>

        {/* Tag filter */}
        <TagFilter selected={selectedTags} onChange={handleTagsChange} />
      </div>

      {isLoading ? (
        <div className="flex w-full justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-border bg-muted/40 px-4 py-2.5">
              <div className="w-5 shrink-0" />
              <span className="w-8 shrink-0 text-right text-xs font-medium text-muted-foreground">#</span>
              <span className="flex-1 text-xs font-medium text-muted-foreground">Title</span>
              <span className="hidden text-xs font-medium text-muted-foreground xl:block" style={{ width: "12rem" }}>Tags</span>
              <span className="hidden text-xs font-medium text-muted-foreground sm:block" style={{ width: "8rem" }}>Acceptance</span>
              <span className="shrink-0 text-xs font-medium text-muted-foreground" style={{ width: "5rem" }}>Difficulty</span>
              <div className="w-4 shrink-0" />
            </div>

            {/* Rows */}
            <ScrollArea className="flex-1 h-full">
              {paginated.length === 0 ? (
                <EmptyState onReset={resetFilters} />
              ) : (
                <div className="divide-y divide-border/50">
                  {paginated.map((p, i) => (
                    <ProblemRow key={p.id} problem={p} index={i} />
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-2.5">
              <span className="text-xs text-muted-foreground">
                {filtered.length === 0
                  ? "No results"
                  : `${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, filtered.length)} of ${filtered.length}`}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline" size="sm"
                  className="h-7 rounded-lg px-2.5 text-xs"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => Math.abs(p - page) <= 2)
                  .map((p) => (
                    <Button
                      key={p}
                      variant={p === page ? "default" : "outline"}
                      size="sm"
                      className="h-7 w-7 rounded-lg p-0 text-xs"
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  ))}
                <Button
                  variant="outline" size="sm"
                  className="h-7 rounded-lg px-2.5 text-xs"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  )
}