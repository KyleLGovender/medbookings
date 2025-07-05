'use client';

import { useMemo, useState } from 'react';

import { Calendar as CalendarIcon, Eye, EyeOff, Filter } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarEvent } from '@/features/calendar/availability/types/client';

import { CoverageGap } from '../types/coverage';
import { AvailabilityStatus, SlotStatus } from '../types/enums';
import { CalendarFilters, CalendarFiltersPanel } from './calendar-filters-panel';
import { CalendarNavigation, CalendarViewMode, RecurringPatternView } from './calendar-navigation';
import { OrganizationCalendarView, OrganizationProvider } from './organization-calendar-view';
import { ProviderCalendarView } from './provider-calendar-view';

export interface EnhancedCalendarViewProps {
  mode: 'organization' | 'provider';
  organizationId?: string;
  providerId?: string;

  // Event handlers
  onEventClick?: (event: CalendarEvent, provider?: OrganizationProvider) => void;
  onProviderClick?: (provider: OrganizationProvider) => void;
  onTimeSlotClick?: (date: Date, hour: number, provider?: OrganizationProvider) => void;
  onCreateAvailability?: (providerId?: string) => void;
  onManageProvider?: (provider: OrganizationProvider) => void;
  onGapClick?: (gap: CoverageGap) => void;
  onRecommendationClick?: (recommendation: string) => void;

  // Configuration
  initialViewMode?: CalendarViewMode;
  initialDate?: Date;
  showFilters?: boolean;
  showCoverageGaps?: boolean;
  enableRecurringPatterns?: boolean;

  className?: string;
}

