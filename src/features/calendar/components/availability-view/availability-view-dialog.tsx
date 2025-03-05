'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { AvailabilityView as AvailabilityViewType } from '../../lib/types';
import { AvailabilityView } from './availability-view';

interface AvailabilityViewDialogProps {
  availability?: AvailabilityViewType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AvailabilityViewDialog({
  availability,
  open,
  onOpenChange,
}: AvailabilityViewDialogProps) {
  if (!availability) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Availability Details</DialogTitle>
          <DialogDescription>
            View details for this availability slot and its services.
          </DialogDescription>
        </DialogHeader>
        <div className="-mr-6 flex-1 overflow-y-auto pr-6">
          <AvailabilityView availability={availability} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
