import { createEnv } from '@t3-oss/env-nextjs';
import { ZodError, z } from 'zod';

const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'production', 'test']),
    DATABASE_URL: z.string().url(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    NEXTAUTH_SECRET: z.string(),
    NEXTAUTH_URL: z.string().url(),
    // Vercel Blob Configuration
    BLOB_READ_WRITE_TOKEN: z.string(),
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
