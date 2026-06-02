import { JwtModuleOptions } from '@nestjs/jwt';
import { envConfig } from './env.config';

export const jwtConfig: JwtModuleOptions = {
    secret: envConfig.jwt.secret,
    signOptions: {
        expiresIn: envConfig.jwt.expiry,
    },
};

export const jwtRefreshConfig = {
    secret: envConfig.jwtRefresh.secret,
    signOptions: {
        expiresIn: envConfig.jwtRefresh.expiry,
    }
};