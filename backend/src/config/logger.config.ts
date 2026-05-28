import { Params as LoggerParams } from "nestjs-pino";
import { NODE_ENVS } from "../common/constants";
import { envConfig } from "./env.config";

export const loggerConfig: LoggerParams = {
    pinoHttp: {
        customProps: () => ({ context: 'HTTP' }), // disabled now
        transport:
            envConfig.app.nodeEnv === NODE_ENVS.DEVELOPMENT
                ? {
                    target: 'pino-pretty',
                    // options: { singleLine: true, colorize: true },
                    options: { colorize: true },
                } : undefined,
    },
};