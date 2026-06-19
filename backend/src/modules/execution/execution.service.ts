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
import { SubmitCodeDto } from './dto/submit-code.dto';
import { RunCodeDto } from './dto/run-code.dto';
import { OutputEvaluator } from './helper/output-evaluator';
import { PrismaService } from '../../prisma/prisma.service';

// ── Internal types ────────────────────────────────────────────────────────────

/**
 * The raw outcome of executing a single test case: the Docker result plus the
 * evaluated verdict. Used as an intermediate value before mapping into the
 * run-specific or judge-specific API shapes.
 */
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
  /** Wall-clock max across all test cases; used as the submission's reported time. */
  maxExecutionTimeMs: number;
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class ExecutionService {
  private readonly logger = new Logger(ExecutionService.name);

  constructor(
    private readonly problemsService: ProblemsService,
    private readonly dockerExecutionService: DockerExecutionService,
    private readonly outputEvaluator: OutputEvaluator,
    private readonly prisma: PrismaService,
  ) {}

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Runs user code against the problem's non-hidden test cases.
   * Results include input/expectedOutput so the UI can display them inline.
   * Nothing is persisted.
   */
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

  /**
   * Judges user code against all test cases (including hidden ones), persists the
   * submission record, and returns the judge result.
   */
  async judge(dto: SubmitCodeDto, userId: number): Promise<JudgeResult> {
    const problem = await this.problemsService.findWithTestCases(dto.problemId, true);

    const executions = await this.executeAllTestCases(
      problem.testCases,
      dto.language as SupportedLanguage,
      dto.sourceCode,
      problem.timeLimitMs,
      problem.memoryLimitMb,
    );

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

  // ── Private: test case execution ───────────────────────────────────────────

  /**
   * Sequentially executes every test case, short-circuiting on a compilation
   * error. Because all test cases share the same source code, if the compiler
   * rejects it for the first test case it will reject it for all of them — there
   * is no value in running the remainder.
   */
  private async executeAllTestCases(
    testCases: Array<{ id: string; input: string; expectedOutput: string }>,
    language: SupportedLanguage,
    sourceCode: string,
    timeLimitMs: number,
    memoryLimitMb: number,
  ): Promise<TestCaseExecution[]> {
    const executions: TestCaseExecution[] = [];

    for (const testCase of testCases) {
      const execution = await this.executeTestCase(
        testCase,
        language,
        sourceCode,
        timeLimitMs,
        memoryLimitMb,
      );
      executions.push(execution);

      if (execution.verdict === SubmissionVerdict.COMPILATION_ERROR) break;
    }

    return executions;
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

    return {
      testCaseId: testCase.id,
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      result,
      verdict,
    };
  }

  // ── Private: verdict logic ─────────────────────────────────────────────────

  /**
   * Maps a raw `ExecutionResult` onto a `SubmissionVerdict`.
   * Checks are ordered from most-definitive to least: the `compilationFailed`
   * flag must be checked before `exitCode`, otherwise a compile failure would
   * incorrectly surface as a `RUNTIME_ERROR`.
   */
  private determineVerdict(
    result: ExecutionResult,
    expectedOutput: string,
    timeLimitMs: number,
  ): SubmissionVerdict {
    if (result.compilationFailed) return SubmissionVerdict.COMPILATION_ERROR;
    if (result.timedOut || result.executionTimeMs > timeLimitMs) return SubmissionVerdict.TIME_LIMIT_EXCEEDED;
    if (result.oomKilled) return SubmissionVerdict.MEMORY_LIMIT_EXCEEDED;
    if (result.exitCode !== 0) return SubmissionVerdict.RUNTIME_ERROR;
    if (!this.outputEvaluator.isCorrect(result.stdout, expectedOutput)) return SubmissionVerdict.WRONG_ANSWER;
    return SubmissionVerdict.ACCEPTED;
  }

  // ── Private: result aggregation ────────────────────────────────────────────

  /**
   * Derives the overall submission verdict and statistics from a list of
   * per-test-case executions.
   *
   * Overall verdict = ACCEPTED only if every test case passed; otherwise it is
   * the verdict of the first failing test case (preserving the natural ordering
   * in which test cases are defined on the problem).
   */
  private aggregateVerdict(executions: TestCaseExecution[]): AggregatedVerdict {
    let overallVerdict = SubmissionVerdict.ACCEPTED;
    let passedCount = 0;
    let maxExecutionTimeMs = 0;

    for (const { verdict, result } of executions) {
      if (verdict === SubmissionVerdict.ACCEPTED) {
        passedCount++;
      } else if (overallVerdict === SubmissionVerdict.ACCEPTED) {
        overallVerdict = verdict; // Capture the first failing verdict.
      }
      if (result.executionTimeMs > maxExecutionTimeMs) {
        maxExecutionTimeMs = result.executionTimeMs;
      }
    }

    return { overallVerdict, passedCount, maxExecutionTimeMs };
  }

  // ── Private: result mapping ────────────────────────────────────────────────

  /**
   * Maps to the run-specific shape, which includes `input` and `expectedOutput`
   * so the UI can display them inline next to the verdict.
   */
  private toRunTestCaseResult(execution: TestCaseExecution): RunTestCaseResult {
    return {
      testCaseId: execution.testCaseId,
      input: execution.input,
      expectedOutput: execution.expectedOutput,
      verdict: execution.verdict,
      executionTimeMs: execution.result.executionTimeMs,
      stdout: execution.result.stdout,
      stderr: execution.result.stderr,
    };
  }

  /**
   * Maps to the judge-specific shape. Does NOT include `input` or `expectedOutput`
   * because hidden test case data must not be leaked to the client.
   */
  private toTestCaseResult(execution: TestCaseExecution): TestCaseResult {
    return {
      testCaseId: execution.testCaseId,
      verdict: execution.verdict,
      executionTimeMs: execution.result.executionTimeMs,
      memoryUsedMb: execution.result.memoryUsedMb,
      stdout: execution.result.stdout,
      stderr: execution.result.stderr,
    };
  }

  // ── Private: persistence ───────────────────────────────────────────────────

  private async persistSubmission(params: {
    dto: SubmitCodeDto;
    userId: number;
    verdict: SubmissionVerdict;
    passedCount: number;
    totalCount: number;
    executionTimeMs: number;
    testCaseResults: TestCaseResult[];
  }) {
    const { dto, userId, verdict, passedCount, totalCount, executionTimeMs, testCaseResults } =
      params;

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