'use server';

import {
  AvailabilitySchema,
  BookingSchema,
  CalculatedAvailabilitySlotSchema,
  ServiceAvailabilityConfigSchema,
  ServiceProviderSchema,
  ServiceSchema,
} from '@prisma/zod';

import { prisma } from '@/lib/prisma';

import { Availability, Service } from './types';

const CalculatedSlotWithRelationsSchema = CalculatedAvailabilitySlotSchema.extend({
  booking: BookingSchema.nullable(),
  service: ServiceSchema,
  serviceConfig: ServiceAvailabilityConfigSchema,
});

const AvailabilityWithRelationsSchema = AvailabilitySchema.extend({
  serviceProvider: ServiceProviderSchema,
  availableServices: ServiceAvailabilityConfigSchema.array(),
  calculatedSlots: CalculatedSlotWithRelationsSchema.array(),
});

export async function getServiceProviderAvailabilityInRange(
  serviceProviderId: string,
  startDate: Date,
  endDate: Date
): Promise<Availability[]> {
  try {
    const availabilities = await prisma.availability.findMany({
      where: {
        serviceProviderId,
        startTime: { lte: endDate }, // Availability starts before range end
        endTime: { gte: startDate }, // Availability ends after range start
      },
      include: {
        serviceProvider: true,
        availableServices: {
          include: {
            service: true,
          },
        },
        calculatedSlots: {
          where: {
            startTime: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            service: true,
            booking: {
              include: {
                slot: true,
                client: true,
                bookedBy: true,
                serviceProvider: true,
                service: true,
                notifications: true,
                review: true,
              },
            },
          },
        },
      },
    });

    // Let Zod handle all the transformations
    return AvailabilityWithRelationsSchema.array().parse(availabilities);
  } catch (error) {
    console.error('Error fetching availability:', error);
    console.error('Error details:', error instanceof Error ? error.stack : error);
    return [];
  }
}

export async function getServiceProviderServices(serviceProviderId: string): Promise<Service[]> {
  try {
    const services = await prisma.service.findMany({
      where: {
        providers: {
          some: {
            id: serviceProviderId,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return ServiceSchema.array().parse(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
}
