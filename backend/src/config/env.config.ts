import { envSchema } from './env.schema';

const parsed = envSchema.parse(process.env);

export const envConfig = Object.freeze({
  nodeEnv: parsed.NODE_ENV,
  
  port: parsed.PORT,

  redis: {
    host: parsed.REDIS_HOST,
    port: parsed.REDIS_PORT,
  },

  worker: {
    concurrency: parsed.WORKER_CONCURRENCY,
    executionTimeout: parsed.WORKER_EXECUTION_TIMEOUT_MS,
    maxOutputBytes: parsed.WORKER_MAX_OUTPUT_BYTES,
  },
});

export type AppConfig = typeof envConfig;

export * from './logger.config'
export * from './redis.config'