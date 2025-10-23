import { createEnv } from '@t3-oss/env-nextjs';
import { ZodError, z } from 'zod';

const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'production', 'test']),
    DATABASE_URL: z.string().url(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    AUTH_SECRET: z.string(),
    NEXTAUTH_URL: z.string().url(),
    // AWS S3 Configuration
    S3_BUCKET_NAME: z.string(),
    AWS_REGION: z.string().default('eu-west-1'),
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
  // eslint-disable-next-line n/no-process-env
  experimental__runtimeEnv: process.env,
  onValidationError: (error: ZodError) => {
    // eslint-disable-next-line no-console
    console.log('❌ Invalid environment variables:', error.flatten().fieldErrors);
    // throw new Error('Invalid environment variables');
    process.exit(1);
  },
});

export default env;
