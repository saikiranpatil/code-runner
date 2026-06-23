import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";

import { QUEUE_NAMES } from "../../../common/constants";
import { RunCodeDto } from "../dto/run-code.dto";
import { envConfig } from "../../../config";
import { ExecutionRunnerService } from "../execution-runner.service";

@Processor(QUEUE_NAMES.EXECUTION_RUN, { concurrency: envConfig.worker.runConcurrency })
export class ExecutionRunProcessor extends WorkerHost {
  constructor(private runner: ExecutionRunnerService) { super(); }
  process(job: Job<RunCodeDto & { userId: number }>) { return this.runner.run(job.data, job.data.userId); }
}