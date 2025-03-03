'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { deleteAvailability } from '@/features/calendar/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { formatTime } from '@/lib/helper';

import { AvailabilityView } from '../lib/types';

interface CalendarViewAvailabilityProps {
  availability: AvailabilityView;
  gridPosition: string;
  gridColumn: number;
  onAvailabilityClick?: (availability: AvailabilityView) => void;
  onAvailabilityEdit?: (availability: AvailabilityView) => void;
}

export function CalendarViewAvailability({
  availability,
  gridPosition,
  gridColumn,
  onAvailabilityClick,
  onAvailabilityEdit,
  serviceProviderId,
  onRefresh,
}: CalendarViewAvailabilityProps & {
  serviceProviderId: string;
  onRefresh: () => Promise<void>;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onAvailabilityEdit?.(availability);
  };

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
          <button
            onClick={() => onAvailabilityClick?.(availability)}
            className="group absolute inset-1 flex items-center rounded-lg bg-blue-50 p-1 text-xs leading-5 hover:bg-blue-100"
          >
            <p className="text-left font-semibold text-blue-700">
              {formatTime(availability.startTime)} - {formatTime(availability.endTime)}
            </p>
          </button>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem onClick={() => onAvailabilityClick?.(availability)}>
            View Details
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onAvailabilityEdit?.(availability)}>Edit</ContextMenuItem>
          <ContextMenuItem onClick={handleDelete} className="text-red-600">
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </li>
  );
}
