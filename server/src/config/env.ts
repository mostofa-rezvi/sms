import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '8000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/ctpsms?schema=public',
  jwtSecret: process.env.JWT_SECRET || 'ctpsms-jwt-secret-key-change-in-production',
  defaultApiKey: process.env.DEFAULT_API_KEY || 'system-user-api-key',
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

export const env = {
  PORT: config.port,
  NODE_ENV: config.nodeEnv,
  DATABASE_URL: config.databaseUrl,
  JWT_SECRET: config.jwtSecret,
  DEFAULT_API_KEY: config.defaultApiKey,
  CORS_ORIGIN: config.corsOrigin,
};
