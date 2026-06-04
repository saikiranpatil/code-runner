import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { envConfig } from '../../config';
import { STRATEGY_NAME } from '../../common/constants';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../../common/types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, STRATEGY_NAME.JWT) {
    constructor(private usersService: UsersService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: envConfig.jwt.secret,
        });
    }

    async validate(payload: JwtPayload) {
        if (payload.type !== 'access') {
            throw new UnauthorizedException("Invalid Access Token");
        }

        const user = await this.usersService.findById(payload.sub);

        if (!user) {
            throw new UnauthorizedException("Invalid User");
        }

        const { passwordHash, emailVerified, refreshTokenHash, ...safeUser } = user;
        return safeUser;
    }
}