import { ForbiddenException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { User } from '../prisma/generated/client';
import { envConfig } from '../config';
import { JwtPayload, JwtRefreshPayload } from '../common/types';

type SafeUser = Omit<User, 'passwordHash' | 'refreshTokenHash'>;
@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) { }

    async validateUser(email: string, password: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            return null;
        }

        const isMatch = await compare(password, user.passwordHash);
        if (isMatch) {
            const { passwordHash, ...result } = user;
            return result;
        }

        return null;
    }

    async login(user: User) {
        const tokens = await this.generateTokens(user.id, user.email);
        await this.storeRefreshToken(user.id, tokens.refreshToken);
        return tokens;
    }

    async refresh(user: User) {
        const tokens = await this.generateTokens(user.id, user.email);
        await this.storeRefreshToken(user.id, tokens.refreshToken); // Token rotation
        return tokens;
    }

    async logout(userId: number) {
        await this.usersService.update({
            where: { id: userId },
            data: { refreshTokenHash: null },
        });
    }

    async validateRefreshToken(userId: number, token: string): Promise<SafeUser> {
        const user = await this.usersService.findById(userId);
        if (!user || !user.refreshTokenHash) {
            throw new ForbiddenException();
        }

        const valid = await compare(token, user.refreshTokenHash);
        if (!valid) {
            throw new ForbiddenException();
        }

        const { passwordHash, refreshTokenHash, ...result } = user;
        return result;
    }

    private async generateTokens(userId: number, email: string): Promise<{ accessToken: string, refreshToken: string }> {
        const accessTokenPayload: JwtPayload = {
            type: 'access',
            sub: userId,
            email,
        };

        const refreshTokenPayload: JwtRefreshPayload = {
            type: 'refresh',
            sub: userId,
        };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.sign(accessTokenPayload),
            this.jwtService.sign(refreshTokenPayload, {
                secret: envConfig.jwtRefresh.secret,
                expiresIn: envConfig.jwtRefresh.expiryMs,
            }),
        ]);

        return { accessToken, refreshToken };
    }

    private async storeRefreshToken(userId: number, token: string) {
        const hashedRefreshToken = await hash(token, envConfig.bcrypt.saltRounds);
        await this.usersService.update({
            where: { id: userId },
            data: { refreshTokenHash: hashedRefreshToken },
        });
    }
}