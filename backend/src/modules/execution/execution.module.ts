import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { QUEUE_NAMES } from "../../common/constants";
import { PrismaModule } from "../../prisma/prisma.module";
import { ProblemsModule } from "../problems/problems.module";
import { ExecutionController } from "./execution.controller";
import { ExecutionQueueService } from "./execution-queue.service";
import { redisConfig } from "../../config";

@Module({
  imports: [
    BullModule.forRoot(redisConfig),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.EXECUTION_RUN },
      { name: QUEUE_NAMES.EXECUTION_SUBMIT },
    ),
    PrismaModule,
    ProblemsModule,
  ],
  controllers: [ExecutionController],
  providers: [ExecutionQueueService],
})
export class ExecutionModule {}