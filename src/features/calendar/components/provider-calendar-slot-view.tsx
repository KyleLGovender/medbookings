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
import {
  type BookingFormData,
  BookingSlotModal,
} from '@/features/calendar/components/booking-slot-modal';
import { BookingSuccessToast } from '@/features/calendar/components/booking-success-toast';
import { CalendarErrorBoundary } from '@/features/calendar/components/error-boundary';
import { CalendarSkeleton } from '@/features/calendar/components/loading';
import { SlotDayView } from '@/features/calendar/components/views/slot-day-view';
import { SlotThreeDayView } from '@/features/calendar/components/views/slot-three-day-view';
import { SlotWeekView } from '@/features/calendar/components/views/slot-week-view';
import { useCreateBooking } from '@/features/calendar/hooks/use-create-booking';
import { useProviderSlots } from '@/features/calendar/hooks/use-provider-slots';
import { calculateDateRange, navigateCalendarDate } from '@/features/calendar/lib/calendar-utils';
import { type BookingSlot } from '@/features/calendar/types/types';
import { CalendarViewMode } from '@/features/calendar/types/types';
import { logger } from '@/lib/logger';
import { nowUTC, parseUTC } from '@/lib/timezone';
import type { RouterOutputs } from '@/utils/api';

// Extract proper types for strong typing
type ProviderSlotsResult = RouterOutputs['calendar']['getProviderSlots'];
type SlotData = ProviderSlotsResult[number];

