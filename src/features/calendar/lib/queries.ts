'use server';

import { Service } from '@/features/service-provider/lib/types';
import { prisma } from '@/lib/prisma';

import { AvailabilitySlot, AvailabilityView } from './types';

export async function getServiceProviderAvailabilityInRange(
  serviceProviderId: string,
  startDate: Date,
  endDate: Date
): Promise<AvailabilityView[]> {
  try {
    const availabilities = await prisma.availability.findMany({
      where: {
        serviceProviderId,
        startTime: { lte: endDate },
        endTime: { gte: startDate },
      },
      select: {
        id: true,
        serviceProviderId: true,
        serviceProvider: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        startTime: true,
        endTime: true,
        calculatedSlots: {
          where: {
            startTime: { gte: startDate, lte: endDate },
          },
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
            service: {
              select: {
                id: true,
                name: true,
                description: true,
                displayPriority: true,
              },
            },
            serviceConfig: {
              select: {
                id: true,
                price: true,
                duration: true,
                isOnlineAvailable: true,
                isInPerson: true,
                location: true,
              },
            },
            booking: {
              select: {
                id: true,
                status: true,
                price: true,
                guestName: true,
                guestEmail: true,
                guestPhone: true,
                guestWhatsapp: true,
                client: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        availableServices: {
          select: {
            serviceId: true,
            duration: true,
            price: true,
            isOnlineAvailable: true,
            isInPerson: true,
            location: true,
          },
        },
      },
    });

    // Convert price fields to numbers
    return availabilities.map((availability) => ({
      id: availability.id,
      startTime: availability.startTime,
      endTime: availability.endTime,
      serviceProvider: {
        id: availability.serviceProvider.id,
        name: availability.serviceProvider.name,
        image: availability.serviceProvider.image,
      },
      availableServices: availability.availableServices.map((service) => ({
        serviceId: service.serviceId,
        duration: service.duration,
        price: Number(service.price),
        isOnlineAvailable: service.isOnlineAvailable,
        isInPerson: service.isInPerson,
        location: service.location,
      })),
      slots: availability.calculatedSlots.map((slot) => ({
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: slot.status,
        service: {
          id: slot.service.id,
          name: slot.service.name,
          description: slot.service.description,
          displayPriority: slot.service.displayPriority,
        },
        serviceConfig: {
          id: slot.serviceConfig.id,
          price: Number(slot.serviceConfig.price),
          duration: slot.serviceConfig.duration,
          isOnlineAvailable: slot.serviceConfig.isOnlineAvailable,
          isInPerson: slot.serviceConfig.isInPerson,
          location: slot.serviceConfig.location,
        },
        booking: slot.booking
          ? {
              id: slot.booking.id,
              status: slot.booking.status,
              price: Number(slot.booking.price),
              startTime: slot.startTime,
              endTime: slot.endTime,
              service: {
                id: slot.service.id,
                name: slot.service.name,
              },
              client: slot.booking.client
                ? {
                    id: slot.booking.client.id,
                    name: slot.booking.client.name,
                    email: slot.booking.client.email,
                    phone: null,
                    whatsapp: null,
                  }
                : undefined,
              guestName: slot.booking.guestName,
              guestEmail: slot.booking.guestEmail,
              guestPhone: slot.booking.guestPhone,
              guestWhatsapp: slot.booking.guestWhatsapp,
            }
          : null,
      })),
    }));
  } catch (error) {
    console.error('Error fetching availability:', error);
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
      include: {
        availabilityConfigs: {
          where: {
            serviceProviderId,
          },
        },
      },
    });
    return services.map((service) => ({
      ...service,
      defaultPrice: Number(service.defaultPrice),
      availabilityConfigs: service.availabilityConfigs.map((config) => ({
        ...config,
        price: Number(config.price),
      })),
    }));
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
}

export async function getBookingDetails(slotId: string): Promise<{
  slot: AvailabilitySlot;
  serviceProvider: {
    id: string;
    name: string;
    image?: string | null;
  };
}> {
  const slot = await prisma.calculatedAvailabilitySlot.findUnique({
    where: { id: slotId },
    include: {
      service: true,
      serviceConfig: true,
      booking: {
        include: {
          client: true,
        },
      },
      availability: {
        include: {
          serviceProvider: true,
        },
      },
    },
  });

  if (!slot) {
    throw new Error('Slot not found');
  }

  const serviceProvider = slot.availability.serviceProvider;

  return {
    slot: {
      id: slot.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: slot.status,
      service: {
        id: slot.service.id,
        name: slot.service.name,
        description: slot.service.description,
        displayPriority: slot.service.displayPriority,
      },
      serviceConfig: {
        id: slot.serviceConfig.id,
        price: Number(slot.serviceConfig.price),
        duration: slot.serviceConfig.duration,
        isOnlineAvailable: slot.serviceConfig.isOnlineAvailable,
        isInPerson: slot.serviceConfig.isInPerson,
        location: slot.serviceConfig.location,
      },
      booking: slot.booking
        ? {
            id: slot.booking.id,
            status: slot.booking.status,
            price: Number(slot.booking.price),
            startTime: slot.startTime,
            endTime: slot.endTime,
            service: {
              id: slot.service.id,
              name: slot.service.name,
            },
            client: slot.booking.client
              ? {
                  id: slot.booking.client.id,
                  name: slot.booking.client.name,
                  email: slot.booking.client.email,
                  phone: null,
                  whatsapp: null,
                }
              : undefined,
            guestName: slot.booking.guestName,
            guestEmail: slot.booking.guestEmail,
            guestPhone: slot.booking.guestPhone,
            guestWhatsapp: slot.booking.guestWhatsapp,
          }
        : null,
    },
    serviceProvider: {
      id: serviceProvider.id,
      name: serviceProvider.name,
      image: serviceProvider.image,
    },
  };
}
