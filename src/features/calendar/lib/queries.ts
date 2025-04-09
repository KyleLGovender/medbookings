'use server';

import { Service } from '@/features/service-provider/lib/types';
import { prisma } from '@/lib/prisma';

import { AvailabilitySlot, AvailabilityView, BookingView } from './types';

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
        location: service.location || null,
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
          location: slot.serviceConfig.location || null,
        },
        booking: slot.booking
          ? {
              id: slot.booking.id,
              status: slot.booking.status,
              bookingType: 'USER_SELF',
              notificationPreferences: { whatsapp: false },
              guestInfo: {
                name: slot.booking.guestName ?? '',
                whatsapp: slot.booking.guestWhatsapp ?? undefined,
              },
            }
          : null,
      })),
    }));
  } catch (error) {
    console.error('Error fetching availability:', error);
    throw error;
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

export async function getSlotDetails(slotId: string): Promise<{
  slot: AvailabilitySlot;
  serviceProvider: {
    id: string;
    name: string;
    whatsapp?: string | null;
    image?: string | null;
  };
  booking: BookingView | null;
}> {
  const rawSlot = await prisma.calculatedAvailabilitySlot.findUnique({
    where: { id: slotId },
    include: {
      service: true,
      serviceConfig: true,
      availability: {
        include: {
          serviceProvider: true,
        },
      },
      booking: {
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          service: true,
        },
      },
    },
  });

  if (!rawSlot) {
    throw new Error('Slot not found');
  }

  // Transform the data to match expected types
  const slot = {
    id: rawSlot.id,
    startTime: rawSlot.startTime,
    endTime: rawSlot.endTime,
    status: rawSlot.status,
    service: {
      id: rawSlot.service.id,
      name: rawSlot.service.name,
      description: rawSlot.service.description,
      displayPriority: rawSlot.service.displayPriority,
    },
    serviceConfig: {
      id: rawSlot.serviceConfig.id,
      price: Number(rawSlot.serviceConfig.price),
      duration: rawSlot.serviceConfig.duration,
      isOnlineAvailable: rawSlot.serviceConfig.isOnlineAvailable,
      isInPerson: rawSlot.serviceConfig.isInPerson,
      location: rawSlot.serviceConfig.location || null,
    },
    booking: rawSlot.booking
      ? {
          id: rawSlot.booking.id,
          status: rawSlot.booking.status,
          bookingType: 'GUEST_SELF',
          notificationPreferences: { whatsapp: false },
          guestInfo: {
            name: rawSlot.booking.guestName || '',
            whatsapp: rawSlot.booking.guestWhatsapp || undefined,
          },
        }
      : null,
  };

  const serviceProvider = {
    id: rawSlot.availability.serviceProvider.id,
    name: rawSlot.availability.serviceProvider.name,
    whatsapp: rawSlot.availability.serviceProvider.whatsapp,
    image: rawSlot.availability.serviceProvider.image,
  };

  const booking = rawSlot.booking
    ? {
        id: rawSlot.booking.id,
        status: rawSlot.booking.status,
        bookingType: 'GUEST_SELF',
        notificationPreferences: { whatsapp: false },
        guestInfo: {
          name: rawSlot.booking.guestName || '',
          whatsapp: rawSlot.booking.guestWhatsapp || undefined,
        },
        slot: {
          id: rawSlot.id,
          startTime: rawSlot.startTime,
          endTime: rawSlot.endTime,
          status: rawSlot.status,
          service: {
            id: rawSlot.service.id,
            name: rawSlot.service.name,
            description: rawSlot.service.description || undefined,
            displayPriority: rawSlot.service.displayPriority,
          },
          serviceConfig: {
            id: rawSlot.serviceConfig.id,
            price: Number(rawSlot.serviceConfig.price),
            duration: rawSlot.serviceConfig.duration,
            isOnlineAvailable: rawSlot.serviceConfig.isOnlineAvailable,
            isInPerson: rawSlot.serviceConfig.isInPerson,
            location: rawSlot.serviceConfig.location ?? undefined,
          },
          serviceProvider: {
            id: rawSlot.availability.serviceProvider.id,
            name: rawSlot.availability.serviceProvider.name,
            whatsapp: rawSlot.availability.serviceProvider.whatsapp,
            image: rawSlot.availability.serviceProvider.image ?? undefined,
          },
        },
      }
    : null;

  return { slot, serviceProvider, booking };
}