export function EnhancedCalendarView({
  mode,
  organizationId,
  providerId,
  onEventClick,
  onProviderClick,
  onTimeSlotClick,
  onCreateAvailability,
  onManageProvider,
  onGapClick,
  onRecommendationClick,
  initialViewMode = 'week',
  initialDate = new Date(),
  showFilters = true,
  showCoverageGaps = true,
  enableRecurringPatterns = true,
  className = '',
}: EnhancedCalendarViewProps) {
  // Core state
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [viewMode, setViewMode] = useState<CalendarViewMode>(initialViewMode);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<CalendarFilters>({
    selectedProviders: [],
    providerTypes: [],
    availabilityStatuses: [],
    schedulingRules: [],
    showRecurring: true,
    showOneTime: true,
    bookingStatuses: [],
    showConfirmedOnly: false,
    showPendingOnly: false,
    selectedLocations: [],
    showOnlineOnly: false,
    showInPersonOnly: false,
    workingHoursOnly: false,
    dateRange: { start: null, end: null },
    timeRange: { start: '00:00', end: '23:59' },
    showSeriesOnly: false,
    showIndividualOnly: false,
    seriesIds: [],
    searchText: '',
  });

  // Recurring pattern state
  const [recurringView, setRecurringView] = useState<RecurringPatternView>({
    showAllOccurrences: true,
    highlightSeries: false,
    groupBySeries: false,
    showSeriesNavigator: false,
    expandSeries: [],
  });

  // Mock data for demonstration
  const mockProviders = useMemo(() => generateMockProviders(), []);
  const mockLocations = useMemo(() => generateMockLocations(), []);
  const mockActiveSeries = useMemo(() => generateMockActiveSeries(), []);

  function generateMockProviders() {
    return [
      {
        id: 'p1',
        name: 'Dr. Sarah Johnson',
        type: 'General Practitioner',
        specialization: 'Family Medicine',
      },
      { id: 'p2', name: 'Dr. Michael Chen', type: 'Cardiologist', specialization: 'Heart Disease' },
      {
        id: 'p3',
        name: 'Dr. Emily Rodriguez',
        type: 'Pediatrician',
        specialization: 'Child Health',
      },
      {
        id: 'p4',
        name: 'Dr. James Wilson',
        type: 'Orthopedist',
        specialization: 'Sports Medicine',
      },
      { id: 'p5', name: 'Dr. Lisa Thompson', type: 'Dermatologist', specialization: 'Skin Care' },
    ];
  }

  function generateMockLocations() {
    return [
      { id: 'main', name: 'Main Building', isOnline: false },
      { id: 'annex', name: 'Annex Building', isOnline: false },
      { id: 'online', name: 'Online Services', isOnline: true },
    ];
  }

  function generateMockActiveSeries() {
    return [
      {
        id: 'series-1',
        title: 'Weekly Team Meetings',
        color: '#3b82f6',
        occurrenceCount: 12,
        nextOccurrence: new Date(Date.now() + 86400000), // Tomorrow
      },
      {
        id: 'series-2',
        title: 'Monthly Health Checks',
        color: '#10b981',
        occurrenceCount: 3,
        nextOccurrence: new Date(Date.now() + 7 * 86400000), // Next week
      },
      {
        id: 'series-3',
        title: 'Emergency Coverage',
        color: '#f59e0b',
        occurrenceCount: 8,
        nextOccurrence: new Date(Date.now() + 2 * 86400000), // Day after tomorrow
      },
    ];
  }

  // Filter events based on current filters
  const applyFilters = (events: CalendarEvent[], providers: OrganizationProvider[]) => {
    return events.filter((event) => {
      // Text search
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const matchesSearch =
          event.title.toLowerCase().includes(searchLower) ||
          event.notes?.toLowerCase().includes(searchLower) ||
          event.customer?.name.toLowerCase().includes(searchLower) ||
          event.service?.name.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Availability status
      if (filters.availabilityStatuses.length > 0 && event.type === 'availability') {
        if (!filters.availabilityStatuses.includes(event.status as AvailabilityStatus))
          return false;
      }

      // Booking status
      if (filters.bookingStatuses.length > 0 && event.type === 'booking') {
        if (!filters.bookingStatuses.includes(event.status as SlotStatus)) return false;
      }

      // Scheduling rules
      if (filters.schedulingRules.length > 0 && event.schedulingRule) {
        if (!filters.schedulingRules.includes(event.schedulingRule)) return false;
      }

      // Recurring vs one-time
      if (!filters.showRecurring && event.isRecurring) return false;
      if (!filters.showOneTime && !event.isRecurring) return false;

      // Location filters
      if (event.location) {
        if (filters.showOnlineOnly && !event.location.isOnline) return false;
        if (filters.showInPersonOnly && event.location.isOnline) return false;
        if (
          filters.selectedLocations.length > 0 &&
          !filters.selectedLocations.includes(event.location.id)
        )
          return false;
      }

      // Time filters
      if (filters.workingHoursOnly) {
        const hour = event.startTime.getHours();
        if (hour < 9 || hour >= 17) return false; // Assuming 9-5 work hours
      }

      const startTimeStr = event.startTime.toTimeString().slice(0, 5);
      const endTimeStr = event.endTime.toTimeString().slice(0, 5);
      if (startTimeStr < filters.timeRange.start || endTimeStr > filters.timeRange.end)
        return false;

      // Booking specific filters
      if (event.type === 'booking') {
        if (filters.showConfirmedOnly && event.status !== SlotStatus.BOOKED) return false;
        if (filters.showPendingOnly && event.status !== SlotStatus.PENDING) return false;
      }

      return true;
    });
  };

  // Count active filters
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.selectedProviders.length > 0) count++;
    if (filters.providerTypes.length > 0) count++;
    if (filters.availabilityStatuses.length > 0) count++;
    if (filters.schedulingRules.length > 0) count++;
    if (filters.bookingStatuses.length > 0) count++;
    if (filters.selectedLocations.length > 0) count++;
    if (filters.searchText.trim()) count++;
    if (filters.showRecurring !== true || filters.showOneTime !== true) count++;
    if (filters.workingHoursOnly) count++;
    if (filters.showConfirmedOnly || filters.showPendingOnly) count++;
    if (filters.showOnlineOnly || filters.showInPersonOnly) count++;
    return count;
  };

  const handleTodayClick = () => {
    setCurrentDate(new Date());
  };

  const handleSeriesSelect = (seriesId: string) => {
    setRecurringView((prev) => ({
      ...prev,
      expandSeries: prev.expandSeries.includes(seriesId)
        ? prev.expandSeries.filter((id) => id !== seriesId)
        : [...prev.expandSeries, seriesId],
    }));
  };

  const handleExport = () => {
    // TODO: Implement calendar export functionality
    console.log('Export calendar');
  };

  const handleShare = () => {
    // TODO: Implement calendar sharing functionality
    console.log('Share calendar');
  };

  const handleSettings = () => {
    // TODO: Implement calendar settings
    console.log('Calendar settings');
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Navigation */}
      <CalendarNavigation
        currentDate={currentDate}
        viewMode={viewMode}
        onDateChange={setCurrentDate}
        onViewModeChange={setViewMode}
        onTodayClick={handleTodayClick}
        recurringView={recurringView}
        onRecurringViewChange={setRecurringView}
        activeSeries={enableRecurringPatterns ? mockActiveSeries : []}
        onSeriesSelect={handleSeriesSelect}
        onExport={handleExport}
        onShare={handleShare}
        onSettings={handleSettings}
        showQuickNav={true}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="lg:col-span-1">
            {/* Mobile filter toggle */}
            <div className="mb-4 lg:hidden">
              <Button
                variant="outline"
                onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                className="w-full justify-between"
              >
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </div>
                {isFiltersExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            {/* Filter panel */}
            <div className={`${isFiltersExpanded ? 'block' : 'hidden'} lg:block`}>
              <CalendarFiltersPanel
                filters={filters}
                onFiltersChange={setFilters}
                providers={mockProviders}
                locations={mockLocations}
                compact={false}
              />
            </div>
          </div>
        )}

        {/* Calendar Content */}
        <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
          {/* Filter summary */}
          {activeFiltersCount > 0 && (
            <Card className="mb-4">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} applied
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setFilters({
                        selectedProviders: [],
                        providerTypes: [],
                        availabilityStatuses: [],
                        schedulingRules: [],
                        showRecurring: true,
                        showOneTime: true,
                        bookingStatuses: [],
                        showConfirmedOnly: false,
                        showPendingOnly: false,
                        selectedLocations: [],
                        showOnlineOnly: false,
                        showInPersonOnly: false,
                        workingHoursOnly: false,
                        dateRange: { start: null, end: null },
                        timeRange: { start: '00:00', end: '23:59' },
                        showSeriesOnly: false,
                        showIndividualOnly: false,
                        seriesIds: [],
                        searchText: '',
                      })
                    }
                  >
                    Clear all
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Calendar */}
          {mode === 'organization' && organizationId ? (
            <OrganizationCalendarView
              organizationId={organizationId}
              onEventClick={(event, provider) => onEventClick?.(event, provider)}
              onProviderClick={onProviderClick}
              onTimeSlotClick={(date, hour, provider) => onTimeSlotClick?.(date, hour, provider)}
              onCreateAvailability={onCreateAvailability}
              onManageProvider={onManageProvider}
              onGapClick={onGapClick}
              onRecommendationClick={onRecommendationClick}
              viewMode={viewMode === 'agenda' ? 'week' : viewMode} // Map agenda to week for now
              initialDate={currentDate}
              showCoverageGaps={showCoverageGaps}
            />
          ) : providerId ? (
            <ProviderCalendarView
              providerId={providerId}
              onEventClick={(event) => onEventClick?.(event)}
              onTimeSlotClick={(date, hour) => onTimeSlotClick?.(date, hour)}
              onCreateAvailability={onCreateAvailability}
              viewMode={viewMode === 'agenda' ? 'week' : viewMode} // Map agenda to week for now
              initialDate={currentDate}
            />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <CalendarIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>Please provide either organizationId or providerId</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
