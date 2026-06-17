import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import { ListProblemsDto } from './dto/list-problems.dto';
import {
  PaginatedProblemsEntity,
  ProblemEntity,
  ProblemStats,
  TestCaseEntity,
} from './entities/problem.entity';
import { Prisma } from '../../prisma/generated/client';
import { AttemptStatus, ProblemExample } from '../execution/execution.types';

@Injectable()
export class ProblemsService {
  private readonly logger = new Logger(ProblemsService.name);

  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateProblemDto): Promise<ProblemEntity> {
    const existing = await this.prisma.problem.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(`Problem with slug "${dto.slug}" already exists`);
    }

    const problem = await this.prisma.problem.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        constraints: dto.constraints,
        inputFormat: dto.inputFormat,
        outputFormat: dto.outputFormat,
        difficulty: dto.difficulty as any,
        tags: dto.tags ?? [],
        timeLimitMs: dto.timeLimitMs,
        memoryLimitMb: dto.memoryLimitMb,
        visibility: dto.visibility as any,
        examples: (dto.examples ?? []) as any,
        testCases: dto.testCases?.length
          ? {
            create: dto.testCases.map((tc, i) => ({
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              isHidden: tc.isHidden ?? false,
              position: i,
            })),
          }
          : undefined,
      },
      include: { testCases: true },
    });

    const problemStats = await this.getStats(problem?.id);
    return this.mapToEntity(problem, problemStats);
  }

  async findById(id: string): Promise<ProblemEntity> {
    const problem = await this.prisma.problem.findUnique({
      where: { id },
      include: {
        testCases: { where: { isHidden: false }, orderBy: { position: 'asc' } },
      },
    });
    if (!problem) throw new NotFoundException(`Problem "${id}" not found`);

    const problemStats = await this.getStats(problem?.id);
    return this.mapToEntity(problem, problemStats);
  }

  async findBySlug(slug: string): Promise<ProblemEntity> {
    const problem = await this.prisma.problem.findUnique({
      where: { slug },
      include: {
        testCases: { where: { isHidden: false }, orderBy: { position: 'asc' } },
      },
    });
    if (!problem) throw new NotFoundException(`Problem "${slug}" not found`);

    const problemStats = await this.getStats(problem?.id);
    return this.mapToEntity(problem, problemStats);
  }

  async list(dto: ListProblemsDto): Promise<PaginatedProblemsEntity> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    const where: Prisma.ProblemWhereInput = {
      visibility: 'PUBLIC' as any,
      ...(dto.difficulty && { difficulty: dto.difficulty as any }),
      ...(dto.tags?.length && { tags: { hasSome: dto.tags } }),
    };

    const [problems, total] = await Promise.all([
      this.prisma.problem.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.problem.count({ where }),
    ]);

    // Single batched query for submission stats across all problems
    const problemIds = problems.map((p) => p.id);

    const submissionStats =
      problemIds.length > 0
        ? await this.prisma.submission.groupBy({
          by: ['problemId', 'verdict'],
          where: { problemId: { in: problemIds } },
          _count: { id: true },
        })
        : [];

    const statsMap = new Map<string, { totalSubmissions: number; acceptedSubmissions: number, status: AttemptStatus }>();
    for (const stat of submissionStats) {
      if (!statsMap.has(stat.problemId)) {
        statsMap.set(stat.problemId, { totalSubmissions: 0, acceptedSubmissions: 0, status: AttemptStatus.UNATTEMPTED });
      }
      const s = statsMap.get(stat.problemId)!;
      s.totalSubmissions += stat._count.id;
      if (stat.verdict === 'ACCEPTED') {
        s.acceptedSubmissions += stat._count.id;
        s.status = AttemptStatus.SOLVED;
      } else if (s.status !== AttemptStatus.SOLVED) {
        s.status = AttemptStatus.ATTEMPTED;
      }
    }

    return {
      problems: problems.map((p) =>
        this.mapToEntity(p, statsMap.get(p.id) ?? { totalSubmissions: 0, acceptedSubmissions: 0, status: AttemptStatus.UNATTEMPTED }),
      ),
      total,
    };
  }

  async findWithTestCases(id: string, includeHiddenTestcases: boolean = false) {
    const problem = await this.prisma.problem.findUnique({
      where: { id },
      include: { testCases: includeHiddenTestcases ? true : { where: { isHidden: false } } },
    });
    if (!problem) throw new NotFoundException(`Problem "${id}" not found`);
    return problem;
  }

  async getUserSubmissions(problemId: string, userId: number) {
    return this.prisma.submission.findMany({
      where: { problemId, userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        verdict: true,
        language: true,
        passedCount: true,
        totalCount: true,
        executionTimeMs: true,
        createdAt: true,
      },
    });
  }

  private async getStats(problemId: string) {
    const [totalSubmissions, acceptedSubmissions] = await Promise.all([
      this.prisma.submission.count({ where: { problemId } }),
      this.prisma.submission.count({ where: { problemId, verdict: 'ACCEPTED' } }),
    ]);

    const attemptStatus = acceptedSubmissions > 0 ?
      AttemptStatus.SOLVED : totalSubmissions > 0 ?
        AttemptStatus.ATTEMPTED : AttemptStatus.UNATTEMPTED;

    return {
      acceptedSubmissions,
      status: attemptStatus,
      totalSubmissions
    };
  }

  private mapToEntity(
    problem: any,
    stats: ProblemStats,
  ): ProblemEntity {
    const { totalSubmissions, acceptedSubmissions, status } = stats;
    const acceptanceRate =
      totalSubmissions > 0
        ? Math.round((acceptedSubmissions / totalSubmissions) * 10000) / 100
        : 0;

    return {
      id: problem.id,
      title: problem.title,
      slug: problem.slug,
      description: problem.description,
      constraints: problem.constraints ?? null,
      inputFormat: problem.inputFormat ?? null,
      outputFormat: problem.outputFormat ?? null,
      difficulty: problem.difficulty,
      tags: problem.tags,
      timeLimitMs: problem.timeLimitMs,
      memoryLimitMb: problem.memoryLimitMb,
      visibility: problem.visibility,
      examples: problem.examples as ProblemExample[],
      testCases: (problem.testCases ?? []).map(
        (tc: any): TestCaseEntity => ({
          id: tc.id,
          problemId: tc.problemId,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden,
          position: tc.position,
          createdAt: tc.createdAt.toISOString(),
          updatedAt: tc.updatedAt.toISOString(),
        }),
      ),
      status,
      totalSubmissions,
      acceptedSubmissions,
      acceptanceRate,
      createdAt: problem.createdAt.toISOString(),
      updatedAt: problem.updatedAt.toISOString(),
    };
  }
}