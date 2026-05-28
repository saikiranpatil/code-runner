import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { jwtConfig } from '../config/jwt.config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersService } from '../users/users.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LocalStrategy } from './strategies/local.strategy';
import { GithubStrategy } from './strategies/github-strategy';
import { JwtStrategy } from './strategies/jwt.stratedy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [
    JwtModule.register(jwtConfig),
    PassportModule,
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UsersService,
    LocalStrategy,
    GithubStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
  ],
})
export class AuthModule { }
