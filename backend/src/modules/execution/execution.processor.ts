import { Job } from 'bullmq';
import {
    Processor,
    WorkerHost,
    OnWorkerEvent,
} from '@nestjs/bullmq';

import { ExecutionDto } from './dto/execution.dto';
import { Logger } from 'nestjs-pino';
import { ExecutorService } from './executor.service';
import { envConfig } from '../../config';
import { QUEUE_NAMES } from '../../common/constants';

@Processor(QUEUE_NAMES.EXECUTION, { concurrency: envConfig.worker.concurrency })
export class ExecutorProcessor extends WorkerHost {
    constructor(
        private readonly logger: Logger,
        private readonly executorService: ExecutorService,
    ) {
        super();
    }

    async process(job: Job<ExecutionDto>) {
        const { code, language } = job.data;
        return this.executorService.execute(code, language);
    }

    @OnWorkerEvent('completed')
    onCompleted(job: Job, result: any) {
        this.logger.log(
            {
                jobId: job.id,
                result,
            },
            'Job completed successfully',
        );
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job | undefined, error: Error) {
        this.logger.error(
            {
                jobId: job?.id,
                error: error.message,
                stack: error.stack,
            },
            'Job failed',
        );
    }

    @OnWorkerEvent('closed')
    onClosed() {
        this.logger.warn(
            'Worker closed',
        );
    }

    @OnWorkerEvent('error')
    onError(error: Error) {
        this.logger.error(
            {
                error: error.message,
                stack: error.stack,
            },
            'Worker error',
        );
    }
}