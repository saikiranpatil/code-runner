import type { Language } from "@/common/constants"

export type Difficulty = "EASY" | "MEDIUM" | "HARD" | "NONE"
export type Visibility = "PUBLIC" | "PRIVATE" | "DRAFT"
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

export interface TestCaseEntity {
  id: string
  problemId: string
  input: string
  expectedOutput: string
  isHidden: boolean
  position: number
  createdAt: string
  updatedAt: string
}

export interface ProblemEntity {
  id: string
  title: string
  slug: string
  description: string
  constraints: string | null
  inputFormat: string | null
  outputFormat: string | null
  difficulty: Difficulty
  tags: string[]
  timeLimitMs: number
  memoryLimitMb: number
  visibility: Visibility
  examples: ProblemExample[]
  testCases: TestCaseEntity[]
  totalSubmissions: number
  acceptedSubmissions: number
  acceptanceRate: number
  createdAt: string
  updatedAt: string
}

export interface SubmissionEntity {
  id: string
  problemId: string
  userId: number
  language: Language
  verdict: SubmissionVerdict
  passedCount: number
  totalCount: number
  executionTimeMs: number
  createdAt: string
}

export interface PaginatedProblemsResponse {
  problems: ProblemEntity[]
  total: number
}

export interface CreateProblemRequest {
  title: string
  slug: string
  description: string
  difficulty: Difficulty
  visibility: Visibility
  tags?: string[]
  timeLimitMs: number
  memoryLimitMb: number
  constraints?: string
  inputFormat?: string
  outputFormat?: string
  examples?: ProblemExample[]
}