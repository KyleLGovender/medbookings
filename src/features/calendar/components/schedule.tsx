import * as React from 'react';
import { useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AvailabilityDialog } from '@/features/calendar/components/availability-dialog';
import { deleteAvailability, deleteBooking } from '@/features/calendar/lib/actions';
import { Booking, Schedule } from '@/features/calendar/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ScheduleProps {
  scheduleData: Schedule[];
}

export function ScheduleCalendar({ scheduleData }: ScheduleProps) {
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | Booking | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleEdit = (schedule: Schedule | Booking) => {
    setSelectedSchedule(schedule);
    setIsDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedSchedule(undefined);
    }
  };

  const handleDelete = async (id: string, type: 'availability' | 'booking') => {
    const baseId = id.split('-')[0];

    const response =
      type === 'availability' ? await deleteAvailability(baseId) : await deleteBooking(baseId);

    if (response.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: response.error,
      });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['schedule'] });

    toast({
      title: 'Success',
      description: `${type === 'availability' ? 'Availability' : 'Booking'} deleted successfully`,
    });
  };

  return (
    <>
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
                <TableHead className="hidden md:table-cell">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...scheduleData]
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .map((availability) => (
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
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(availability)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(availability.id, 'availability')}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Nested Booking Rows */}
                    {[...availability.bookings]
                      .sort(
                        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
                      )
                      .map((booking) => (
                        <TableRow key={booking.id} className="bg-white">
                          <TableCell className="pl-8">Booking</TableCell>
                          <TableCell>{format(booking.startTime, 'EEE, MMM dd')}</TableCell>
                          <TableCell>
                            {format(booking.startTime, 'HH:mm')} -{' '}
                            {format(booking.endTime, 'HH:mm')}
                          </TableCell>
                          <TableCell>{booking.duration} mins</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {booking.client.name}
                          </TableCell>
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
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(booking)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(booking.id, 'booking')}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </React.Fragment>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <AvailabilityDialog
        availability={selectedSchedule}
        mode="edit"
        open={isDialogOpen}
        onOpenChange={handleDialogChange}
      />
    </>
  );
}
