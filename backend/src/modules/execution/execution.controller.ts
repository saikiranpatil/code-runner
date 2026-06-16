import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JudgeResult, RunResult } from './execution.types';
import { SubmitCodeDto } from './dto/submit-code.dto';
import { RunCodeDto } from './dto/run-code.dto';
import { ExecutionService } from './execution.service';

@Controller('execution')
@UsePipes(new ValidationPipe({ transform: true }))
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  @Post('run')
  @HttpCode(HttpStatus.OK)
  run(@Body() dto: RunCodeDto, @Req() req: any): Promise<RunResult> {
    return this.executionService.run(dto, req.user.id);
  }

  @Post('submit')
  @HttpCode(HttpStatus.OK)
  submit(@Body() dto: SubmitCodeDto, @Req() req: any): Promise<JudgeResult> {
    return this.executionService.judge(dto, req.user.id);
  }
}