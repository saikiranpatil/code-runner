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
} from './entities/problem.entity';
import { Prisma } from '../../prisma/generated/client';

@Injectable()
export class ProblemsService {
  private readonly logger = new Logger(ProblemsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProblemDto): Promise<ProblemEntity> {
    const existing = await this.prisma.problem.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException(
        `Problem with slug "${dto.slug}" already exists`,
      );
    }

    this.logger.log(`Creating problem: ${dto.slug}`);

    const problem = await this.prisma.$transaction(async (tx) => {
      return tx.problem.create({
        data: {
          title: dto.title,
          slug: dto.slug,
          description: dto.description,
          constraints: dto.constraints,
          inputFormat: dto.inputFormat,
          outputFormat: dto.outputFormat,
          difficulty: dto.difficulty,
          tags: dto.tags ?? [],
          timeLimitMs: dto.timeLimitMs ?? 2000,
          memoryLimitMb: dto.memoryLimitMb ?? 256,
          visibility: dto.visibility,
          examples: (dto.examples ?? [])  as unknown as Prisma.InputJsonValue,
          testCases: {
            create: dto.testCases.map((tc) => ({
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              isHidden: tc.isHidden,
            })),
          },
        },
        include: { testCases: true },
      });
    });

    return this.mapToEntity(problem);
  }

  async findById(id: string): Promise<ProblemEntity> {
    const problem = await this.prisma.problem.findUnique({
      where: { id },
      include: { testCases: true },
    });

    if (!problem) {
      throw new NotFoundException(`Problem with id "${id}" not found`);
    }

    return this.mapToEntity(problem);
  }

  async findBySlug(slug: string): Promise<ProblemEntity> {
    const problem = await this.prisma.problem.findUnique({
      where: { slug },
      include: { testCases: true },
    });

    if (!problem) {
      throw new NotFoundException(`Problem with slug "${slug}" not found`);
    }

    return this.mapToEntity(problem);
  }

  async list(dto: ListProblemsDto): Promise<PaginatedProblemsEntity> {
    const { page = 1, limit = 20, difficulty, tags, search } = dto;
    const skip = (page - 1) * limit;

    const where: Prisma.ProblemWhereInput = {
      visibility: 'PUBLIC',
      ...(difficulty && { difficulty }),
      ...(tags?.length && { tags: { hasSome: tags } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, problems] = await this.prisma.$transaction([
      this.prisma.problem.count({ where }),
      this.prisma.problem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        // Exclude test cases from listing for performance
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          constraints: true,
          inputFormat: true,
          outputFormat: true,
          difficulty: true,
          tags: true,
          timeLimitMs: true,
          memoryLimitMb: true,
          visibility: true,
          examples: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      data: problems.map((p) => this.mapToEntity(p as any)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Returns a problem with its test cases. Used internally by the judge.
   * Throws NotFoundException if problem doesn't exist.
   */
  async findWithTestCases(id: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { id },
      include: { testCases: true },
    });

    if (!problem) {
      throw new NotFoundException(`Problem with id "${id}" not found`);
    }

    return problem;
  }

  private mapToEntity(problem: any): ProblemEntity {
    return {
      id: problem.id,
      title: problem.title,
      slug: problem.slug,
      description: problem.description,
      constraints: problem.constraints ?? undefined,
      inputFormat: problem.inputFormat ?? undefined,
      outputFormat: problem.outputFormat ?? undefined,
      difficulty: problem.difficulty,
      tags: problem.tags,
      timeLimitMs: problem.timeLimitMs,
      memoryLimitMb: problem.memoryLimitMb,
      visibility: problem.visibility,
      examples: Array.isArray(problem.examples) ? problem.examples : [],
      testCases: problem.testCases?.map((tc: any) => ({
        id: tc.id,
        problemId: tc.problemId,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden,
        createdAt: tc.createdAt,
      })),
      createdAt: problem.createdAt,
      updatedAt: problem.updatedAt,
    };
  }
}
