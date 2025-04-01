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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { declineBooking } from '@/features/calendar/lib/actions';

export function DeclineBookingForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [reason, setReason] = useState('');

  async function handleDecline() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await declineBooking(bookingId, reason);

      if (response.error) {
        setError(response.error);
      } else {
        setSuccess(true);
        // Redirect after a short delay
        setTimeout(() => {
          router.push(`/calendar/booking/view/${bookingId}`);
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
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle>Decline Booking</CardTitle>
        <CardDescription>Are you sure you want to decline this booking?</CardDescription>
      </CardHeader>

      <CardContent>
        {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-700">
            Booking declined successfully! Redirecting...
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a reason for declining"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isLoading || success}
            />
          </div>

          <p className="text-sm text-gray-500">
            Declining this booking will notify the client and free up this time slot.
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => router.push('/calendar/bookings')}
          disabled={isLoading}
        >
          Cancel
        </Button>

        <Button variant="destructive" onClick={handleDecline} disabled={isLoading || success}>
          {isLoading ? 'Declining...' : 'Decline Booking'}
        </Button>
      </CardFooter>
    </Card>
  );
}
