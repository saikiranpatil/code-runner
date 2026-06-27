import { InjectQueue } from "@nestjs/bullmq";
import { QUEUE_NAMES } from "../../common/constants";
import { Injectable, NotFoundException } from "@nestjs/common";
import { Queue } from "bullmq";
import { RunCodeDto } from "./dto/run-code.dto";
import { SubmitCodeDto } from "./dto/submit-code.dto";

@Injectable()
export class ExecutionQueueService {
  constructor(
    @InjectQueue(QUEUE_NAMES.EXECUTION_RUN) private runQueue: Queue,
    @InjectQueue(QUEUE_NAMES.EXECUTION_SUBMIT) private submitQueue: Queue,
  ) { }

  async enqueueRun(dto: RunCodeDto, userId: number) {
    const job = await this.runQueue.add('run', { ...dto, userId }, {
      attempts: 1,
      removeOnComplete: { age: 300 },
      removeOnFail: { age: 3600 },
    });

    return { jobId: job.id };
  }

  async enqueueSubmit(dto: SubmitCodeDto, userId: number) {
    const job = await this.submitQueue.add('submit', { ...dto, userId }, {
      attempts: 2,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { age: 3600 },
      removeOnFail: { age: 86400 },
    });

    return { jobId: job.id };
  }

  async getJobStatus(queue: 'run' | 'submit', jobId: string) {
    const q = queue === 'run' ? this.runQueue : this.submitQueue;

    const job = await q.getJob(jobId);
    if (!job) throw new NotFoundException('Job not found or expired');

    const state = await job.getState();
    return {
      state,
      result: state === 'completed' ? job.returnvalue : null,
      error: state === 'failed' ? job.failedReason : null
    };
  }
}