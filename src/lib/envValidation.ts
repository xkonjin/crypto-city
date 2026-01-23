/**
 * Environment Variable Validation
 * Issue #244: Add Environment Variable Validation
 * 
 * Validates required environment variables on startup
 * Prevents runtime errors from missing configuration
 */

import { z } from 'zod';

/**
 * Environment variable schema
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // API URLs
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_WS_URL: z.string().url().optional(),
  
  // Database
  DATABASE_URL: z.string().optional(),
  
  // Authentication
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  
  // External services
  SENTRY_DSN: z.string().url().optional(),
  ANALYTICS_ID: z.string().optional(),
  
  // Feature flags
  NEXT_PUBLIC_ENABLE_MULTIPLAYER: z.string().transform(val => val === 'true').optional(),
  NEXT_PUBLIC_ENABLE_CRYPTO: z.string().transform(val => val === 'true').optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables
 */
export function validateEnv(): { valid: boolean; env?: Env; errors?: string[] } {
  try {
    const env = envSchema.parse(process.env);
    return { valid: true, env };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { valid: false, errors };
    }
    return { valid: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Get validated environment variables
 * Throws error if validation fails
 */
export function getEnv(): Env {
  const result = validateEnv();
  
  if (!result.valid) {
    console.error('Environment variable validation failed:');
    result.errors?.forEach(error => console.error(`  - ${error}`));
    throw new Error('Invalid environment configuration');
  }
  
  return result.env!;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

/**
 * Get a required environment variable
 * Throws error if not found
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  
  return value;
}

/**
 * Get an optional environment variable with default
 */
export function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * Log environment configuration (safe for production)
 */
export function logEnvConfig(): void {
  console.log('Environment Configuration:');
  console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`  API URL: ${process.env.NEXT_PUBLIC_API_URL || 'not set'}`);
  console.log(`  Multiplayer: ${process.env.NEXT_PUBLIC_ENABLE_MULTIPLAYER === 'true' ? 'enabled' : 'disabled'}`);
  console.log(`  Crypto: ${process.env.NEXT_PUBLIC_ENABLE_CRYPTO === 'true' ? 'enabled' : 'disabled'}`);
  
  // Don't log sensitive values
  if (process.env.DATABASE_URL) {
    console.log('  Database: connected');
  }
  if (process.env.SENTRY_DSN) {
    console.log('  Sentry: enabled');
  }
}
