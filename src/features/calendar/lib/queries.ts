'use server';

import { prisma } from '@/lib/prisma';

import { Availability, Service } from './types';

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

    // Convert Decimal to number before sending to client
    return services.map((service) => ({
      ...service,
      defaultPrice: service.defaultPrice ? Number(service.defaultPrice) : null,
    }));
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
}
