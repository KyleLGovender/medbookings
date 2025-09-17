import { BookingFormData } from '@/features/calendar/components/booking-slot-modal';
import { api } from '@/utils/api';

interface UseCreateBookingOptions {
  onSuccess?: (data: any, variables: BookingFormData) => void;
  onError?: (error: Error) => void;
  providerId?: string;
}

export function useCreateBooking(options?: UseCreateBookingOptions) {
  const utils = api.useUtils();

  return api.calendar.createPublicBooking.useMutation({
    onSuccess: async (data, variables) => {
      // Invalidate and refetch related queries to refresh the data
      // This will update the slot availability immediately across all components

      try {
        // Invalidate provider availability if we know the provider ID
        if (options?.providerId) {
          await utils.calendar.getByProviderId.invalidate({
            providerId: options.providerId,
          });

          // Also invalidate any provider search results
          await utils.calendar.searchProvidersByLocation.invalidate();
        }

        // Invalidate general availability queries
        await utils.calendar.getById.invalidate();

        console.log('Booking created successfully:', {
          bookingId: data.booking?.id,
          bookingReference: data.booking?.id?.substring(0, 8).toUpperCase(),
          guestName: data.booking?.guestName,
          providerName: data.booking?.slot?.availability?.provider?.user?.name,
          startTime: data.booking?.slot?.startTime,
        });

        // Call user-provided success handler
        options?.onSuccess?.(data, variables);
      } catch (error) {
        console.error('Error invalidating queries after successful booking:', error);
        // Still call success handler even if query invalidation fails
        options?.onSuccess?.(data, variables);
      }
    },
    onError: (error, variables) => {
      console.error('Booking creation failed:', {
        error: error.message,
        slotId: variables.slotId,
        guestName: variables.clientName,
      });

      options?.onError?.(new Error(error.message));
    },
    // Add optimistic updates for better UX
    onMutate: async (variables) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      if (options?.providerId) {
        await utils.calendar.getByProviderId.cancel({
          providerId: options.providerId,
        });
      }

      // Optionally, you could implement optimistic updates here
      // For now, we'll rely on the success handler to update the cache
    },
  });
}
