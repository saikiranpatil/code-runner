import { Logger } from 'nestjs-pino';
import { ExecutionModule } from './components/execution/execution.module';
import { NestFactory } from '@nestjs/core';
import { envConfig } from './config';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(ExecutionModule, {
        bufferLogs: true,
        logger: false
    });

    app.enableShutdownHooks();

    const logger = app.get(Logger);
    app.useLogger(logger);

    logger.log({ worker: envConfig.worker }, 'Worker started');

    const shutdown = async () => {
        await app.close(); // stops HTTP server + triggers module cleanup
        process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}

void bootstrap();