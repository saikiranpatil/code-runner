import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { ShutdownModule } from '../../shutdown/shutdown.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [ShutdownModule, PrismaModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }
