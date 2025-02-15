import { ServiceProviderSchema, ServiceProviderTypeSchema, ServiceSchema } from '@prisma/zod';
import { z } from 'zod';

import { User } from '@/features/profile/lib/types';

export type ServiceProvider = z.infer<typeof ServiceProviderSchema> & {
  services: z.infer<typeof ServiceSchema>[];
  user: User;
  serviceProviderType: z.infer<typeof ServiceProviderTypeSchema>;
};

export type Service = z.infer<typeof ServiceSchema>;
