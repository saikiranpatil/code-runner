import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BullModule } from '@nestjs/bullmq';
import { LoggerModule } from 'nestjs-pino';
import { QUEUE_NAMES } from './common/constants';
import { loggerConfig } from './config/logger.config';

@Module({
  imports: [
    LoggerModule.forRoot(loggerConfig),
    BullModule.registerQueue({
      name: QUEUE_NAMES.EXECUTIONS,
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
