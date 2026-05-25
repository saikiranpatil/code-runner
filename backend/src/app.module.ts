import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BullModule } from '@nestjs/bullmq';
import { LoggerModule } from 'nestjs-pino';
import { QUEUE_NAMES } from './common/constants';
import { loggerConfig } from './config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { ShutdownModule } from './shutdown/shutdown.module';

@Module({
  imports: [
    LoggerModule.forRoot(loggerConfig),
    BullModule.registerQueue({ name: QUEUE_NAMES.EXECUTIONS }),
    ShutdownModule,
    PrismaModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [
    AppController,
  ],
  providers: [
    AppService,
  ],
})
export class AppModule { }
