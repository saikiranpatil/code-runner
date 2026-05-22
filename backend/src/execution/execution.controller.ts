import {
  Body,
  Controller,
  Post,
  UsePipes,
} from '@nestjs/common';
import { ExecutionService } from './ececution.service';
import { ZodValidationPipe } from 'src/common/zod/zod-validation.pipe';
import { executionSchema } from './execution.schema';
import type { ExecutionInput } from './execution.schema';

@Controller('execute')
export class ExecutionController {
  constructor(
    private readonly executionService: ExecutionService,
  ) { }

  @Post()
  @UsePipes(new ZodValidationPipe(executionSchema))
  async execute(
    @Body() body: ExecutionInput,
  ) {
    return this.executionService.addJob(
      body.code,
      body.language,
    );
  }
}