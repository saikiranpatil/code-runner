import { Module } from '@nestjs/common';
import { ExecutionService } from './execution.service';
import { BullModule } from '@nestjs/bullmq';
import { LoggerModule } from 'nestjs-pino';
import { QUEUE_NAMES } from '../common/constants';
import { loggerConfig, redisConfig } from '../config';

@Module({
  imports: [
    LoggerModule.forRoot(loggerConfig),
    BullModule.forRoot(redisConfig),
    BullModule.registerQueue({
      name: QUEUE_NAMES.EXECUTIONS,
    }),
  ],
  providers: [ExecutionService],
})
export class ExecutionModule { }
