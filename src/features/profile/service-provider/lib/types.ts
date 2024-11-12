import { ServiceProvider as PrismaServiceProvider, Service } from '@prisma/client';

export type ServiceProviderWithRelations = PrismaServiceProvider & {
  services: Service[];
  user: {
    email: string | null;
  };
  serviceProviderType: {
    name: string;
    description: string | null;
  };
};
