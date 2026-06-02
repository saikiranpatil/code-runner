import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BullModule } from '@nestjs/bullmq';
import { LoggerModule } from 'nestjs-pino';
import { QUEUE_NAMES } from './common/constants';
import { envConfig, loggerConfig } from './config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { ShutdownModule } from './shutdown/shutdown.module';
import AuthGuardProvider from './auth/auth.provider';

@Module({
  imports: [
    LoggerModule.forRoot(loggerConfig),
    BullModule.registerQueue({ name: QUEUE_NAMES.EXECUTION }),
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
    AuthGuardProvider,
  ],
})
export class AppModule { }
