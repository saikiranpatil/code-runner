import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ShutdownService } from '../shutdown/shutdown.service';
import { ShutdownModule } from '../shutdown/shutdown.module';

@Module({
  imports: [ShutdownModule],
  providers: [PrismaService, ShutdownService],
  exports: [PrismaService],
})
export class PrismaModule { }