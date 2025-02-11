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
        startTime: { lte: endDate },
        endTime: { gte: startDate },
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

    console.log(
      'Availabilities data structure:',
      JSON.stringify(
        {
          count: availabilities.length,
          sample: {
            ...availabilities[0],
            startTime: availabilities[0]?.startTime,
            endTime: availabilities[0]?.endTime,
            createdAt: availabilities[0]?.createdAt,
            updatedAt: availabilities[0]?.updatedAt,
          },
          fields: Object.keys(availabilities[0] || {}),
          serviceProvider: availabilities[0]?.serviceProvider,
          serviceProviderFields: Object.keys(availabilities[0]?.serviceProvider || {}),
          availableServices: availabilities[0]?.availableServices,
          availableServicesFields: Object.keys(availabilities[0]?.availableServices?.[0] || {}),
        },
        null,
        2
      )
    );

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
