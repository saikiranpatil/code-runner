import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { User } from '../prisma/generated/client';
import { envConfig } from '../config';

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

    async validateRefreshToken(userId: number, token: string): Promise<User> {
        const user = await this.usersService.findUnique({ id: userId });
        if (!user || !user.refreshTokenHash) {
            throw new ForbiddenException();
        }

        const valid = await compare(token, user.refreshTokenHash);
        if (!valid) {
            throw new ForbiddenException();
        }

        return user;
    }

    private async generateTokens(userId: number, email: string): Promise<{ accessToken: string, refreshToken: string }> {
        const payload = { sub: userId, email };
        
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.sign(payload),
            this.jwtService.sign(payload, {
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