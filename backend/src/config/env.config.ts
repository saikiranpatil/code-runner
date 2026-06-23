import 'dotenv/config';
import { envSchema } from './env.schema';

const parsed = envSchema.parse(process.env);

export const envConfig = Object.freeze({
  app: {
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
    corsAllowedOrigins: parsed.CORS_ALLOWED_ORIGINS,
    frontendUrl: parsed.FRONTEND_URL,
  },

  redis: {
    host: parsed.REDIS_HOST,
    port: parsed.REDIS_PORT,
  },

  worker: {
    concurrency: parsed.WORKER_CONCURRENCY,
    executionTimeout: parsed.WORKER_EXECUTION_TIMEOUT_MS,
    maxOutputBytes: parsed.WORKER_MAX_OUTPUT_BYTES,
    runConcurrency: parsed.WORKER_RUN_CONCURRENCY,
    submitConcurrency: parsed.WORKER_SUBMIT_CONCURRENCY,
  },

  database: {
    url: parsed.DATABASE_URL,
  },

  jwt: {
    secret: parsed.JWT_SECRET,
    expiry: parsed.JWT_EXPIRATION,
  },

  jwtRefresh: {
    secret: parsed.JWT_REFRESH_SECRET,
    expiry: parsed.JWT_REFRESH_EXPIRATION,
  },

  bcrypt: {
    saltRounds: parsed.BCRYPT_SALT_ROUNDS,
  },

  github: {
    clientId: parsed.GITHUB_CLIENT_ID,
    clientSecret: parsed.GITHUB_CLIENT_SECRET,
    callbackUrl: parsed.GITHUB_CALLBACK_URL,
  },

  google: {
    clientId: parsed.GOOGLE_CLIENT_ID,
    clientSecret: parsed.GOOGLE_CLIENT_SECRET,
    callbackUrl: parsed.GOOGLE_CALLBACK_URL,
  },
});

export type AppConfig = typeof envConfig;

export * from './logger.config'
export * from './redis.config'