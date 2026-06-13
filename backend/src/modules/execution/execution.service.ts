import { Injectable, Logger } from '@nestjs/common';
import {
  ExecutionResult,
  JudgeResult,
  SubmissionVerdict,
  SupportedLanguage,
  TestCaseResult,
} from './execution.types';
import { ProblemsService } from '../problems/problems.service';
import { DockerExecutionService } from './docker-execution.service';
import { SubmitCodeDto } from './dto/submit-code.dto';
import { OutputEvaluator } from './helper/output-evaluator';

@Injectable()
export class ExecutionService {
  private readonly logger = new Logger(ExecutionService.name);

  constructor(
    private readonly dockerExecution: DockerExecutionService,
    private readonly problemsService: ProblemsService,
    private readonly outputEvaluator: OutputEvaluator,
  ) {}

  async judge(dto: SubmitCodeDto): Promise<JudgeResult> {
    const { problemId, language, sourceCode } = dto;

    this.logger.log(
      `Judging submission — problem: ${problemId}, language: ${language}`,
    );

    // 1. Load problem and test cases
    const problem = await this.problemsService.findWithTestCases(problemId);

    const testCaseResults: TestCaseResult[] = [];
    let overallVerdict = SubmissionVerdict.ACCEPTED;
    let passedCount = 0;
    let totalExecutionTimeMs = 0;

    // 2. Execute against each test case sequentially
    for (const testCase of problem.testCases) {
      const result = await this.dockerExecution.execute({
        language: language as SupportedLanguage,
        sourceCode,
        stdin: testCase.input,
        timeLimitMs: problem.timeLimitMs,
        memoryLimitMb: problem.memoryLimitMb,
      });

      totalExecutionTimeMs += result.executionTimeMs;

      const verdict = this.determineVerdict(
        result,
        testCase.expectedOutput,
        problem.timeLimitMs,
      );

      testCaseResults.push({
        testCaseId: testCase.id,
        verdict,
        executionTimeMs: result.executionTimeMs,
        memoryUsedMb: result.memoryUsedMb,
        stdout: result.stdout,
        stderr: result.stderr,
      });

      if (verdict === SubmissionVerdict.ACCEPTED) {
        passedCount++;
      } else {
        // 3. Stop immediately on compilation errors; continue on runtime/WA
        if (
          verdict === SubmissionVerdict.COMPILATION_ERROR ||
          verdict === SubmissionVerdict.INTERNAL_ERROR
        ) {
          overallVerdict = verdict;
          break;
        }

        // Record the first failing verdict as the overall verdict
        if (overallVerdict === SubmissionVerdict.ACCEPTED) {
          overallVerdict = verdict;
        }
      }
    }

    return {
      verdict: overallVerdict,
      passedCount,
      totalCount: problem.testCases.length,
      executionTimeMs: totalExecutionTimeMs,
      testCaseResults,
    };
  }

  private determineVerdict(
    result: ExecutionResult,
    expectedOutput: string,
    timeLimitMs: number,
  ): SubmissionVerdict {
    // Compilation error: exit code 1 with no stdout (heuristic)
    // The compile phase returns early with stderr populated and stdout empty
    // when the compiler exits non-zero.
    if (result.exitCode !== 0 && result.stdout === '' && result.stderr !== '') {
      // Could be compile error or runtime error — distinguish by stderr content
      const stderr = result.stderr.toLowerCase();
      if (
        stderr.includes('error:') &&
        (stderr.includes('compile') ||
          stderr.includes('syntax') ||
          stderr.includes('undefined') ||
          stderr.includes('expected') ||
          stderr.includes('undeclared') ||
          stderr.includes('cannot find symbol'))
      ) {
        return SubmissionVerdict.COMPILATION_ERROR;
      }
    }

    if (result.timedOut || result.executionTimeMs >= timeLimitMs) {
      return SubmissionVerdict.TIME_LIMIT_EXCEEDED;
    }

    if (result.oomKilled) {
      return SubmissionVerdict.MEMORY_LIMIT_EXCEEDED;
    }

    // Non-zero exit with no compile error signals = runtime error
    if (result.exitCode !== 0) {
      return SubmissionVerdict.RUNTIME_ERROR;
    }

    if (!this.outputEvaluator.isCorrect(result.stdout, expectedOutput)) {
      return SubmissionVerdict.WRONG_ANSWER;
    }

    return SubmissionVerdict.ACCEPTED;
  }
}