'use client';

import React, { useState } from 'react';

import { format } from 'date-fns';
import { Calendar, Clock, MapPin, User, CreditCard, Phone, Mail } from 'lucide-react';

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
import { BookingSlot } from '@/features/calendar/types/booking-types';

interface BookingSlotModalProps {
  slot: BookingSlot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookingConfirm: (bookingData: BookingFormData) => void;
  isLoading?: boolean;
}

export interface BookingFormData {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes?: string;
  slotId: string;
}

export function BookingSlotModal({
  slot,
  open,
  onOpenChange,
  onBookingConfirm,
  isLoading = false,
}: BookingSlotModalProps) {
  const [formData, setFormData] = useState<BookingFormData>({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    notes: '',
    slotId: slot?.id || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update slot ID when slot changes
  React.useEffect(() => {
    if (slot) {
      setFormData(prev => ({ ...prev, slotId: slot.id }));
    }
  }, [slot]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Name is required';
    }

    if (!formData.clientEmail.trim()) {
      newErrors.clientEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
      newErrors.clientEmail = 'Please enter a valid email address';
    }

    if (!formData.clientPhone.trim()) {
      newErrors.clientPhone = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    onBookingConfirm(formData);
  };

  const handleInputChange = (field: keyof BookingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleClose = () => {
    setFormData({
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      notes: '',
      slotId: slot?.id || '',
    });
    setErrors({});
    onOpenChange(false);
  };

  if (!slot) return null;

  const formatDuration = (minutes: number): string => {
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <Calendar className="h-6 w-6 text-primary" />
            Book Appointment
          </DialogTitle>
          <DialogDescription>
            Complete the form below to book your appointment with {slot.provider.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Appointment Details Card */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-start gap-4">
              <UserAvatar
                name={slot.provider.name}
                image={slot.provider.image}
                className="h-12 w-12"
              />
              
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{slot.provider.name}</h3>
                  {slot.service && (
                    <p className="text-sm text-muted-foreground">{slot.service.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(slot.startTime, 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(slot.startTime, 'h:mm a')} - {format(slot.endTime, 'h:mm a')}
                      <span className="ml-1 text-muted-foreground">
                        ({formatDuration(slot.durationMinutes)})
                      </span>
                    </span>
                  </div>

                  {slot.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {slot.location.isOnline ? 'Online' : slot.location.name}
                      </span>
                    </div>
                  )}

                  {slot.price && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">${slot.price.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name *
                </Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => handleInputChange('clientName', e.target.value)}
                  placeholder="Enter your full name"
                  className={errors.clientName ? 'border-destructive' : ''}
                />
                {errors.clientName && (
                  <p className="text-sm text-destructive">{errors.clientName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientPhone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number *
                </Label>
                <Input
                  id="clientPhone"
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                  placeholder="Enter your phone number"
                  className={errors.clientPhone ? 'border-destructive' : ''}
                />
                {errors.clientPhone && (
                  <p className="text-sm text-destructive">{errors.clientPhone}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientEmail" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address *
              </Label>
              <Input
                id="clientEmail"
                type="email"
                value={formData.clientEmail}
                onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                placeholder="Enter your email address"
                className={errors.clientEmail ? 'border-destructive' : ''}
              />
              {errors.clientEmail && (
                <p className="text-sm text-destructive">{errors.clientEmail}</p>
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

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
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
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Booking...' : 'Confirm Booking'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}