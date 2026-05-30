import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envConfig } from './config/env.config';
import { Logger } from 'nestjs-pino';
import { HttpExceptionFilter } from './http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true, autoFlushLogs: true });

  app.enableCors({
    origin: envConfig.app.corsAllowedOrigins || [],
    credentials: true,
  });

  app.use(cookieParser());

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
  // enable CORS
  app.enableCors();

  const logger = app.get(Logger);
  app.useLogger(logger);

  const config = new DocumentBuilder()
    .setTitle('Code Runner')
    .setDescription('The Code Runner API description')
    .setVersion('0.1')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(envConfig.app.port);

  logger.log(`Application started at ${envConfig.app.port}`);

  const shutdown = async () => {
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap();
