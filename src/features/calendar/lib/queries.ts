import { prisma } from '@/lib/prisma';

import { expandRecurringSchedule } from './helper';
import { Schedule } from './types';

export async function getScheduleInRange(startDate: Date, endDate: Date): Promise<Schedule[]> {
  const schedules = await prisma.availability.findMany({
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

  // Convert Decimal to number and expand recurring schedules
  const expandedSchedules = schedules.flatMap((schedule) => {
    const processed = {
      ...schedule,
      price: Number(schedule.price),
      bookings: schedule.bookings.map((booking) => ({
        ...booking,
        price: Number(booking.price),
        status: booking.status as 'PENDING' | 'CONFIRMED' | 'NO_SHOW' | 'CANCELLED' | 'COMPLETED',
        client: {
          name: booking.client?.name ?? null,
        },
      })),
    };

    return expandRecurringSchedule(processed, endDate);
  });

  return expandedSchedules;
}
