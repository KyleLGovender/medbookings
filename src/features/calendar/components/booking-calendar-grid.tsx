'use client';

import React, { useMemo } from 'react';

import { Clock } from 'lucide-react';

import CalendarLoader from '@/components/calendar-loader';
import { Card, CardContent } from '@/components/ui/card';
import { BookingSlotItem } from '@/features/calendar/components/booking-slot-item';
import { MobileSlotList } from '@/features/calendar/components/mobile-slot-list';
import { BookingSlot, CalendarGridProps } from '@/features/calendar/types/booking-types';

export function BookingCalendarGrid({
  providerId,
  currentDate,
  viewMode,
  slots,
  isLoading,
  error,
  onSlotClick,
  selectedSlot,
}: CalendarGridProps) {
  // Generate time grid (7 AM to 9 PM in 30-minute intervals)
  const timeGrid = useMemo(() => {
    const times = [];
    for (let hour = 7; hour <= 21; hour++) {
      times.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 21) {
        times.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return times;
  }, []);

  // Generate date columns based on view mode
  const dateColumns = useMemo(() => {
    const dates = [];
    const startDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'day':
        dates.push(new Date(startDate));
        break;
      case '3-day':
        for (let i = 0; i < 3; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          dates.push(date);
        }
        break;
      case 'week':
        // Start from Monday of the current week
        const monday = new Date(startDate);
        const dayOfWeek = monday.getDay();
        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        monday.setDate(monday.getDate() + daysToMonday);
        
        for (let i = 0; i < 7; i++) {
          const date = new Date(monday);
          date.setDate(date.getDate() + i);
          dates.push(date);
        }
        break;
    }
    
    return dates;
  }, [currentDate, viewMode]);

  // Group slots by date and time
  const slotsByDateTime = useMemo(() => {
    const grouped = new Map<string, BookingSlot[]>();
    
    slots.forEach(slot => {
      const dateKey = slot.startTime.toDateString();
      const timeKey = slot.startTime.toTimeString().substring(0, 5);
      const key = `${dateKey}-${timeKey}`;
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(slot);
    });
    
    return grouped;
  }, [slots]);

  // Get slots for a specific date and time
  const getSlotsForDateTime = (date: Date, time: string) => {
    const dateKey = date.toDateString();
    const key = `${dateKey}-${time}`;
    return slotsByDateTime.get(key) || [];
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <CalendarLoader 
            message="Loading availability"
            submessage="Fetching appointment slots..."
            showAfterMs={300}
          />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="font-medium text-destructive">Failed to load availability</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Please refresh the page or try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!slots || slots.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
          <p className="font-medium text-muted-foreground">No available slots</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your filters or selecting a different date range.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Mobile View - Show list layout on small screens */}
      <div className="block lg:hidden">
        <MobileSlotList
          slots={slots}
          currentDate={currentDate}
          onSlotClick={onSlotClick}
          selectedSlot={selectedSlot}
        />
      </div>

      {/* Desktop View - Show grid layout on large screens */}
      <div className="hidden lg:block">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div 
                className="grid min-w-full"
                style={{
                  gridTemplateColumns: `80px repeat(${dateColumns.length}, 1fr)`,
                  gridTemplateRows: `auto repeat(${timeGrid.length}, 60px)`,
                }}
              >
            {/* Header row with dates */}
            <div className="border-b border-r bg-gray-50 p-2">
              <span className="text-xs font-medium text-muted-foreground">Time</span>
            </div>
            
            {dateColumns.map((date, dateIndex) => (
              <div 
                key={dateIndex}
                className="border-b bg-gray-50 p-2 text-center"
              >
                <div className="text-sm font-medium">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="text-xs text-muted-foreground">
                  {date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                </div>
              </div>
            ))}

            {/* Time slots grid */}
            {timeGrid.map((time, timeIndex) => (
              <React.Fragment key={time}>
                {/* Time label */}
                <div className="border-b border-r bg-gray-50 p-2 text-center">
                  <span className="text-xs font-medium text-muted-foreground">
                    {time}
                  </span>
                </div>
                
                {/* Date columns for this time */}
                {dateColumns.map((date, dateIndex) => {
                  const dateSlots = getSlotsForDateTime(date, time);
                  const hasSlots = dateSlots.length > 0;
                  
                  return (
                    <div
                      key={`${timeIndex}-${dateIndex}`}
                      className="border-b border-r p-1"
                    >
                      {hasSlots ? (
                        <div className="space-y-1">
                          {dateSlots.map((slot, slotIndex) => (
                            <BookingSlotItem
                              key={`${slot.id}-${slotIndex}`}
                              slot={slot}
                              onClick={() => onSlotClick(slot)}
                              isSelected={selectedSlot?.id === slot.id}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="h-full bg-gray-100 rounded opacity-50" />
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </>
  );
}