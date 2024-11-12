import { createEnv } from '@t3-oss/env-nextjs';
import { ZodError, z } from 'zod';

const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'production', 'test']),
    DATABASE_URL: z.string().url(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
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
