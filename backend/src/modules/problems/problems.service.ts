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
  TestCaseEntity,
} from './entities/problem.entity';
import { Prisma } from '../../prisma/generated/client';
import { ProblemExample } from '../execution/execution.types';

@Injectable()
export class ProblemsService {
  private readonly logger = new Logger(ProblemsService.name);

  constructor(private readonly prisma: PrismaService) {}

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

    return this.mapToEntity(problem, { totalSubmissions: 0, acceptedSubmissions: 0 });
  }

  async findById(id: string): Promise<ProblemEntity> {
    const problem = await this.prisma.problem.findUnique({
      where: { id },
      include: {
        testCases: { where: { isHidden: false }, orderBy: { position: 'asc' } },
      },
    });
    if (!problem) throw new NotFoundException(`Problem "${id}" not found`);

    const [totalSubmissions, acceptedSubmissions] = await Promise.all([
      this.prisma.submission.count({ where: { problemId: id } }),
      this.prisma.submission.count({ where: { problemId: id, verdict: 'ACCEPTED' } }),
    ]);

    return this.mapToEntity(problem, { totalSubmissions, acceptedSubmissions });
  }

  async findBySlug(slug: string): Promise<ProblemEntity> {
    const problem = await this.prisma.problem.findUnique({
      where: { slug },
      include: {
        testCases: { where: { isHidden: false }, orderBy: { position: 'asc' } },
      },
    });
    if (!problem) throw new NotFoundException(`Problem "${slug}" not found`);

    const [totalSubmissions, acceptedSubmissions] = await Promise.all([
      this.prisma.submission.count({ where: { problemId: problem.id } }),
      this.prisma.submission.count({ where: { problemId: problem.id, verdict: 'ACCEPTED' } }),
    ]);

    return this.mapToEntity(problem, { totalSubmissions, acceptedSubmissions });
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

    const statsMap = new Map<string, { totalSubmissions: number; acceptedSubmissions: number }>();
    for (const stat of submissionStats) {
      if (!statsMap.has(stat.problemId)) {
        statsMap.set(stat.problemId, { totalSubmissions: 0, acceptedSubmissions: 0 });
      }
      const s = statsMap.get(stat.problemId)!;
      s.totalSubmissions += stat._count.id;
      if (stat.verdict === 'ACCEPTED') s.acceptedSubmissions += stat._count.id;
    }

    return {
      problems: problems.map((p) =>
        this.mapToEntity(p, statsMap.get(p.id) ?? { totalSubmissions: 0, acceptedSubmissions: 0 }),
      ),
      total,
    };
  }

  async findWithTestCases(id: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { id },
      include: { testCases: { orderBy: { position: 'asc' } } },
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

  private mapToEntity(
    problem: any,
    stats: { totalSubmissions: number; acceptedSubmissions: number },
  ): ProblemEntity {
    const { totalSubmissions, acceptedSubmissions } = stats;
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
      totalSubmissions,
      acceptedSubmissions,
      acceptanceRate,
      createdAt: problem.createdAt.toISOString(),
      updatedAt: problem.updatedAt.toISOString(),
    };
  }
}