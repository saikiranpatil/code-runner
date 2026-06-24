import { z } from 'zod';
import ms, { StringValue } from 'ms';
import { NODE_ENVS } from '../common/constants';

export const envSchema = z.object({
    PORT: z.coerce.number().int().positive().default(3000),

    NODE_ENV: z
        .enum([NODE_ENVS.DEVELOPMENT, NODE_ENVS.PRODUCTION, NODE_ENVS.TEST])
        .default(NODE_ENVS.DEVELOPMENT),
    BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),

    FRONTEND_URL: z.url().default("http://localhost:5173"),

    // Redis
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().int().positive().default(6379),

    // Worker
    WORKER_CONCURRENCY: z.coerce.number().int().positive().default(4),
    WORKER_EXECUTION_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
    WORKER_MAX_OUTPUT_BYTES: z.coerce.number().int().positive().default(65_536),
    WORKER_RUN_CONCURRENCY: z.coerce.number().int().positive().default(5),
    WORKER_SUBMIT_CONCURRENCY: z.coerce.number().int().positive().default(3),

    // Database
    DATABASE_URL: z.string().min(1),

    // JWT access token
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRATION: z.custom<StringValue>(
        (val): val is StringValue => typeof val === 'string' && ms(val as StringValue) !== undefined,
        { message: 'Invalid duration string (e.g. "2m", "15m")' }
    ).default("15m"),

    // JWT refresh token
    JWT_REFRESH_SECRET: z
        .string()
        .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    JWT_REFRESH_EXPIRATION: z.custom<StringValue>(
        (val): val is StringValue => typeof val === 'string' && ms(val as StringValue) !== undefined,
        { message: 'Invalid duration string (e.g. "2m", "15m")' }
    ).default("7d"),

    // CORS
    CORS_ALLOWED_ORIGINS: z.string().min(1).default('http://localhost:5173'),

    // GitHub OAuth
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    GITHUB_CALLBACK_URL: z.url(),

    // Google OAuth
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GOOGLE_CALLBACK_URL: z.url(),
});

export type EnvSchema = z.infer<typeof envSchema>;