import type { Language } from "@/common/constants"

export interface GetExecutionResponse {
    state: 'completed' | 'failed' | 'delayed' | 'active' | 'waiting' | 'waiting-children' | 'unknown',
    result: ExecutionResult | null,
    error: string | null,
}

export interface ExecutionResult {
    stdout: string
    stderr: string
    exitCode: number
    timedOut: boolean
    oomKilled: boolean
    outputLimitHit: boolean
}

export interface CreateExecutionRequest {
    code: string;
    language: Language;
}

export interface CreateExecutionResponse {
    jobId: string;
}