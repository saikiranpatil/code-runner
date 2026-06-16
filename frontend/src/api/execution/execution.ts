import type { Language } from "@/common/constants";

export interface ExecutionRequest {
  problemId: string;
  language: Language;
  sourceCode: string;
}

export interface ExecutionResponse {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  oomKilled: boolean;
  outputLimitHit: boolean;
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum Visibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  DRAFT = 'DRAFT',
}

export enum SubmissionVerdict {
  ACCEPTED = 'ACCEPTED',
  WRONG_ANSWER = 'WRONG_ANSWER',
  TIME_LIMIT_EXCEEDED = 'TIME_LIMIT_EXCEEDED',
  MEMORY_LIMIT_EXCEEDED = 'MEMORY_LIMIT_EXCEEDED',
  RUNTIME_ERROR = 'RUNTIME_ERROR',
  COMPILATION_ERROR = 'COMPILATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export enum SupportedLanguage {
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  PYTHON = 'python',
  CPP = 'cpp',
  JAVA = 'java',
}

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface TestCaseResult {
  testCaseId: string;
  verdict: SubmissionVerdict;
  executionTimeMs: number;
  memoryUsedMb?: number;
  stdout?: string;
  stderr?: string;
}

export interface JudgeResult {
  verdict: SubmissionVerdict;
  passedCount: number;
  totalCount: number;
  executionTimeMs: number;
  testCaseResults: TestCaseResult[];
}

export interface ExecutionOptions {
  language: SupportedLanguage;
  sourceCode: string;
  stdin: string;
  timeLimitMs: number;
  memoryLimitMb: number;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  memoryUsedMb?: number;
  timedOut: boolean;
  oomKilled: boolean;
}