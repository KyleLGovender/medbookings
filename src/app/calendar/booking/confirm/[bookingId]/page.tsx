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

export default function ConfirmBookingPage({ params }: { params: { bookingId: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleConfirm() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await confirmBooking(params.bookingId);

      if (response.error) {
        setError(response.error);
      } else {
        setSuccess(true);
        // Redirect after a short delay
        setTimeout(() => {
          router.push('/dashboard/bookings');
        }, 2000);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Confirm Booking</CardTitle>
          <CardDescription>Are you sure you want to confirm this booking?</CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}

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
            onClick={() => router.push('/dashboard/bookings')}
            disabled={isLoading}
          >
            Cancel
          </Button>

          <Button onClick={handleConfirm} disabled={isLoading || success}>
            {isLoading ? 'Confirming...' : 'Confirm Booking'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