export async function getBookingDetails(bookingId: string): Promise<{
  booking: BookingView;
  slot: AvailabilitySlot;
  serviceProvider: {
    id: string;
    name: string;
    whatsapp?: string | null;
    image?: string | null;
  };
}> {
  const rawBooking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: true,
      serviceProvider: true,
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          whatsapp: true,
        },
      },
      slot: {
        include: {
          service: true,
          serviceConfig: true,
          availability: {
            include: {
              serviceProvider: true,
            },
          },
        },
      },
    },
  });

  if (!rawBooking) {
    throw new Error('Booking not found');
  }

  // If there's an associated slot, create the slot object
  let slot: AvailabilitySlot;

  if (rawBooking.slot) {
    slot = {
      id: rawBooking.slot.id,
      startTime: rawBooking.slot.startTime,
      endTime: rawBooking.slot.endTime,
      status: rawBooking.slot.status,
      service: {
        id: rawBooking.slot.service.id,
        name: rawBooking.slot.service.name,
        description: rawBooking.slot.service.description,
        displayPriority: rawBooking.slot.service.displayPriority,
      },
      serviceConfig: {
        id: rawBooking.slot.serviceConfig.id,
        price: Number(rawBooking.slot.serviceConfig.price),
        duration: rawBooking.slot.serviceConfig.duration,
        isOnlineAvailable: rawBooking.slot.serviceConfig.isOnlineAvailable,
        isInPerson: rawBooking.slot.serviceConfig.isInPerson,
        location: rawBooking.slot.serviceConfig.location || null,
      },
      booking: null, // We already have the booking separately
    };
  } else {
    // If there's no slot, create a virtual slot from the booking data
    slot = {
      id: 'virtual-slot', // This is a placeholder
      startTime: rawBooking.startTime,
      endTime: rawBooking.endTime,
      status: 'BOOKED', // Since this is a virtual slot for an existing booking
      service: {
        id: rawBooking.serviceId,
        name: rawBooking.service.name,
        description: rawBooking.service.description,
        displayPriority: 0, // Default value
      },
      serviceConfig: {
        id: 'virtual-config', // This is a placeholder
        price: Number(rawBooking.price),
        duration: rawBooking.duration,
        isOnlineAvailable: rawBooking.isOnline,
        isInPerson: rawBooking.isInPerson,
        location: rawBooking.location || null,
      },
      booking: null, // We already have the booking separately
    };
  }

  const serviceProvider = {
    id: rawBooking.serviceProvider.id,
    name: rawBooking.serviceProvider.name,
    whatsapp: rawBooking.serviceProvider.whatsapp,
    image: rawBooking.serviceProvider.image,
  };

  // Create the booking view object with the slot nested inside
  const booking: BookingView = {
    id: rawBooking.id,
    status: rawBooking.status,
    bookingType: rawBooking.clientId ? 'USER_SELF' : 'GUEST_SELF',
    notificationPreferences: {
      whatsapp: false,
    },
    guestInfo: {
      name: rawBooking.guestName || rawBooking.client?.name || '',
      whatsapp: rawBooking.guestWhatsapp || rawBooking.client?.whatsapp || undefined,
    },
    slot: {
      id: slot.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: slot.status,
      service: {
        id: slot.service.id,
        name: slot.service.name,
        description: slot.service.description || undefined,
        displayPriority: slot.service.displayPriority,
      },
      serviceConfig: {
        id: slot.serviceConfig.id,
        price: slot.serviceConfig.price,
        duration: slot.serviceConfig.duration,
        isOnlineAvailable: slot.serviceConfig.isOnlineAvailable,
        isInPerson: slot.serviceConfig.isInPerson,
        location: slot.serviceConfig.location || undefined,
      },
      serviceProvider: {
        id: serviceProvider.id,
        name: serviceProvider.name,
        whatsapp: serviceProvider.whatsapp,
        image: serviceProvider.image || undefined,
      },
    },
  };

  return { booking, slot, serviceProvider };
}
