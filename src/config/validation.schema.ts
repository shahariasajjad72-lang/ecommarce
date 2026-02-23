/**
 * ENVIRONMENT VALIDATION - PRODUCTION READY
 *
 * Ensures all required environment variables are set
 * BEFORE the application starts. If something is missing,
 * you'll get a clear error message.
 */

import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3001),

  // Database - REQUIRED
  DATABASE_URL: Joi.string().uri().required(),

  // JWT - REQUIRED
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES: Joi.string().default('7d'),

  // Super Admin - REQUIRED
  SUPER_ADMIN_EMAIL: Joi.string().email().required(),
  SUPER_ADMIN_PASSWORD: Joi.string().min(8).required(),
  SUPER_ADMIN_FIRST_NAME: Joi.string().default('Super'),
  SUPER_ADMIN_LAST_NAME: Joi.string().default('Admin'),

  // Security
  BCRYPT_ROUNDS: Joi.number().min(10).max(14).default(12),
  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(100),
});
