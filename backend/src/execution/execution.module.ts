import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { LoggerModule } from 'nestjs-pino';
import { QUEUE_NAMES } from '../common/constants';
import { loggerConfig, redisConfig } from '../config';
import { ExecutorProcessor } from './execution.processor';
import { ExecutorService } from './executor.service';

@Module({
  imports: [
    LoggerModule.forRoot(loggerConfig),
    BullModule.forRoot(redisConfig),
    BullModule.registerQueue({
      name: QUEUE_NAMES.EXECUTIONS,
    }),
  ],
  providers: [ExecutorProcessor, ExecutorService],
})
export class ExecutionModule { }
