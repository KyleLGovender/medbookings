'use server';

import { prisma } from '@/lib/prisma';

import { Availability } from './types';

export async function getServiceProviderAvailabilityInRange(
  serviceProviderId: string,
  startDate: Date,
  endDate: Date
): Promise<Availability[]> {
  try {
    return await prisma.availability.findMany({
      where: {
        serviceProviderId,
        calculatedSlots: {
          some: {
            startTime: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
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
            availability: true,
            service: true,
            serviceConfig: true,
            booking: {
              include: {
                client: true,
                bookedBy: true,
                serviceProvider: true,
                service: true,
                notifications: true,
                review: true,
              },
            },
          },
          orderBy: {
            startTime: 'asc',
          },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching availabilities:', error);
    return [];
  }
}
