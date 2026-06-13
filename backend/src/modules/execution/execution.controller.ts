import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JudgeResult } from './execution.types';
import { SubmitCodeDto } from './dto/submit-code.dto';
import { ExecutionService } from './execution.service';

@Controller('submissions')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  submit(@Body() dto: SubmitCodeDto): Promise<JudgeResult> {
    return this.executionService.judge(dto);
  }
}
