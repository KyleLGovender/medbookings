import { api } from '@/utils/api';
import { BookingFormData } from '@/features/calendar/components/booking-slot-modal';

export function useCreateBooking() {
  return api.calendar.createPublicBooking.useMutation({
    onSuccess: (data) => {
      console.log('Booking created successfully:', data);
    },
    onError: (error) => {
      console.error('Failed to create booking:', error);
    },
  });
}