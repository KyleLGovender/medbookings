'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

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
import { BookingSlotModal, type BookingFormData } from '@/features/calendar/components/booking-slot-modal';
import { BookingSuccessToast } from '@/features/calendar/components/booking-success-toast';
import { CalendarErrorBoundary } from '@/features/calendar/components/error-boundary';
import { CalendarSkeleton } from '@/features/calendar/components/loading';
import { DayView } from '@/features/calendar/components/views/day-view';
import { MonthView } from '@/features/calendar/components/views/month-view';
import { ThreeDayView } from '@/features/calendar/components/views/three-day-view';
import { WeekView } from '@/features/calendar/components/views/week-view';
import { useCreateBooking } from '@/features/calendar/hooks/use-create-booking';
import { useProviderSlots } from '@/features/calendar/hooks/use-provider-slots';
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
type ProviderSlotsResult = RouterOutputs['calendar']['getAvailableSlots'];
type SlotData = ProviderSlotsResult[number];

// Performance monitoring functions removed - using simplified approach
const measureCalendarDataProcessing = (fn: () => any) => fn();
const measureCalendarRendering = (fn: () => any) => fn();
const recordCalendarCyclePerformance = (eventCount: number, viewMode: string, dateRange: any) => {};
const usePerformanceMonitor = (name: string, deps: any[]) => ({
  startMeasurement: () => {},
  endMeasurement: () => {},
});

export interface ProviderCalendarSlotViewProps {
  providerId: string;
  viewMode?: CalendarViewMode;
  initialDate?: Date;
  searchParams?: { [key: string]: string | string[] | undefined };
}

