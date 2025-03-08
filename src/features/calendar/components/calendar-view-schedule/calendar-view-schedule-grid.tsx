'use client';

import { useRouter } from 'next/navigation';

import { SlotStatusSchema } from '@prisma/zod';
import { format } from 'date-fns';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { deleteAvailability, deleteBooking } from '@/features/calendar/lib/actions';
import { AvailabilityView } from '@/features/calendar/lib/types';
import { useToast } from '@/hooks/use-toast';

interface CalendarViewScheduleGridProps {
  availabilityData: AvailabilityView[];
  serviceProviderId: string;
  onRefresh: () => Promise<void>;
  onView: (availability: AvailabilityView) => void;
  onEdit: (availability: AvailabilityView) => void;
}

type SlotStatus = z.infer<typeof SlotStatusSchema>;

export function CalendarViewScheduleGrid({
  availabilityData,
  serviceProviderId,
  onRefresh,
  onView,
  onEdit,
}: CalendarViewScheduleGridProps) {
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async (id: string, type: 'availability' | 'booking') => {
    const baseId = id.split('-')[0];

    const response =
      type === 'availability'
        ? await deleteAvailability(baseId, serviceProviderId)
        : await deleteBooking(baseId);

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
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center text-lg font-semibold text-gray-900">
                Date
              </TableHead>
              <TableHead className="text-center text-lg font-semibold text-gray-900">
                Period
              </TableHead>
              <TableHead className="text-center text-lg font-semibold text-gray-900">
                % Booked
              </TableHead>
              <TableHead className="text-center text-lg font-semibold text-gray-900">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {availabilityData
              .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
              .map((availability) => (
                <TableRow key={availability.id}>
                  <TableCell className="text-center">
                    {format(new Date(availability.startTime), 'EEE, MMM dd')}
                  </TableCell>
                  <TableCell className="text-center">
                    {format(new Date(availability.startTime), 'HH:mm')} -{' '}
                    {format(new Date(availability.endTime), 'HH:mm')}
                  </TableCell>
                  <TableCell className="text-center">
                    {Math.round(
                      (availability.slots.filter((slot) => slot.status === 'BOOKED').length /
                        availability.slots.length) *
                        100
                    )}
                    %
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => onView(availability)}>
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onEdit(availability)}>
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
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