// Performance monitoring functions removed - using simplified approach
const measureCalendarDataProcessing = (fn: () => unknown) => fn();
const measureCalendarRendering = (fn: () => unknown) => fn();
const recordCalendarCyclePerformance = (
  eventCount: number,
  viewMode: string,
  dateRange: unknown
) => {};
const usePerformanceMonitor = (name: string, deps: unknown[]) => ({
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
  initialDate = nowUTC(),
  searchParams,
}: ProviderCalendarSlotViewProps) {
  const router = useRouter();
  const searchParamsObj = useSearchParams();

  // Initialize state from URL search params or defaults
  const [currentDate, setCurrentDate] = useState(() => {
    const dateParam = searchParams?.date;
    if (typeof dateParam === 'string') {
      const parsedDate = parseUTC(dateParam);
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
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [lastBookingDetails, setLastBookingDetails] = useState<{
    providerName: string;
    appointmentTime: string;
  } | null>(null);

  // Performance monitoring
  usePerformanceMonitor('ProviderCalendarSlotView', [currentDate, viewMode, serviceFilter]);

  // Function to update URL search params
  const updateSearchParams = useCallback(
    (updates: { date?: Date; view?: CalendarViewMode; service?: string }) => {
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
    },
    [router, providerId, searchParamsObj]
  );

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
  } = useProviderSlots({
    providerId,
    dateRange,
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
      logger.error('Booking failed', {
        error: error instanceof Error ? error.message : String(error),
      });
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

  // Get unique services from slot data for filtering
  const availableServices = useMemo(() => {
    const slots: ProviderSlotsResult = slotsData || [];
    if (!Array.isArray(slots)) return [];

    const serviceMap = new Map<string, { id: string; name: string }>();

    slots.forEach((slot: SlotData) => {
      if (slot.service && !serviceMap.has(slot.service.id)) {
        serviceMap.set(slot.service.id, {
          id: slot.service.id,
          name: slot.service.name,
        });
      }
    });

    return Array.from(serviceMap.values()) as Array<{ id: string; name: string }>;
  }, [slotsData]);

  // Helper functions to convert between service names and IDs for URL readability
  const getServiceIdByName = useCallback(
    (serviceName: string) => {
      const service = availableServices.find(
        (s) => s.name.toLowerCase().replace(/\s+/g, '-') === serviceName.toLowerCase()
      );
      return service?.id || serviceName; // Fallback to original if not found
    },
    [availableServices]
  );

  const getServiceNameForUrl = useCallback(
    (serviceId: string) => {
      if (serviceId === 'ALL') return 'all';
      const service = availableServices.find((s) => s.id === serviceId);
      return service ? service.name.toLowerCase().replace(/\s+/g, '-') : serviceId;
    },
    [availableServices]
  );

  const getServiceIdFromUrl = useCallback(
    (urlParam: string) => {
      if (urlParam === 'all') return 'ALL';
      return getServiceIdByName(urlParam);
    },
    [getServiceIdByName]
  );

  // Initialize service filter from URL param (convert URL name back to ID)
  useEffect(() => {
    const serviceParam = searchParams?.service;
    if (
      typeof serviceParam === 'string' &&
      serviceParam !== 'ALL' &&
      availableServices.length > 0
    ) {
      const serviceId = getServiceIdFromUrl(serviceParam);
      if (serviceId !== serviceFilter) {
        setServiceFilter(serviceId);
      }
    }
  }, [searchParams?.service, availableServices, serviceFilter, getServiceIdFromUrl]);

  // Auto-select service if there's only one service and no filter is set
  useEffect(() => {
    if (availableServices.length === 1 && serviceFilter === 'ALL') {
      const service = availableServices[0];
      setServiceFilter(service.id);
      updateSearchParams({ service: getServiceNameForUrl(service.id) });
    }
  }, [availableServices, serviceFilter, updateSearchParams, getServiceNameForUrl]);

  // Filter slots based on service selection
  const filteredSlots = useMemo(() => {
    const slots: ProviderSlotsResult = slotsData || [];
    if (!Array.isArray(slots)) return [];

    if (serviceFilter === 'ALL') {
      return slots;
    }

    return slots.filter((slot: SlotData) => slot.service?.id === serviceFilter);
  }, [slotsData, serviceFilter]);

  // Calculate stats from slot data
  const stats = useMemo(() => {
    const slots = filteredSlots;

    // Calculate available slots (slots without bookings)
    const availableSlots = slots.filter((slot) => !slot.booking).length;

    // Calculate booked slots
    const bookedSlots = slots.filter((slot) => slot.booking).length;

    // Total slots
    const totalSlots = slots.length;

    // Calculate confirmed bookings
    const confirmedBookings = slots.filter(
      (slot) => slot.booking && slot.booking.status === 'CONFIRMED'
    ).length;

    // Calculate utilization rate
    const utilizationRate = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;

    return {
      utilizationRate,
      availableSlots,
      bookedSlots,
      totalSlots,
      confirmedBookings,
    };
  }, [filteredSlots]);

  // Derive working hours from slot data or use defaults
  const workingHours = useMemo(() => {
    const slots = filteredSlots;

    if (slots.length === 0) {
      // Default working hours
      return { start: '09:00', end: '17:00' };
    }

    // Find earliest start and latest end times
    let earliestHour = 24;
    let latestHour = 0;

    slots.forEach((slot) => {
      const startTime = slot.startTime;
      const endTime = slot.endTime;

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
  }, [filteredSlots]);

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
  const handleSlotClick = useCallback((slot: SlotData, clickEvent?: React.MouseEvent) => {
    // Only allow booking of available slots (slots without bookings)
    if (!slot.booking) {
      setSelectedSlot(slot);
      setIsBookingModalOpen(true);
    }
  }, []);

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

  // Style slots based on booking status
  const getSlotStyle = useCallback((slot: SlotData): string => {
    if (slot.booking) {
      // Booked slot styling
      return 'bg-gray-200 border-gray-300 text-gray-600 cursor-not-allowed';
    } else {
      // Available slot styling - can be booked
      return 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100 cursor-pointer transition-colors';
    }
  }, []);

  // Process slots for display with performance optimization
  const displaySlots = useMemo(() => {
    const slots = filteredSlots;
    if (!slots.length) return [];

    // Sort slots by start time for consistent display
    const sorted = [...slots].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    return sorted;
  }, [filteredSlots]);

  // Record performance metrics when data changes
  useEffect(() => {
    if (displaySlots.length > 0) {
      recordCalendarCyclePerformance(displaySlots.length, viewMode, dateRange);
    }
  }, [displaySlots, viewMode, dateRange]);

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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = nowUTC();
                      setCurrentDate(today);
                      updateSearchParams({ date: today });
                    }}
                  >
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
                  </SelectContent>
                </Select>

                <Select
                  value={serviceFilter}
                  onValueChange={(value: string) => {
                    setServiceFilter(value);
                    // Convert service ID to URL-friendly name for the URL
                    const urlValue = value === 'ALL' ? 'all' : getServiceNameForUrl(value);
                    updateSearchParams({ service: urlValue });
                  }}
                >
                  <SelectTrigger className="w-full sm:w-60">
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
            {/* Show message when no service is selected and there are multiple services */}
            {serviceFilter === 'ALL' && availableServices.length > 1 ? (
              <div className="py-12 text-center">
                <CalendarIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  Please Choose a Service
                </h3>
                <p className="mb-4 text-gray-600">
                  Select which service you&apos;d like to book from the dropdown above to view
                  available time slots.
                </p>
                <div className="text-sm text-gray-500">
                  Available services: {availableServices.map((s) => s.name).join(', ')}
                </div>
              </div>
            ) : displaySlots.length === 0 ? (
              <div className="py-12 text-center">
                <CalendarIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold text-gray-900">No Available Slots</h3>
                <p className="text-gray-600">
                  No time slots are available for{' '}
                  {serviceFilter === 'ALL' ? 'any service' : 'this service'} in the selected time
                  period.
                </p>
                <div className="mt-2 text-sm text-gray-500">
                  Try selecting a different date range{serviceFilter !== 'ALL' ? ' or service' : ''}
                  .
                </div>
              </div>
            ) : (
              <>
                {viewMode === 'day' && (
                  <SlotDayView
                    currentDate={currentDate}
                    slots={displaySlots}
                    workingHours={workingHours}
                    onSlotClick={handleSlotClick}
                    getSlotStyle={getSlotStyle}
                  />
                )}
                {viewMode === '3-day' && (
                  <SlotThreeDayView
                    currentDate={currentDate}
                    slots={displaySlots}
                    workingHours={workingHours}
                    onSlotClick={handleSlotClick}
                    getSlotStyle={getSlotStyle}
                  />
                )}
                {viewMode === 'week' && (
                  <SlotWeekView
                    currentDate={currentDate}
                    slots={displaySlots}
                    workingHours={workingHours}
                    onSlotClick={handleSlotClick}
                    onDateClick={handleDateClick}
                    getSlotStyle={getSlotStyle}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Booking Modal */}
        <BookingSlotModal
          slot={selectedSlot as BookingSlot | null}
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
