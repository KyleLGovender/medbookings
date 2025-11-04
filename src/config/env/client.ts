import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

const clientEnv = createEnv({
  client: {
    // REQUIRED - Google Maps API for location features
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z
      .string()
      .min(1, 'Google Maps API key is required for location features'),

    // OPTIONAL - Application version for debugging
    NEXT_PUBLIC_APP_VERSION: z.string().optional(),
  },
  // eslint-disable-next-line n/no-process-env
  runtimeEnv: {
    // eslint-disable-next-line n/no-process-env
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    // eslint-disable-next-line n/no-process-env
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  },
  emptyStringAsUndefined: true,
});

export default clientEnv;
