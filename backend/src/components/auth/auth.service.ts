import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { User } from '../../prisma/generated/client';
import { RegisterDto } from './dto/register.dto';
import { jwtRefreshConfig } from '../../config/jwt.config';
import { BCRYPT_ROUNDS } from '../../common/constants';
import { JwtPayload, JwtRefreshPayload } from './auth.types';

export type SafeUser = Omit<User, 'passwordHash' | 'refreshTokenHash'>;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) { }

  async validateUser(email: string, password: string): Promise<SafeUser> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isMatch = await compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const { passwordHash, refreshTokenHash, ...safe } = user;
    return safe;
  }


  async login(user: User) {
    const tokens = await this.generateTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    const { passwordHash, refreshTokenHash, ...safe } = user;
    return { user: safe, ...tokens };
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(
        'An account with this email already exists.',
      );
    }

    const user = await this.usersService.create(dto);
    return this.login(user);
  }

  async refresh(user: User) {
    const tokens = await this.generateTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    const { passwordHash, refreshTokenHash, ...safe } = user;
    return { user: safe, ...tokens };
  }

  async logout(userId: number) {
    await this.usersService.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  async validateRefreshToken(
    userId: number,
    rawToken: string,
  ): Promise<SafeUser> {
    const user = await this.usersService.findById(userId);
    if (!user?.refreshTokenHash) {
      throw new ForbiddenException('Invalid User');
    }

    const isValid = await compare(rawToken, user.refreshTokenHash);
    if (!isValid) {
      throw new ForbiddenException('Invalid User');
    }

    const { passwordHash, refreshTokenHash, ...safe } = user;
    return safe;
  }

  private async generateTokens(userId: number, email: string) {
    const accessPayload: JwtPayload = { sub: userId, email, type: 'access' };
    const refreshPayload: JwtRefreshPayload = { sub: userId, type: 'refresh' };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload),
      this.jwtService.signAsync(refreshPayload, {
        secret: jwtRefreshConfig.secret,
        expiresIn: jwtRefreshConfig.signOptions.expiresIn,
      }),
    ]);

    const decoded = this.jwtService.decode(accessToken) as { exp: number };
    const expiresIn = decoded.exp * 1000 - Date.now();

    return { accessToken, refreshToken, expiresIn };
  }

  private async storeRefreshToken(userId: number, rawToken: string) {
    const refreshTokenHash = await hash(rawToken, BCRYPT_ROUNDS);
    await this.usersService.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });
  }
}