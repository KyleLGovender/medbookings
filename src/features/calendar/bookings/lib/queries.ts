'use server';

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
