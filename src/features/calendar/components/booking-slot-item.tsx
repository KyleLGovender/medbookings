'use client';

import React from 'react';

import { Clock, MapPin, Video } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BookingSlot } from '@/features/calendar/types/booking-types';

interface BookingSlotItemProps {
  slot: BookingSlot;
  onClick: () => void;
  isSelected?: boolean;
  className?: string;
}

export function BookingSlotItem({ 
  slot, 
  onClick, 
  isSelected = false,
  className 
}: BookingSlotItemProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatPrice = (price?: number) => {
    if (!price) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={!slot.isAvailable}
      className={cn(
        'h-auto w-full flex-col items-start justify-start p-2 text-left transition-all',
        slot.isAvailable
          ? 'border-green-200 bg-green-50 text-green-900 hover:bg-green-100 hover:border-green-300'
          : 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed opacity-60',
        isSelected && 'ring-2 ring-blue-500 ring-offset-1',
        className
      )}
    >
      {/* Time and Duration */}
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span className="text-xs font-medium">
            {formatTime(slot.startTime)}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {slot.durationMinutes}min
        </span>
      </div>

      {/* Service Name */}
      {slot.service && (
        <div className="mt-1 w-full">
          <p className="truncate text-xs font-medium">
            {slot.service.name}
          </p>
        </div>
      )}

      {/* Location */}
      <div className="mt-1 flex w-full items-center gap-1">
        {slot.location?.isOnline ? (
          <>
            <Video className="h-3 w-3" />
            <span className="text-xs">Online</span>
          </>
        ) : (
          <>
            <MapPin className="h-3 w-3" />
            <span className="truncate text-xs">
              {slot.location?.name || 'In-person'}
            </span>
          </>
        )}
      </div>

      {/* Price */}
      {slot.price && (
        <div className="mt-1 w-full">
          <span className="text-xs font-semibold text-green-700">
            {formatPrice(slot.price)}
          </span>
        </div>
      )}

      {/* Availability Status Indicator */}
      <div className="mt-1 w-full">
        <div className={cn(
          'rounded-full px-2 py-0.5 text-xs font-medium',
          slot.isAvailable
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-600'
        )}>
          {slot.isAvailable ? 'Available' : 'Booked'}
        </div>
      </div>
    </Button>
  );
}