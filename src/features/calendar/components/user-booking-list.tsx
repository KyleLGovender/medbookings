'use client';

import React, { useState } from 'react';

import { format } from 'date-fns';
import {
  Calendar,
  Clock,
  CreditCard,
  Edit3,
  Mail,
  MapPin,
  Phone,
  RefreshCcw,
  User,
  X
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserAvatar } from '@/components/user-avatar';
import { type RouterOutputs } from '@/utils/api';

type UserBooking = RouterOutputs['calendar']['getUserBookings'][number];

interface UserBookingListProps {
  bookings: UserBooking[];
  isLoading: boolean;
  onEditBooking: (booking: UserBooking) => void;
  onCancelBooking: (booking: UserBooking) => void;
  onRescheduleBooking: (booking: UserBooking) => void;
}

export function UserBookingList({
  bookings,
  isLoading,
  onEditBooking,
  onCancelBooking,
  onRescheduleBooking,
}: UserBookingListProps) {
  const [activeTab, setActiveTab] = useState('upcoming');

  const getStatusColor = (status: UserBooking['status']) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-700 border-red-200';
      case 'COMPLETED':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'NO_SHOW':
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: UserBooking['status']) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmed';
      case 'PENDING':
        return 'Pending';
      case 'CANCELLED':
        return 'Cancelled';
      case 'COMPLETED':
        return 'Completed';
      case 'NO_SHOW':
        return 'No Show';
      default:
        return status;
    }
  };

  const filterBookings = (status: string) => {
    const now = new Date();
    // Filter out bookings without slots as they are incomplete
    const validBookings = bookings.filter((booking) => booking.slot);

    switch (status) {
      case 'upcoming':
        return validBookings.filter(
          (booking) =>
            booking.slot!.startTime > now &&
            booking.status !== 'CANCELLED' &&
            booking.status !== 'NO_SHOW'
        );
      case 'past':
        return validBookings.filter(
          (booking) =>
            booking.slot!.startTime <= now ||
            booking.status === 'COMPLETED' ||
            booking.status === 'NO_SHOW'
        );
      case 'cancelled':
        return validBookings.filter((booking) => booking.status === 'CANCELLED');
      default:
        return validBookings;
    }
  };

  const formatDuration = (startTime: Date, endTime: Date): string => {
    const minutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  };

  const canEditBooking = (booking: UserBooking): boolean => {
    if (!booking.slot) return false;
    const now = new Date();
    const bookingTime = new Date(booking.slot.startTime);
    const timeDiff = bookingTime.getTime() - now.getTime();
    const hoursUntilBooking = timeDiff / (1000 * 60 * 60);

    return (
      booking.status === 'CONFIRMED' &&
      hoursUntilBooking > 24 // Can only edit if more than 24 hours away
    );
  };

  const canCancelBooking = (booking: UserBooking): boolean => {
    if (!booking.slot) return false;
    const now = new Date();
    const bookingTime = new Date(booking.slot.startTime);
    const timeDiff = bookingTime.getTime() - now.getTime();
    const hoursUntilBooking = timeDiff / (1000 * 60 * 60);

    return (
      (booking.status === 'CONFIRMED' || booking.status === 'PENDING') &&
      hoursUntilBooking > 2 // Can cancel if more than 2 hours away
    );
  };

  const canRescheduleBooking = (booking: UserBooking): boolean => {
    return canEditBooking(booking); // Same rules as editing for now
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-muted" />
                  <div className="h-4 w-1/2 rounded bg-muted" />
                  <div className="h-4 w-1/4 rounded bg-muted" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
          <p className="text-muted-foreground text-center">
            You haven't made any bookings yet. Start by browsing available providers.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upcoming">
            Upcoming ({filterBookings('upcoming').length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({filterBookings('past').length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({filterBookings('cancelled').length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({bookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {filterBookings(activeTab).map((booking) => {
            // Early return if booking has no slot (should not happen after filtering)
            if (!booking.slot) return null;

            return (
              <Card key={booking.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        name={booking.slot.availability.provider.user.name || 'Provider'}
                        image={booking.slot.availability.provider.user.image}
                        className="h-10 w-10"
                      />
                      <div>
                        <CardTitle className="text-lg">
                          {booking.slot.availability.provider.user.name || 'Provider'}
                        </CardTitle>
                        {booking.slot.service && (
                          <p className="text-sm text-muted-foreground">
                            {booking.slot.service.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge className={getStatusColor(booking.status)}>
                      {getStatusText(booking.status)}
                    </Badge>
                  </div>
                </CardHeader>

              <CardContent className="space-y-4">
                {/* Booking Details */}
                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(booking.slot.startTime, 'EEEE, MMMM d, yyyy')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(booking.slot.startTime, 'h:mm a')} -{' '}
                      {format(booking.slot.endTime, 'h:mm a')}
                      <span className="ml-1 text-muted-foreground">
                        ({formatDuration(booking.slot.startTime, booking.slot.endTime)})
                      </span>
                    </span>
                  </div>


                  {booking.slot.serviceConfig?.price && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">${booking.slot.serviceConfig.price.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Client Information */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Booking Information</h4>
                  <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    {booking.guestName && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.guestName}</span>
                      </div>
                    )}
                    {booking.guestEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.guestEmail}</span>
                      </div>
                    )}
                    {booking.guestPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.guestPhone}</span>
                      </div>
                    )}
                  </div>
                  {booking.notes && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">
                        <strong>Notes:</strong> {booking.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {(canEditBooking(booking) || canCancelBooking(booking) || canRescheduleBooking(booking)) && (
                  <>
                    <Separator />
                    <div className="flex flex-wrap gap-2">
                      {canEditBooking(booking) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditBooking(booking)}
                          className="flex items-center gap-2"
                        >
                          <Edit3 className="h-4 w-4" />
                          Edit Details
                        </Button>
                      )}
                      {canRescheduleBooking(booking) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRescheduleBooking(booking)}
                          className="flex items-center gap-2"
                        >
                          <RefreshCcw className="h-4 w-4" />
                          Reschedule
                        </Button>
                      )}
                      {canCancelBooking(booking) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCancelBooking(booking)}
                          className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}