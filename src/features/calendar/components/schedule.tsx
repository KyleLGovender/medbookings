import * as React from 'react';

import { format } from 'date-fns';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AvailabilityWithBookings } from '@/features/calendar/lib/types';
import { cn } from '@/lib/utils';

interface ScheduleProps {
  filteredSchedule: AvailabilityWithBookings[];
}

export function Schedule({ filteredSchedule }: ScheduleProps) {
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
                  <TableCell>{format(availability.startTime, 'EEE, MMM dd')}</TableCell>
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
                  <TableCell className="hidden text-right md:table-cell">
                    R{Number(availability.price).toFixed(2)}
                  </TableCell>
                </TableRow>

                {/* Nested Booking Rows */}
                {availability.bookings.map((booking) => (
                  <TableRow key={booking.id} className="bg-white">
                    <TableCell className="pl-8">Booking</TableCell>
                    <TableCell>{format(booking.startTime, 'EEE, MMM dd')}</TableCell>
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
                      R{Number(booking.price).toFixed(2)}
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
