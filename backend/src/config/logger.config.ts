import { NODE_ENVS } from "../common/constants";
import { envConfig } from "./env.config";

export const loggerConfig = {
    pinoHttp: {
        customProps: () => ({ context: 'HTTP' }),
        transport:
            envConfig.nodeEnv === NODE_ENVS.DEVELOPMENT
                ? {
                    target: 'pino-pretty',
                    options: { singleLine: true, colorize: true },
                } : undefined,
    },
};