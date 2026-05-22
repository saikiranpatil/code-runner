import { z } from 'zod';

export const envSchema = z.object({
    PORT: z.coerce.number().default(3000),

    // redis
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().default(6379),

    WORKER_CONCURRENCY: z.coerce.number().default(3),
    EXECUTION_TIMEOUT: z.coerce.number().default(5000),
    MAX_OUTPUT_BYTES: z.coerce.number().default(1024 * 100),
});

export type EnvSchema = z.infer<typeof envSchema>;