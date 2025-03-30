import { getLocalTimeZone, now } from '@internationalized/date';
import { Prisma } from '@prisma/client';

export function parseAbsoluteToLocal(date: Date) {
  return now(getLocalTimeZone()).set({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });
}

type ServiceProviderWithRelations = Prisma.ServiceProviderGetPayload<{
  include: {
    services: true;
    user: {
      select: {
        email: true;
      };
    };
    serviceProviderType: {
      select: {
        name: true;
        description: true;
      };
    };
    requirementSubmissions: {
      include: {
        requirementType: true;
      };
    };
  };
}>;

export function serializeServiceProvider(provider: ServiceProviderWithRelations) {
  return {
    ...provider,
    user: {
      email: provider.user.email,
    },
    serviceProviderType: {
      name: provider.serviceProviderType.name,
      description: provider.serviceProviderType.description,
    },
    services: provider.services.map((service) => ({
      ...service,
      defaultPrice: service.defaultPrice ? Number(service.defaultPrice) : null,
      defaultDuration: service.defaultDuration ? Number(service.defaultDuration) : null,
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    })),
    createdAt: provider.createdAt.toISOString(),
    updatedAt: provider.updatedAt.toISOString(),
    verifiedAt: provider.verifiedAt?.toISOString() ?? null,
    trialStarted: provider.trialStarted?.toISOString() ?? null,
    trialEnded: provider.trialEnded?.toISOString() ?? null,
    requirementSubmissions: provider.requirementSubmissions?.map((submission) => ({
      requirementTypeId: submission.requirementTypeId,
      documentUrl: submission.documentUrl,
      documentMetadata: submission.documentMetadata as { value?: string } | null,
      createdAt: submission.createdAt.toISOString(),
      updatedAt: submission.updatedAt.toISOString(),
      validatedAt: submission.validatedAt?.toISOString() ?? null,
      expiresAt: submission.expiresAt?.toISOString() ?? null,
      requirementType: {
        id: submission.requirementType.id,
        name: submission.requirementType.name,
        description: submission.requirementType.description,
        createdAt: submission.requirementType.createdAt.toISOString(),
        updatedAt: submission.requirementType.updatedAt.toISOString(),
        validationConfig: submission.requirementType.validationConfig,
      },
    })),
  };
}
