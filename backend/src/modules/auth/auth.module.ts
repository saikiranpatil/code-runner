import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersService } from '../users/users.service';
import { LocalStrategy } from './strategies/local.strategy';
import { GithubStrategy } from './strategies/github-strategy';
import { JwtStrategy } from './strategies/jwt.stratedy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { GoogleStrategy } from './strategies/google-strategy';
import { jwtConfig } from '../../config/jwt.config';
import { PrismaModule } from '../../prisma/prisma.module';

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
    GoogleStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
  ],
})
export class AuthModule { }
