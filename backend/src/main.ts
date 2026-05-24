import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envConfig } from './config/env.config';
import { Logger } from 'nestjs-pino';
import { HttpExceptionFilter } from './http-exception.filter';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true, logger: false });

  // graceful shutdown of application
  app.enableShutdownHooks();
  // enable global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));
  // global constient exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  const logger = app.get(Logger);
  app.useLogger(logger);

  await app.listen(envConfig.port);

  logger.log(`Application started at port: ${envConfig.port}`);

  const shutdown = async () => {
    await app.close(); // stops HTTP server + triggers module cleanup
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap();
