import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class ExecutionService {
  constructor(
    @InjectQueue('executions')
    private readonly executionQueue: Queue,
  ) {}

  async addJob(code: string, language: string) {
    return this.executionQueue.add('execute-code', {
      code,
      language,
    });
  }
}