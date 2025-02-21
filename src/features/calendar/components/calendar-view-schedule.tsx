import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
import { AvailabilityDialog } from '@/features/calendar/components/availability-dialog';
import { deleteAvailability, deleteBooking } from '@/features/calendar/lib/actions';
import { AvailabilityView, BookingView } from '@/features/calendar/lib/types';
import { useToast } from '@/hooks/use-toast';

interface CalendarViewScheduleProps {
  availabilityData: AvailabilityView[];
  serviceProviderId: string;
  onRefresh: () => Promise<void>;
}

type SlotStatus = z.infer<typeof SlotStatusSchema>;

export function CalendarViewSchedule({
  availabilityData,
  serviceProviderId,
  onRefresh,
}: CalendarViewScheduleProps) {
  const [selectedAvailability, setSelectedAvailability] = useState<AvailabilityView | undefined>();
  const [selectedBooking, setSelectedBooking] = useState<BookingView | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleEdit = (data: AvailabilityView | BookingView, type: 'availability' | 'booking') => {
    if (type === 'availability') {
      setSelectedAvailability(data as AvailabilityView);
    }
    if (type === 'booking') {
      setSelectedBooking(data as BookingView);
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
    <>
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Period</TableHead>
                <TableHead className="text-center">% Booked</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {availabilityData.map((availability) => (
                <TableRow key={availability.id}>
                  <TableCell>{format(new Date(availability.startTime), 'EEE, MMM dd')}</TableCell>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(availability, 'availability')}
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
