import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ExecutionQueueService } from './execution-queue.service';

@Controller('execution')
@UsePipes(new ValidationPipe({ transform: true }))
export class ExecutionController {
  constructor(private readonly executionQueueService: ExecutionQueueService) { }

  @Post('run') @HttpCode(HttpStatus.ACCEPTED) run(@Body() dto, @Req() req) {
    return this.executionQueueService.enqueueRun(dto, req.user.id);
  }

  @Get('run/:jobId') getRun(@Param('jobId') id: string) {
    return this.executionQueueService.getJobStatus('run', id);
  }

  @Post('submit') @HttpCode(HttpStatus.ACCEPTED) submit(@Body() dto, @Req() req) {
    return this.executionQueueService.enqueueSubmit(dto, req.user.id);
  }

  @Get('submit/:jobId') getSubmit(@Param('jobId') id: string) {
    return this.executionQueueService.getJobStatus('submit', id);
  }
}