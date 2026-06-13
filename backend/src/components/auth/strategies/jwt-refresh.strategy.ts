import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { jwtRefreshConfig } from '../../../config/jwt.config';
import { COOKIE_NAME, STRATEGY_NAME } from '../../../common/constants';
import { JwtRefreshPayload } from '../auth.types';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  STRATEGY_NAME.JWT_REFRESH,
) {
  constructor(private authService: AuthService) {
    super({
      // Extract the refresh token from the httpOnly cookie
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.[COOKIE_NAME.REFRESH_TOKEN] ?? null,
      ]),
      secretOrKey: jwtRefreshConfig.secret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtRefreshPayload) {
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid User.');
    }

    const rawToken = req.cookies?.[COOKIE_NAME.REFRESH_TOKEN];
    if (!rawToken) {
      throw new UnauthorizedException('Invalid User.');
    }

    // validateRefreshToken compares the raw token against the stored hash
    return this.authService.validateRefreshToken(payload.sub, rawToken);
  }
}