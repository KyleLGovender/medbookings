import { logger } from '@/lib/logger';
import { api } from '@/utils/api';

interface UseUserBookingsOptions {
  status?: 'upcoming' | 'past' | 'cancelled' | 'all';
  limit?: number;
  offset?: number;
}

export function useUserBookings(options?: UseUserBookingsOptions) {
  return api.calendar.getUserBookings.useQuery({
    status: options?.status ?? 'all',
    limit: options?.limit ?? 50,
    offset: options?.offset ?? 0,
  });
}

interface UseUpdateBookingOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: unknown) => void;
}

export function useUpdateBooking(options?: UseUpdateBookingOptions) {
  const utils = api.useUtils();

  return api.calendar.updateUserBooking.useMutation({
    onSuccess: async (data) => {
      // Invalidate user bookings to refresh the list
      await utils.calendar.getUserBookings.invalidate();

      // Also invalidate provider availability in case booking time changed
      if (data.slot?.availability?.providerId) {
        await utils.calendar.getByProviderId.invalidate({
          providerId: data.slot.availability.providerId,
        });
      }

      logger.info('Booking updated successfully', {
        bookingId: data.id,
        status: data.status,
      });

      options?.onSuccess?.(data);
    },
    onError: (error) => {
      logger.error('Booking update failed', {
        error: error.message,
      });
      options?.onError?.(new Error(error.message));
    },
  });
}

export function useCancelBooking(options?: UseUpdateBookingOptions) {
  const utils = api.useUtils();

  return api.calendar.cancelUserBooking.useMutation({
    onSuccess: async (data) => {
      // Invalidate user bookings to refresh the list
      await utils.calendar.getUserBookings.invalidate();

      // Also invalidate provider availability since slot is now available
      if (data.slot?.availability?.providerId) {
        await utils.calendar.getByProviderId.invalidate({
          providerId: data.slot.availability.providerId,
        });
      }

      logger.info('Booking cancelled successfully', {
        bookingId: data.id,
      });

      options?.onSuccess?.(data);
    },
    onError: (error) => {
      logger.error('Booking cancellation failed', {
        error: error.message,
      });
      options?.onError?.(new Error(error.message));
    },
  });
}

interface UseRescheduleBookingOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: unknown) => void;
}

export function useRescheduleBooking(options?: UseRescheduleBookingOptions) {
  const utils = api.useUtils();

  return api.calendar.rescheduleUserBooking.useMutation({
    onSuccess: async (data) => {
      // Invalidate user bookings to refresh the list
      await utils.calendar.getUserBookings.invalidate();

      // Invalidate provider availability for both old and new providers
      if (data.slot?.availability?.providerId) {
        await utils.calendar.getByProviderId.invalidate({
          providerId: data.slot.availability.providerId,
        });
      }

      logger.info('Booking rescheduled successfully', {
        bookingId: data.id,
        newStartTime: data.slot?.startTime,
      });

      options?.onSuccess?.(data);
    },
    onError: (error) => {
      logger.error('Booking reschedule failed', {
        error: error.message,
      });
      options?.onError?.(new Error(error.message));
    },
  });
}
