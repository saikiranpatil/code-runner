import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { ShutdownService } from '../shutdown/shutdown.service';
import { ShutdownModule } from '../shutdown/shutdown.module';

@Module({
  imports: [ShutdownModule],
  providers: [UsersService, PrismaService, ShutdownService]
})
export class UsersModule { }
