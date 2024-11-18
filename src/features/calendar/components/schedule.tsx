'use client';

import * as React from 'react';

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

// Match Prisma schema
interface Booking {
  id: string;
  serviceProviderId: string;
  clientId: string;
  availabilityId: string;
  duration: number;
  price: Decimal;
  isOnline: boolean;
  location?: string | null;
  startTime: Date;
  endTime: Date;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  notes?: string | null;
  client: {
    name: string;
  };
}

// Updated dummy data matching schema
const bookings: Booking[] = [
  {
    id: '1',
    serviceProviderId: 'sp1',
    clientId: 'c1',
    availabilityId: 'a1',
    duration: 60,
    price: new Decimal(150),
    isOnline: true,
    startTime: new Date('2024-11-20T09:00:00'),
    endTime: new Date('2024-11-20T10:00:00'),
    status: 'CONFIRMED',
    client: {
      name: 'Dr. Smith',
    },
  },
  {
    id: '2',
    serviceProviderId: 'sp2',
    clientId: 'c2',
    availabilityId: 'a2',
    duration: 45,
    price: new Decimal(175),
    isOnline: false,
    location: '123 Medical Center Dr',
    startTime: new Date('2024-11-21T14:30:00'),
    endTime: new Date('2024-11-21T15:15:00'),
    status: 'PENDING',
    client: {
      name: 'Dr. Johnson',
    },
  },
  {
    id: '3',
    serviceProviderId: 'sp3',
    clientId: 'c3',
    availabilityId: 'a3',
    duration: 30,
    price: new Decimal(200),
    isOnline: true,
    startTime: new Date('2024-11-22T11:15:00'),
    endTime: new Date('2024-11-22T11:45:00'),
    status: 'CONFIRMED',
    client: {
      name: 'Dr. Williams',
    },
  },
];

export function Schedule({
  view = 'schedule',
  dateRange: propDateRange,
}: {
  view?: 'schedule' | 'day' | 'week';
  dateRange?: DateRange;
}) {
  // Remove the local dateRange state since we're getting it from props
  const [singleDate, setSingleDate] = React.useState<Date>(new Date());

  // Updated filtering logic to use propDateRange
  const filteredBookings = React.useMemo(() => {
    if (view === 'schedule') {
      if (!propDateRange?.from || !propDateRange?.to) return bookings;
      return bookings.filter(
        (booking) =>
          booking.startTime >= propDateRange.from && booking.startTime <= propDateRange.to
      );
    }
    // For day view, filter by single date
    return bookings.filter(
      (booking) => format(booking.startTime, 'yyyy-MM-dd') === format(singleDate, 'yyyy-MM-dd')
    );
  }, [view, propDateRange, singleDate]);

  // Handler for date changes
  const handleDateChange = (newDate: DateRange | Date | undefined) => {
    if (view === 'schedule') {
      setDateRange(newDate as DateRange | undefined);
    } else {
      setSingleDate(newDate as Date);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="hidden text-right md:table-cell">Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>{booking.client.name}</TableCell>
                <TableCell>{format(booking.startTime, 'MMM dd, yyyy HH:mm')}</TableCell>
                <TableCell>{booking.duration} mins</TableCell>
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
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
