// backend/src/modules/execution/execution-runner.service.ts
import { Injectable, Logger } from '@nestjs/common';
import {
    ExecutionResult,
    JudgeResult,
    RunResult,
    RunTestCaseResult,
    SubmissionVerdict,
    SupportedLanguage,
    TestCaseResult,
} from './execution.types';
import { ProblemsService } from '../problems/problems.service';
import { DockerExecutionService } from './docker-execution.service';
import { OutputEvaluator } from './helper/output-evaluator';
import { PrismaService } from '../../prisma/prisma.service';
import { RunCodeDto } from './dto/run-code.dto';
import { SubmitCodeDto } from './dto/submit-code.dto';

const MAX_TESTCASE_CONCURRENCY = 4;

interface TestCaseExecution {
    testCaseId: string;
    input: string;
    expectedOutput: string;
    result: ExecutionResult;
    verdict: SubmissionVerdict;
}

interface AggregatedVerdict {
    overallVerdict: SubmissionVerdict;
    passedCount: number;
    maxExecutionTimeMs: number;
}

@Injectable()
export class ExecutionRunnerService {
    private readonly logger = new Logger(ExecutionRunnerService.name);

    constructor(
        private readonly problemsService: ProblemsService,
        private readonly dockerExecutionService: DockerExecutionService,
        private readonly outputEvaluator: OutputEvaluator,
        private readonly prisma: PrismaService,
    ) { }

    async run(dto: RunCodeDto, _userId: number): Promise<RunResult> {
        const problem = await this.problemsService.findWithTestCases(dto.problemId, false);
        const executions = await this.executeAllTestCases(
            problem.testCases,
            dto.language as SupportedLanguage,
            dto.sourceCode,
            problem.timeLimitMs,
            problem.memoryLimitMb,
        );
        const { overallVerdict, passedCount } = this.aggregateVerdict(executions);
        return {
            verdict: overallVerdict,
            passedCount,
            totalCount: problem.testCases.length,
            testCaseResults: executions.map((e) => this.toRunTestCaseResult(e)),
        };
    }

    async judge(dto: SubmitCodeDto, userId: number): Promise<JudgeResult> {
        const problem = await this.problemsService.findWithTestCases(dto.problemId, true);

        let executions: TestCaseExecution[];
        try {
            executions = await this.executeAllTestCases(
                problem.testCases,
                dto.language as SupportedLanguage,
                dto.sourceCode,
                problem.timeLimitMs,
                problem.memoryLimitMb,
            );
        } catch (err) {
            // Real infrastructure failure — let BullMQ retry this job.
            this.logger.error(`judge() infra failure for problem ${dto.problemId}`, err as Error);
            throw err;
        }

        const { overallVerdict, passedCount, maxExecutionTimeMs } = this.aggregateVerdict(executions);
        const testCaseResults = executions.map((e) => this.toTestCaseResult(e));

        const submission = await this.persistSubmission({
            dto,
            userId,
            verdict: overallVerdict,
            passedCount,
            totalCount: problem.testCases.length,
            executionTimeMs: maxExecutionTimeMs,
            testCaseResults,
        });

        return {
            submissionId: submission.id,
            verdict: overallVerdict,
            passedCount,
            totalCount: problem.testCases.length,
            executionTimeMs: maxExecutionTimeMs,
            testCaseResults,
        };
    }

    // execution-runner.service.ts

    private async executeAllTestCases(
        testCases: Array<{ id: string; input: string; expectedOutput: string }>,
        language: SupportedLanguage,
        sourceCode: string,
        timeLimitMs: number,
        memoryLimitMb: number,
    ): Promise<TestCaseExecution[]> {
        const allExecutions = await this.mapWithConcurrencyLimit(
            testCases,
            MAX_TESTCASE_CONCURRENCY,
            (testCase) => this.executeTestCase(testCase, language, sourceCode, timeLimitMs, memoryLimitMb),
        );

        // Short-circuit: because all test cases share the same source code, a
        // compilation error is deterministic — no value in surfacing the rest.
        // Slice results up to and including the first compilation failure.
        const executions: TestCaseExecution[] = [];
        for (const execution of allExecutions) {
            executions.push(execution);
            if (execution.verdict === SubmissionVerdict.COMPILATION_ERROR) break;
        }
        return executions;
    }

