import { prisma } from '@/lib/prisma';

import { expandRecurringAvailability } from './helper';
import { AvailabilityWithBookings } from './types';

export async function getAvailabilitiesInRange(
  startDate: Date,
  endDate: Date
): Promise<AvailabilityWithBookings[]> {
  const availabilities = await prisma.availability.findMany({
    where: {
      startTime: { gte: startDate, lte: endDate },
    },
    include: {
      bookings: {
        include: {
          client: { select: { name: true } },
        },
      },
    },
    orderBy: { startTime: 'asc' },
  });

  // Convert Decimal to number and expand recurring availabilities
  const expandedAvailabilities = availabilities.flatMap((availability) => {
    const processed = {
      ...availability,
      price: Number(availability.price),
      bookings: availability.bookings.map((booking) => ({
        ...booking,
        price: Number(booking.price),
        status: booking.status as 'PENDING' | 'CONFIRMED' | 'NO_SHOW' | 'CANCELLED' | 'COMPLETED',
        client: {
          name: booking.client?.name ?? null,
        },
      })),
    };

    return expandRecurringAvailability(processed, endDate);
  });

  return expandedAvailabilities satisfies AvailabilityWithBookings[];
}
