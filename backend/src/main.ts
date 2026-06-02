import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envConfig } from './config/env.config';
import { Logger } from 'nestjs-pino';
import { HttpExceptionFilter } from './http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { ResponseTransformInterceptor } from './response-transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Logging
  const logger = app.get(Logger);
  app.useLogger(logger);

  // Cookie parser
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: envConfig.app.corsAllowedOrigins?.split(',') ?? [],
    credentials: true,
  });

  // Global pipes for class validations
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global interceptors
  // Wraps every 2xx response: { success: true, message: 'OK', data: ... }
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  // Global filters
  // Handles HttpException, Prisma errors, and unknown errors uniformly.
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Code Runner API')
    .setDescription('Remote code execution API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(envConfig.app.port);
  logger.log(`Application running on port ${envConfig.app.port}`);
}

bootstrap().catch((err) => {
  console.error('Fatal error during bootstrap', err);
  process.exit(1);
});