export function ProviderCalendarSlotView({
  providerId,
  viewMode: initialViewMode = 'week',
  initialDate = new Date(),
  searchParams,
}: ProviderCalendarSlotViewProps) {
  const router = useRouter();
  const searchParamsObj = useSearchParams();
  
  // Initialize state from URL search params or defaults
  const [currentDate, setCurrentDate] = useState(() => {
    const dateParam = searchParams?.date;
    if (typeof dateParam === 'string') {
      const parsedDate = new Date(dateParam);
      return isNaN(parsedDate.getTime()) ? initialDate : parsedDate;
    }
    return initialDate;
  });
  
  const [viewMode, setViewMode] = useState<CalendarViewMode>(() => {
    const viewParam = searchParams?.view;
    if (typeof viewParam === 'string' && ['day', '3-day', 'week', 'month'].includes(viewParam)) {
      return viewParam as CalendarViewMode;
    }
    return initialViewMode;
  });
  
  const [serviceFilter, setServiceFilter] = useState<string>(() => {
    const serviceParam = searchParams?.service;
    return typeof serviceParam === 'string' ? serviceParam : 'ALL';
  });
  
  const [isMobile, setIsMobile] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [lastBookingDetails, setLastBookingDetails] = useState<{
    providerName: string;
    appointmentTime: string;
  } | null>(null);

  // Performance monitoring
  usePerformanceMonitor('ProviderCalendarSlotView', [currentDate, viewMode, serviceFilter]);

  // Function to update URL search params
  const updateSearchParams = useCallback((updates: { date?: Date; view?: CalendarViewMode; service?: string }) => {
    const params = new URLSearchParams(searchParamsObj);
    
    if (updates.date) {
      params.set('date', updates.date.toISOString().split('T')[0]);
    }
    if (updates.view) {
      params.set('view', updates.view);
    }
    if (updates.service) {
      params.set('service', updates.service);
    }
    
    router.replace(`/calendar/${providerId}?${params.toString()}`, { scroll: false });
  }, [router, providerId, searchParamsObj]);

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

  // Calculate date range using the helper function
  const dateRange = useMemo(() => {
    return calculateDateRange(currentDate, viewMode);
  }, [currentDate, viewMode]);

  // Use provider slots hook to fetch slot data
  const {
    data: slotsData,
    isLoading,
    error: slotsError,
    provider,
    availableServices,
  } = useProviderSlots({
    providerId,
    dateRange,
    serviceId: serviceFilter === 'ALL' ? undefined : serviceFilter,
  });

  // Create booking mutation
  const createBookingMutation = useCreateBooking({
    onSuccess: (data, variables) => {
      // Close the booking modal
      setIsBookingModalOpen(false);
      setSelectedSlot(null);

      // Set up success toast details
      if (provider && selectedSlot) {
        setLastBookingDetails({
          providerName: provider.user?.name || 'Provider',
          appointmentTime: `${selectedSlot.startTime.toLocaleDateString()} at ${selectedSlot.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        });
        setShowSuccessToast(true);
      }
    },
    onError: (error) => {
      console.error('Booking failed:', error);
      // Keep modal open to show error
    },
  });

  // Preload the image when provider data is available - must be before early returns
  useEffect(() => {
    if (provider?.user?.image) {
      const img = new window.Image();
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setImageLoaded(false);
      img.src = provider.user.image;
    }
  }, [provider?.user?.image]);

  // Transform slot data to calendar events
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    const slots: ProviderSlotsResult = slotsData || [];
    if (!Array.isArray(slots)) return [];

    // Transform slots to CalendarEvent format
    const events: CalendarEvent[] = [];

    slots.forEach((slot: SlotData) => {
      // Only show available slots (not booked)
      if (!slot.booking) {
        events.push({
          id: slot.id,
          type: 'slot' as const,
          title: slot.service ? `${slot.service.name}` : 'Available Slot',
          startTime: new Date(slot.startTime),
          endTime: new Date(slot.endTime),
          status: 'AVAILABLE',
          service: slot.service ? {
            id: slot.service.id,
            name: slot.service.name,
            duration: slot.serviceConfig?.duration || 30, // Default to 30 minutes if not specified
            price: slot.serviceConfig?.price || slot.service.defaultPrice || 0,
          } : undefined,
          location: slot.availability?.location
            ? {
                id: slot.availability.location.id,
                name: slot.availability.location.name || 'Location',
                isOnline: slot.availability.isOnlineAvailable,
              }
            : undefined,
          provider: {
            id: slot.availability?.provider?.id || '',
            name: slot.availability?.provider?.user?.name || 'Provider',
            image: slot.availability?.provider?.user?.image,
          },
          // Additional slot data for booking
          slotData: slot,
        });
      } else {
        // Show booked slots as unavailable
        events.push({
          id: slot.booking.id,
          type: 'booking' as const,
          title: 'Booked',
          startTime: new Date(slot.startTime),
          endTime: new Date(slot.endTime),
          status: slot.booking.status,
          customer: {
            id: slot.booking.customerId || slot.booking.id,
            name: 'Booked', // Don't show customer name for privacy
          },
        });
      }
    });

    return events;
  }, [slotsData]);

  // Calculate stats from slot data
  const stats = useMemo(() => {
    const events = calendarEvents;

    // Calculate available slots
    const availableSlots = events.filter(event => event.type === 'slot').length;

    // Calculate booked slots  
    const bookedSlots = events.filter(event => event.type === 'booking').length;

    // Calculate total slots
    const totalSlots = availableSlots + bookedSlots;

    // Calculate utilization rate
    const utilizationRate = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;

    // Calculate confirmed bookings
    const confirmedBookings = events.filter(
      event => event.type === 'booking' && event.status === 'CONFIRMED'
    ).length;

    return {
      utilizationRate,
      availableSlots,
      bookedSlots,
      totalSlots,
      confirmedBookings,
    };
  }, [calendarEvents]);

  // Derive working hours from slot data or use defaults
  const workingHours = useMemo(() => {
    const events = calendarEvents;
    const slotEvents = events.filter((e) => e.type === 'slot' || e.type === 'booking');

    if (slotEvents.length === 0) {
      // Default working hours
      return { start: '09:00', end: '17:00' };
    }

    // Find earliest start and latest end times
    let earliestHour = 24;
    let latestHour = 0;

    slotEvents.forEach((event) => {
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
      updateSearchParams({ date: newDate });
    },
    [currentDate, viewMode, updateSearchParams]
  );

  const handleDateClick = useCallback(
    (date: Date) => {
      setCurrentDate(date);
      setViewMode('day');
      updateSearchParams({ date, view: 'day' });
    },
    [updateSearchParams]
  );

  // Handle slot click to open booking modal
  const handleSlotClick = useCallback(
    (event: CalendarEvent, clickEvent?: React.MouseEvent) => {
      // Only allow booking of available slots
      if (event.type === 'slot' && event.slotData) {
        setSelectedSlot(event.slotData);
        setIsBookingModalOpen(true);
      }
    },
    []
  );

  // Handle booking confirmation
  const handleBookingConfirm = useCallback(
    (bookingData: BookingFormData) => {
      createBookingMutation.mutate({
        slotId: bookingData.slotId,
        clientName: bookingData.clientName,
        clientEmail: bookingData.clientEmail,
        clientPhone: bookingData.clientPhone,
        notes: bookingData.notes,
      });
    },
    [createBookingMutation]
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

  // Early return if error
  if (slotsError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="py-8 text-center text-muted-foreground">
            <CalendarIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>Error loading calendar data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Early return if no provider data
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
                <div className="grid grid-cols-2 gap-3 text-center md:grid-cols-2 md:gap-4">
                  <div>
                    <div className="text-lg font-bold text-indigo-600 md:text-2xl">
                      {stats.totalSlots}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Slots</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600 md:text-2xl">
                      {stats.availableSlots}
                    </div>
                    <div className="text-xs text-muted-foreground">Available</div>
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
                    onChange={(date) => {
                      if (date) {
                        setCurrentDate(date);
                        updateSearchParams({ date });
                      }
                    }}
                  />
                  <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    const today = new Date();
                    setCurrentDate(today);
                    updateSearchParams({ date: today });
                  }}>
                    Today
                  </Button>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
                <Select
                  value={viewMode}
                  onValueChange={(value: CalendarViewMode) => {
                    setViewMode(value);
                    updateSearchParams({ view: value });
                  }}
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
                  value={serviceFilter}
                  onValueChange={(value: string) => {
                    setServiceFilter(value);
                    updateSearchParams({ service: value });
                  }}
                >
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Services</SelectItem>
                    {availableServices?.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {viewMode === 'day' && (
              <DayView
                currentDate={currentDate}
                events={optimizedEvents}
                workingHours={workingHours}
                onEventClick={handleSlotClick}
                getEventStyle={getEventStyleLocal}
              />
            )}
            {viewMode === '3-day' && (
              <ThreeDayView
                currentDate={currentDate}
                events={optimizedEvents}
                workingHours={workingHours}
                onEventClick={handleSlotClick}
                getEventStyle={getEventStyleLocal}
              />
            )}
            {viewMode === 'week' && (
              <WeekView
                currentDate={currentDate}
                events={optimizedEvents}
                workingHours={workingHours}
                onEventClick={handleSlotClick}
                onDateClick={handleDateClick}
                getEventStyle={getEventStyleLocal}
              />
            )}
            {viewMode === 'month' && (
              <MonthView
                currentDate={currentDate}
                events={optimizedEvents}
                onEventClick={handleSlotClick}
                onDateClick={handleDateClick}
                getEventStyle={getEventStyleLocal}
              />
            )}
          </CardContent>
        </Card>

        {/* Booking Modal */}
        <BookingSlotModal
          slot={selectedSlot}
          open={isBookingModalOpen}
          onOpenChange={setIsBookingModalOpen}
          onBookingConfirm={handleBookingConfirm}
          isLoading={createBookingMutation.isPending}
        />

        {/* Success Toast */}
        <BookingSuccessToast
          show={showSuccessToast}
          onClose={() => setShowSuccessToast(false)}
          providerName={lastBookingDetails?.providerName || ''}
          appointmentTime={lastBookingDetails?.appointmentTime || ''}
        />
      </div>
    </CalendarErrorBoundary>
  );
}
