import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envConfig } from './config/env.config';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  
  const logger = app.get(Logger);
  app.useLogger(logger);

  await app.listen(envConfig.port);

  app.useLogger(logger);
  logger.log(`Application started at port: ${envConfig.port}`);
}
bootstrap();
