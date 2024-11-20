import { prisma } from '@/lib/prisma';

export async function getAvailabilitiesInRange(
  serviceProviderId: string,
  startDate: Date,
  endDate: Date
) {
  return prisma.availability.findMany({
    where: {
      serviceProviderId,
      OR: [
        // One-time availabilities within range
        {
          isRecurring: false,
          startTime: {
            gte: startDate,
            lte: endDate,
          },
        },
        // Recurring availabilities that overlap with range
        {
          isRecurring: true,
          recurrenceEndDate: {
            gte: startDate,
          },
          startTime: {
            lte: endDate,
          },
        },
      ],
    },
    include: {
      bookings: {
        include: {
          client: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      startTime: 'asc',
    },
  });
}
