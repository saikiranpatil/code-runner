export const STRATEGY_NAME = {
  LOCAL: 'local',
  JWT: 'jwt',
  JWT_REFRESH: 'jwt-refresh',
  GITHUB: 'github',
  GOOGLE: 'google',
} as const;

export const COOKIE_NAME = {
  REFRESH_TOKEN: 'refreshToken',
} as const;

export const IS_PUBLIC_KEY = 'isPublic';

export const QUEUE_NAMES = {
  EXECUTION: 'execution',
} as const;

export const NODE_ENVS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
} as const;

export const BCRYPT_ROUNDS = 10;