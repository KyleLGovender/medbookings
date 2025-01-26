'use server';

import { eachDayOfInterval, isSameDay } from 'date-fns';

import { prisma } from '@/lib/prisma';

import { Schedule } from './types';

export async function getServiceProviderScheduleInRange(
  serviceProviderId: string,
  startDate: Date,
  endDate: Date
): Promise<Schedule[]> {
  try {
    const schedule = await prisma.availability.findMany({
      where: {
        serviceProviderId,
        OR: [
          // One-time availabilities
          {
            isRecurring: false,
            startTime: {
              gte: startDate,
              lte: endDate,
            },
          },
          // Recurring availabilities that overlap with the range
          {
            isRecurring: true,
            startTime: {
              lte: endDate,
            },
            recurrenceEndDate: {
              gte: startDate,
            },
          },
        ],
      },
      include: {
        calculatedSlots: {
          include: {
            booking: true,
            service: true,
          },
        },
        availableServices: {
          include: {
            service: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return schedule.flatMap((availability) => {
      if (!availability.isRecurring) {
        return [
          {
            type: 'single',
            availability: {
              ...availability,
              bookings: availability.calculatedSlots
                .filter((slot) => slot.booking)
                .map((slot) => slot.booking!),
            },
          },
        ];
      }

      // Generate instances for recurring availabilities
      const dates = eachDayOfInterval({
        start: new Date(Math.max(availability.startTime.getTime(), startDate.getTime())),
        end: new Date(Math.min(availability.recurrenceEndDate!.getTime(), endDate.getTime())),
      });

      return dates
        .filter((date) => {
          // Filter by recurrence pattern (e.g., weekly on specific days)
          const dayOfWeek = date.getDay();
          return availability.recurringDays.includes(dayOfWeek);
        })
        .map((date) => {
          const instanceStartTime = new Date(date);
          instanceStartTime.setHours(
            availability.startTime.getHours(),
            availability.startTime.getMinutes()
          );

          const instanceEndTime = new Date(date);
          instanceEndTime.setHours(
            availability.endTime.getHours(),
            availability.endTime.getMinutes()
          );

          const instanceBookings = availability.calculatedSlots
            .filter((slot) => slot.booking && isSameDay(slot.booking.startTime, date))
            .map((slot) => slot.booking!);

          return {
            type: 'recurring',
            availability: {
              ...availability,
              id: `${availability.id}-${date.toISOString().split('T')[0]}`,
              startTime: instanceStartTime,
              endTime: instanceEndTime,
              bookings: instanceBookings,
            },
          };
        });
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return [];
  }
}
