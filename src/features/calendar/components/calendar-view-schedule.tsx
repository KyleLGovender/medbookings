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
import { Availability, Booking } from '@/features/calendar/lib/types';
import { useToast } from '@/hooks/use-toast';

interface CalendarViewScheduleProps {
  availabilityData: Availability[];
  serviceProviderId: string;
  onRefresh: () => Promise<void>;
}

export function CalendarViewSchedule({
  availabilityData,
  serviceProviderId,
  onRefresh,
}: CalendarViewScheduleProps) {
  const [selectedAvailability, setSelectedAvailability] = useState<Availability | undefined>();
  const [selectedBooking, setSelectedBooking] = useState<Booking | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleEdit = (availability: Availability | Booking, type: 'availability' | 'booking') => {
    if (type === 'availability') {
      setSelectedAvailability(availability as Availability);
    }
    if (type === 'booking') {
      setSelectedBooking(availability as Booking);
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
              {availabilityData
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .map((availability) => (
                  <React.Fragment key={availability.id}>
                    {/* Availability Row */}
                    <TableRow className="bg-slate-50">
                      <TableCell>
                        {format(new Date(availability.startTime), 'EEE, MMM dd')}
                      </TableCell>
                      <TableCell>
                        {format(new Date(availability.startTime), 'HH:mm')} -{' '}
                        {format(new Date(availability.endTime), 'HH:mm')}
                      </TableCell>
                      <TableCell>
                        {availability.availableServices[0]?.duration ?? '-'} mins
                      </TableCell>
                      <TableCell className="hidden md:table-cell">-</TableCell>
                      <TableCell className="hidden md:table-cell">-</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                          Available
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-right md:table-cell">
                        R{Number(availability.availableServices[0]?.price).toFixed(2)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
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
