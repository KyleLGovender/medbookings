'use client';

import React from 'react';

import { format, isSameDay } from 'date-fns';
import { Calendar, Clock, MapPin, DollarSign, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookingSlot } from '@/features/calendar/types/booking-types';

interface MobileSlotListProps {
  slots: BookingSlot[];
  currentDate: Date;
  onSlotClick: (slot: BookingSlot) => void;
  selectedSlot?: BookingSlot | null;
}

export function MobileSlotList({
  slots,
  currentDate,
  onSlotClick,
  selectedSlot,
}: MobileSlotListProps) {
  // Group slots by date
  const slotsByDate = React.useMemo(() => {
    const grouped = new Map<string, BookingSlot[]>();
    
    slots.forEach(slot => {
      const dateKey = format(slot.startTime, 'yyyy-MM-dd');
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(slot);
    });

    // Sort slots within each date by start time
    grouped.forEach(daySlots => {
      daySlots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    });

    return grouped;
  }, [slots]);

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
    <div className="space-y-4">
      {Array.from(slotsByDate.entries()).map(([dateKey, daySlots]) => {
        const date = new Date(dateKey);
        const isToday = isSameDay(date, new Date());
        const isCurrentDate = isSameDay(date, currentDate);

        return (
          <Card key={dateKey} className={isCurrentDate ? 'ring-2 ring-primary' : ''}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                {format(date, 'EEEE, MMMM d')}
                {isToday && (
                  <span className="ml-2 rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">
                    Today
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {daySlots.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No available slots for this date
                </p>
              ) : (
                daySlots.map(slot => (
                  <Button
                    key={slot.id}
                    variant={slot.isAvailable ? 'outline' : 'ghost'}
                    className={`w-full h-auto p-4 text-left justify-start ${
                      slot.isAvailable 
                        ? 'hover:bg-primary/5 hover:border-primary border-2' 
                        : 'opacity-50 cursor-not-allowed'
                    } ${
                      selectedSlot?.id === slot.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => slot.isAvailable && onSlotClick(slot)}
                    disabled={!slot.isAvailable}
                  >
                    <div className="w-full space-y-2">
                      {/* Time and Duration */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(slot.startTime, 'h:mm a')} - {format(slot.endTime, 'h:mm a')}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDuration(slot.durationMinutes)}
                        </span>
                      </div>

                      {/* Service and Provider */}
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {slot.service?.name || 'General Consultation'}
                        </span>
                        {slot.provider.name && (
                          <span className="text-sm text-muted-foreground">
                            with {slot.provider.name}
                          </span>
                        )}
                      </div>

                      {/* Location and Price */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {slot.location?.isOnline ? 'Online' : slot.location?.name || 'Location TBD'}
                          </span>
                        </div>
                        
                        {slot.price && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{slot.price.toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      {/* Availability Status */}
                      <div className="flex justify-between items-center">
                        <div className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          slot.isAvailable
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {slot.isAvailable ? 'Available' : 'Booked'}
                        </div>
                        
                        {slot.isAvailable && (
                          <span className="text-xs text-primary font-medium">
                            Tap to book →
                          </span>
                        )}
                      </div>
                    </div>
                  </Button>
                ))
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}