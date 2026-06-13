import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { ExecutionDto } from './components/execution/dto/execution.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('profile')
  getProfile(@Req() req: { user: string }) {
    return req.user;
  }

  @Post("execution")
  handleExecute(@Body() createExecutionDto: ExecutionDto) {
    return this.appService.handleExecute(createExecutionDto);
  }

  @Get('execution/:jobId')
  getResult(@Param('jobId') jobId: string) {
    return this.appService.getResult(jobId);
  }
}
