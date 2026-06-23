import { BullModule } from "@nestjs/bullmq";
import { loggerConfig, redisConfig } from "../../config";
import { Module } from "@nestjs/common";
import { QUEUE_NAMES } from "../../common/constants";
import { PrismaModule } from "../../prisma/prisma.module";
import { ProblemsModule } from "../problems/problems.module";
import { ExecutionRunnerService } from "./execution-runner.service";
import { ExecutionRunProcessor } from "./processors/execution-run.processor";
import { ExecutionSubmitProcessor } from "./processors/execution-submit.processor";
import { DockerExecutionService } from "./docker-execution.service";
import { OutputEvaluator } from "./helper/output-evaluator";
import { LanguageRegistry } from "./strategies/language-registry";
import { CppStrategy, JavaScriptStrategy, JavaStrategy, PythonStrategy, TypeScriptStrategy } from "./strategies/language-runners";
import { LANGUAGE_STRATEGIES } from "./strategies/language-strategy.interface";
import { LoggerModule } from "nestjs-pino";
import { ShutdownModule } from "../../shutdown/shutdown.module";

@Module({
    imports: [
        LoggerModule.forRoot(loggerConfig),
        BullModule.forRoot(redisConfig),
        BullModule.registerQueue(
            { name: QUEUE_NAMES.EXECUTION_RUN },
            { name: QUEUE_NAMES.EXECUTION_SUBMIT },
        ),
        PrismaModule,
        ProblemsModule,
        ShutdownModule,
    ],
    providers: [
        ExecutionRunnerService,
        ExecutionRunProcessor,
        ExecutionSubmitProcessor,
        DockerExecutionService,
        OutputEvaluator,
        LanguageRegistry,

        JavaScriptStrategy,
        TypeScriptStrategy,
        PythonStrategy,
        CppStrategy,
        JavaStrategy,

        {
            provide: LANGUAGE_STRATEGIES,
            useFactory: (js, ts, py, cpp, java) => [js, ts, py, cpp, java],
            inject: [JavaScriptStrategy, TypeScriptStrategy, PythonStrategy, CppStrategy, JavaStrategy],
        },
    ],
})
export class ExecutionWorkerModule { }