'use server';

import { prisma } from '@/lib/prisma';

import { QueriedAvailability, Service } from './types';

export async function getServiceProviderAvailabilityInRange(
  serviceProviderId: string,
  startDate: Date,
  endDate: Date
): Promise<QueriedAvailability[]> {
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

    // Transform and return the data
    return availabilities.map((availability) => ({
      ...availability,
      availableServices: availability.availableServices.map((as) => ({
        ...as,
        price: Number(as.price),
        service: {
          ...as.service,
          defaultPrice: as.service.defaultPrice ? Number(as.service.defaultPrice) : null,
        },
      })),
      calculatedSlots: availability.calculatedSlots.map((slot) => ({
        ...slot,
        booking: slot.booking && {
          ...slot.booking,
          price: Number(slot.booking.price),
          client: slot.booking.client || undefined,
          bookedBy: slot.booking.bookedBy || undefined,
          serviceProvider: {
            ...slot.booking.serviceProvider,
            averageRating: slot.booking.serviceProvider.averageRating || null,
          },
          service: {
            ...slot.booking.service,
            defaultPrice: Number(slot.booking.service.defaultPrice),
          },
        },
        service: {
          ...slot.service,
          defaultPrice: slot.service.defaultPrice ? Number(slot.service.defaultPrice) : null,
        },
      })),
    }));
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
