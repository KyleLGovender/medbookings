import { api } from '@/utils/api';
import { BookingFormData } from '@/features/calendar/components/booking-slot-modal';

interface UseCreateBookingOptions {
  onSuccess?: (data: any, variables: BookingFormData) => void;
  onError?: (error: Error) => void;
}

export function useCreateBooking(options?: UseCreateBookingOptions) {
  return api.calendar.createPublicBooking.useMutation({
    onSuccess: (data, variables) => {
      // Invalidate related queries to refresh the data
      // This will update the slot availability immediately
      
      console.log('Booking created successfully:', data);
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError as any,
  });
}