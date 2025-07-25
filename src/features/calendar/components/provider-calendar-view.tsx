'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Repeat } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DayView } from '@/features/calendar/components/views/day-view';
import { MonthView } from '@/features/calendar/components/views/month-view';
import { ThreeDayView } from '@/features/calendar/components/views/three-day-view';
import { WeekView } from '@/features/calendar/components/views/week-view';
import { CalendarErrorBoundary } from '@/features/calendar/components/error-boundary';
import { CalendarSkeleton } from '@/features/calendar/components/loading';
import { useCalendarData } from '@/features/calendar/hooks/use-calendar-data';
import {
  AvailabilityStatus,
  CalendarEvent,
  CalendarViewMode,
} from '@/features/calendar/types/types';
import { 
  getEventStyle, 
  navigateCalendarDate, 
  getCalendarViewTitle 
} from '@/features/calendar/lib/calendar-utils';


export interface ProviderCalendarViewProps {
  providerId: string;
  onEventClick?: (event: CalendarEvent, clickEvent: React.MouseEvent) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
  onCreateAvailability?: () => void;
  onEditEvent?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  viewMode?: CalendarViewMode;
  initialDate?: Date;
}

export function ProviderCalendarView({
  providerId,
  onEventClick,
  onTimeSlotClick,
  onCreateAvailability,
  onEditEvent,
  onDateClick,
  viewMode: initialViewMode = 'week',
  initialDate = new Date(),
}: ProviderCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [viewMode, setViewMode] = useState<CalendarViewMode>(initialViewMode);
  const [statusFilter, setStatusFilter] = useState<AvailabilityStatus | 'ALL'>('ALL');
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection and view mode handling
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 640; // sm breakpoint
      setIsMobile(mobile);

      // If switching to mobile and current view is not allowed, switch to day view
      if (mobile && (viewMode === 'week' || viewMode === 'month')) {
        setViewMode('day');
      }
    };

    // Check initial state
    checkIsMobile();

    // Listen for window resize
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, [viewMode]);

  // Modal state (context menu removed - modal now handled by parent)

  // Calculate total hours for a day with memoization
  const calculateDayHours = useCallback((events: CalendarEvent[]) => {
    const availabilityEvents = events.filter((event) => event.type === 'availability');
    if (availabilityEvents.length === 0) return 0;

    // Sort events by start time
    const sortedEvents = availabilityEvents.sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );

    // Merge overlapping events to avoid double counting
    const mergedEvents = [];
    let currentEvent = sortedEvents[0];

    for (let i = 1; i < sortedEvents.length; i++) {
      const nextEvent = sortedEvents[i];

      // If events overlap, merge them
      if (currentEvent.endTime >= nextEvent.startTime) {
        currentEvent = {
          ...currentEvent,
          endTime: new Date(Math.max(currentEvent.endTime.getTime(), nextEvent.endTime.getTime())),
        };
      } else {
        mergedEvents.push(currentEvent);
        currentEvent = nextEvent;
      }
    }
    mergedEvents.push(currentEvent);

    // Calculate total hours
    return mergedEvents.reduce((total, event) => {
      const duration = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60 * 60);
      return total + duration;
    }, 0);
  }, []);

  // Get status breakdown for a day with memoization
  const getStatusBreakdown = useCallback((events: CalendarEvent[]) => {
    const availabilityEvents = events.filter((event) => event.type === 'availability');
    const breakdown = {
      [AvailabilityStatus.PENDING]: 0,
      [AvailabilityStatus.ACCEPTED]: 0,
      [AvailabilityStatus.CANCELLED]: 0,
      [AvailabilityStatus.REJECTED]: 0,
    };

    availabilityEvents.forEach((event) => {
      breakdown[event.status as AvailabilityStatus]++;
    });

    return breakdown;
  }, []);

  // Get styling based on status mix with memoization
  const getHoursSummaryStyle = useCallback((events: CalendarEvent[]) => {
    const breakdown = getStatusBreakdown(events);
    const total = Object.values(breakdown).reduce((sum, count) => sum + count, 0);

    if (total === 0) return 'text-gray-400';

    const acceptedRatio = breakdown[AvailabilityStatus.ACCEPTED] / total;
    const pendingRatio = breakdown[AvailabilityStatus.PENDING] / total;
    const rejectedRatio = breakdown[AvailabilityStatus.REJECTED] / total;

    if (acceptedRatio > 0.7) return 'text-green-600 bg-green-50';
    if (pendingRatio > 0.5) return 'text-yellow-600 bg-yellow-50';
    if (rejectedRatio > 0.3) return 'text-red-600 bg-red-50';

    return 'text-blue-600 bg-blue-50';
  }, [getStatusBreakdown]);

  // Use standardized calendar data hook with optimized caching and memoization
  const { 
    data: calendarData, 
    filteredEvents, 
    isLoading, 
    error: calendarError 
  } = useCalendarData({
    providerId,
    currentDate,
    viewMode,
    statusFilter,
  });

  // Transform availability data into calendar events with optimized memoization
  const calendarData: ProviderCalendarData | null = useMemo(() => {
    if (!provider || !availabilityData) return null;

    // Transform availability records into calendar events
    const events: CalendarEvent[] = [];

    // Add availability blocks
    availabilityData.forEach((availability: AvailabilityWithRelations) => {
      // Determine creator information
      const isProviderCreated =
        availability.isProviderCreated ||
        (!availability.organizationId && !availability.createdByMembershipId);

      const event: CalendarEvent = {
        id: availability.id,
        type: 'availability' as const,
        title: availability.availableServices?.[0]?.service?.name || 'General Consultation',
        startTime: new Date(availability.startTime),
        endTime: new Date(availability.endTime),
        status: availability.status,
        schedulingRule: availability.schedulingRule as SchedulingRule,
        isRecurring: availability.isRecurring,
        seriesId: availability.seriesId || undefined,
        location: availability.location
          ? {
              id: availability.location.id,
              name: availability.location.name,
              isOnline: !availability.locationId,
            }
          : undefined,
        service: availability.availableServices?.[0]
          ? {
              id: availability.availableServices[0].service.id,
              name: availability.availableServices[0].service.name,
              duration: availability.availableServices[0].duration || 30,
              price: Number(availability.availableServices[0].price) || 0,
            }
          : undefined,
        // Creator information
        isProviderCreated,
        createdBy: availability.createdBy
          ? {
              id: availability.createdBy.id,
              name: availability.createdBy.name || 'Unknown',
              type: isProviderCreated ? 'provider' : 'organization',
            }
          : undefined,
        organization: availability.organization
          ? {
              id: availability.organization.id,
              name: availability.organization.name,
            }
          : undefined,
      };

      events.push(event);

      // Add booked slots from this availability's calculated slots
      availability.calculatedSlots
        ?.filter((slot) => slot.status === 'BOOKED')
        .forEach((slot) => {
          events.push({
            id: slot.id,
            type: 'booking' as const,
            title: slot.service?.name || 'Appointment',
            startTime: new Date(slot.startTime),
            endTime: new Date(slot.endTime),
            status: slot.status,
            schedulingRule: availability.schedulingRule as SchedulingRule,
            isRecurring: false,
            location: slot.serviceConfig?.location
              ? {
                  id: slot.serviceConfig.location.id,
                  name: slot.serviceConfig.location.name,
                  isOnline: slot.serviceConfig.isOnlineAvailable,
                }
              : undefined,
            service:
              slot.service && slot.serviceConfig
                ? {
                    id: slot.service.id,
                    name: slot.service.name,
                    duration: slot.serviceConfig.duration || 30,
                    price: Number(slot.serviceConfig.price) || 0,
                  }
                : undefined,
            // Customer data will be populated when booking relationship is available
          });
        });
    });

    // Calculate stats from all calculated slots
    const allSlots = availabilityData.flatMap(
      (availability: AvailabilityWithRelations) => availability.calculatedSlots || []
    );
    const bookedSlots = allSlots.filter(
      (slot: CalculatedAvailabilitySlotWithRelations) => slot.status === 'BOOKED'
    ).length;
    const pendingSlots = allSlots.filter(
      (slot: CalculatedAvailabilitySlotWithRelations) =>
        slot.booking?.status === BookingStatus.PENDING
    ).length;

    return {
      providerId,
      providerName: provider.name,
      providerType: 'Healthcare Provider', // TODO: Add type information to SerializedProvider
      workingHours: { start: '09:00', end: '17:00' }, // Default working hours
      events,
      stats: {
        totalAvailabilityHours: availabilityData.length,
        bookedHours: bookedSlots,
        utilizationRate:
          allSlots.length > 0 ? Math.round((bookedSlots / allSlots.length) * 100) : 0,
        pendingBookings: pendingSlots,
        completedBookings: bookedSlots,
      },
    };
  }, [provider, availabilityData, providerId]);

  // Memoize date range calculation for better performance
  const memoizedDateRange = useMemo(() => {
    return calculateDateRange(currentDate, viewMode);
  }, [currentDate, viewMode]);

  // Memoize event filtering for current view
  const filteredEvents = useMemo(() => {
    if (!calendarData?.events) return [];
    
    return calendarData.events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= memoizedDateRange.start && eventDate <= memoizedDateRange.end;
    });
  }, [calendarData?.events, memoizedDateRange]);

  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    const newDate = navigateCalendarDate(currentDate, direction, viewMode);
    setCurrentDate(newDate);
  }, [currentDate, viewMode]);

  const handleDateClick = useCallback((date: Date) => {
    setCurrentDate(date);
    setViewMode('day');
    onDateClick?.(date);
  }, [onDateClick]);

  const getViewTitle = useCallback((): string => {
    return getCalendarViewTitle(currentDate, viewMode);
  }, [currentDate, viewMode]);

  // Use shared event styling utility with memoization
  const getEventStyleLocal = useCallback((event: CalendarEvent): string => {
    return getEventStyle(event);
  }, []);

  if (isLoading) {
    return <CalendarSkeleton />;
  }

  if (!calendarData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="py-8 text-center text-muted-foreground">
            <CalendarIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>No calendar data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <CalendarErrorBoundary>
      <div className="space-y-6">
      {/* Header with Provider Info and Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>
                  {calendarData.providerName
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{calendarData.providerName}</CardTitle>
                <p className="text-sm text-muted-foreground">{calendarData.providerType}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="grid grid-cols-2 gap-3 text-center md:grid-cols-4 md:gap-4">
                <div>
                  <div className="text-lg font-bold text-blue-600 md:text-2xl">
                    {calendarData.stats.utilizationRate}%
                  </div>
                  <div className="text-xs text-muted-foreground">Utilization</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600 md:text-2xl">
                    {calendarData.stats.bookedHours}
                  </div>
                  <div className="text-xs text-muted-foreground">Booked Hours</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-600 md:text-2xl">
                    {calendarData.stats.pendingBookings}
                  </div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-600 md:text-2xl">
                    {calendarData.stats.completedBookings}
                  </div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            {/* Navigation and Title */}
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
              <div className="flex items-center justify-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <DatePicker date={currentDate} onChange={(date) => date && setCurrentDate(date)} />
                <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                  Today
                </Button>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
              <Select
                value={viewMode}
                onValueChange={(value: CalendarViewMode) => setViewMode(value)}
              >
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="3-day">3 Days</SelectItem>
                  <SelectItem value="week" className="hidden sm:block">
                    Week
                  </SelectItem>
                  <SelectItem value="month" className="hidden sm:block">
                    Month
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(value: AvailabilityStatus | 'ALL') => setStatusFilter(value)}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value={AvailabilityStatus.ACCEPTED}>✅ Active</SelectItem>
                  <SelectItem value={AvailabilityStatus.PENDING}>🟡 Pending</SelectItem>
                  <SelectItem value={AvailabilityStatus.CANCELLED}>⏸️ Cancelled</SelectItem>
                  <SelectItem value={AvailabilityStatus.REJECTED}>❌ Rejected</SelectItem>
                </SelectContent>
              </Select>

              {onCreateAvailability && (
                <Button size="sm" onClick={onCreateAvailability} className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Availability
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {viewMode === 'day' && (
            <DayView
              currentDate={currentDate}
              events={filteredEvents}
              workingHours={calendarData.workingHours}
              onEventClick={(event, clickEvent) => onEventClick?.(event, clickEvent || {} as React.MouseEvent)}
              onTimeSlotClick={onTimeSlotClick}
              getEventStyle={getEventStyleLocal}
            />
          )}
          {viewMode === '3-day' && (
            <ThreeDayView
              currentDate={currentDate}
              events={filteredEvents}
              workingHours={calendarData.workingHours}
              onEventClick={(event, clickEvent) => onEventClick?.(event, clickEvent || {} as React.MouseEvent)}
              onTimeSlotClick={onTimeSlotClick}
              getEventStyle={getEventStyleLocal}
            />
          )}
          {viewMode === 'week' && (
            <WeekView
              currentDate={currentDate}
              events={filteredEvents}
              workingHours={calendarData.workingHours}
              onEventClick={(event, clickEvent) => onEventClick?.(event, clickEvent || {} as React.MouseEvent)}
              onTimeSlotClick={onTimeSlotClick}
              onDateClick={handleDateClick}
              getEventStyle={getEventStyleLocal}
            />
          )}
          {viewMode === 'month' && (
            <MonthView
              currentDate={currentDate}
              events={filteredEvents}
              onEventClick={(event, clickEvent) => onEventClick?.(event, clickEvent || {} as React.MouseEvent)}
              onDateClick={handleDateClick}
              onEditEvent={onEditEvent}
              getEventStyle={getEventStyleLocal}
            />
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-xs font-medium text-muted-foreground">Provider Created</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded border border-green-400 bg-green-100"></div>
                <span>✅ Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded border border-green-300 bg-green-50"></div>
                <span>⏸️ Cancelled</span>
              </div>
            </div>

            <div className="text-xs font-medium text-muted-foreground">Organization Created</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded border border-yellow-400 bg-yellow-100"></div>
                <span>🟡 Pending</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded border border-blue-400 bg-blue-100"></div>
                <span>✅ Accepted</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded border border-red-400 bg-red-100"></div>
                <span>❌ Rejected</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded border border-gray-400 bg-gray-100"></div>
                <span>⏸️ Cancelled</span>
              </div>
            </div>

            <div className="text-xs font-medium text-muted-foreground">Bookings</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded border border-purple-300 bg-purple-100"></div>
                <span>📅 Booked</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded border border-orange-300 bg-orange-100"></div>
                <span>⏳ Booking Pending</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </CalendarErrorBoundary>
  );
}
