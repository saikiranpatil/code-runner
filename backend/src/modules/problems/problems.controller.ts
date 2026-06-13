import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateProblemDto } from './dto/create-problem.dto';
import { ListProblemsDto } from './dto/list-problems.dto';
import {
  PaginatedProblemsEntity,
  ProblemEntity,
} from './entities/problem.entity';
import { ProblemsService } from './problems.service';
import { Public } from '../auth/auth.decorators';

@Public()
@Controller('problems')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProblemDto): Promise<ProblemEntity> {
    return this.problemsService.create(dto);
  }

  @Get()
  list(@Query() query: ListProblemsDto): Promise<PaginatedProblemsEntity> {
    return this.problemsService.list(query);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string): Promise<ProblemEntity> {
    return this.problemsService.findBySlug(slug);
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<ProblemEntity> {
    return this.problemsService.findById(id);
  }
}
