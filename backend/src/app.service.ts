import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  constructor(
    @InjectQueue("execution")
    private readonly queue: Queue
  ) { }

  getHello(): string {
    return "Hello World!";
  }

  async addJob() {
    this.logger.log("Adding job to queue");
    await this.queue.add("testJob", { message: "hello from queue" });
  }
}
