import { Logger } from 'nestjs-pino';
import { NestFactory } from '@nestjs/core';
import { envConfig } from './config';
import { ExecutionWorkerModule } from './modules/execution/execution-worker.module';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(ExecutionWorkerModule, {
        bufferLogs: true
    });

    app.enableShutdownHooks();

    const logger = app.get(Logger);
    app.useLogger(logger);

    logger.log({ worker: envConfig.worker }, 'Worker started');
}

void bootstrap();