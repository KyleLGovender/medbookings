import { createEnv } from '@t3-oss/env-nextjs';
import { ZodError, z } from 'zod';

const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'production', 'test']),
    DATABASE_URL: z.string().url(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    // NextAuth Secret - supports both v4 (NEXTAUTH_SECRET) and v5 (AUTH_SECRET)
    // Both are optional here, but runtime validation below ensures at least one exists
    AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters').optional(),
    NEXTAUTH_SECRET: z
      .string()
      .min(32, 'NEXTAUTH_SECRET must be at least 32 characters')
      .optional(),
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
    process.exit(1);
  },
});

// Runtime validation: Ensure at least one NextAuth secret is provided
// This runs after the schema validation above, allowing either variable name
if (!env.AUTH_SECRET && !env.NEXTAUTH_SECRET) {
  // eslint-disable-next-line no-console
  console.error(
    '❌ NextAuth Configuration Error: Either AUTH_SECRET or NEXTAUTH_SECRET must be provided\n'
  );
  // eslint-disable-next-line no-console
  console.error('💡 Set one of these environment variables with at least 32 characters\n');
  process.exit(1);
}

export default env;
