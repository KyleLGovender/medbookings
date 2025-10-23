import { useCallback, useState } from 'react';

import type { AvailabilityAction, SeriesActionScope } from '@/features/calendar/types/types';
import type { RouterOutputs } from '@/utils/api';

type AvailabilityData = RouterOutputs['calendar']['searchAvailability'][number];

interface AvailabilityModalOptions {
  onEdit?: (event: AvailabilityData, scope: SeriesActionScope) => void;
  onDelete?: (event: AvailabilityData, scope: SeriesActionScope) => void;
  onAccept?: (event: AvailabilityData) => void;
  onReject?: (event: AvailabilityData, reason: string) => void;
}

export function useAvailabilityModal(options: AvailabilityModalOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AvailabilityData | null>(null);

  const openEvent = useCallback((event: AvailabilityData) => {
    setSelectedEvent(event);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setSelectedEvent(null);
  }, []);

  const handleEdit = useCallback(
    (event: AvailabilityData, scope: SeriesActionScope) => {
      options.onEdit?.(event, scope);
    },
    [options]
  );

  const handleDelete = useCallback(
    (event: AvailabilityData, scope: SeriesActionScope) => {
      options.onDelete?.(event, scope);
    },
    [options]
  );

  const handleAccept = useCallback(
    (event: AvailabilityData) => {
      options.onAccept?.(event);
    },
    [options]
  );

  const handleReject = useCallback(
    (event: AvailabilityData, reason: string) => {
      options.onReject?.(event, reason);
    },
    [options]
  );

  return {
    isOpen,
    selectedEvent,
    openEvent,
    close,
    handleEdit,
    handleDelete,
    handleAccept,
    handleReject,
  };
}
