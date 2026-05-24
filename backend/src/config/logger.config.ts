import { NODE_ENVS } from "../common/constants";
import { envConfig } from "./env.config";

export const loggerConfig = {
    pinoHttp: {
        // customProps: () => ({ context: 'HTTP' }), // disabled now
        transport:
            envConfig.nodeEnv === NODE_ENVS.DEVELOPMENT
                ? {
                    target: 'pino-pretty',
                    options: { singleLine: true, colorize: true },
                } : undefined,
    },
};