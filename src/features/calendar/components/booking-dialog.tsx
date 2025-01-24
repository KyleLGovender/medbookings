'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Availability } from '../lib/types';
import { BookingForm } from './booking-form';

interface BookingDialogProps {
  serviceProviderId?: string;
  userId?: string;
  availability?: Availability;
  mode: 'create' | 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => Promise<void>;
}

export function BookingDialog({
  serviceProviderId,
  userId,
  availability,
  mode,
  open,
  onOpenChange,
  onRefresh,
}: BookingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
          <DialogDescription>
            Fill in the details below to schedule your appointment.
          </DialogDescription>
        </DialogHeader>
        <BookingForm
          serviceProviderId={serviceProviderId}
          userId={userId}
          availability={availability}
          mode={mode}
          onClose={() => onOpenChange(false)}
          onRefresh={onRefresh}
        />
      </DialogContent>
    </Dialog>
  );
}
