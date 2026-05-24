import { Logger } from 'nestjs-pino';
import { ExecutionModule } from './execution/execution.module';
import { NestFactory } from '@nestjs/core';
import { envConfig } from './config';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(ExecutionModule, {
        bufferLogs: true,
    });

    const logger = app.get(Logger);
    app.useLogger(logger);

    logger.log({ worker: envConfig.worker }, 'Worker started',);
}

void bootstrap();