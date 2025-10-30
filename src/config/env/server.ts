import { z } from 'zod';

// Environment variable schemas
const serverSchemas = {
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
};

// Cache for validated values to avoid repeated validation
const validatedCache = new Map<string, any>();

/**
 * CRITICAL FIX: Lazy validation using Proxy
 *
 * This approach defers environment variable validation until the variable is actually accessed.
 * This prevents module import failures that cause generic 500 errors in Lambda/Amplify.
 *
 * Benefits:
 * - Module can be imported without crashing
 * - Specific failing variable is clearly identified in logs
 * - Error handlers can run and provide detailed feedback
 * - Production mode falls back to process.env for invalid variables
 */
const env = new Proxy(
  {},
  {
    get(target, prop: string) {
      // Return cached value if already validated
      if (validatedCache.has(prop)) {
        return validatedCache.get(prop);
      }

      // Get the schema for this property
      const schema = serverSchemas[prop as keyof typeof serverSchemas];

      // If no schema defined, just return the raw env value
      if (!schema) {
        const rawValue = process.env[prop];
        validatedCache.set(prop, rawValue);
        return rawValue;
      }

      // Get raw value from process.env
      const rawValue = process.env[prop];

      // Handle emptyStringAsUndefined
      const valueToValidate = rawValue === '' ? undefined : rawValue;

      try {
        // Validate the value
        const validatedValue = schema.parse(valueToValidate);

        // Cache the validated value
        validatedCache.set(prop, validatedValue);

        return validatedValue;
      } catch (error) {
        // Validation failed for this specific variable
        const zodError = error as z.ZodError;

        // eslint-disable-next-line no-console
        console.error(`❌ Environment variable validation failed for: ${prop}`);
        // eslint-disable-next-line no-console
        console.error(`   Value: ${rawValue === undefined ? 'undefined' : `"${rawValue}"`}`);
        // eslint-disable-next-line no-console
        console.error(`   Error: ${zodError.errors[0]?.message || 'Invalid value'}`);
        // eslint-disable-next-line no-console
        console.error(`   Path: ${zodError.errors[0]?.path.join('.') || prop}`);

        if (process.env.NODE_ENV !== 'production') {
          // In development, throw immediately for fast feedback
          throw new Error(
            `Environment variable validation failed for ${prop}: ${zodError.errors[0]?.message}`
          );
        }

        // In production, log warning and return raw value as fallback
        // eslint-disable-next-line no-console
        console.error(`⚠️  WARNING: Using raw value for ${prop} despite validation failure`);
        // eslint-disable-next-line no-console
        console.error('⚠️  This may cause runtime errors. Fix environment variable ASAP!');

        // Cache the raw value to avoid repeated validation attempts
        validatedCache.set(prop, rawValue);

        return rawValue;
      }
    },
  }
) as any;

export default env;
