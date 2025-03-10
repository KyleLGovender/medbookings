'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { AvailabilitySlot } from '../../lib/types';
import { BookingForm } from './booking-form';

interface BookingFormDialogProps {
  slot: AvailabilitySlot;
  serviceProvider: {
    id: string;
    name: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

export function BookingFormDialog({
  slot,
  serviceProvider,
  isOpen,
  onClose,
  onRefresh,
}: BookingFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-left">Book Appointment</DialogTitle>
          <DialogDescription className="text-left">
            Fill in the details below to book your appointment.
          </DialogDescription>
        </DialogHeader>
        <BookingForm
          slot={slot}
          serviceProvider={serviceProvider}
          onClose={onClose}
          onRefresh={onRefresh}
        />
      </DialogContent>
    </Dialog>
  );
}
