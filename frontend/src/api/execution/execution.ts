import type { Language } from "@/common/constants"

export type SubmissionVerdict =
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "TIME_LIMIT_EXCEEDED"
  | "MEMORY_LIMIT_EXCEEDED"
  | "RUNTIME_ERROR"
  | "COMPILATION_ERROR"
  | "INTERNAL_ERROR"

export interface RunCodeRequest {
  problemId: string
  language: Language
  sourceCode: string
}

export interface SubmitCodeRequest {
  problemId: string
  language: Language
  sourceCode: string
}

export interface RunResult {
  verdict: SubmissionVerdict
  passedCount: number
  totalCount: number
  testCaseResults: TestCaseResult[]
}

export interface TestCaseResult {
  testCaseId: string
  input: string
  expectedOutput: string
  verdict: SubmissionVerdict
  executionTimeMs: number
  memoryUsedMb?: number
  stdout?: string
  stderr?: string
}

export interface SubmitResult {
  submissionId: string
  verdict: SubmissionVerdict
  passedCount: number
  totalCount: number
  executionTimeMs: number
  testCaseResults: TestCaseResult[]
}

export interface EnqueueJobResponse {
  jobId: string
}

export type JobState = "waiting" | "active" | "completed" | "failed" | "delayed" | "unknown"

export interface JobStatusResponse<TResult> {
  state: JobState
  result: TResult | null
  error: string | null
}