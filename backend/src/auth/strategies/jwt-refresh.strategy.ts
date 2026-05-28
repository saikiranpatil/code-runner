import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService } from "../auth.service";
import { envConfig } from "../../config";
import { STRATEGY_NAME } from "../../common/constants";

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, STRATEGY_NAME.JWT_REFRESH) {
    constructor(private authService: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
            secretOrKey: envConfig.jwtRefresh.secret,
            passReqToCallback: true,
        });
    }
    
    async validate(req: Request, payload: any) {
        const refreshToken = (req.body as any).refreshToken;
        return this.authService.validateRefreshToken(payload.sub, refreshToken);
    }
}