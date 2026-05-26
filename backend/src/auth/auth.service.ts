import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { SignInDto } from '../users/dto/signInDto';
import { compare } from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) { }

    async signIn(signInDto: SignInDto): Promise<{ access_token: string }> {
        const { email, password } = signInDto;
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

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        if (user && user.passwordHash === pass) {
            const { passwordHash, ...result } = user;
            return result;
        }
        return null;
    }
}