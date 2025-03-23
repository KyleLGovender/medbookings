'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { SlotStatusSchema } from '@prisma/zod';
import { format } from 'date-fns';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, type: 'availability' | 'booking') => {
    setDeletingId(id);

    try {
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
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center text-xs font-semibold text-gray-900 sm:text-lg">
                Date
              </TableHead>
              <TableHead className="text-center text-xs font-semibold text-gray-900 sm:text-lg">
                Period
              </TableHead>
              <TableHead className="text-center text-xs font-semibold text-gray-900 sm:text-lg">
                % Booked
              </TableHead>
              <TableHead className="text-center text-xs font-semibold text-gray-900 sm:text-lg">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {availabilityData
              .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
              .map((availability) => (
                <TableRow key={availability.id}>
                  <TableCell className="text-center text-xs sm:text-base">
                    {format(new Date(availability.startTime), 'EEE, MMM dd')}
                  </TableCell>
                  <TableCell className="text-center text-xs sm:text-base">
                    {format(new Date(availability.startTime), 'HH:mm')} -{' '}
                    {format(new Date(availability.endTime), 'HH:mm')}
                  </TableCell>
                  <TableCell className="text-center text-xs sm:text-base">
                    {Math.round(
                      (availability.slots.filter((slot) => slot.status === 'BOOKED').length /
                        availability.slots.length) *
                        100
                    )}
                    %
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs sm:text-sm"
                        onClick={() => onView(availability)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs sm:text-sm"
                        onClick={() => onEdit(availability)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="text-xs sm:text-sm"
                        disabled={deletingId === availability.id}
                        onClick={() => handleDelete(availability.id, 'availability')}
                      >
                        {deletingId === availability.id ? (
                          <>
                            <Spinner className="mr-2 h-3 w-3" />
                          </>
                        ) : (
                          'Delete'
                        )}
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
