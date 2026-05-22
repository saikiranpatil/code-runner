// execution.module.ts

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ExecutionProcessor } from './execution.processor';
import { ExecutionService } from './ececution.service';
import { ExecutorService } from './executor.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    }),

    BullModule.registerQueue({
      name: 'executions',
    }),
  ],

  providers: [
    ExecutionProcessor,
    ExecutionService,
    ExecutorService,
  ],

  exports: [ExecutionService],
})
export class ExecutionModule { }