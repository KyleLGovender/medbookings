import { Suspense } from 'react';

import { BookingStatus } from '@prisma/client';

import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatLocalDate, formatLocalTime } from '@/lib/timezone-helper';

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

  // Sort bookings by start time (oldest first)
  const sortedBookings = [...bookings].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // After fetching bookings, you can either:
  // Option 1: Transform the data before passing to the UI
  const formattedBookings = sortedBookings.map((booking) => ({
    ...booking,
    startTime: {
      date: formatLocalDate(booking.startTime),
      time: formatLocalTime(booking.startTime),
    },
  }));

  return (
    <div className="space-y-6">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center text-xs font-semibold text-gray-900 sm:text-lg">
                Date
              </TableHead>
              <TableHead className="text-center text-xs font-semibold text-gray-900 sm:text-lg">
                Time
              </TableHead>
              <TableHead className="text-center text-xs font-semibold text-gray-900 sm:text-lg">
                Status
              </TableHead>
              <TableHead className="hidden text-center text-xs font-semibold text-gray-900 md:table-cell md:text-lg">
                {serviceProvider ? 'Client' : 'Provider'}
              </TableHead>
              <TableHead className="hidden text-center text-xs font-semibold text-gray-900 md:table-cell md:text-lg">
                Service
              </TableHead>
              <TableHead className="text-center text-xs font-semibold text-gray-900 sm:text-lg">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formattedBookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="text-center text-xs sm:text-base">
                  {booking.startTime.date}
                </TableCell>
                <TableCell className="text-center text-xs sm:text-base">
                  {booking.startTime.time}
                </TableCell>
                <TableCell className="text-center text-xs sm:text-base">
                  <div className="flex flex-col items-center space-y-2 md:flex-row md:justify-center md:space-x-2 md:space-y-0">
                    <div className="flex flex-col justify-center gap-1 pt-1 md:flex-row md:space-x-2 md:space-y-0 md:pt-0">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getStatusBgColor(booking.status)}`}
                      >
                        {booking.status}
                      </span>

                      {serviceProvider && booking.status === BookingStatus.PENDING && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-green-600 text-xs hover:bg-green-700 sm:text-sm"
                            asChild
                          >
                            <a href={`/calendar/booking/confirm/${booking.id}`}>Confirm</a>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="text-xs sm:text-sm"
                            asChild
                          >
                            <a href={`/calendar/booking/decline/${booking.id}`}>Decline</a>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden text-center text-xs md:table-cell md:text-base">
                  {serviceProvider
                    ? booking.client?.name || booking.guestName || 'Unknown'
                    : booking.serviceProvider.name}
                </TableCell>
                <TableCell className="hidden text-center text-xs md:table-cell md:text-base">
                  {booking.service.name}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center justify-center gap-1 sm:gap-2 md:flex-row">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs sm:text-sm"
                      asChild
                    >
                      <a href={`/calendar/booking/view/${booking.id}`}>View</a>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs sm:text-sm"
                      asChild
                    >
                      <a href={`/calendar/booking/edit/${booking.id}`}>Edit</a>
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full text-xs sm:text-sm"
                      asChild
                    >
                      <a href={`/calendar/booking/delete/${booking.id}`}>Delete</a>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function getStatusBgColor(status: BookingStatus) {
  switch (status) {
    case BookingStatus.CONFIRMED:
      return 'bg-green-100 text-green-800';
    case BookingStatus.PENDING:
      return 'bg-amber-100 text-amber-800';
    case BookingStatus.CANCELLED:
      return 'bg-red-100 text-red-800';
    case BookingStatus.COMPLETED:
      return 'bg-blue-100 text-blue-800';
    case BookingStatus.NO_SHOW:
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
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
    <div className="bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
          <p className="mt-2 text-sm text-gray-600">Manage your bookings and appointments</p>
        </div>

        <Suspense fallback={<BookingsListSkeleton />}>
          <BookingsList />
        </Suspense>
      </div>
    </div>
  );
}

function BookingsListSkeleton() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center text-xs font-semibold text-gray-900 sm:text-lg">
              Date
            </TableHead>
            <TableHead className="text-center text-xs font-semibold text-gray-900 sm:text-lg">
              Time
            </TableHead>
            <TableHead className="text-center text-xs font-semibold text-gray-900 sm:text-lg">
              Status
            </TableHead>
            <TableHead className="hidden text-center text-xs font-semibold text-gray-900 md:table-cell md:text-lg">
              Client/Provider
            </TableHead>
            <TableHead className="hidden text-center text-xs font-semibold text-gray-900 md:table-cell md:text-lg">
              Service
            </TableHead>
            <TableHead className="text-center text-xs font-semibold text-gray-900 sm:text-lg">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(6)].map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-6 w-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-full" />
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Skeleton className="h-6 w-full" />
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Skeleton className="h-6 w-full" />
              </TableCell>
              <TableCell>
                <div className="flex justify-center gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
