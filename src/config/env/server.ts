import { createEnv } from '@t3-oss/env-nextjs';
import { ZodError, z } from 'zod';

// Environment schema definition
const envSchema = {
  server: {
    NODE_ENV: z.enum(['development', 'production', 'test']),
    DATABASE_URL: z.string().url(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    // NextAuth v4 Secret - required for authentication
    NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
    NEXTAUTH_URL: z.string().url(),
    // AWS S3 Configuration
    S3_BUCKET_NAME: z.string(),
    S3_REGION: z.string().default('eu-west-1'),
    // AWS credentials are optional - automatically provided by IAM role in AWS Amplify
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    // Twilio Configuration
    TWILIO_ACCOUNT_SID: z.string(),
    TWILIO_AUTH_TOKEN: z.string(),
    TWILIO_PHONE_NUMBER: z.string(),
    TWILIO_WHATSAPP_NUMBER: z.string(),
    // SendGrid Configuration
    SENDGRID_API_KEY: z.string(),
    SENDGRID_FROM_EMAIL: z.string(),
  },
  emptyStringAsUndefined: true,
  // Empty object because we have no client-side (NEXT_PUBLIC_*) variables in this config
  // experimental__runtimeEnv is required but should be empty for server-only configs
  experimental__runtimeEnv: {},
  onValidationError: (error: ZodError) => {
    // Environment validation failure - show which variables are missing/invalid
    // This runs during app startup, before logger is initialized
    // eslint-disable-next-line no-console
    console.error('❌ Invalid environment variables:\n');
    // eslint-disable-next-line no-console
    console.error(error.errors.map((e) => `  - ${e.path.join('.')}: ${e.message}`).join('\n'));
    // eslint-disable-next-line no-console
    console.error('\n💡 Check your .env file and compare with .env.example\n');

    // In development, exit immediately for fast feedback
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }

    // In production, throw error to be caught by try-catch below
    // This prevents process.exit() from killing Lambda/Amplify processes
    throw error;
  },
};

// CRITICAL FIX: Wrap env creation in try-catch for production environments
// This prevents validation errors from killing Lambda/Amplify processes
let env: any;

try {
  env = createEnv(envSchema);
} catch (error) {
  if (process.env.NODE_ENV === 'production') {
    // eslint-disable-next-line no-console
    console.error('⚠️  WARNING: Environment validation failed in production');
    // eslint-disable-next-line no-console
    console.error('⚠️  Using process.env directly as fallback. This may cause runtime errors.');
    // eslint-disable-next-line no-console
    console.error('⚠️  Fix environment variables ASAP!');

    // Fallback: use process.env directly
    // This allows the app to start but will likely cause runtime errors
    env = process.env;
  } else {
    // In development, re-throw to fail fast
    throw error;
  }
}

export default env;
