import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { ExecutionService } from './ececution.service';
import { executionSchema } from './execution.schema';
import type { ExecutionInput } from './execution.schema';
import { ZodValidationPipe } from '../common/zod/zod-validation.pipe';

@Controller('execute')
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(executionSchema))
  async execute(@Body() body: ExecutionInput) {
    return this.executionService.addJob(body.code, body.language);
  }
}
