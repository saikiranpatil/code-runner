import { NestFactory } from "@nestjs/core";
import { ExecutionModule } from "./execution/execution.module";
import { Logger } from "@nestjs/common";
import { envConfig } from "./config/env.config";

async function bootstrap() {
    const logger = new Logger('Worker');
    await NestFactory.createApplicationContext(ExecutionModule, { bufferLogs: true });
    logger.log(`Worker Started with options: ${envConfig.worker}`);
}
bootstrap();