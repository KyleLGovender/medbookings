'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { AvailabilityStatus } from '@prisma/client';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

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
import { UserAvatar } from '@/components/user-avatar';
import { CalendarErrorBoundary } from '@/features/calendar/components/error-boundary';
import { CalendarSkeleton } from '@/features/calendar/components/loading';
import { DayView } from '@/features/calendar/components/views/day-view';
import { MonthView } from '@/features/calendar/components/views/month-view';
import { ThreeDayView } from '@/features/calendar/components/views/three-day-view';
import { WeekView } from '@/features/calendar/components/views/week-view';
import { useCalendarData } from '@/features/calendar/hooks/use-calendar-data';
import {
  calculateDateRange,
  getEventStyle,
  navigateCalendarDate,
} from '@/features/calendar/lib/calendar-utils';
import {
  groupEventsByDate,
  sortEventsForRendering,
} from '@/features/calendar/lib/virtualization-helpers';
import { CalendarEvent, CalendarViewMode } from '@/features/calendar/types/types';
import type { RouterOutputs } from '@/utils/api';

// Extract proper types for strong typing
type AvailabilitySearchResult = RouterOutputs['calendar']['searchAvailability'];
type AvailabilityData = AvailabilitySearchResult[number];

// Performance monitoring functions removed - using simplified approach
const measureCalendarDataProcessing = (fn: () => any) => fn();
const measureCalendarRendering = (fn: () => any) => fn();
const recordCalendarCyclePerformance = (eventCount: number, viewMode: string, dateRange: any) => {};
const usePerformanceMonitor = (name: string, deps: any[]) => ({
  startMeasurement: () => {},
  endMeasurement: () => {},
});

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
  const [imageLoaded, setImageLoaded] = useState(false);

  // Performance monitoring
  usePerformanceMonitor('ProviderCalendarView', [currentDate, viewMode, statusFilter]);

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
      [AvailabilityStatus.REJECTED]: 0,
    };

    availabilityEvents.forEach((event) => {
      breakdown[event.status as AvailabilityStatus]++;
    });

    return breakdown;
  }, []);

  // Get styling based on status mix with memoization
  const getHoursSummaryStyle = useCallback(
    (events: CalendarEvent[]) => {
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
    },
    [getStatusBreakdown]
  );

  // Calculate date range using the helper function
  const dateRange = useMemo(() => {
    return calculateDateRange(currentDate, viewMode);
  }, [currentDate, viewMode]);

  // Use standardized calendar data hook with optimized caching and memoization
  const calendarDataResult = useCalendarData({
    providerIds: [providerId],
    dateRange,
    statusFilter,
  });

  // Extract data for the single provider
  const providerData = calendarDataResult.providers.get(providerId);
  const providerQuery = providerData?.provider;
  const availabilityQuery = providerData?.availability;
  const isLoading = calendarDataResult.isLoading;
  const hasError = calendarDataResult.hasError;

  // Extract provider data early for image loading
  const provider = providerQuery?.data;

  // Preload the image when provider data is available - must be before early returns
  useEffect(() => {
    if (provider?.user?.image) {
      const img = new window.Image();
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setImageLoaded(false);
      img.src = provider.user.image;
    }
  }, [provider?.user?.image]);

  // Transform availability data to calendar events
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    const availabilities: AvailabilitySearchResult = availabilityQuery?.data || [];
    if (!Array.isArray(availabilities)) return [];

    // Transform availabilities to CalendarEvent format
    const events: CalendarEvent[] = [];

    // Add availability events
    availabilities.forEach((availability: AvailabilityData) => {
      events.push({
        id: availability.id,
        type: 'availability' as const,
        title: `Available - ${availability.provider?.user?.name || 'Provider'}`,
        startTime: new Date(availability.startTime),
        endTime: new Date(availability.endTime),
        status: availability.status,
        schedulingRule: availability.schedulingRule,
        isRecurring: availability.isRecurring,
        seriesId: availability.seriesId,
        location: availability.location
          ? {
              id: availability.location.id,
              name: availability.location.name || 'Location',
              isOnline: availability.isOnlineAvailable,
            }
          : undefined,
        organization: availability.organization
          ? {
              id: availability.organization.id,
              name: availability.organization.name,
            }
          : undefined,
        isProviderCreated: availability.isProviderCreated ?? (availability.createdById === availability.provider?.userId),
        // Include additional data for modal display
        ...(availability.availableServices && { availableServices: availability.availableServices }),
        ...(availability.recurrencePattern && { recurrencePattern: availability.recurrencePattern }),
        ...(availability.requiresConfirmation !== undefined && { requiresConfirmation: availability.requiresConfirmation }),
      });

      // Add booking events from calculated slots
      if (availability.calculatedSlots) {
        availability.calculatedSlots.forEach((slot: any) => {
          if (slot.booking) {
            events.push({
              id: slot.booking.id,
              type: 'booking' as const,
              title: `Booking - ${slot.booking.customerName || 'Customer'}`,
              startTime: new Date(slot.startTime),
              endTime: new Date(slot.endTime),
              status: slot.booking.status,
              customer: {
                id: slot.booking.customerId || slot.booking.id,
                name: slot.booking.customerName || 'Customer',
                email: slot.booking.customerEmail,
              },
            });
          }
        });
      }
    });

    return events;
  }, [availabilityQuery?.data]);

  // Calculate stats from availability data
  const stats = useMemo(() => {
    const events = calendarEvents;

    // Calculate total available hours
    const totalAvailableHours = events.reduce((total, event) => {
      if (event.type === 'availability') {
        const hours = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60 * 60);
        return total + hours;
      }
      return total;
    }, 0);

    // Calculate booked hours
    const bookedHours = events.reduce((total, event) => {
      if (event.type === 'booking' && event.status === 'CONFIRMED') {
        const hours = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60 * 60);
        return total + hours;
      }
      return total;
    }, 0);

    // Count pending and completed bookings
    const pendingBookings = events.filter(
      (event) => event.type === 'booking' && event.status === 'PENDING'
    ).length;

    const completedBookings = events.filter(
      (event) => event.type === 'booking' && event.status === 'COMPLETED'
    ).length;

    // Calculate utilization rate
    const utilizationRate =
      totalAvailableHours > 0 ? Math.round((bookedHours / totalAvailableHours) * 100) : 0;

    return {
      utilizationRate,
      bookedHours: Math.round(bookedHours),
      pendingBookings,
      completedBookings,
      totalAvailableHours: Math.round(totalAvailableHours),
    };
  }, [calendarEvents]);

  // Derive working hours from availability data or use defaults
  const workingHours = useMemo(() => {
    const events = calendarEvents;
    const availabilityEvents = events.filter((e) => e.type === 'availability');

    if (availabilityEvents.length === 0) {
      // Default working hours
      return { start: '09:00', end: '17:00' };
    }

    // Find earliest start and latest end times
    let earliestHour = 24;
    let latestHour = 0;

    availabilityEvents.forEach((event) => {
      const startHour = event.startTime.getHours();
      const startMinutes = event.startTime.getMinutes();
      const endHour = event.endTime.getHours();
      const endMinutes = event.endTime.getMinutes();

      const startDecimal = startHour + startMinutes / 60;
      const endDecimal = endHour + endMinutes / 60;

      if (startDecimal < earliestHour) {
        earliestHour = startDecimal;
      }
      if (endDecimal > latestHour) {
        latestHour = endDecimal;
      }
    });

    // Convert back to HH:MM format
    const formatTime = (decimal: number) => {
      const hours = Math.floor(decimal);
      const minutes = Math.round((decimal - hours) * 60);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    return {
      start: earliestHour < 24 ? formatTime(earliestHour) : '09:00',
      end: latestHour > 0 ? formatTime(latestHour) : '17:00',
    };
  }, [calendarEvents]);

  const navigateDate = useCallback(
    (direction: 'prev' | 'next') => {
      const newDate = navigateCalendarDate(currentDate, direction, viewMode);
      setCurrentDate(newDate);
    },
    [currentDate, viewMode]
  );

  const handleDateClick = useCallback(
    (date: Date) => {
      setCurrentDate(date);
      setViewMode('day');
      onDateClick?.(date);
    },
    [onDateClick]
  );

  // Use shared event styling utility with memoization
  const getEventStyleLocal = useCallback((event: CalendarEvent): string => {
    return getEventStyle(event);
  }, []);

  // Optimized event filtering and sorting for large datasets
  const optimizedEvents = useMemo(() => {
    const events = calendarEvents;
    if (!events.length) return [];

    // Sort events for optimal rendering performance
    const sorted = sortEventsForRendering(events);

    // For month view, group events by date for efficient rendering
    if (viewMode === 'month') {
      const grouped = groupEventsByDate(sorted);
      return Array.from(grouped.values()).flat();
    }

    return sorted;
  }, [calendarEvents, viewMode]);

  // Record performance metrics when data changes
  useEffect(() => {
    if (calendarEvents.length > 0) {
      recordCalendarCyclePerformance(calendarEvents.length, viewMode, dateRange);
    }
  }, [calendarEvents, viewMode, dateRange]);

  // Early return for loading state
  if (isLoading) {
    return <CalendarSkeleton />;
  }

  // Early return if no provider data
  if (!providerData || !providerQuery) {
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

  // Provider data already extracted above before early returns

  // Early return if provider data is not loaded
  if (!provider) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="py-8 text-center text-muted-foreground">
            <CalendarIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>No provider data available</p>
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
                <UserAvatar
                  name={provider.user?.name}
                  image={provider.user?.image}
                  email={provider.user?.email}
                  className="h-12 w-12"
                />
                <div>
                  <CardTitle className="text-xl">{provider.user?.name || 'Provider'}</CardTitle>
                  <p className="text-sm text-muted-foreground">Healthcare Provider</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="grid grid-cols-2 gap-3 text-center md:grid-cols-4 md:gap-4">
                  <div>
                    <div className="text-lg font-bold text-blue-600 md:text-2xl">
                      {stats.utilizationRate}%
                    </div>
                    <div className="text-xs text-muted-foreground">Utilization</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600 md:text-2xl">
                      {stats.bookedHours}
                    </div>
                    <div className="text-xs text-muted-foreground">Booked Hours</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-orange-600 md:text-2xl">
                      {stats.pendingBookings}
                    </div>
                    <div className="text-xs text-muted-foreground">Pending</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600 md:text-2xl">
                      {stats.completedBookings}
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
                  <DatePicker
                    date={currentDate}
                    onChange={(date) => date && setCurrentDate(date)}
                  />
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
                events={optimizedEvents}
                workingHours={workingHours}
                onEventClick={(event, clickEvent) =>
                  onEventClick?.(event, clickEvent || ({} as React.MouseEvent))
                }
                onTimeSlotClick={onTimeSlotClick}
                getEventStyle={getEventStyleLocal}
              />
            )}
            {viewMode === '3-day' && (
              <ThreeDayView
                currentDate={currentDate}
                events={optimizedEvents}
                workingHours={workingHours}
                onEventClick={(event, clickEvent) =>
                  onEventClick?.(event, clickEvent || ({} as React.MouseEvent))
                }
                onTimeSlotClick={onTimeSlotClick}
                getEventStyle={getEventStyleLocal}
              />
            )}
            {viewMode === 'week' && (
              <WeekView
                currentDate={currentDate}
                events={optimizedEvents}
                workingHours={workingHours}
                onEventClick={(event, clickEvent) =>
                  onEventClick?.(event, clickEvent || ({} as React.MouseEvent))
                }
                onTimeSlotClick={onTimeSlotClick}
                onDateClick={handleDateClick}
                getEventStyle={getEventStyleLocal}
              />
            )}
            {viewMode === 'month' && (
              <MonthView
                currentDate={currentDate}
                events={optimizedEvents}
                onEventClick={(event, clickEvent) =>
                  onEventClick?.(event, clickEvent || ({} as React.MouseEvent))
                }
                onDateClick={handleDateClick}
                onEditEvent={onEditEvent}
                getEventStyle={getEventStyleLocal}
              />
            )}
          </CardContent>
        </Card>

        
      </div>
    </CalendarErrorBoundary>
  );
}
