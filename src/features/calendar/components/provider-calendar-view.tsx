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
import { CalendarEventModal } from '@/features/calendar/components/modal/calendar-event-modal';
import { AvailabilityDayView } from '@/features/calendar/components/views/availability-day-view';
import { AvailabilityMonthView } from '@/features/calendar/components/views/availability-month-view';
import { AvailabilityThreeDayView } from '@/features/calendar/components/views/availability-three-day-view';
import { AvailabilityWeekView } from '@/features/calendar/components/views/availability-week-view';
import { useCalendarData } from '@/features/calendar/hooks/use-calendar-data';
import {
  calculateDateRange,
  navigateCalendarDate
} from '@/features/calendar/lib/calendar-utils';
import { CalendarViewMode } from '@/features/calendar/types/types';
import type { CalendarEventModalState, CalendarEventPermissions } from '@/features/calendar/types/modal';
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
  onAvailabilityClick?: (availability: AvailabilityData, clickEvent: React.MouseEvent) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
  onCreateAvailability?: () => void;
  onEditAvailability?: (availability: AvailabilityData) => void;
  onDateClick?: (date: Date) => void;
  viewMode?: CalendarViewMode;
  initialDate?: Date;
}

export function ProviderCalendarView({
  providerId,
  onAvailabilityClick,
  onTimeSlotClick,
  onCreateAvailability,
  onEditAvailability,
  onDateClick,
  viewMode: initialViewMode = 'week',
  initialDate = new Date(),
}: ProviderCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [viewMode, setViewMode] = useState<CalendarViewMode>(initialViewMode);
  const [statusFilter, setStatusFilter] = useState<AvailabilityStatus | 'ALL'>('ALL');
  const [isMobile, setIsMobile] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Calendar Event Modal state
  const [modalState, setModalState] = useState<CalendarEventModalState>({
    isOpen: false,
    selectedEvent: null,
    currentStep: 'event-details',
    selectedScope: null,
    pendingAction: null,
    actionData: {},
  });

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
  const calculateDayHours = useCallback((availabilities: AvailabilityData[]) => {
    if (availabilities.length === 0) return 0;

    // Sort availabilities by start time
    const sortedAvailabilities = [...availabilities].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    // Merge overlapping availabilities to avoid double counting
    const mergedAvailabilities = [];
    let currentAvailability = sortedAvailabilities[0];

    for (let i = 1; i < sortedAvailabilities.length; i++) {
      const nextAvailability = sortedAvailabilities[i];
      const currentEnd = new Date(currentAvailability.endTime);
      const nextStart = new Date(nextAvailability.startTime);

      // If availabilities overlap, merge them
      if (currentEnd >= nextStart) {
        currentAvailability = {
          ...currentAvailability,
          endTime: new Date(Math.max(currentEnd.getTime(), new Date(nextAvailability.endTime).getTime())),
        };
      } else {
        mergedAvailabilities.push(currentAvailability);
        currentAvailability = nextAvailability;
      }
    }
    mergedAvailabilities.push(currentAvailability);

    // Calculate total hours
    return mergedAvailabilities.reduce((total, availability) => {
      const duration = (new Date(availability.endTime).getTime() - new Date(availability.startTime).getTime()) / (1000 * 60 * 60);
      return total + duration;
    }, 0);
  }, []);

  // Get status breakdown for a day with memoization
  const getStatusBreakdown = useCallback((availabilities: AvailabilityData[]) => {
    const breakdown = {
      [AvailabilityStatus.PENDING]: 0,
      [AvailabilityStatus.ACCEPTED]: 0,
      [AvailabilityStatus.REJECTED]: 0,
    };

    availabilities.forEach((availability) => {
      breakdown[availability.status]++;
    });

    return breakdown;
  }, []);

  // Get styling based on status mix with memoization
  const getHoursSummaryStyle = useCallback(
    (availabilities: AvailabilityData[]) => {
      const breakdown = getStatusBreakdown(availabilities);
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

  // Get availabilities data directly (no transformation needed)
  const availabilities: AvailabilitySearchResult = useMemo(() => {
    return availabilityQuery?.data || [];
  }, [availabilityQuery?.data]);

  // Calculate stats from availability data
  const stats = useMemo(() => {
    // Calculate total available hours
    const totalAvailableHours = availabilities.reduce((total, availability) => {
      const hours = (new Date(availability.endTime).getTime() - new Date(availability.startTime).getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);

    // Calculate booked hours and bookings from slots
    let bookedHours = 0;
    let pendingBookings = 0;
    let completedBookings = 0;

    availabilities.forEach((availability) => {
      if (availability.calculatedSlots) {
        availability.calculatedSlots.forEach((slot: any) => {
          if (slot.booking) {
            const slotHours = (new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / (1000 * 60 * 60);
            bookedHours += slotHours;
            
            if (slot.booking.status === 'PENDING') {
              pendingBookings++;
            } else if (slot.booking.status === 'CONFIRMED' || slot.booking.status === 'COMPLETED') {
              completedBookings++;
            }
          }
        });
      }
    });

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
  }, [availabilities]);

  // Derive working hours from availability data or use defaults
  const workingHours = useMemo(() => {
    if (availabilities.length === 0) {
      // Default working hours
      return { start: '09:00', end: '17:00' };
    }

    // Find earliest start and latest end times
    let earliestHour = 24;
    let latestHour = 0;

    availabilities.forEach((availability) => {
      const startTime = new Date(availability.startTime);
      const endTime = new Date(availability.endTime);
      
      const startHour = startTime.getHours();
      const startMinutes = startTime.getMinutes();
      const endHour = endTime.getHours();
      const endMinutes = endTime.getMinutes();

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
  }, [availabilities]);

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

  // Get availability style based on status
  const getAvailabilityStyle = useCallback((availability: AvailabilityData): string => {
    switch (availability.status) {
      case AvailabilityStatus.ACCEPTED:
        return 'bg-green-100 border-green-300 text-green-900';
      case AvailabilityStatus.PENDING:
        return 'bg-yellow-100 border-yellow-300 text-yellow-900';
      case AvailabilityStatus.REJECTED:
        return 'bg-red-100 border-red-300 text-red-900';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-900';
    }
  }, []);

  // Filter and prepare availabilities for display
  const displayAvailabilities = useMemo(() => {
    // Filter by status if needed
    const filtered = statusFilter === 'ALL' 
      ? availabilities 
      : availabilities.filter(a => a.status === statusFilter);

    // Sort by start time
    return filtered.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }, [availabilities, statusFilter]);

  // Handle availability click - open modal with view action by default
  const handleAvailabilityClick = useCallback((availability: AvailabilityData, clickEvent?: React.MouseEvent) => {
    if (clickEvent) {
      clickEvent.preventDefault();
      clickEvent.stopPropagation();
    }
    
    // Check if this is a recurring availability
    // If it's recurring, start with scope selection, otherwise go directly to details
    const isRecurring = availability.isRecurring && availability.seriesId;
    
    setModalState({
      isOpen: true,
      selectedEvent: availability,
      currentStep: isRecurring ? 'scope-selection' : 'event-details',
      selectedScope: isRecurring ? null : 'single',
      pendingAction: 'view',
      actionData: {},
    });

    // Call parent callback if provided
    if (clickEvent) {
      onAvailabilityClick?.(availability, clickEvent);
    }
  }, [onAvailabilityClick]);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setModalState({
      isOpen: false,
      selectedEvent: null,
      currentStep: 'event-details',
      selectedScope: null,
      pendingAction: null,
      actionData: {},
    });
  }, []);

  // Modal action handlers
  const handleSelectScope = useCallback((scope: any) => {
    setModalState(prev => ({
      ...prev,
      selectedScope: scope,
      currentStep: 'event-details',
    }));
  }, []);

  const handleSetPendingAction = useCallback((action: any) => {
    setModalState(prev => {
      const event = prev.selectedEvent;
      const isRecurring = event?.isRecurring && event?.seriesId;
      
      // For recurring events, we need to select scope first (unless it's just viewing)
      if (isRecurring && action !== 'view' && !prev.selectedScope) {
        return {
          ...prev,
          pendingAction: action,
          currentStep: 'scope-selection',
        };
      }
      
      // For destructive actions, show confirmation
      if (action === 'delete' || action === 'cancel') {
        return {
          ...prev,
          pendingAction: action,
          currentStep: 'action-confirmation',
        };
      }
      
      return {
        ...prev,
        pendingAction: action,
        currentStep: 'event-details',
      };
    });
  }, []);

  const handleSetActionData = useCallback((data: Record<string, any>) => {
    setModalState(prev => ({
      ...prev,
      actionData: { ...prev.actionData, ...data },
    }));
  }, []);

  const handleExecuteAction = useCallback(() => {
    // Handle the actual action execution here
    // For now, just close the modal
    handleModalClose();
    
    // TODO: Implement actual action execution logic based on modalState.pendingAction
    // This would call tRPC mutations for edit/delete/accept/reject actions
  }, [handleModalClose]);

  // Define permissions for calendar events (provider can view/edit/delete their own availability)
  const modalPermissions: CalendarEventPermissions = useMemo(() => ({
    canView: true,
    canEdit: true,
    canDelete: true,
    canAccept: false, // Only org members can accept provider availability
    canReject: false, // Only org members can reject provider availability  
    canCancel: false, // Bookings can be cancelled, not availability
    canCreate: true,
  }), []);

  // Record performance metrics when data changes
  useEffect(() => {
    if (availabilities.length > 0) {
      recordCalendarCyclePerformance(availabilities.length, viewMode, dateRange);
    }
  }, [availabilities, viewMode, dateRange]);

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
                <div className="grid grid-cols-2 gap-3 text-center md:grid-cols-5 md:gap-4">
                  <div>
                    <div className="text-lg font-bold text-indigo-600 md:text-2xl">
                      {stats.totalAvailableHours}
                    </div>
                    <div className="text-xs text-muted-foreground">Available Hours</div>
                  </div>
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
              <AvailabilityDayView
                currentDate={currentDate}
                events={displayAvailabilities}
                workingHours={workingHours}
                onEventClick={handleAvailabilityClick}
                onTimeSlotClick={onTimeSlotClick}
                getEventStyle={getAvailabilityStyle}
              />
            )}
            {viewMode === '3-day' && (
              <AvailabilityThreeDayView
                currentDate={currentDate}
                events={displayAvailabilities}
                workingHours={workingHours}
                onEventClick={handleAvailabilityClick}
                onTimeSlotClick={onTimeSlotClick}
                getEventStyle={getAvailabilityStyle}
              />
            )}
            {viewMode === 'week' && (
              <AvailabilityWeekView
                currentDate={currentDate}
                events={displayAvailabilities}
                workingHours={workingHours}
                onEventClick={handleAvailabilityClick}
                onTimeSlotClick={onTimeSlotClick}
                onDateClick={handleDateClick}
                getEventStyle={getAvailabilityStyle}
              />
            )}
            {viewMode === 'month' && (
              <AvailabilityMonthView
                currentDate={currentDate}
                events={displayAvailabilities}
                onEventClick={handleAvailabilityClick}
                onDateClick={handleDateClick}
                onEditEvent={onEditAvailability}
                getEventStyle={getAvailabilityStyle}
              />
            )}
          </CardContent>
        </Card>

        {/* Calendar Event Modal */}
        <CalendarEventModal
          state={modalState}
          permissions={modalPermissions}
          onSelectScope={handleSelectScope}
          onSetPendingAction={handleSetPendingAction}
          onSetActionData={handleSetActionData}
          onExecuteAction={handleExecuteAction}
          onClose={handleModalClose}
        />
      </div>
    </CalendarErrorBoundary>
  );
}
