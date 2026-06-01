import { z } from 'zod';
import ms, { StringValue } from 'ms';
import { NODE_ENVS } from '../common/constants';

const timeSpanToMs = (val: string | number): number => {
    if (typeof val === 'number') return val;
    const parsed = ms(val as StringValue);
    if (parsed === undefined) {
        throw new Error(`Invalid time span: ${val}`);
    }
    return parsed;
};

export const envSchema = z.object({
    NODE_ENV: z.enum([NODE_ENVS.DEVELOPMENT, NODE_ENVS.PRODUCTION]).default(NODE_ENVS.DEVELOPMENT),
    PORT: z.coerce.number().default(3000),
    CORS_ALLOWED_ORIGINS: z.string().transform(value => value.split(',').map(String)),

    // redis
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().default(6379),

    // worker
    WORKER_CONCURRENCY: z.coerce.number().default(3),
    WORKER_EXECUTION_TIMEOUT_MS: z.coerce.number().default(5000),
    WORKER_MAX_OUTPUT_BYTES: z.coerce.number().default(1024 * 100),

    // database
    DATABASE_URL: z.string(),

    // jwt
    JWT_SECRET: z.string(),
    JWT_EXPIRY: z.union([z.string(), z.coerce.number()]).default("15m").transform(timeSpanToMs),
    JWT_REFRESH_SECRET: z.string(),
    JWT_REFRESH_EXPIRY: z.union([z.string(), z.coerce.number()]).default("7d").transform(timeSpanToMs),

    // bcrypt
    BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),

    // github
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    GITHUB_CALLBACK_URL: z.url(),

    // github
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GOOGLE_CALLBACK_URL: z.url(),
});

export type EnvSchema = z.infer<typeof envSchema>;