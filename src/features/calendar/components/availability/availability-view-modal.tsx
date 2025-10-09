'use client';

import { useMemo } from 'react';

import { AlertTriangle, Calendar, Clock, MapPin, Repeat, User } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useAvailabilityById } from '@/features/calendar/hooks/use-availability';
import { type RouterOutputs } from '@/utils/api';

// Use tRPC-inferred type for availability with relations - matches useAvailabilityById return type
type AvailabilityWithRelations = RouterOutputs['calendar']['getById'];

interface AvailabilityViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  availabilityId: string | null;
}

/**
 * AvailabilityViewModal - A read-only modal for viewing availability details
 *
 * This modal displays comprehensive information about an availability including:
 * - Creator and provider information
 * - Time settings and scheduling details
 * - Recurrence patterns
 * - Location information
 * - Services offered
 * - Status and metadata
 */
export function AvailabilityViewModal({
  isOpen,
  onClose,
  availabilityId,
}: AvailabilityViewModalProps) {
  // Fetch availability data
  const {
    data: availability,
    isLoading,
    error,
  } = useAvailabilityById(isOpen ? availabilityId || undefined : undefined);

  const selectedLocation = useMemo(() => {
    if (!availability?.locationId) return null;
    return availability.location || null;
  }, [availability]);

  const formatDateTime = (date: Date) => {
    return date.toLocaleString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'REJECTED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRecurrencePattern = (pattern: Record<string, unknown> | string | null) => {
    if (!pattern) return 'No recurrence';

    try {
      const parsedPattern = typeof pattern === 'string' ? JSON.parse(pattern) : pattern;

      if (parsedPattern.type === 'DAILY') {
        return `Daily, every ${parsedPattern.interval || 1} day(s)`;
      } else if (parsedPattern.type === 'WEEKLY') {
        return `Weekly, every ${parsedPattern.interval || 1} week(s)`;
      } else if (parsedPattern.type === 'MONTHLY') {
        return `Monthly, every ${parsedPattern.interval || 1} month(s)`;
      }

      return 'Custom recurrence';
    } catch {
      return 'Custom recurrence';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Availability Details
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">Loading availability...</div>
          </div>
        )}

        {!!error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load availability:{' '}
              {error instanceof Error ? error.message : 'Unknown error'}
            </AlertDescription>
          </Alert>
        )}

        {!availability && !isLoading && !error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Not Found</AlertTitle>
            <AlertDescription>
              Availability not found or you don&apos;t have permission to view it.
            </AlertDescription>
          </Alert>
        )}

        {!!availability && (
          <div className="space-y-6">
            {/* Profile Information */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-medium">
                <User className="h-4 w-4" />
                Profile Information
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Created by</label>
                  <div className="rounded-md border bg-gray-50 p-3">
                    <div className="text-sm font-medium">
                      {availability.provider?.name || 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-600">
                      {availability.providerId ? 'Provider (Self)' : 'Organization Role'}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Provider</label>
                  <div className="rounded-md border bg-gray-50 p-3">
                    <div className="text-sm font-medium">
                      {availability.provider?.name || 'Unknown Provider'}
                    </div>
                    <div className="text-xs text-gray-600">Service Provider</div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Time Settings */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-medium">
                <Clock className="h-4 w-4" />
                Time Settings
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Time</label>
                  <div className="rounded-md border bg-gray-50 p-3">
                    <div className="text-sm font-medium">
                      {formatDateTime(availability.startTime)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">End Time</label>
                  <div className="rounded-md border bg-gray-50 p-3">
                    <div className="text-sm font-medium">
                      {formatDateTime(availability.endTime)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Duration</label>
                <div className="rounded-md border bg-gray-50 p-3">
                  <div className="text-sm font-medium">
                    {Math.round(
                      (availability.endTime.getTime() - availability.startTime.getTime()) /
                        (1000 * 60)
                    )}{' '}
                    minutes
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Recurrence Settings */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-medium">
                <Repeat className="h-4 w-4" />
                Recurrence Settings
              </h3>
              <div className="space-y-2">
                <label className="text-sm font-medium">Recurrence Pattern</label>
                <div className="rounded-md border bg-gray-50 p-3">
                  <div className="flex items-center gap-2">
                    {availability.isRecurring && (
                      <Badge variant="secondary">
                        <Repeat className="mr-1 h-3 w-3" />
                        Recurring
                      </Badge>
                    )}
                    <span className="text-sm font-medium">
                      {formatRecurrencePattern(
                        availability.recurrencePattern as Record<string, unknown> | null
                      )}
                    </span>
                  </div>
                  {availability.seriesId && (
                    <div className="mt-2 text-xs text-gray-600">
                      Series ID: {availability.seriesId}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Location */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-medium">
                <MapPin className="h-4 w-4" />
                Location
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Online Availability</label>
                  <div className="rounded-md border bg-gray-50 p-3">
                    <div className="text-sm font-medium">
                      {availability.isOnlineAvailable ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Physical Location</label>
                  <div className="rounded-md border bg-gray-50 p-3">
                    {selectedLocation ? (
                      <div>
                        <div className="text-sm font-medium">{selectedLocation.name}</div>
                        {selectedLocation.formattedAddress && (
                          <div className="mt-1 text-xs text-gray-600">
                            {selectedLocation.formattedAddress}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">No physical location</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Services */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Services Offered</h3>
              <div className="space-y-2">
                {availability?.availableServices && availability.availableServices.length > 0 ? (
                  availability.availableServices.map((serviceConfig, index: number) => (
                    <div key={index} className="rounded-md border bg-gray-50 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Service {index + 1}</div>
                          <div className="text-xs text-gray-600">
                            Duration: {serviceConfig.duration} minutes
                          </div>
                        </div>
                        <div className="text-sm font-medium">R{serviceConfig.price.toString()}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-md border bg-gray-50 p-3">
                    <div className="text-sm text-gray-500">No services configured</div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Status and Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Status & Additional Information</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <div className="rounded-md border bg-gray-50 p-3">
                    <Badge className={getStatusColor(availability.status)}>
                      {availability.status.toLowerCase().replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Requires Confirmation</label>
                  <div className="rounded-md border bg-gray-50 p-3">
                    <div className="text-sm font-medium">
                      {availability.requiresConfirmation ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Scheduling Rule</label>
                <div className="rounded-md border bg-gray-50 p-3">
                  <div className="text-sm font-medium">
                    {availability.schedulingRule === 'CONTINUOUS' && 'Continuous'}
                    {availability.schedulingRule === 'ON_THE_HOUR' && 'On the Hour'}
                    {availability.schedulingRule === 'ON_THE_HALF_HOUR' && 'On the Half Hour'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Created At</label>
                  <div className="rounded-md border bg-gray-50 p-3">
                    <div className="text-sm font-medium">
                      {formatDateTime(availability.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Updated</label>
                  <div className="rounded-md border bg-gray-50 p-3">
                    <div className="text-sm font-medium">
                      {formatDateTime(availability.updatedAt)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AvailabilityViewModal;
