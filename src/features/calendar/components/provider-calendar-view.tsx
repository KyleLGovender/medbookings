'use client';

import React, { useMemo, useState } from 'react';

import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

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
import { useAvailabilitySearch } from '@/features/calendar/hooks/use-availability';
import {
  AvailabilityStatus,
  AvailabilityWithRelations,
  CalculatedAvailabilitySlotWithRelations,
  CalendarEvent,
  CalendarViewMode,
  SchedulingRule,
} from '@/features/calendar/types/types';
import { useProvider } from '@/features/providers/hooks/use-provider';

// Client-safe enum (matches Prisma BookingStatus)
enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}

interface ProviderCalendarData {
  providerId: string;
  providerName: string;
  providerType: string;
  workingHours: { start: string; end: string };
  events: CalendarEvent[];
  stats: {
    totalAvailabilityHours: number;
    bookedHours: number;
    utilizationRate: number;
    pendingBookings: number;
    completedBookings: number;
  };
}

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
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<AvailabilityStatus | 'ALL'>('ALL');

  // Modal state (context menu removed - modal now handled by parent)

  // Calculate total hours for a day
  const calculateDayHours = (events: CalendarEvent[]) => {
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
  };

  // Get status breakdown for a day
  const getStatusBreakdown = (events: CalendarEvent[]) => {
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
  };

  // Get styling based on status mix
  const getHoursSummaryStyle = (events: CalendarEvent[]) => {
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
  };

  // Fetch real data from API
  const { data: provider, isLoading: isProviderLoading } = useProvider(providerId);

  // Calculate date range for current view
  const dateRange = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    switch (viewMode) {
      case 'day':
        // Set start to beginning of day
        start.setHours(0, 0, 0, 0);
        // Set end to end of day
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        // Monday as first day (1 = Monday, 0 = Sunday)
        const dayOfWeek = currentDate.getDay();
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        start.setDate(currentDate.getDate() - daysFromMonday);
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(start.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { start, end };
  }, [currentDate, viewMode]);

  const { data: availabilityData, isLoading: isAvailabilityLoading } = useAvailabilitySearch({
    providerId: providerId,
    startDate: dateRange.start,
    endDate: dateRange.end,
    ...(statusFilter !== 'ALL' && { status: statusFilter }),
  });

  const isLoading = isProviderLoading || isAvailabilityLoading;

  // Transform availability data into calendar events
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
      providerType: 'Healthcare Provider', // TODO: Update provider data to include typeAssignments
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

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);

    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }

    setCurrentDate(newDate);
  };

  const handleDateClick = (date: Date) => {
    setCurrentDate(date);
    setViewMode('day');
    onDateClick?.(date);
  };

  const getViewTitle = (): string => {
    switch (viewMode) {
      case 'day':
        return currentDate.toLocaleDateString([], {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      case '3-day':
        return currentDate.toLocaleDateString([], {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      case 'week':
        const startOfWeek = new Date(currentDate);
        const dayOfWeek = currentDate.getDay();
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startOfWeek.setDate(currentDate.getDate() - daysFromMonday);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `${startOfWeek.toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'month':
        return currentDate.toLocaleDateString([], { year: 'numeric', month: 'long' });
    }
  };

  const getEventStyle = (event: CalendarEvent): string => {
    switch (event.type) {
      case 'availability':
        // Provider-created availabilities (green tones)
        if (event.isProviderCreated) {
          switch (event.status) {
            case AvailabilityStatus.ACCEPTED:
              return 'bg-green-100 border-green-400 text-green-800';
            case AvailabilityStatus.CANCELLED:
              return 'bg-green-50 border-green-300 text-green-600';
            default:
              return 'bg-green-100 border-green-400 text-green-800';
          }
        }
        // Organization-created availabilities (blue/yellow tones)
        else {
          switch (event.status) {
            case AvailabilityStatus.PENDING:
              return 'bg-yellow-100 border-yellow-400 text-yellow-800';
            case AvailabilityStatus.ACCEPTED:
              return 'bg-blue-100 border-blue-400 text-blue-800';
            case AvailabilityStatus.REJECTED:
              return 'bg-red-100 border-red-400 text-red-800';
            case AvailabilityStatus.CANCELLED:
              return 'bg-gray-100 border-gray-400 text-gray-800';
            default:
              return 'bg-blue-100 border-blue-400 text-blue-800';
          }
        }
      case 'booking':
        switch (event.status) {
          case 'BOOKED':
            return 'bg-purple-100 border-purple-300 text-purple-800';
          case 'PENDING':
            return 'bg-orange-100 border-orange-300 text-orange-800';
          default:
            return 'bg-purple-100 border-purple-300 text-purple-800';
        }
      case 'blocked':
        return 'bg-red-100 border-red-300 text-red-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-1/3 rounded bg-gray-200"></div>
            <div className="h-64 rounded bg-gray-200"></div>
          </div>
        </CardContent>
      </Card>
    );
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
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
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
              events={calendarData.events}
              workingHours={calendarData.workingHours}
              onEventClick={(event) => onEventClick?.(event, {} as React.MouseEvent)}
              onTimeSlotClick={onTimeSlotClick}
              getEventStyle={getEventStyle}
            />
          )}
          {viewMode === '3-day' && (
            <ThreeDayView
              currentDate={currentDate}
              events={calendarData.events}
              workingHours={calendarData.workingHours}
              onEventClick={(event) => onEventClick?.(event, {} as React.MouseEvent)}
              onTimeSlotClick={onTimeSlotClick}
              getEventStyle={getEventStyle}
            />
          )}
          {viewMode === 'week' && (
            <WeekView
              currentDate={currentDate}
              events={calendarData.events}
              workingHours={calendarData.workingHours}
              onEventClick={(event) => onEventClick?.(event, {} as React.MouseEvent)}
              onTimeSlotClick={onTimeSlotClick}
              onDateClick={handleDateClick}
              getEventStyle={getEventStyle}
            />
          )}
          {viewMode === 'month' && (
            <MonthView
              currentDate={currentDate}
              events={calendarData.events}
              onEventClick={onEventClick}
              onDateClick={handleDateClick}
              onEditEvent={onEditEvent}
              getEventStyle={getEventStyle}
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
  );
}
