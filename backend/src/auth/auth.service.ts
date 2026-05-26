import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { compare, hash } from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { envConfig } from '../config';
import { User } from '../prisma/generated/client';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) { }

    async login(loginDto: LoginDto): Promise<{ access_token: string }> {
        const { email, password } = loginDto;
        const user = await this.usersService.findByEmail(email);

        if (!user) {
            throw new UnauthorizedException('Invalid user');
        }

        const isMatch = await compare(password, user.passwordHash);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { sub: user.id, username: user.name };
        const access_token = await this.jwtService.signAsync(payload)

        return { access_token };
    }

    async register(registerDto: RegisterDto): Promise<User> {
        const user = await this.usersService.create(registerDto);
        return user;
    }

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
}