import 'dotenv/config';
import { envSchema } from './env.schema';

const parsed = envSchema.parse(process.env);

export const envConfig = Object.freeze({
  app: {
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
    corsAllowedOrigins: parsed.CORS_ALLOWED_ORIGINS,
  },

  redis: {
    host: parsed.REDIS_HOST,
    port: parsed.REDIS_PORT,
  },

  worker: {
    concurrency: parsed.WORKER_CONCURRENCY,
    executionTimeout: parsed.WORKER_EXECUTION_TIMEOUT_MS,
    maxOutputBytes: parsed.WORKER_MAX_OUTPUT_BYTES,
  },

  database: {
    url: parsed.DATABASE_URL,
  },

  jwt: {
    secret: parsed.JWT_SECRET,
    expiryMs: parsed.JWT_EXPIRY_MS,
  },

  jwtRefresh: {
    secret: parsed.JWT_REFRESH_SECRET,
    expiryMs: parsed.JWT_REFRESH_EXPIRY_MS,
  },

  bcrypt: {
    saltRounds: parsed.BCRYPT_SALT_ROUNDS,
  },

  github: {
    clientId: parsed.GITHUB_CLIENT_ID,
    clientSecret: parsed.GITHUB_CLIENT_SECRET,
  }
});

export type AppConfig = typeof envConfig;

export * from './logger.config'
export * from './redis.config'