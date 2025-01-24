"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Booking, Schedule } from "../lib/types";
import { BookingForm } from "./booking-form";

interface BookingDialogProps {
  availability?: Schedule;
  booking?: Booking;
  serviceProviderId: string;
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => Promise<void>;
}

export function BookingDialog({
  availability,
  serviceProviderId,
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
          mode={mode}
          serviceProviderId={serviceProviderId}
          onClose={() => onOpenChange(false)}
          onRefresh={onRefresh}
          selectedDate={new Date()}
        />
      </DialogContent>
    </Dialog>
  );
}
