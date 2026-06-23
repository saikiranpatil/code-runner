import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from 'nestjs-pino';
import { loggerConfig } from './config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import AuthGuardProvider from './modules/auth/auth.provider';
import { ExecutionModule } from './modules/execution/execution.module';
import { ProblemsModule } from './modules/problems/problems.module';

@Module({
  imports: [
    LoggerModule.forRoot(loggerConfig),
    PrismaModule,
    AuthModule,
    UsersModule,
    ExecutionModule,
    ProblemsModule,
  ],
  controllers: [
    AppController,
  ],
  providers: [
    AppService,
    AuthGuardProvider,
  ],
})
export class AppModule { }
