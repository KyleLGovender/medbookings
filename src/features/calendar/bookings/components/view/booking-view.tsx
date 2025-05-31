import { notFound } from 'next/navigation';

import { BookingStatus } from '@prisma/client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getBookingDetails } from '@/features/calendar/lib/queries';
import { formatLocalDate, formatLocalTime } from '@/lib/timezone-helper';

interface BookingViewProps {
  bookingId: string;
}

export async function BookingView({ bookingId }: BookingViewProps) {
  try {
    // Fetch booking details using the server action
    const { booking } = await getBookingDetails(bookingId);

    // Add appointmentType to the booking object based on isOnlineAvailable and isInPerson
    const appointmentType = booking.slot.serviceConfig.isOnlineAvailable ? 'online' : 'inperson';

    const { slot, status, guestInfo, notificationPreferences, id } = booking;

    const serviceProvider = booking.slot.serviceProvider;

    // Get status badge color
    const getStatusColor = (status: BookingStatus) => {
      switch (status) {
        case BookingStatus.CONFIRMED:
          return 'bg-green-100 text-green-800';
        case BookingStatus.PENDING:
          return 'bg-yellow-100 text-yellow-800';
        case BookingStatus.CANCELLED:
          return 'bg-red-100 text-red-800';
        case BookingStatus.COMPLETED:
          return 'bg-blue-100 text-blue-800';
        case BookingStatus.NO_SHOW:
          return 'bg-gray-100 text-gray-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-col items-start justify-between border-b border-gray-200 p-4 md:flex-row md:items-center">
          <h2 className="mb-3 text-xl font-semibold sm:mb-0">Booking Details</h2>
          <div className="mb-3 flex items-center gap-2 md:mb-0">
            Status: <Badge className={getStatusColor(status)}>{status}</Badge>
          </div>
          <div className="mb-3 flex items-center gap-2 md:mb-0">
            {status === BookingStatus.PENDING && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  className="bg-green-600 text-xs hover:bg-green-700 sm:text-sm"
                  asChild
                >
                  <a href={`/calendar/booking/confirm/${id}`}>Confirm</a>
                </Button>
                <Button variant="destructive" size="sm" className="text-xs sm:text-sm" asChild>
                  <a href={`/calendar/booking/decline/${id}`}>Decline</a>
                </Button>
              </>
            )}
          </div>
          <div className="flex w-full items-center gap-2 md:w-auto">
            <Button variant="outline" size="sm" className="text-xs sm:text-sm" asChild>
              <a href={`/calendar/booking/edit/${id}`}>Edit</a>
            </Button>
            <Button variant="destructive" size="sm" className="text-xs sm:text-sm" asChild>
              <a href={`/calendar/booking/delete/${id}`}>Delete</a>
            </Button>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-auto p-4">
          {/* Service Provider Info */}
          <div className="flex items-start space-x-4">
            <Avatar className="h-24 w-24 rounded-full">
              <AvatarImage
                src={serviceProvider.image || undefined}
                alt={serviceProvider.name}
                className="object-cover"
              />
              <AvatarFallback className="text-xl font-medium">
                {serviceProvider.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="text-lg font-medium">{serviceProvider.name}</h4>
              <p className="text-base text-gray-500">{slot.service.name}</p>
            </div>
          </div>

          {/* Appointment Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Appointment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Date</span>
                  <span className="text-sm text-gray-600">{formatLocalDate(slot.startTime)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Time</span>
                  <span className="text-sm text-gray-600">
                    {formatLocalTime(slot.startTime)}
                    {' - '}
                    {formatLocalTime(slot.endTime)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Duration</span>
                  <span className="text-sm text-gray-600">
                    {slot.serviceConfig.duration} minutes
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Price</span>
                  <span className="text-sm text-gray-600">R{slot.serviceConfig.price}</span>
                </div>
                <div className="col-span-2 flex flex-col">
                  <span className="text-sm font-medium">Appointment Type</span>
                  <span className="text-sm capitalize text-gray-600">{appointmentType}</span>
                  {appointmentType === 'inperson' && slot.serviceConfig.location && (
                    <p className="mt-1 text-sm text-gray-600">
                      Location: {slot.serviceConfig.location}
                    </p>
                  )}
                  {appointmentType === 'online' && (
                    <p className="mt-1 text-sm text-gray-600">
                      Meeting link will be sent before the appointment
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guest Information */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Guest Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Name</span>
                  <span className="text-sm text-gray-600">{guestInfo.name}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">WhatsApp</span>
                  <span className="text-sm text-gray-600">
                    {guestInfo.whatsapp || 'Not provided'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {notificationPreferences.whatsapp && (
                  <Badge variant="outline" className="bg-emerald-50">
                    WhatsApp
                  </Badge>
                )}
                {!notificationPreferences.whatsapp && (
                  <span className="text-sm text-gray-500">
                    No notification preferences selected
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching booking details:', error);
    return notFound();
  }
}
