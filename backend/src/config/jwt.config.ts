import { JwtModuleOptions } from "@nestjs/jwt";
import { envConfig } from "./env.config";

export const jwtConfig: JwtModuleOptions = {
    global: true,
    secret: envConfig.jwt.secret,
    signOptions: {
        expiresIn: envConfig.jwt.expiryMs
    },
}