'use client';

import { format } from 'date-fns';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { AvailabilityView as AvailabilityViewType } from '../../lib/types';

interface AvailabilityViewProps {
  availability: AvailabilityViewType;
}

export function AvailabilityView({ availability }: AvailabilityViewProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium">Time Slot</h3>
        <p className="text-sm text-gray-500">
          {format(new Date(availability.startTime), 'EEEE, MMMM d, yyyy')}
          <br />
          {format(new Date(availability.startTime), 'h:mm a')} -{' '}
          {format(new Date(availability.endTime), 'h:mm a')}
        </p>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Available Services</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Booking Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {availability.availableServices.map((service) => {
              const serviceSlots = availability.slots.filter(
                (slot) => slot.service.id === service.serviceId
              );
              const bookedSlots = serviceSlots.filter((slot) => slot.status === 'BOOKED');
              const bookingPercentage = Math.round(
                (bookedSlots.length / serviceSlots.length) * 100
              );

              return (
                <TableRow key={service.serviceId}>
                  <TableCell>
                    {availability.slots.find((slot) => slot.service.id === service.serviceId)
                      ?.service.name || service.serviceId}
                  </TableCell>
                  <TableCell>{service.duration} min</TableCell>
                  <TableCell>${service.price}</TableCell>
                  <TableCell>
                    {service.isOnlineAvailable && 'Online'}
                    {service.isOnlineAvailable && service.isInPerson && ' / '}
                    {service.isInPerson && (service.location || 'In Person')}
                  </TableCell>
                  <TableCell>
                    {bookingPercentage}% ({bookedSlots.length}/{serviceSlots.length})
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Booking Status</h3>
        <p className="text-sm text-gray-500">
          {Math.round(
            (availability.slots.filter((slot) => slot.status === 'BOOKED').length /
              availability.slots.length) *
              100
          )}
          % Booked ({availability.slots.filter((slot) => slot.status === 'BOOKED').length}/{' '}
          {availability.slots.length} slots)
        </p>
      </div>
    </div>
  );
}
