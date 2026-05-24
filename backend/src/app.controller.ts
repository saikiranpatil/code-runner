import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ExecutionDto } from './execution/dto/execution.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post("execute")
  handleExecute(@Body() createExecutionDto: ExecutionDto) {
    return this.appService.handleExecute(createExecutionDto);
  }

  @Get('execute/:jobId')
  getResult(@Param('jobId') jobId: string) {
    return this.appService.getResult(jobId);
  }
}
