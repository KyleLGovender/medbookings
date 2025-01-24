import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useState } from 'react';

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
import { Availability, Booking, Schedule } from '@/features/calendar/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CalendarViewScheduleProps {
  scheduleData: Schedule[];
  serviceProviderId: string;
  onRefresh: () => Promise<void>;
}

export function CalendarViewSchedule({
  scheduleData,
  serviceProviderId,
  onRefresh,
}: CalendarViewScheduleProps) {
  const [selectedAvailability, setSelectedAvailability] = useState<Availability | undefined>();
  const [selectedBooking, setSelectedBooking] = useState<Booking | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleEdit = (schedule: Schedule | Booking, type: 'availability' | 'booking') => {
    if (type === 'availability') {
      setSelectedAvailability(schedule as Availability);
    }
    if (type === 'booking') {
      setSelectedBooking(schedule as Booking);
    }

    setIsDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedAvailability(undefined);
      setSelectedBooking(undefined);
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

    toast({
      title: 'Success',
      description: `${type === 'availability' ? 'Availability' : 'Booking'} deleted successfully`,
    });

    router.refresh();
    await onRefresh();
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
              {scheduleData
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .map((schedule) => (
                  <React.Fragment key={schedule.id}>
                    {/* Availability Row */}
                    <TableRow className="bg-slate-50">
                      <TableCell>
                        {schedule.isRecurring ? 'Availability Series' : 'Availability'}
                      </TableCell>
                      <TableCell>{format(new Date(schedule.startTime), 'EEE, MMM dd')}</TableCell>
                      <TableCell>
                        {format(new Date(schedule.startTime), 'HH:mm')} -{' '}
                        {format(new Date(schedule.endTime), 'HH:mm')}
                      </TableCell>
                      <TableCell>{schedule.duration} mins</TableCell>
                      <TableCell className="hidden md:table-cell">-</TableCell>
                      <TableCell className="hidden md:table-cell">-</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                          Available
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-right md:table-cell">
                        R{Number(schedule.price).toFixed(2)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(schedule, 'availability')}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(schedule.id, 'availability')}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Nested Booking Rows */}
                    {(schedule.bookings || [])
                      .sort(
                        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
                      )
                      .map((booking) => (
                        <TableRow key={booking.id} className="bg-white">
                          <TableCell className="pl-8">Booking</TableCell>
                          <TableCell>
                            {format(new Date(booking.startTime), 'EEE, MMM dd')}
                          </TableCell>
                          <TableCell>
                            {format(new Date(booking.startTime), 'HH:mm')} -{' '}
                            {format(new Date(booking.endTime), 'HH:mm')}
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
                                onClick={() => handleEdit(booking, 'booking')}
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
        availability={selectedAvailability}
        serviceProviderId={serviceProviderId}
        mode="edit"
        open={isDialogOpen}
        onOpenChange={handleDialogChange}
        onRefresh={onRefresh}
      />
    </>
  );
}
