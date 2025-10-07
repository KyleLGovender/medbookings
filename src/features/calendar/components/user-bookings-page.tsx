'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Calendar } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserBookingActionModal } from '@/features/calendar/components/user-booking-action-modal';
import { UserBookingList } from '@/features/calendar/components/user-booking-list';
import {
  useCancelBooking,
  useRescheduleBooking,
  useUpdateBooking,
  useUserBookings,
} from '@/features/calendar/hooks/use-user-bookings';
import { BookingUpdateData } from '@/features/calendar/types/types';
import { useToast } from '@/hooks/use-toast';
import { type RouterOutputs } from '@/utils/api';

type UserBooking = RouterOutputs['calendar']['getUserBookings'][number];

export function UserBookingsPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State for modals
  const [selectedBooking, setSelectedBooking] = useState<UserBooking | null>(null);
  const [modalAction, setModalAction] = useState<'edit' | 'cancel' | 'reschedule' | null>(null);

  // API hooks
  const { data: bookings = [], isLoading } = useUserBookings();

  const updateBookingMutation = useUpdateBooking({
    onSuccess: () => {
      toast({
        title: 'Booking Updated',
        description: 'Your booking details have been successfully updated.',
      });
      setModalAction(null);
      setSelectedBooking(null);
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Failed to update booking. Please try again.';
      toast({
        title: 'Update Failed',
        description: message,
        variant: 'destructive',
      });
    },
  });

  const cancelBookingMutation = useCancelBooking({
    onSuccess: (data) => {
      toast({
        title: 'Booking Cancelled',
        description: 'Your booking has been cancelled.',
      });
      setModalAction(null);
      setSelectedBooking(null);
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Failed to cancel booking. Please try again.';
      toast({
        title: 'Cancellation Failed',
        description: message,
        variant: 'destructive',
      });
    },
  });

  const rescheduleBookingMutation = useRescheduleBooking({
    onSuccess: () => {
      toast({
        title: 'Rescheduling Started',
        description: 'Redirecting to select a new time slot...',
      });
      setModalAction(null);
      setSelectedBooking(null);
      // Redirect to provider calendar with booking context
      if (selectedBooking && selectedBooking.slot) {
        router.push(
          `/calendar/${selectedBooking.slot.availability.provider.id}?reschedule=${selectedBooking.id}`
        );
      }
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Failed to initiate reschedule. Please try again.';
      toast({
        title: 'Reschedule Failed',
        description: message,
        variant: 'destructive',
      });
    },
  });

  // Modal handlers
  const handleEditBooking = (booking: UserBooking) => {
    setSelectedBooking(booking);
    setModalAction('edit');
  };

  const handleCancelBooking = (booking: UserBooking) => {
    setSelectedBooking(booking);
    setModalAction('cancel');
  };

  const handleRescheduleBooking = (booking: UserBooking) => {
    setSelectedBooking(booking);
    setModalAction('reschedule');
  };

  // Modal action handlers
  const handleModalConfirm = (data?: BookingUpdateData) => {
    if (!selectedBooking) return;

    switch (modalAction) {
      case 'edit':
        if (data) {
          updateBookingMutation.mutate({
            id: selectedBooking.id,
            ...data,
          });
        }
        break;
      case 'cancel':
        cancelBookingMutation.mutate({
          id: selectedBooking.id,
        });
        break;
      case 'reschedule':
        // For reschedule, we'll handle this differently
        // For now, just close modal and redirect
        setModalAction(null);
        setSelectedBooking(null);
        if (selectedBooking && selectedBooking.slot) {
          router.push(
            `/calendar/${selectedBooking.slot.availability.provider.id}?reschedule=${selectedBooking.id}`
          );
        }
        break;
    }
  };

  const isModalLoading =
    updateBookingMutation.isPending ||
    cancelBookingMutation.isPending ||
    rescheduleBookingMutation.isPending;

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
          <p className="text-muted-foreground">
            View and manage your upcoming and past appointments
          </p>
        </div>
        <Button onClick={() => router.push('/calendar')} className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Book New Appointment
        </Button>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {isLoading || bookings.length > 0 ? (
          <UserBookingList
            bookings={bookings}
            isLoading={isLoading}
            onEditBooking={handleEditBooking}
            onCancelBooking={handleCancelBooking}
            onRescheduleBooking={handleRescheduleBooking}
          />
        ) : (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle>No Bookings Yet</CardTitle>
              <CardDescription>
                {
                  // eslint-disable-next-line quotes
                  "You haven't made any bookings yet. Start by browsing available providers and booking your first appointment."
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => router.push('/calendar')} className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Browse Providers
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Modal */}
      {modalAction && (
        <UserBookingActionModal
          booking={selectedBooking}
          open={!!modalAction}
          onOpenChange={(open) => {
            if (!open) {
              setModalAction(null);
              setSelectedBooking(null);
            }
          }}
          action={modalAction}
          isLoading={isModalLoading}
          onConfirm={handleModalConfirm}
        />
      )}
    </div>
  );
}
