import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { envConfig } from '../../config';
import { STRATEGY_NAME } from '../../common/constants';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, STRATEGY_NAME.JWT) {
    constructor(private usersService: UsersService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: envConfig.jwt.secret,
        });
    }

    async validate(payload: any) {
        const user = await this.usersService.findByEmail(payload.email);

        if (!user) {
            throw new UnauthorizedException();
        }

        return user;
    }
}