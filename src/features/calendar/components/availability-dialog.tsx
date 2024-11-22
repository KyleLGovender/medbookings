'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Schedule } from '../lib/types';
import { AvailabilityForm } from './availability-form';

interface AvailabilityDialogProps {
  availability?: Schedule;
  mode: 'create' | 'edit';
  onOpenChange: (open: boolean) => void;
  open: boolean;
  serviceProviderId: string;
}

export function AvailabilityDialog({
  availability,
  mode,
  onOpenChange,
  open,
  serviceProviderId,
}: AvailabilityDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add Availability' : 'Edit Availability'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Set your available time slots for consultations.'
              : 'Modify your existing availability.'}
          </DialogDescription>
        </DialogHeader>
        <AvailabilityForm
          serviceProviderId={serviceProviderId}
          availability={availability}
          mode={mode}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
