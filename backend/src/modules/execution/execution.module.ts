import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { LoggerModule } from 'nestjs-pino';
import { ExecutorProcessor } from './execution.processor';
import { ExecutorService } from './executor.service';
import { loggerConfig, redisConfig } from '../../config';
import { QUEUE_NAMES } from '../../common/constants';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProblemsModule } from '../problems/problems.module';
import { ExecutionController } from './execution.controller';
import {
  CppStrategy,
  JavaScriptStrategy,
  JavaStrategy,
  PythonStrategy,
  TypeScriptStrategy
} from './strategies/language-runners';
import { ExecutionService } from './execution.service';
import { DockerExecutionService } from './docker-execution.service';
import { OutputEvaluator } from './helper/output-evaluator';
import { LanguageRegistry } from './strategies/language-registry';
import { LANGUAGE_STRATEGIES } from './strategies/language-strategy.interface';

@Module({
  imports: [
    LoggerModule.forRoot(loggerConfig),
    BullModule.forRoot(redisConfig),
    BullModule.registerQueue({
      name: QUEUE_NAMES.EXECUTION,
    }),

    PrismaModule,
    ProblemsModule,
  ],
  controllers: [
    ExecutionController,
  ],
  providers: [
    ExecutorProcessor,
    ExecutorService,

    ExecutionService,
    DockerExecutionService,
    OutputEvaluator,
    LanguageRegistry,
    // Language strategies
    JavaScriptStrategy,
    TypeScriptStrategy,
    PythonStrategy,
    CppStrategy,
    JavaStrategy,
    // Inject all strategies as an array
    {
      provide: LANGUAGE_STRATEGIES,
      useFactory: (
        js: JavaScriptStrategy,
        ts: TypeScriptStrategy,
        py: PythonStrategy,
        cpp: CppStrategy,
        java: JavaStrategy,
      ) => [js, ts, py, cpp, java],
      inject: [
        JavaScriptStrategy,
        TypeScriptStrategy,
        PythonStrategy,
        CppStrategy,
        JavaStrategy,
      ],
    },
  ],
})
export class ExecutionModule { }
