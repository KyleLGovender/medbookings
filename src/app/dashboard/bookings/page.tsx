import { Suspense } from 'react';

import { BookingStatus } from '@prisma/client';
import { format } from 'date-fns';

import { EmptyState } from '@/components/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function BookingsList() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <EmptyState title="Not authenticated" description="Please sign in to view your bookings" />
    );
  }

  // Check if user is a service provider
  const serviceProvider = await prisma.serviceProvider.findUnique({
    where: { userId: user.id },
  });

  const bookings = await prisma.booking.findMany({
    where: serviceProvider
      ? { serviceProviderId: serviceProvider.id } // Service provider sees their bookings
      : { clientId: user.id }, // Regular user sees bookings they made
    include: {
      service: true,
      serviceProvider: true,
      client: true,
    },
    orderBy: { startTime: 'desc' },
  });

  if (bookings.length === 0) {
    return <EmptyState title="No bookings found" description="You don't have any bookings yet" />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {bookings.map((booking) => (
          <div key={booking.id} className="rounded-lg border p-4 shadow-sm">
            <div className="flex justify-between">
              <h3 className="font-medium">{booking.service.name}</h3>
              <span className={`text-sm ${getStatusColor(booking.status)}`}>{booking.status}</span>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              <p>Date: {format(booking.startTime, 'PPP')}</p>
              <p>
                Time: {format(booking.startTime, 'p')} - {format(booking.endTime, 'p')}
              </p>
              <p>
                {serviceProvider
                  ? `Client: ${booking.client?.name || booking.guestName || 'Unknown'}`
                  : `Provider: ${booking.serviceProvider.name}`}
              </p>
            </div>

            {serviceProvider && booking.status === BookingStatus.PENDING && (
              <div className="mt-4 flex gap-2">
                <a
                  href={`/dashboard/bookings/confirm/${booking.id}`}
                  className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700"
                >
                  Confirm
                </a>
                <a
                  href={`/dashboard/bookings/decline/${booking.id}`}
                  className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
                >
                  Decline
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function getStatusColor(status: BookingStatus) {
  switch (status) {
    case BookingStatus.CONFIRMED:
      return 'text-green-600';
    case BookingStatus.PENDING:
      return 'text-amber-600';
    case BookingStatus.CANCELLED:
      return 'text-red-600';
    case BookingStatus.COMPLETED:
      return 'text-blue-600';
    case BookingStatus.NO_SHOW:
      return 'text-gray-600';
    default:
      return 'text-gray-600';
  }
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
          <p className="mt-2 text-sm text-gray-600">Manage your bookings and appointments</p>
        </div>

        <Suspense fallback={<BookingsListSkeleton />}>
          <BookingsList />
        </Suspense>
      </div>
    </main>
  );
}

function BookingsListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-lg border p-4 shadow-sm">
          <Skeleton className="h-6 w-3/4" />
          <div className="mt-2 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
