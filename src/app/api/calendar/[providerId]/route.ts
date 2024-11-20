import { NextRequest, NextResponse } from 'next/server';

import { expandRecurringSchedule } from '@/features/calendar/lib/helper';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: { providerId: string } }) {
  try {
    const { startDate, endDate } = await request.json();
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Reuse the getAvailabilitiesInRange function with provider filter
    const schedule = await prisma.availability.findMany({
      where: {
        serviceProviderId: params.providerId,
        startTime: { gte: start },
        endTime: { lte: end },
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
    });

    // Process and expand recurring availabilities
    const expandedSchedule = schedule.flatMap((avail) => {
      const processed = {
        ...avail,
        price: Number(avail.price),
        recurrenceEndDate: avail.recurrenceEndDate,
        bookings: avail.bookings.map((booking) => ({
          ...booking,
          price: Number(booking.price),
          status: booking.status as 'PENDING' | 'CONFIRMED' | 'NO_SHOW' | 'CANCELLED' | 'COMPLETED',
          client: {
            name: booking.client?.name ?? null,
          },
        })),
      };

      return expandRecurringSchedule(processed, end);
    });

    return NextResponse.json(expandedSchedule);
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
}
