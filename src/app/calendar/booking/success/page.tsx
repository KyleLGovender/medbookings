import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Booking Successful',
  description: 'Your booking has been successfully submitted',
};

interface BookingSuccessPageProps {
  searchParams: {
    bookingId?: string;
  };
}

export default async function BookingSuccessPage({ searchParams }: BookingSuccessPageProps) {
  const bookingId = searchParams.bookingId;

  // If no booking ID is provided, show a generic success message
  if (!bookingId) {
    return renderGenericSuccess();
  }

  // Fetch booking details from the database
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: true,
      serviceProvider: true,
    },
  });

  // If booking not found, show 404
  if (!booking) {
    return notFound();
  }

  // Format date and time for display
  const bookingDate = new Date(booking.startTime).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const startTime = new Date(booking.startTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const endTime = new Date(booking.endTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="container mx-auto flex max-w-md flex-col items-center justify-center py-12">
      <Card className="w-full">
        <CardHeader className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Booking Successful!</h1>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p>
                  The service provider will review your booking request and confirm it shortly. You
                  can check the status of your booking in your dashboard.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-2 font-semibold">Booking Reference</h2>
            <p className="font-mono text-sm">{booking.id}</p>
          </div>

          <div>
            <h2 className="mb-2 font-semibold">Booking Details</h2>
            <div className="rounded-md border p-4 text-sm">
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Service:</span>
                  <span className="font-medium">{booking.service.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Provider:</span>
                  <span className="font-medium">{booking.serviceProvider.name}</span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between">
                  <span className="text-gray-500">Date:</span>
                  <span className="font-medium">{bookingDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time:</span>
                  <span className="font-medium">
                    {startTime} - {endTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Duration:</span>
                  <span className="font-medium">{booking.duration} minutes</span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between">
                  <span className="text-gray-500">Type:</span>
                  <span className="font-medium">
                    {booking.isOnline
                      ? 'Online'
                      : booking.isInPerson
                        ? 'In Person'
                        : 'Not specified'}
                  </span>
                </div>
                {booking.isInPerson && booking.location && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Location:</span>
                    <span className="font-medium">{booking.location}</span>
                  </div>
                )}
                <Separator className="my-1" />
                <div className="flex justify-between">
                  <span className="text-gray-500">Price:</span>
                  <span className="font-medium">${Number(booking.price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className="font-medium capitalize">{booking.status.toLowerCase()}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center space-x-4">
          <Button asChild variant="outline">
            <Link href="/calendar/service-provider/bookings">View My Bookings</Link>
          </Button>
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Fallback for when no booking ID is provided
function renderGenericSuccess() {
  return (
    <div className="container mx-auto flex max-w-md flex-col items-center justify-center py-12">
      <Card className="w-full">
        <CardHeader className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Booking Successful!</h1>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4 text-gray-600">
            Your booking request has been successfully submitted.
          </p>
          <p className="text-gray-600">
            You will receive a confirmation notification shortly with all the details of your
            appointment.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center space-x-4">
          <Button asChild variant="outline">
            <Link href="/calendar/service-provider/bookings">View My Bookings</Link>
          </Button>
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
