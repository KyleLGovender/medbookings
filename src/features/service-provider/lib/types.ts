import {
  ServiceProviderSchema,
  ServiceProviderTypeSchema,
  ServiceSchema,
  UserSchema,
} from '@prisma/zod';
import { z } from 'zod';

export type Service = z.infer<typeof ServiceSchema>;

export type ServiceProvider = z.infer<typeof ServiceProviderSchema> & {
  services: Service[];
  user: z.infer<typeof UserSchema>;
  serviceProviderType: z.infer<typeof ServiceProviderTypeSchema>;
};
