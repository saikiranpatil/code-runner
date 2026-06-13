import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { LoggerModule } from 'nestjs-pino';
import { ExecutorProcessor } from './execution.processor';
import { ExecutorService } from './executor.service';
import { loggerConfig, redisConfig } from '../../config';
import { QUEUE_NAMES } from '../../common/constants';

@Module({
  imports: [
    LoggerModule.forRoot(loggerConfig),
    BullModule.forRoot(redisConfig),
    BullModule.registerQueue({
      name: QUEUE_NAMES.EXECUTION,
    }),
  ],
  providers: [ExecutorProcessor, ExecutorService],
})
export class ExecutionModule { }
