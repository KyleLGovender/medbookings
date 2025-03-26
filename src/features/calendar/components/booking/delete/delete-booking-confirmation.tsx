'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AlertCircle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { deleteBooking } from '@/features/calendar/lib/actions';
import { getBookingDetails } from '@/features/calendar/lib/queries';
import { BookingView } from '@/features/calendar/lib/types';
import { useToast } from '@/hooks/use-toast';

interface DeleteBookingConfirmationProps {
  bookingId: string;
  returnUrl?: string;
}

export function DeleteBookingConfirmation({
  bookingId,
  returnUrl = '/calendar/bookings',
}: DeleteBookingConfirmationProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingView | null>(null);
  const [serviceProvider, setServiceProvider] = useState<{
    id: string;
    name: string;
    image?: string | null;
  } | null>(null);

  useEffect(() => {
    async function fetchBooking() {
      try {
        setIsLoading(true);
        setError(null);
        const result = await getBookingDetails(bookingId);
        if (!result) {
          setError('Booking not found');
          return;
        }
        setBooking(result.booking);
        setServiceProvider(result.serviceProvider);
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError('Failed to load booking details');
      } finally {
        setIsLoading(false);
      }
    }

    fetchBooking();
  }, [bookingId]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteBooking(bookingId);

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Booking deleted successfully',
      });

      router.push(returnUrl);
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete booking',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    router.push(returnUrl);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-8 w-8" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Booking not found'}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={handleCancel} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="text-xl font-semibold">Delete Booking with {serviceProvider?.name}</h2>
      <div className="mt-4 space-y-4">
        <div>
          <p className="text-sm text-gray-500">Service</p>
          <p className="font-medium">{booking.slot.service.name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Date & Time</p>
          <p className="font-medium">
            {new Date(booking.slot.startTime).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <p className="font-medium">
            {new Date(booking.slot.startTime).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
            {' - '}
            {new Date(booking.slot.endTime).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Guest</p>
          <p className="font-medium">{booking.guestInfo.name}</p>
          <p className="font-medium">{booking.guestInfo.email}</p>
          <p className="font-medium">{booking.guestInfo.phone}</p>
          <p className="font-medium">{booking.guestInfo.whatsapp}</p>
        </div>
      </div>
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>This action cannot be undone.</AlertDescription>
      </Alert>
      <div className="mt-6 flex justify-end space-x-4">
        <Button variant="outline" onClick={handleCancel} disabled={isDeleting}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Deleting...
            </>
          ) : (
            'Delete Booking'
          )}
        </Button>
      </div>
    </div>
  );
}
