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

export enum AttemptStatus {
  ATTEMPTED = 'ATTEMPTED',
  SOLVED = 'SOLVED',
  UNATTEMPTED = 'UNATTEMPTED',
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

export interface RunTestCaseResult {
  testCaseId: string;
  input: string;
  expectedOutput: string;
  verdict: SubmissionVerdict;
  executionTimeMs: number;
  stdout?: string;
  stderr?: string;
}

export interface RunResult {
  verdict: SubmissionVerdict;
  passedCount: number;
  totalCount: number;
  testCaseResults: RunTestCaseResult[];
}

export interface JudgeResult {
  submissionId: string;
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
  /**
   * True when the compile phase (not the run phase) produced a non-zero exit code.
   * Allows determineVerdict() to return COMPILATION_ERROR rather than RUNTIME_ERROR.
   *
   * Previously, compilation failures were silently mis-classified as RUNTIME_ERROR
   * because ExecutionResult carried no information about which phase had failed.
   */
  compilationFailed: boolean;
}