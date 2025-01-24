'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Availability } from '../lib/types';
import { AvailabilityForm } from './availability-form';

interface AvailabilityDialogProps {
  availability?: Availability;
  mode: 'create' | 'edit';
  onOpenChange: (open: boolean) => void;
  open: boolean;
  serviceProviderId: string;
  onRefresh: () => Promise<void>;
}

export function AvailabilityDialog(props: AvailabilityDialogProps) {
  const { availability, mode, onOpenChange, open, serviceProviderId, onRefresh } = props;

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
          onClose={() => onOpenChange(false)}
          onRefresh={onRefresh}
        />
      </DialogContent>
    </Dialog>
  );
}
