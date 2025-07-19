'use client';

import { useState } from 'react';

import { AlertTriangle, Calendar, Clock, Trash2, Users } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDeleteAvailability } from '@/features/calendar/hooks/use-availability';
import { AvailabilityWithRelations } from '@/features/calendar/types/types';
import { useToast } from '@/hooks/use-toast';

interface AvailabilityDeleteDialogProps {
  availability: AvailabilityWithRelations;
  onSuccess?: () => void;
  children?: React.ReactNode;
}

export function AvailabilityDeleteDialog({
  availability,
  onSuccess,
  children,
}: AvailabilityDeleteDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const deleteMutation = useDeleteAvailability({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Availability deleted successfully',
      });
      setIsOpen(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Calculate booking statistics
  const totalSlots = availability.calculatedSlots?.length || 0;
  const bookedSlots = availability.calculatedSlots?.filter((slot) => slot.booking)?.length || 0;
  const hasBookings = bookedSlots > 0;

  // Check if this is a recurring series
  const isRecurring = availability.isRecurring;
  const seriesCount = isRecurring
    ? availability.calculatedSlots?.reduce((acc, slot) => {
        // In a real implementation, we'd count unique series occurrences
        return acc;
      }, 0) || 1
    : 1;

  const handleDelete = async () => {
    if (hasBookings) {
      toast({
        title: 'Cannot Delete',
        description:
          'Cannot delete availability with existing bookings. Cancel the bookings first.',
        variant: 'destructive',
      });
      return;
    }

    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync({ id: availability.id });
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {children || (
          <Button variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete Availability
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Are you sure you want to delete this availability? This action cannot be undone.
              </p>

              {/* Availability Details */}
              <div className="space-y-3 rounded-lg bg-muted p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">
                    {availability.startTime.toLocaleDateString()}{' '}
                    {availability.startTime.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {' - '}
                    {availability.endTime.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {isRecurring && (
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary" className="text-xs">
                      Recurring Series
                    </Badge>
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{totalSlots} slots</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{bookedSlots} booked</span>
                  </div>
                </div>
              </div>

              {/* Warning for existing bookings */}
              {hasBookings && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Cannot Delete</AlertTitle>
                  <AlertDescription>
                    This availability has {bookedSlots} existing booking
                    {bookedSlots !== 1 ? 's' : ''}. You must cancel all bookings before deleting the
                    availability.
                  </AlertDescription>
                </Alert>
              )}

              {/* Warning for recurring series */}
              {isRecurring && !hasBookings && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Recurring Series</AlertTitle>
                  <AlertDescription>
                    This will delete the entire recurring series. All future occurrences will be
                    removed.
                  </AlertDescription>
                </Alert>
              )}

              {/* Services that will be affected */}
              {availability.availableServices && availability.availableServices.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Affected Services:</p>
                  <div className="space-y-1">
                    {availability.availableServices.map((serviceConfig, index) => (
                      <div
                        key={index}
                        className="rounded bg-muted/50 p-2 text-xs text-muted-foreground"
                      >
                        {serviceConfig.service?.name || 'Unknown Service'}
                        {' - '}
                        {serviceConfig.duration} min
                        {serviceConfig.serviceProvider?.showPrice && serviceConfig.price && (
                          <span> - ${serviceConfig.price.toString()}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={hasBookings || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete Availability'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface QuickDeleteButtonProps {
  availability: AvailabilityWithRelations;
  onSuccess?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

// Convenience component for quick deletion
export function QuickDeleteButton({
  availability,
  onSuccess,
  variant = 'ghost',
  size = 'sm',
}: QuickDeleteButtonProps) {
  return (
    <AvailabilityDeleteDialog availability={availability} onSuccess={onSuccess}>
      <Button variant={variant} size={size}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </AvailabilityDeleteDialog>
  );
}
