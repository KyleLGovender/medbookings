'use client';

import { useRouter } from 'next/navigation';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { deleteAvailability } from '@/features/calendar/lib/actions';
import { AvailabilityView } from '@/features/calendar/lib/types';
import { useToast } from '@/hooks/use-toast';
import { formatTime } from '@/lib/helper';

interface CalendarItemAvailabilityProps {
  availability: AvailabilityView;
  gridPosition: string;
  gridColumn: number;
  serviceProviderId: string;
  onRefresh: () => Promise<void>;
  onView: (availability: AvailabilityView) => void;
  onEdit: (availability: AvailabilityView) => void;
}

export function CalendarItemAvailability({
  availability,
  gridPosition,
  gridColumn,
  serviceProviderId,
  onRefresh,
  onView,
  onEdit,
}: CalendarItemAvailabilityProps) {
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    const baseId = availability.id.split('-')[0];
    const response = await deleteAvailability(baseId, serviceProviderId);

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
      description: 'Availability deleted successfully',
    });

    router.refresh();
    await onRefresh();
  };

  return (
    <li
      style={{
        gridRow: gridPosition,
        gridColumn: `${gridColumn} / span 1`,
      }}
      className="relative mt-px flex"
    >
      <ContextMenu>
        <ContextMenuTrigger>
          <div className="group absolute inset-1 flex items-center rounded-lg bg-blue-50 p-1 text-xs leading-5 hover:bg-blue-100">
            <p className="text-left font-semibold text-blue-700">
              {formatTime(availability.startTime)}-{formatTime(availability.endTime)}
            </p>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem onSelect={() => onView(availability)}>View</ContextMenuItem>
          <ContextMenuItem onSelect={() => onEdit(availability)}>Edit</ContextMenuItem>
          <ContextMenuItem className="text-red-600" onSelect={handleDelete}>
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </li>
  );
}
