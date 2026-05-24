import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from './common/constants';
import { ExecutionDto } from './execution/dto/execution.dto';
import { Logger } from 'nestjs-pino';

@Injectable()
export class AppService {
  constructor(
    @InjectQueue(QUEUE_NAMES.EXECUTIONS)
    private readonly queue: Queue,
    private readonly logger: Logger,
  ) { }

  getHello(): string {
    return 'Hello World!';
  }

  async handleExecute(createExecutionDto: ExecutionDto) {
    const job = await this.queue.add('run-code', createExecutionDto, {
      attempts: 3,
      removeOnComplete: false,
      removeOnFail: false,
    });

    return { jobId: job.id };
  }

  async getResult(jobId: string) {
    const job = await this.queue.getJob(jobId);
    this.logger.log(job, "Return value of getResult")
    if (!job) throw new NotFoundException('Job not found or expired');

    const state = await job.getState();
    return {
      state,
      result: state === 'completed' ? job.returnvalue : null,
      error: state === 'failed' ? job.failedReason : null,
    };
  }
}
