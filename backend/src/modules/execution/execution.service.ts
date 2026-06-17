import { Injectable, Logger } from '@nestjs/common';
import {
  ExecutionResult,
  JudgeResult,
  RunResult,
  TestCaseResult,
  SubmissionVerdict,
} from './execution.types';
import { ProblemsService } from '../problems/problems.service';
import { DockerExecutionService } from './docker-execution.service';
import { SubmitCodeDto } from './dto/submit-code.dto';
import { RunCodeDto } from './dto/run-code.dto';
import { OutputEvaluator } from './helper/output-evaluator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ExecutionService {
  private readonly logger = new Logger(ExecutionService.name);

  constructor(
    private readonly problemsService: ProblemsService,
    private readonly dockerExecutionService: DockerExecutionService,
    private readonly outputEvaluator: OutputEvaluator,
    private readonly prisma: PrismaService,
  ) { }

  async run(dto: RunCodeDto, _userId: number): Promise<RunResult> {
    const problem = await this.problemsService.findWithTestCases(dto.problemId);
    const testCases = problem.testCases;

    const results = await Promise.all(
      testCases.map((tc) =>
        this.dockerExecutionService.execute({
          language: dto.language,
          sourceCode: dto.sourceCode,
          stdin: tc.input,
          timeLimitMs: problem.timeLimitMs,
          memoryLimitMb: problem.memoryLimitMb,
        }).then((result) => ({
          tc,
          result,
          verdict: this.determineVerdict(result, tc.expectedOutput, problem.timeLimitMs),
        }))
      )
    );

    let passedCount = 0;
    let overallVerdict = SubmissionVerdict.ACCEPTED;
    const testCaseResults: TestCaseResult[] = results.map(({ tc, result, verdict }) => {
      if (verdict === SubmissionVerdict.ACCEPTED) passedCount++;
      else if (overallVerdict === SubmissionVerdict.ACCEPTED) overallVerdict = verdict;
      return {
        testCaseId: tc.id, input: tc.input, expectedOutput: tc.expectedOutput,
        verdict, executionTimeMs: result.executionTimeMs,
        stdout: result.stdout, stderr: result.stderr,
      };
    });

    return {
      verdict: overallVerdict,
      passedCount,
      totalCount: testCases.length,
      testCaseResults
    };
  }

  async judge(dto: SubmitCodeDto, userId: number): Promise<JudgeResult> {
    const problem = await this.problemsService.findWithTestCases(dto.problemId, true);
    const testCases = problem.testCases;

    const executionResults = await Promise.all(testCases.map(async tc => {
      return await this.dockerExecutionService.execute({
        language: dto.language,
        sourceCode: dto.sourceCode,
        stdin: tc.input,
        timeLimitMs: problem.timeLimitMs,
        memoryLimitMb: problem.memoryLimitMb,
      });
    }));

    let verdict = SubmissionVerdict.ACCEPTED;
    let passedCount = 0;
    let maxExecutionTimeMs = 0;
    let firstFailedResult: TestCaseResult | null = null;

    const dbResults: {
      testCaseId: string;
      verdict: string;
      executionTimeMs: number;
      memoryUsedMb?: number;
      stdout?: string;
      stderr?: string;
    }[] = [];

    testCases.forEach((tc, idx) => {
      const result = executionResults[idx];
      const tcVerdict = this.determineVerdict(result, tc.expectedOutput, problem.timeLimitMs);
      maxExecutionTimeMs = Math.max(maxExecutionTimeMs, result.executionTimeMs);

      const tcResult: TestCaseResult = {
        testCaseId: tc.id,
        expectedOutput: tc.expectedOutput,
        input: tc.input,
        verdict: tcVerdict,
        executionTimeMs: result.executionTimeMs,
        memoryUsedMb: result.memoryUsedMb,
        stdout: result.stdout,
        stderr: result.stderr,
      };

      dbResults.push({
        testCaseId: tc.id,
        verdict: tcVerdict,
        executionTimeMs: result.executionTimeMs,
        memoryUsedMb: result.memoryUsedMb,
        stdout: result.stdout,
        stderr: result.stderr,
      });

      if (tcVerdict === SubmissionVerdict.ACCEPTED) {
        passedCount++;
      } else if (verdict === SubmissionVerdict.ACCEPTED) {
        verdict = tcVerdict;
        firstFailedResult = tcResult;
      }
    })

    const submission = await this.prisma.submission.create({
      data: {
        problemId: dto.problemId,
        userId,
        language: dto.language as any,
        sourceCode: dto.sourceCode,
        verdict: verdict as any,
        passedCount,
        totalCount: testCases.length,
        executionTimeMs: maxExecutionTimeMs,
        testCaseResults: {
          create: dbResults.map((r) => ({
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

    return {
      submissionId: submission.id,
      verdict,
      passedCount,
      totalCount: testCases.length,
      executionTimeMs: maxExecutionTimeMs,
      testCaseResults: firstFailedResult ? [firstFailedResult] : [],
    };
  }

  private determineVerdict(
    result: ExecutionResult,
    expectedOutput: string,
    timeLimitMs: number,
  ): SubmissionVerdict {
    if (result.timedOut || result.executionTimeMs >= timeLimitMs) {
      return SubmissionVerdict.TIME_LIMIT_EXCEEDED;
    }
    if (result.oomKilled) {
      return SubmissionVerdict.MEMORY_LIMIT_EXCEEDED;
    }
    if (result.exitCode !== 0) {
      // Could be compile error or runtime error — distinguish by stderr content
      const stderr = result.stderr?.toLowerCase() ?? '';
      if (
        stderr.includes('syntaxerror') ||
        stderr.includes('error:') ||
        stderr.includes('compil')
      ) {
        return SubmissionVerdict.COMPILATION_ERROR;
      }
      return SubmissionVerdict.RUNTIME_ERROR;
    }
    if (this.outputEvaluator.isCorrect(result.stdout, expectedOutput)) {
      return SubmissionVerdict.ACCEPTED;
    }
    return SubmissionVerdict.WRONG_ANSWER;
  }
}