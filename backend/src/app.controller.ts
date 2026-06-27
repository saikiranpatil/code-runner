import { Controller, Get, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './modules/auth/auth.decorators';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Public()
  @Get("health")
  getHello(): string {
    return this.appService.health();
  }

  @Get('profile')
  getProfile(@Req() req: { user: string }) {
    return req.user;
  }
}
