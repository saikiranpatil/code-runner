import { NestFactory } from '@nestjs/core';
import { ExecutionModule } from './execution/execution.module';

async function bootstrap() {
  await NestFactory.createApplicationContext(ExecutionModule);
}
bootstrap();
