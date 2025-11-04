import { createEnv } from '@t3-oss/env-nextjs';
import { ZodError, z } from 'zod';

const env = createEnv({
  server: {
    // REQUIRED - Core application
    NODE_ENV: z.enum(['development', 'production', 'test']),
    DATABASE_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
    NEXTAUTH_URL: z.string().url(),

    // OPTIONAL - OAuth providers (can disable if using credentials only)
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),

    // OPTIONAL - File storage (gracefully degrades if not configured)
    BLOB_READ_WRITE_TOKEN: z.string().optional(),

    // OPTIONAL - SMS/WhatsApp (gracefully degrades if not configured)
    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    TWILIO_PHONE_NUMBER: z.string().optional(),
    TWILIO_WHATSAPP_NUMBER: z.string().optional(),

    // OPTIONAL - Email service (gracefully degrades if not configured)
    SENDGRID_API_KEY: z.string().optional(),
    SENDGRID_FROM_EMAIL: z.string().email().optional(),

    // OPTIONAL - Admin notifications
    ADMIN_EMAILS: z.string().optional(),
    ADMIN_NOTIFICATION_EMAIL: z.string().email().optional(),

    // OPTIONAL - Deployment configuration
    PORT: z.string().optional(),
    VERCEL_URL: z.string().optional(),

    // REQUIRED in production - Rate limiting across multiple instances
    // OPTIONAL in development - Can use in-memory fallback
    // NOTE: Serverless/multi-instance deployments MUST have Redis configured
    UPSTASH_REDIS_REST_URL:
      process.env.NODE_ENV === 'production'
        ? z.string().url('UPSTASH_REDIS_REST_URL is required in production for rate limiting')
        : z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN:
      process.env.NODE_ENV === 'production'
        ? z.string().min(1, 'UPSTASH_REDIS_REST_TOKEN is required in production for rate limiting')
        : z.string().optional(),
  },
  emptyStringAsUndefined: true,
  // eslint-disable-next-line n/no-process-env
  experimental__runtimeEnv: process.env,
  onValidationError: (error: ZodError) => {
    // Environment validation failure - show which variables are missing/invalid
    // This runs during app startup, before logger is initialized
    // eslint-disable-next-line no-console
    console.error('❌ Invalid environment variables:\n');
    // eslint-disable-next-line no-console
    console.error(error.errors.map((e) => `  - ${e.path.join('.')}: ${e.message}`).join('\n'));
    // eslint-disable-next-line no-console
    console.error('\n💡 Check your .env file and compare with .env.example\n');
    process.exit(1);
  },
});

export default env;
