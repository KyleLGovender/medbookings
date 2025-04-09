'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { confirmBooking } from '@/features/calendar/lib/actions';
import { getBookingDetails } from '@/features/calendar/lib/queries';
import { sendBookingConfirmation } from '@/features/calendar/lib/server-helper';

export function ConfirmBookingForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleConfirm() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await confirmBooking(bookingId);

      if (response.error) {
        setError(response.error);
      } else {
        // Get booking details and send confirmation
        const { booking } = await getBookingDetails(bookingId);
        await sendBookingConfirmation(booking);

        setSuccess(true);
        router.push(`/calendar/booking/view/${bookingId}`);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle>Confirm Booking</CardTitle>
        <CardDescription>Are you sure you want to confirm this booking?</CardDescription>
      </CardHeader>

      <CardContent>
        {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-700">
            Booking confirmed successfully! Redirecting...
          </div>
        )}

        <p className="text-sm text-gray-500">
          Confirming this booking will notify the client and update your calendar.
        </p>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => router.push('/calendar/bookings')}
          disabled={isLoading}
        >
          Cancel
        </Button>

        <Button onClick={handleConfirm} disabled={isLoading || success}>
          {isLoading ? 'Confirming...' : 'Confirm Booking'}
        </Button>
      </CardFooter>
    </Card>
  );
}
