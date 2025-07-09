'use client';

import { useState } from 'react';

import {
  AlertCircle,
  Calendar,
  Clock,
  Copy,
  DollarSign,
  Edit2,
  Mail,
  MapPin,
  Trash2,
  User,
} from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  AvailabilityStatus,
  CalendarEvent,
  SlotStatus,
} from '@/features/calendar/availability/types/types';

interface CalendarEventDialogProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (event: CalendarEvent) => void;
  onDuplicate?: (event: CalendarEvent) => void;
  onConfirmBooking?: (event: CalendarEvent) => void;
  onCancelBooking?: (event: CalendarEvent) => void;
}

export function CalendarEventDialog({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onConfirmBooking,
  onCancelBooking,
}: CalendarEventDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!event) return null;

  const getStatusBadge = () => {
    switch (event.type) {
      case 'availability':
        switch (event.status) {
          case AvailabilityStatus.ACCEPTED:
            return <Badge className="bg-green-100 text-green-800">Active</Badge>;
          case AvailabilityStatus.PENDING:
            return <Badge className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>;
          case AvailabilityStatus.CANCELLED:
            return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
          default:
            return <Badge variant="secondary">{event.status}</Badge>;
        }
      case 'booking':
        switch (event.status) {
          case SlotStatus.BOOKED:
            return <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>;
          case SlotStatus.AVAILABLE:
            return <Badge className="bg-green-100 text-green-800">Available</Badge>;
          case SlotStatus.BLOCKED:
            return <Badge className="bg-red-100 text-red-800">Blocked</Badge>;
          default:
            return <Badge variant="secondary">{event.status}</Badge>;
        }
      case 'blocked':
        return <Badge className="bg-gray-100 text-gray-800">Blocked Time</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getDuration = () => {
    const diffMs = event.endTime.getTime() - event.startTime.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;

    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
    }
    return `${minutes}m`;
  };

  const handleConfirmBooking = async () => {
    setIsConfirming(true);
    try {
      await onConfirmBooking?.(event);
      onClose();
    } catch (error) {
      console.error('Error confirming booking:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="truncate">{event.title}</span>
            {getStatusBadge()}
          </DialogTitle>
          <DialogDescription>
            Event details and actions for{' '}
            {event.type === 'availability'
              ? 'availability'
              : event.type === 'booking'
                ? 'booking'
                : 'blocked time'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {event.startTime.toLocaleDateString([], {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                {event.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                <span className="ml-2 text-muted-foreground">({getDuration()})</span>
              </span>
            </div>

            {event.location && (
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  {event.location.isOnline ? (
                    <Badge variant="secondary" className="text-xs">
                      Online
                    </Badge>
                  ) : (
                    event.location.name
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Service Information */}
          {event.service && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Service Details</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span>{event.service.name}</span>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-3 w-3" />
                      <span>${event.service.price}</span>
                    </div>
                  </div>
                  <div className="text-muted-foreground">
                    Duration: {event.service.duration} minutes
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Customer Information */}
          {event.customer && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Customer Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{event.customer.name}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{event.customer.email}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Availability Information */}
          {event.type === 'availability' && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Availability Details</h4>
                <div className="space-y-1 text-sm">
                  {event.schedulingRule && (
                    <div>
                      <span className="text-muted-foreground">Scheduling Rule: </span>
                      <Badge variant="outline" className="text-xs">
                        {event.schedulingRule.replace('_', ' ')}
                      </Badge>
                    </div>
                  )}
                  {event.isRecurring && (
                    <div className="flex items-center space-x-1">
                      <span className="text-muted-foreground">Recurring Series</span>
                      <Badge variant="outline" className="text-xs">
                        Series
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {event.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Notes</h4>
                <p className="text-sm text-muted-foreground">{event.notes}</p>
              </div>
            </>
          )}

          {/* Confirmation Required Alert */}
          {event.status === SlotStatus.BOOKED && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This booking requires confirmation from the provider.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <Separator />
          <div className="flex flex-wrap gap-2">
            {/* Booking Actions */}
            {event.type === 'booking' &&
              event.status === SlotStatus.AVAILABLE &&
              onConfirmBooking && (
                <Button size="sm" onClick={handleConfirmBooking} disabled={isConfirming}>
                  {isConfirming ? 'Confirming...' : 'Confirm Booking'}
                </Button>
              )}

            {event.type === 'booking' && event.status === SlotStatus.BOOKED && onCancelBooking && (
              <Button variant="outline" size="sm" onClick={() => onCancelBooking(event)}>
                Cancel Booking
              </Button>
            )}

            {/* Edit Actions */}
            {onEdit && (event.type === 'availability' || event.type === 'blocked') && (
              <Button variant="outline" size="sm" onClick={() => onEdit(event)}>
                <Edit2 className="mr-1 h-3 w-3" />
                Edit
              </Button>
            )}

            {/* Duplicate Actions */}
            {onDuplicate && event.type === 'availability' && (
              <Button variant="outline" size="sm" onClick={() => onDuplicate(event)}>
                <Copy className="mr-1 h-3 w-3" />
                Duplicate
              </Button>
            )}

            {/* Delete Actions */}
            {onDelete && (event.type === 'availability' || event.type === 'blocked') && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => onDelete(event)}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
