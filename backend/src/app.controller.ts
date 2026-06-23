import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { ExecutionDto } from './modules/execution/dto/execution.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get("health")
  getHello(): string {
    return this.appService.health();
  }

  @Get('profile')
  getProfile(@Req() req: { user: string }) {
    return req.user;
  }
}
