import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BullModule } from '@nestjs/bullmq';
import { LoggerModule } from 'nestjs-pino';
import { QUEUE_NAMES } from './common/constants';
import { loggerConfig } from './config';
import { PrismaModule } from './prisma/prisma.module';
import { ShutdownModule } from './shutdown/shutdown.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import AuthGuardProvider from './modules/auth/auth.provider';
import { ExecutionModule } from './modules/execution/execution.module';
import { ProblemsModule } from './modules/problems/problems.module';

@Module({
  imports: [
    LoggerModule.forRoot(loggerConfig),
    BullModule.registerQueue({ name: QUEUE_NAMES.EXECUTION }),
    ShutdownModule,
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
