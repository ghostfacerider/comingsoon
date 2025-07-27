import { getEnv } from './.env';

export const AppConfig = {
  NODE_ENV: getEnv('NODE_ENV', { default: 'development' }),
  PORT: getEnv('PORT', { type: 'number', required: true }),
  DATABASE_URL: getEnv('DATABASE_URL', { required: true }),
  JWT_SECRET: getEnv('JWT_SECRET', { required: true }),
  DEBUG_MODE: getEnv('DEBUG_MODE', { type: 'boolean', default: false }),
};
