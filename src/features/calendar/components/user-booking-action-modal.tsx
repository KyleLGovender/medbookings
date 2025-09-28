'use client';

import React, { useState } from 'react';

import { format } from 'date-fns';
import { AlertTriangle, Calendar, Clock, Mail, Phone, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/user-avatar';
import { BookingUpdateData } from '@/features/calendar/types/booking-types';
import { type RouterOutputs } from '@/utils/api';

type UserBooking = RouterOutputs['calendar']['getUserBookings'][number];

interface UserBookingActionModalProps {
  booking: UserBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: 'edit' | 'cancel' | 'reschedule';
  isLoading?: boolean;
  onConfirm: (data?: BookingUpdateData) => void;
}

export function UserBookingActionModal({
  booking,
  open,
  onOpenChange,
  action,
  isLoading = false,
  onConfirm,
}: UserBookingActionModalProps) {
  const [formData, setFormData] = useState<BookingUpdateData>({
    guestName: booking?.guestName || '',
    guestEmail: booking?.guestEmail || '',
    guestPhone: booking?.guestPhone || '',
    notes: booking?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when booking changes
  React.useEffect(() => {
    if (booking) {
      setFormData({
        guestName: booking.guestName || '',
        guestEmail: booking.guestEmail || '',
        guestPhone: booking.guestPhone || '',
        notes: booking.notes || '',
      });
    }
  }, [booking]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.guestName?.trim()) {
      newErrors.guestName = 'Name is required';
    }

    if (!formData.guestEmail?.trim()) {
      newErrors.guestEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guestEmail)) {
      newErrors.guestEmail = 'Please enter a valid email address';
    }

    if (!formData.guestPhone?.trim()) {
      newErrors.guestPhone = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (action === 'edit' && !validateForm()) {
      return;
    }

    onConfirm(action === 'edit' ? formData : undefined);
  };

  const handleInputChange = (field: keyof BookingUpdateData, value: string) => {
    setFormData((prev: BookingUpdateData) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors((prev: Record<string, string>) => ({ ...prev, [field as string]: '' }));
    }
  };

  const handleClose = () => {
    setFormData({
      guestName: booking?.guestName || '',
      guestEmail: booking?.guestEmail || '',
      guestPhone: booking?.guestPhone || '',
      notes: booking?.notes || '',
    });
    setErrors({});
    onOpenChange(false);
  };

  if (!booking || !booking.slot) return null;

  const getModalConfig = () => {
    switch (action) {
      case 'edit':
        return {
          title: 'Edit Booking Details',
          description: 'Update your booking information below.',
          confirmText: isLoading ? 'Updating...' : 'Update Booking',
          confirmVariant: 'default' as const,
        };
      case 'cancel':
        return {
          title: 'Cancel Booking',
          description: 'Are you sure you want to cancel this booking?',
          confirmText: isLoading ? 'Cancelling...' : 'Cancel Booking',
          confirmVariant: 'destructive' as const,
        };
      case 'reschedule':
        return {
          title: 'Reschedule Booking',
          description: 'This will guide you to select a new time slot.',
          confirmText: isLoading ? 'Processing...' : 'Continue to Reschedule',
          confirmVariant: 'default' as const,
        };
      default:
        return {
          title: 'Booking Action',
          description: '',
          confirmText: 'Confirm',
          confirmVariant: 'default' as const,
        };
    }
  };

  const config = getModalConfig();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            {action === 'cancel' && <AlertTriangle className="h-6 w-6 text-destructive" />}
            {action === 'edit' && <User className="h-6 w-6 text-primary" />}
            {action === 'reschedule' && <Calendar className="h-6 w-6 text-primary" />}
            {config.title}
          </DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Booking Summary */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-start gap-4">
              <UserAvatar
                name={booking.slot.availability.provider.user.name || 'Provider'}
                image={booking.slot.availability.provider.user.image}
                className="h-12 w-12"
              />

              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-lg font-semibold">
                    {booking.slot.availability.provider.user.name || 'Provider'}
                  </h3>
                  {booking.slot.service && (
                    <p className="text-sm text-muted-foreground">{booking.slot.service.name}</p>
                  )}
                </div>

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
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action-specific content */}
          {action === 'edit' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="guestName" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name *
                  </Label>
                  <Input
                    id="guestName"
                    value={formData.guestName}
                    onChange={(e) => handleInputChange('guestName', e.target.value)}
                    placeholder="Enter your full name"
                    className={errors.guestName ? 'border-destructive' : ''}
                  />
                  {errors.guestName && (
                    <p className="text-sm text-destructive">{errors.guestName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guestPhone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number *
                  </Label>
                  <Input
                    id="guestPhone"
                    type="tel"
                    value={formData.guestPhone}
                    onChange={(e) => handleInputChange('guestPhone', e.target.value)}
                    placeholder="Enter your phone number"
                    className={errors.guestPhone ? 'border-destructive' : ''}
                  />
                  {errors.guestPhone && (
                    <p className="text-sm text-destructive">{errors.guestPhone}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guestEmail" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address *
                </Label>
                <Input
                  id="guestEmail"
                  type="email"
                  value={formData.guestEmail}
                  onChange={(e) => handleInputChange('guestEmail', e.target.value)}
                  placeholder="Enter your email address"
                  className={errors.guestEmail ? 'border-destructive' : ''}
                />
                {errors.guestEmail && (
                  <p className="text-sm text-destructive">{errors.guestEmail}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any additional information or special requests..."
                  rows={3}
                />
              </div>
            </form>
          )}

          {action === 'cancel' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
                  <div className="space-y-1">
                    <h4 className="font-medium text-destructive">Cancellation Policy</h4>
                    <p className="text-sm text-muted-foreground">
                      {
                        // eslint-disable-next-line quotes
                        "Cancelling this booking may be subject to cancellation fees depending on the provider's policy and timing. You may be eligible for a partial or full refund."
                      }
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. You will need to book a new appointment if you change
                your mind.
              </p>
            </div>
          )}

          {action === 'reschedule' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You will be redirected to select a new available time slot with the same provider.
                Your current booking will be cancelled and replaced with the new time.
              </p>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> Rescheduling is subject to availability. If no suitable
                  slots are available, you may need to cancel and book with a different provider.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type={action === 'edit' ? 'submit' : 'button'}
              variant={config.confirmVariant}
              onClick={action !== 'edit' ? handleSubmit : undefined}
              disabled={isLoading}
              className="flex-1"
            >
              {config.confirmText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