    private async mapWithConcurrencyLimit<T, R>(
        items: T[],
        limit: number,
        fn: (item: T) => Promise<R>,
    ): Promise<R[]> {
        const results: R[] = new Array(items.length);
        let cursor = 0;
        const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
            while (cursor < items.length) {
                const index = cursor++;
                results[index] = await fn(items[index]);
            }
        });
        await Promise.all(workers);
        return results;
    }

    private async executeTestCase(
        testCase: { id: string; input: string; expectedOutput: string },
        language: SupportedLanguage,
        sourceCode: string,
        timeLimitMs: number,
        memoryLimitMb: number,
    ): Promise<TestCaseExecution> {
        const result = await this.dockerExecutionService.execute({
            language,
            sourceCode,
            stdin: testCase.input,
            timeLimitMs,
            memoryLimitMb,
        });
        const verdict = this.determineVerdict(result, testCase.expectedOutput, timeLimitMs);
        return { testCaseId: testCase.id, input: testCase.input, expectedOutput: testCase.expectedOutput, result, verdict };
    }

    private determineVerdict(result: ExecutionResult, expectedOutput: string, timeLimitMs: number): SubmissionVerdict {
        if (result.compilationFailed) return SubmissionVerdict.COMPILATION_ERROR;
        if (result.timedOut || result.executionTimeMs > timeLimitMs) return SubmissionVerdict.TIME_LIMIT_EXCEEDED;
        if (result.oomKilled) return SubmissionVerdict.MEMORY_LIMIT_EXCEEDED;
        if (result.exitCode !== 0) return SubmissionVerdict.RUNTIME_ERROR;
        if (!this.outputEvaluator.isCorrect(result.stdout, expectedOutput)) return SubmissionVerdict.WRONG_ANSWER;
        return SubmissionVerdict.ACCEPTED;
    }

    private aggregateVerdict(executions: TestCaseExecution[]): AggregatedVerdict {
        let overallVerdict = SubmissionVerdict.ACCEPTED;
        let passedCount = 0;
        let maxExecutionTimeMs = 0;
        for (const { verdict, result } of executions) {
            if (verdict === SubmissionVerdict.ACCEPTED) passedCount++;
            else if (overallVerdict === SubmissionVerdict.ACCEPTED) overallVerdict = verdict;
            if (result.executionTimeMs > maxExecutionTimeMs) maxExecutionTimeMs = result.executionTimeMs;
        }
        return { overallVerdict, passedCount, maxExecutionTimeMs };
    }

    private toRunTestCaseResult(e: TestCaseExecution): RunTestCaseResult {
        return {
            testCaseId: e.testCaseId,
            input: e.input,
            expectedOutput: e.expectedOutput,
            verdict: e.verdict,
            executionTimeMs: e.result.executionTimeMs,
            stdout: e.result.stdout,
            stderr: e.result.stderr,
        };
    }

    private toTestCaseResult(e: TestCaseExecution): TestCaseResult {
        return {
            testCaseId: e.testCaseId,
            verdict: e.verdict,
            executionTimeMs: e.result.executionTimeMs,
            memoryUsedMb: e.result.memoryUsedMb,
            stdout: e.result.stdout,
            stderr: e.result.stderr,
        };
    }

    private async persistSubmission(params: {
        dto: SubmitCodeDto;
        userId: number;
        verdict: SubmissionVerdict;
        passedCount: number;
        totalCount: number;
        executionTimeMs: number;
        testCaseResults: TestCaseResult[];
    }) {
        const { dto, userId, verdict, passedCount, totalCount, executionTimeMs, testCaseResults } = params;
        return this.prisma.submission.create({
            data: {
                problemId: dto.problemId,
                userId,
                language: dto.language as any,
                sourceCode: dto.sourceCode,
                verdict: verdict as any,
                passedCount,
                totalCount,
                executionTimeMs,
                testCaseResults: {
                    create: testCaseResults.map((r) => ({
                        testCaseId: r.testCaseId,
                        verdict: r.verdict as any,
                        executionTimeMs: r.executionTimeMs,
                        memoryUsedMb: r.memoryUsedMb,
                        stdout: r.stdout,
                        stderr: r.stderr,
                    })),
                },
            },
        });
    }
}