import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { QUEUE_NAMES } from "../../../common/constants";
import { envConfig } from "../../../config";
import { ExecutionRunnerService } from "../execution-runner.service";
import { SubmitCodeDto } from "../dto/submit-code.dto";
import { Job } from "bullmq";

@Processor(QUEUE_NAMES.EXECUTION_SUBMIT, { concurrency: envConfig.worker.submitConcurrency })
export class ExecutionSubmitProcessor extends WorkerHost {
    constructor(private runner: ExecutionRunnerService) {
        super();
    }

    process(job: Job<SubmitCodeDto & { userId: number }>) {
        return this.runner.judge(job.data, job.data.userId);
    }

    @OnWorkerEvent('failed') onFailed(job: Job, err: Error) {
        /* log + maybe alert */
    }
}