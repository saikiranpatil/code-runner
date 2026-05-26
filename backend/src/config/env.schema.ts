import { z } from 'zod';
import { NODE_ENVS } from '../common/constants';

export const envSchema = z.object({
    NODE_ENV: z.enum([NODE_ENVS.DEVELOPMENT, NODE_ENVS.PRODUCTION]).default(NODE_ENVS.DEVELOPMENT),
    PORT: z.coerce.number().default(3000),

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
    JWT_EXPIRY_MS: z.coerce.number().default(60 * 1000),

    // bcrypt
    BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),
});

export type EnvSchema = z.infer<typeof envSchema>;