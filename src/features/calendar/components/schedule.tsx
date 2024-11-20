'use client';

import * as React from 'react';

import type { Availability as PrismaAvailability, Booking as PrismaBooking } from '@prisma/client';
import { format } from 'date-fns';
import { Decimal } from 'decimal.js';
import { DateRange } from 'react-day-picker';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

const availabilities: PrismaAvailability[] = [
  {
    id: 'a1',
    serviceProviderId: 'provider1',
    startTime: new Date('2024-11-20T09:00:00'),
    endTime: new Date('2024-11-20T17:00:00'),
    isRecurring: false,
    recurringDays: [],
    recurrenceEndDate: null,
    duration: 480,
    price: new Decimal(100),
    isOnlineAvailable: true,
    isInPersonAvailable: true,
    location: null,
    maxBookings: 1,
    remainingSpots: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'a2',
    serviceProviderId: 'provider1',
    startTime: new Date('2024-11-21T09:00:00'),
    endTime: new Date('2024-11-21T17:00:00'),
    isRecurring: false,
    recurringDays: [],
    recurrenceEndDate: null,
    duration: 480,
    price: new Decimal(100),
    isOnlineAvailable: true,
    isInPersonAvailable: true,
    location: null,
    maxBookings: 1,
    remainingSpots: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'a3',
    serviceProviderId: 'provider1',
    startTime: new Date('2024-11-22T09:00:00'),
    endTime: new Date('2024-11-22T17:00:00'),
    isRecurring: false,
    recurringDays: [],
    recurrenceEndDate: null,
    duration: 480,
    price: new Decimal(100),
    isOnlineAvailable: true,
    isInPersonAvailable: true,
    location: null,
    maxBookings: 1,
    remainingSpots: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Updated dummy data matching schema
const bookings: PrismaBooking[] = [
  {
    id: '1',
    serviceProviderId: 'provider1',
    clientId: 'c1',
    availabilityId: 'a1',
    duration: 60,
    price: new Decimal(150),
    isOnline: true,
    location: null,
    selectedServices: [],
    startTime: new Date('2024-11-20T09:00:00'),
    endTime: new Date('2024-11-20T10:00:00'),
    status: 'CONFIRMED',
    notes: null,
    cancellationReason: null,
    cancelledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    client: {
      name: 'Person 1',
    },
  },
  {
    id: '2',
    serviceProviderId: 'provider1',
    clientId: 'c2',
    availabilityId: 'a2',
    duration: 45,
    price: new Decimal(175),
    isOnline: false,
    location: '123 Medical Center Dr',
    selectedServices: [],
    startTime: new Date('2024-11-21T14:30:00'),
    endTime: new Date('2024-11-21T15:15:00'),
    status: 'PENDING',
    notes: null,
    cancellationReason: null,
    cancelledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    client: {
      name: 'Person 2',
    },
  },
  {
    id: '3',
    serviceProviderId: 'provider1',
    clientId: 'c3',
    availabilityId: 'a3',
    duration: 30,
    price: new Decimal(200),
    isOnline: true,
    location: null,
    selectedServices: [],
    startTime: new Date('2024-11-22T11:15:00'),
    endTime: new Date('2024-11-22T11:45:00'),
    status: 'CONFIRMED',
    notes: null,
    cancellationReason: null,
    cancelledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    client: {
      name: 'Person 3',
    },
  },
];

// Modify the Availability interface to include related bookings
interface AvailabilityWithBookings extends PrismaAvailability {
  bookings: PrismaBooking[];
}

// Helper function to group bookings with availabilities
const createSchedule = (
  bookings: PrismaBooking[],
  availabilities: PrismaAvailability[]
): AvailabilityWithBookings[] =>
  availabilities
    .map((availability) => ({
      ...availability,
      bookings: bookings.filter((booking) => booking.availabilityId === availability.id),
    }))
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

const schedule = createSchedule(bookings, availabilities);

export function Schedule({
  view = 'schedule',
  dateRange: propDateRange,
}: {
  view?: 'schedule' | 'day' | 'week';
  dateRange?: DateRange;
}) {
  const [singleDate, setSingleDate] = React.useState<Date>(new Date());

  // Filter both availabilities and their bookings
  const filteredSchedule = React.useMemo(() => {
    if (view === 'schedule') {
      if (!propDateRange?.from || !propDateRange?.to) return schedule;

      return schedule
        .filter(
          (availability) =>
            availability.startTime >= propDateRange.from &&
            availability.startTime <= propDateRange.to
        )
        .map((availability) => ({
          ...availability,
          bookings: availability.bookings.filter(
            (booking) =>
              booking.startTime >= propDateRange.from && booking.startTime <= propDateRange.to
          ),
        }));
    }

    // For day view
    return schedule
      .filter(
        (availability) =>
          format(availability.startTime, 'yyyy-MM-dd') === format(singleDate, 'yyyy-MM-dd')
      )
      .map((availability) => ({
        ...availability,
        bookings: availability.bookings.filter(
          (booking) => format(booking.startTime, 'yyyy-MM-dd') === format(singleDate, 'yyyy-MM-dd')
        ),
      }));
  }, [view, propDateRange, singleDate, schedule]);

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Schedule</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="hidden md:table-cell">Client</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="hidden text-right md:table-cell">Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSchedule.map((availability) => (
              <React.Fragment key={availability.id}>
                {/* Availability Row */}
                <TableRow className="bg-slate-50">
                  <TableCell>Availability</TableCell>
                  <TableCell>{format(availability.startTime, 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    {format(availability.startTime, 'HH:mm')} -{' '}
                    {format(availability.endTime, 'HH:mm')}
                  </TableCell>
                  <TableCell>{availability.duration} mins</TableCell>
                  <TableCell className="hidden md:table-cell">-</TableCell>
                  <TableCell className="hidden md:table-cell">-</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                      Available
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-right md:table-cell">-</TableCell>
                </TableRow>

                {/* Nested Booking Rows */}
                {availability.bookings.map((booking) => (
                  <TableRow key={booking.id} className="bg-white">
                    <TableCell className="pl-8">Booking</TableCell>
                    <TableCell>{format(booking.startTime, 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      {format(booking.startTime, 'HH:mm')} - {format(booking.endTime, 'HH:mm')}
                    </TableCell>
                    <TableCell>{booking.duration} mins</TableCell>
                    <TableCell className="hidden md:table-cell">{booking.client.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {booking.isOnline ? 'Online' : 'In-Person'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span
                        className={cn('rounded-full px-2 py-1 text-xs font-medium', {
                          'bg-yellow-100 text-yellow-800': booking.status === 'PENDING',
                          'bg-green-100 text-green-800': booking.status === 'CONFIRMED',
                          'bg-red-100 text-red-800': booking.status === 'CANCELLED',
                          'bg-blue-100 text-blue-800': booking.status === 'COMPLETED',
                          'bg-gray-100 text-gray-800': booking.status === 'NO_SHOW',
                        })}
                      >
                        {booking.status.charAt(0) + booking.status.slice(1).toLowerCase()}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-right md:table-cell">
                      ${booking.price.toNumber().toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
