import type { SubmissionVerdict } from "@/api/problem/problem";

export type ExecStatus = "idle" | "running" | "submitting" | "done" | "error"

export interface ExecResult {
  state: "completed" | "failed"
  verdict?: SubmissionVerdict
  exitCode?: number
  timedOut?: boolean
  oomKilled?: boolean
  outputLimitHit?: boolean
  stdout?: string
  stderr?: string
  error?: string
}