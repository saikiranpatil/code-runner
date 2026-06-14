export interface ApiResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors: string[];
  data: null;
  path: string;
  timestamp: string;
}

// Execution
export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  oomKilled: boolean;
  outputLimitHit: boolean;
}