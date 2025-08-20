'use client';

import React, { useState, useMemo, useCallback } from 'react';

import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatar } from '@/components/user-avatar';
import CalendarLoader from '@/components/calendar-loader';
import { BookingCalendarGrid } from '@/features/calendar/components/booking-calendar-grid';
import { BookingCalendarHeader } from '@/features/calendar/components/booking-calendar-header';
import { BookingFilterBar } from '@/features/calendar/components/booking-filter-bar';
import { BookingSlotModal, type BookingFormData } from '@/features/calendar/components/booking-slot-modal';
import { BookingSuccessToast } from '@/features/calendar/components/booking-success-toast';
import { useAvailableSlots } from '@/features/calendar/hooks/use-available-slots';
import { useBookingFilters } from '@/features/calendar/hooks/use-booking-filters';
import { useCreateBooking } from '@/features/calendar/hooks/use-create-booking';
import { BookingSlot, CalendarViewMode } from '@/features/calendar/types/booking-types';
import { api, type RouterOutputs } from '@/utils/api';

// Extract provider type from tRPC
type Provider = RouterOutputs['providers']['getById'];

export interface ProviderSlotViewProps {
  providerId: string;
  searchParams?: { [key: string]: string | string[] | undefined };
}

export function ProviderSlotView({ providerId, searchParams }: ProviderSlotViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [lastBookedSlot, setLastBookedSlot] = useState<BookingSlot | null>(null);

  // Initialize filters from search params
  const filters = useBookingFilters(searchParams);

  // Fetch provider data
  const { data: providerData, isLoading: isProviderLoading } = api.providers.getById.useQuery(
    { id: providerId },
    { 
      enabled: !!providerId,
      retry: false,
    }
  );

  // Transform provider data to match ProviderPublicData interface
  const provider = useMemo(() => {
    if (!providerData) return null;
    
    return {
      id: providerData.id,
      user: providerData.user ? {
        id: providerData.user.id,
        name: providerData.user.name ?? undefined,
        email: providerData.user.email ?? undefined,
        image: providerData.user.image ?? undefined,
      } : undefined,
      status: providerData.status,
      specialties: providerData.typeAssignments?.map(assignment => 
        assignment.providerType?.name
      ).filter(Boolean) || [],
    };
  }, [providerData]);

  // Booking mutation
  const createBookingMutation = useCreateBooking();

  // Fetch available slots with filters
  const { 
    data: slots, 
    isLoading: isSlotsLoading, 
    error: slotsError 
  } = useAvailableSlots({
    providerId,
    dateRange: {
      start: currentDate,
      end: calculateEndDate(currentDate, viewMode),
    },
    filters: filters.activeFilters,
  });

  // Calculate stats for current view
  const stats = useMemo(() => {
    if (!slots) return { totalSlots: 0, availableSlots: 0, avgDuration: 0 };

    const availableSlots = slots.filter(slot => slot.isAvailable);
    const totalDuration = availableSlots.reduce((total, slot) => total + slot.durationMinutes, 0);
    const avgDuration = availableSlots.length > 0 ? Math.round(totalDuration / availableSlots.length) : 0;

    return {
      totalSlots: slots.length,
      availableSlots: availableSlots.length,
      avgDuration,
    };
  }, [slots]);

  // Navigation handlers
  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case '3-day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 3 : -3));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
    }
    setCurrentDate(newDate);
  }, [currentDate, viewMode]);

  const handleSlotClick = useCallback((slot: BookingSlot) => {
    if (slot.isAvailable) {
      setSelectedSlot(slot);
      setIsBookingModalOpen(true);
    }
  }, []);

  const handleBookingConfirm = useCallback(async (bookingData: BookingFormData) => {
    try {
      const result = await createBookingMutation.mutateAsync({
        slotId: bookingData.slotId,
        clientName: bookingData.clientName,
        clientEmail: bookingData.clientEmail,
        clientPhone: bookingData.clientPhone,
        notes: bookingData.notes,
      });

      // Close modal on success
      setIsBookingModalOpen(false);
      setLastBookedSlot(selectedSlot);
      setSelectedSlot(null);

      // Show success toast
      setShowSuccessToast(true);

      // Refetch slots to update availability
      // The useAvailableSlots hook will automatically refetch every 5 minutes,
      // but we can trigger a manual refetch for immediate feedback
      
    } catch (error) {
      // Error is handled by the mutation's onError callback
      console.error('Booking failed:', error);
      alert('Failed to create booking. Please try again.');
    }
  }, [createBookingMutation]);

  const handleBookingModalClose = useCallback((open: boolean) => {
    setIsBookingModalOpen(open);
    if (!open) {
      setSelectedSlot(null);
    }
  }, []);

  // Loading state
  if (isProviderLoading) {
    return (
      <div className="flex justify-center py-12">
        <CalendarLoader 
          message="Loading provider information"
          submessage="Please wait while we fetch provider details..."
          showAfterMs={300}
        />
      </div>
    );
  }

  // Provider not found
  if (!provider || !providerData) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="py-8 text-center">
          <p className="font-medium text-destructive">Provider not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The provider you're looking for doesn't exist or is not available for booking.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Provider Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <UserAvatar
                name={providerData.user?.name}
                image={providerData.user?.image}
                email={providerData.user?.email}
                className="h-16 w-16"
              />
              <div>
                <CardTitle className="text-2xl">{providerData.user?.name || 'Healthcare Provider'}</CardTitle>
                <p className="text-muted-foreground">Healthcare Provider</p>
                {providerData.typeAssignments && providerData.typeAssignments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {providerData.typeAssignments.slice(0, 3).map((assignment) => (
                      <span 
                        key={assignment.id}
                        className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                      >
                        {assignment.providerType?.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats - Desktop */}
            <div className="hidden lg:flex lg:items-center lg:space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.availableSlots}</div>
                <div className="text-xs text-muted-foreground">Available Slots</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.avgDuration}min</div>
                <div className="text-xs text-muted-foreground">Avg Duration</div>
              </div>
            </div>
          </div>

          {/* Quick Stats - Mobile */}
          <div className="mt-4 flex justify-center space-x-8 lg:hidden">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{stats.availableSlots}</div>
              <div className="text-xs text-muted-foreground">Available</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{stats.avgDuration}min</div>
              <div className="text-xs text-muted-foreground">Duration</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filter Bar */}
      <BookingFilterBar 
        filters={filters}
        provider={provider}
      />

      {/* Calendar Header with Navigation */}
      <BookingCalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        onDateChange={setCurrentDate}
        onViewModeChange={setViewMode}
        onNavigate={navigateDate}
      />

      {/* Calendar Grid */}
      <BookingCalendarGrid
        providerId={providerId}
        currentDate={currentDate}
        viewMode={viewMode}
        slots={slots || []}
        isLoading={isSlotsLoading}
        error={slotsError ? new Error(slotsError.message) : null}
        onSlotClick={handleSlotClick}
        selectedSlot={selectedSlot}
      />

      {/* Booking Modal */}
      <BookingSlotModal
        slot={selectedSlot}
        open={isBookingModalOpen}
        onOpenChange={handleBookingModalClose}
        onBookingConfirm={handleBookingConfirm}
        isLoading={createBookingMutation.isPending}
      />

      {/* Success Toast */}
      {lastBookedSlot && (
        <BookingSuccessToast
          show={showSuccessToast}
          onClose={() => setShowSuccessToast(false)}
          providerName={lastBookedSlot.provider.name}
          appointmentTime={format(lastBookedSlot.startTime, 'EEEE, MMMM d \'at\' h:mm a')}
        />
      )}
    </div>
  );
}

// Helper function to calculate end date based on view mode
function calculateEndDate(startDate: Date, viewMode: CalendarViewMode): Date {
  const endDate = new Date(startDate);
  switch (viewMode) {
    case 'day':
      return endDate;
    case '3-day':
      endDate.setDate(endDate.getDate() + 2);
      return endDate;
    case 'week':
      endDate.setDate(endDate.getDate() + 6);
      return endDate;
    default:
      return endDate;
  }
}