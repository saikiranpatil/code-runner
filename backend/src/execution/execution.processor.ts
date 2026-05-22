// execution.processor.ts

import {
    OnWorkerEvent,
    Processor,
    WorkerHost,
} from '@nestjs/bullmq';

import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from 'src/common/constants/queue.constants';
import { ExecutorService } from './executor.service';

const WORKER_CONCURRENCY = 3;

@Processor(QUEUE_NAMES.EXECUTIONS, { concurrency: WORKER_CONCURRENCY })
export class ExecutionProcessor extends WorkerHost {
    private readonly logger = new Logger(ExecutionProcessor.name);

    constructor(
        private readonly executorService: ExecutorService,
    ) {
        super();
    }

    async process(job: Job) {
        const { code, language } = job.data;

        this.logger.log(`Processing job ${job.id}`);

        const result = await this.executorService.execute(
            code,
            language,
        );

        return result;
    }

    @OnWorkerEvent('completed')
    onCompleted(job: Job) {
        this.logger.log(`Job ${job.id} done`);
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job, err: Error) {
        this.logger.error(
            `Job ${job?.id} failed: ${err.message}`,
        );
    }
}