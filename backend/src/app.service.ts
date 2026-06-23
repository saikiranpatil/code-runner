import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from './common/constants';
import { Logger } from 'nestjs-pino';
import { ExecutionDto } from './modules/execution/dto/execution.dto';

@Injectable()
export class AppService {
  health(): string {
    return 'OK';
  }
}
