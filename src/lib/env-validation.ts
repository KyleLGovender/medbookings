/**
 * Environment Variable Validation
 */
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  UPSTASH_REDIS_REST_URL:
    process.env.NODE_ENV === 'production' ? z.string().url() : z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN:
    process.env.NODE_ENV === 'production' ? z.string().min(1) : z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().min(1),
  SENDGRID_API_KEY: z.string().min(1),
  SENDGRID_FROM_EMAIL: z.string().email(),
});

export function validateEnv() {
  try {
    envSchema.parse(process.env);
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Invalid environment configuration - cannot deploy. Check all required environment variables are set.'
      );
    }
    return false;
  }
}

if (process.env.NODE_ENV === 'production') {
  validateEnv();
}
