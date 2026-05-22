import { envSchema } from './env.schema';

const parsed = envSchema.parse(process.env);

const configuration = () => ({
  port: parsed.PORT,

  redis: {
    host: parsed.REDIS_HOST,
    port: parsed.REDIS_PORT,
  },

  execution: {
    timeout: parsed.EXECUTION_TIMEOUT,
    concurrency: parsed.WORKER_CONCURRENCY,
    maxOutputBytes: parsed.MAX_OUTPUT_BYTES,
  },
});

export default configuration;

export type AppConfig = ReturnType<typeof configuration>;