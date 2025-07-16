'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  color?: string;
  type?: 'appointment' | 'block' | 'recurring' | 'availability';
  status?: 'confirmed' | 'pending' | 'cancelled';
  provider?: {
    id: string;
    name: string;
    avatar?: string;
  };
  patient?: {
    id: string;
    name: string;
  };
}

export interface ThreeDayViewProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onTimeSlotClick?: (date: Date, time: string) => void;
  onEventCreate?: (startTime: Date, endTime: Date) => void;
  
  // Time configuration
  startHour?: number;
  endHour?: number;
  timeSlotDuration?: number; // in minutes
  
  // Display options
  showWeekend?: boolean;
  showTimeLabels?: boolean;
  showCurrentTimeIndicator?: boolean;
  
  // Styling
  className?: string;
  
  // Loading state
  isLoading?: boolean;
}

export function ThreeDayView({
  currentDate,
  onDateChange,
  events,
  onEventClick,
  onTimeSlotClick,
  onEventCreate,
  startHour = 6,
  endHour = 22,
  timeSlotDuration = 30,
  showWeekend = true,
  showTimeLabels = true,
  showCurrentTimeIndicator = true,
  className = '',
  isLoading = false,
}: ThreeDayViewProps) {
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

  // Calculate the three days: previous, current, next
  const getDaysArray = () => {
    const prevDay = new Date(currentDate);
    prevDay.setDate(currentDate.getDate() - 1);
    
    const nextDay = new Date(currentDate);
    nextDay.setDate(currentDate.getDate() + 1);
    
    return [prevDay, currentDate, nextDay];
  };

  const days = getDaysArray();

  // Generate time slots for the day
  const generateTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += timeSlotDuration) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Filter events for a specific day
  const getEventsForDay = (day: Date) => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    return events.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      
      return (
        (eventStart >= dayStart && eventStart <= dayEnd) ||
        (eventEnd >= dayStart && eventEnd <= dayEnd) ||
        (eventStart <= dayStart && eventEnd >= dayEnd)
      );
    });
  };

  // Calculate event position and height
  const getEventStyle = (event: CalendarEvent) => {
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    
    const startHours = startTime.getHours();
    const startMinutes = startTime.getMinutes();
    const endHours = endTime.getHours();
    const endMinutes = endTime.getMinutes();
    
    const startPosition = ((startHours - startHour) * 60 + startMinutes) / timeSlotDuration;
    const duration = ((endHours - startHours) * 60 + (endMinutes - startMinutes)) / timeSlotDuration;
    
    const slotHeight = 60; // Height of each time slot in pixels
    const top = startPosition * slotHeight;
    const height = duration * slotHeight;
    
    return {
      top: `${top}px`,
      height: `${height}px`,
      zIndex: 10,
    };
  };

  // Get event color based on type and status
  const getEventColor = (event: CalendarEvent) => {
    if (event.color) return event.color;
    
    switch (event.type) {
      case 'appointment':
        return event.status === 'confirmed' ? '#10b981' : '#f59e0b';
      case 'block':
        return '#ef4444';
      case 'recurring':
        return '#8b5cf6';
      case 'availability':
        return '#06b6d4';
      default:
        return '#6b7280';
    }
  };

  // Handle time slot click
  const handleTimeSlotClick = (day: Date, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const clickedDateTime = new Date(day);
    clickedDateTime.setHours(hours, minutes, 0, 0);
    
    setSelectedTimeSlot(`${day.toISOString().split('T')[0]}_${time}`);
    onTimeSlotClick?.(clickedDateTime, time);
  };

  // Handle event drag start
  const handleDragStart = (event: CalendarEvent, e: React.DragEvent) => {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle event drop
  const handleDrop = (day: Date, time: string, e: React.DragEvent) => {
    e.preventDefault();
    
    if (draggedEvent) {
      const [hours, minutes] = time.split(':').map(Number);
      const newStartTime = new Date(day);
      newStartTime.setHours(hours, minutes, 0, 0);
      
      const duration = draggedEvent.endTime.getTime() - draggedEvent.startTime.getTime();
      const newEndTime = new Date(newStartTime.getTime() + duration);
      
      // Here you would typically update the event through an API
      console.log('Event moved:', draggedEvent.id, 'to', newStartTime);
      
      setDraggedEvent(null);
    }
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Check if time slot is current time
  const isCurrentTimeSlot = (day: Date, time: string) => {
    if (!showCurrentTimeIndicator) return false;
    
    const now = new Date();
    const slotDate = new Date(day);
    const [hours, minutes] = time.split(':').map(Number);
    slotDate.setHours(hours, minutes, 0, 0);
    
    const nextSlot = new Date(slotDate);
    nextSlot.setMinutes(slotDate.getMinutes() + timeSlotDuration);
    
    return (
      slotDate.toDateString() === now.toDateString() &&
      now >= slotDate &&
      now < nextSlot
    );
  };

  // Format day header
  const formatDayHeader = (day: Date) => {
    const isToday = day.toDateString() === new Date().toDateString();
    const isCurrentSelected = day.toDateString() === currentDate.toDateString();
    
    return {
      dayName: day.toLocaleDateString([], { weekday: 'short' }),
      dayNumber: day.getDate(),
      monthName: day.toLocaleDateString([], { month: 'short' }),
      isToday,
      isCurrentSelected,
    };
  };

  // Navigate to specific day
  const navigateToDay = (day: Date) => {
    onDateChange(day);
  };

  if (isLoading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading calendar...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">3-Day Calendar View</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-4 border-b">
          {/* Time column header */}
          <div className="p-4 border-r bg-muted/20">
            {showTimeLabels && (
              <div className="text-sm font-medium text-muted-foreground">Time</div>
            )}
          </div>
          
          {/* Day headers */}
          {days.map((day, index) => {
            const dayInfo = formatDayHeader(day);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'p-4 border-r border-muted text-center cursor-pointer hover:bg-muted/50 transition-colors',
                  dayInfo.isCurrentSelected && 'bg-primary/10',
                  dayInfo.isToday && 'bg-blue-50',
                  index === days.length - 1 && 'border-r-0'
                )}
                onClick={() => navigateToDay(day)}
              >
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">
                    {dayInfo.dayName}
                  </div>
                  <div className={cn(
                    'text-xl font-semibold',
                    dayInfo.isToday && 'text-blue-600'
                  )}>
                    {dayInfo.dayNumber}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {dayInfo.monthName}
                  </div>
                  {dayInfo.isToday && (
                    <Badge variant="secondary" className="text-xs">
                      Today
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-4 relative">
          {/* Time slots column */}
          <div className="border-r">
            {timeSlots.map((time, index) => (
              <div
                key={time}
                className={cn(
                  'h-[60px] border-b border-muted/30 p-2 text-right',
                  index === timeSlots.length - 1 && 'border-b-0'
                )}
              >
                {showTimeLabels && (
                  <div className="text-xs text-muted-foreground">{time}</div>
                )}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, dayIndex) => {
            const dayEvents = getEventsForDay(day);
            
            return (
              <div key={day.toISOString()} className="relative border-r border-muted/30">
                {/* Time slot grid */}
                {timeSlots.map((time, timeIndex) => {
                  const slotKey = `${day.toISOString().split('T')[0]}_${time}`;
                  const isCurrentTime = isCurrentTimeSlot(day, time);
                  const isSelected = selectedTimeSlot === slotKey;
                  
                  return (
                    <div
                      key={slotKey}
                      className={cn(
                        'h-[60px] border-b border-muted/30 cursor-pointer hover:bg-muted/20 transition-colors',
                        isCurrentTime && 'bg-yellow-50 border-yellow-200',
                        isSelected && 'bg-primary/10',
                        timeIndex === timeSlots.length - 1 && 'border-b-0'
                      )}
                      onClick={() => handleTimeSlotClick(day, time)}
                      onDrop={(e) => handleDrop(day, time, e)}
                      onDragOver={handleDragOver}
                    >
                      {isCurrentTime && (
                        <div className="absolute left-0 right-0 h-0.5 bg-yellow-500 z-20"></div>
                      )}
                    </div>
                  );
                })}

                {/* Events */}
                {dayEvents.map((event) => {
                  const eventStyle = getEventStyle(event);
                  const eventColor = getEventColor(event);
                  
                  return (
                    <div
                      key={event.id}
                      className={cn(
                        'absolute left-1 right-1 rounded-md p-2 cursor-pointer shadow-sm border-l-4 hover:shadow-md transition-shadow',
                        'bg-white border border-gray-200'
                      )}
                      style={{
                        ...eventStyle,
                        borderLeftColor: eventColor,
                      }}
                      onClick={() => onEventClick?.(event)}
                      draggable
                      onDragStart={(e) => handleDragStart(event, e)}
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {event.title}
                        </div>
                        {event.description && (
                          <div className="text-xs text-gray-600 truncate">
                            {event.description}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {event.startTime.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })} - {event.endTime.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                        {event.patient && (
                          <div className="text-xs text-gray-600 truncate">
                            {event.patient.name}
                          </div>
                        )}
                        {event.status && (
                          <Badge 
                            variant={event.status === 'confirmed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {event.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}