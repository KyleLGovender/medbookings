'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  MoreVertical,
  Plus,
  Settings,
  Users,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CalendarErrorBoundary } from '@/features/calendar/components/error-boundary';
import { CalendarSkeleton } from '@/features/calendar/components/loading';
import {
  AvailabilityWithRelations,
  CalculatedAvailabilitySlotWithRelations,
  CalendarEvent,
} from '@/features/calendar/types/types';
import { useOrganization } from '@/features/organizations/hooks/use-organization';
import { useOrganizationProviderConnections } from '@/features/organizations/hooks/use-provider-connections';
import { OrganizationProviderConnection } from '@/features/organizations/types/types';

import { useOrganizationAvailability } from '../hooks/use-availability';
import {
  CalendarViewMode,
  OrganizationCalendarData,
  OrganizationCalendarViewProps,
  OrganizationMonthViewProps,
  OrganizationProvider,
  OrganizationWeekViewProps,
} from '../types/types';

export function OrganizationCalendarView({
  organizationId,
  onProviderClick,
  onEventClick,
  onTimeSlotClick,
  onCreateAvailability,
  onManageProvider,
  onGapClick,
  onRecommendationClick,
  viewMode: initialViewMode = 'week',
  initialDate = new Date(),
  showCoverageGaps = true,
}: OrganizationCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [viewMode, setViewMode] = useState<CalendarViewMode>(initialViewMode);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [filters, setFilters] = useState({
    showOnlyActive: true,
    showOnlyWithBookings: false,
    selectedLocation: 'all',
    selectedSpecialization: 'all',
  });
  const [showUtilizationOnly, setShowUtilizationOnly] = useState(false);

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

  // Fetch real data from APIs
  const { data: organization, isLoading: isOrgLoading } = useOrganization(organizationId);
  const { data: providerConnections, isLoading: isConnectionsLoading } =
    useOrganizationProviderConnections(organizationId);

  // Calculate date range for current view
  const dateRange = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    switch (viewMode) {
      case 'day':
        end.setDate(start.getDate() + 1);
        break;
      case 'week':
        start.setDate(currentDate.getDate() - currentDate.getDay());
        end.setDate(start.getDate() + 7);
        break;
      case 'month':
        start.setDate(1);
        end.setMonth(start.getMonth() + 1);
        end.setDate(0);
        break;
    }

    return { start, end };
  }, [currentDate, viewMode]);

  const { data: availabilityData, isLoading: isAvailabilityLoading } =
    useOrganizationAvailability(organizationId);

  const isLoading = isOrgLoading || isConnectionsLoading || isAvailabilityLoading;

  // Transform real data into calendar format
  const calendarData: OrganizationCalendarData | null = useMemo(() => {
    if (!organization || !providerConnections || !availabilityData) return null;

    // Transform provider connections into organization providers
    const providers: OrganizationProvider[] = providerConnections.map(
      (connection: OrganizationProviderConnection) => {
        const provider = connection.serviceProvider;

        // Get availability for this provider from organization availability data
        const providerAvailability = availabilityData.filter(
          (availability: AvailabilityWithRelations) => availability.providerId === provider.id
        );

        // Transform availability into calendar events
        const events: CalendarEvent[] = [];

        providerAvailability.forEach((availability: AvailabilityWithRelations) => {
          events.push({
            id: availability.id,
            type: 'availability',
            title: `Available - ${availability.availableServices?.[0]?.service?.name || 'General'}`,
            startTime: new Date(availability.startTime),
            endTime: new Date(availability.endTime),
            status: availability.status,
            schedulingRule: availability.schedulingRule,
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
          });

          // Add booked slots
          availability.calculatedSlots
            ?.filter((slot: CalculatedAvailabilitySlotWithRelations) => slot.status === 'BOOKED')
            .forEach((slot: CalculatedAvailabilitySlotWithRelations) => {
              events.push({
                id: slot.id,
                type: 'booking',
                title: `Booking - ${slot.service?.name || 'Service'}`,
                startTime: new Date(slot.startTime),
                endTime: new Date(slot.endTime),
                status: slot.status,
                location: slot.serviceConfig?.location
                  ? {
                      id: slot.serviceConfig.location.id,
                      name: slot.serviceConfig.location.name,
                      isOnline: slot.serviceConfig.isOnlineAvailable,
                    }
                  : undefined,
                service: slot.service
                  ? {
                      id: slot.service.id,
                      name: slot.service.name,
                      duration: slot.serviceConfig?.duration || 30,
                      price: Number(slot.serviceConfig?.price) || 0,
                    }
                  : undefined,
              });
            });
        });

        // Calculate stats for this provider
        const allSlots = providerAvailability.flatMap(
          (availability: AvailabilityWithRelations) => availability.calculatedSlots || []
        );
        const bookedSlots = allSlots.filter(
          (slot: CalculatedAvailabilitySlotWithRelations) => slot.status === 'BOOKED'
        ).length;
        const availableSlots = allSlots.filter(
          (slot: CalculatedAvailabilitySlotWithRelations) => slot.status === 'AVAILABLE'
        ).length;

        return {
          id: provider.id,
          name: provider.name,
          type: provider.serviceProviderType?.name || 'Healthcare Provider',
          specialization: provider.serviceProviderType?.name,
          isActive: true, // Default to active since we don't have status in the connection type
          workingHours: { start: '09:00', end: '17:00' }, // Default working hours - provider settings integration pending
          utilizationRate:
            allSlots.length > 0 ? Math.round((bookedSlots / allSlots.length) * 100) : 0,
          totalBookings: bookedSlots,
          pendingBookings: 0, // No pending status in SlotStatus
          events,
        };
      }
    );

    // Calculate organization stats
    const totalSlots = providers.reduce(
      (acc, provider) => acc + provider.events.filter((e) => e.type === 'booking').length,
      0
    );
    const totalBookings = providers.reduce((acc, provider) => acc + provider.totalBookings, 0);
    const totalPending = 0; // No pending bookings in current schema
    const activeProviders = providers.filter((p) => p.isActive).length;

    return {
      organizationId,
      organizationName: organization.name,
      providers,
      locations:
        organization.locations?.map((location: any) => ({
          id: location.id,
          name: location.name,
          address: location.address || '',
          providerCount: providers.filter((p) =>
            p.events.some((e) => e.location?.id === location.id)
          ).length,
        })) || [],
      stats: {
        totalProviders: providers.length,
        activeProviders,
        totalAvailableHours: providers.reduce(
          (acc, provider) => acc + provider.events.filter((e) => e.type === 'availability').length,
          0
        ),
        totalBookedHours: totalBookings,
        averageUtilization:
          providers.length > 0
            ? Math.round(
                providers.reduce((acc, p) => acc + p.utilizationRate, 0) / providers.length
              )
            : 0,
        totalPendingBookings: totalPending,
        coverageGaps: 0, // TODO: Calculate coverage gaps
      },
    };
  }, [organization, providerConnections, availabilityData, organizationId]);

  // Initialize selected providers when data loads
  useMemo(() => {
    if (calendarData && selectedProviders.length === 0) {
      setSelectedProviders(calendarData.providers.map((p) => p.id));
    }
  }, [calendarData, selectedProviders.length]);

  const navigateDate = (direction: 'prev' | 'next') => {
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
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }

    setCurrentDate(newDate);
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
        const startOf3Day = new Date(currentDate);
        const endOf3Day = new Date(currentDate);
        endOf3Day.setDate(startOf3Day.getDate() + 2);
        return `${startOf3Day.toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${endOf3Day.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'week':
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `${startOfWeek.toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'month':
        return currentDate.toLocaleDateString([], { year: 'numeric', month: 'long' });
    }
  };

  const toggleProvider = (providerId: string) => {
    setSelectedProviders((prev) =>
      prev.includes(providerId) ? prev.filter((id) => id !== providerId) : [...prev, providerId]
    );
  };

  const toggleAllProviders = () => {
    if (!calendarData) return;

    if (selectedProviders.length === calendarData.providers.length) {
      setSelectedProviders([]);
    } else {
      setSelectedProviders(calendarData.providers.map((p) => p.id));
    }
  };

  const getFilteredProviders = () => {
    if (!calendarData) return [];

    return calendarData.providers.filter((provider) => {
      if (filters.showOnlyActive && !provider.isActive) return false;
      if (filters.showOnlyWithBookings && provider.totalBookings === 0) return false;
      // Add more filters as needed
      return true;
    });
  };

  const getEventStyle = (event: CalendarEvent): string => {
    // Base style for recurring events with left border indicator
    const recurringBorder = event.isRecurring ? 'border-l-4 border-l-blue-600' : '';

    switch (event.type) {
      case 'availability':
        return `bg-green-100 border-green-300 text-green-800 ${recurringBorder}`;
      case 'booking':
        switch (event.status) {
          case 'BOOKED':
            return `bg-blue-100 border-blue-300 text-blue-800 ${recurringBorder}`;
          case 'PENDING':
            return `bg-orange-100 border-orange-300 text-orange-800 ${recurringBorder}`;
          default:
            return `bg-purple-100 border-purple-300 text-purple-800 ${recurringBorder}`;
        }
      case 'blocked':
        return `bg-red-100 border-red-300 text-red-800 ${recurringBorder}`;
      default:
        return `bg-gray-100 border-gray-300 text-gray-800 ${recurringBorder}`;
    }
  };

  if (isLoading) {
    return <CalendarSkeleton />;
  }

  if (!calendarData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="py-8 text-center text-muted-foreground">
            <CalendarIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>No organization calendar data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredProviders = getFilteredProviders();
  const displayedProviders = filteredProviders.filter((p) => selectedProviders.includes(p.id));

  return (
    <CalendarErrorBoundary>
      <div className="space-y-6">
        {/* Organization Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">{calendarData.organizationName}</CardTitle>
                  <p className="text-sm text-muted-foreground">Healthcare Provider Calendar</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center md:grid-cols-3 md:gap-4 lg:grid-cols-5">
                <div>
                  <div className="text-lg font-bold text-blue-600 md:text-2xl">
                    {calendarData.stats.averageUtilization}%
                  </div>
                  <div className="text-xs text-muted-foreground">Avg Utilization</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600 md:text-2xl">
                    {calendarData.stats.activeProviders}
                  </div>
                  <div className="text-xs text-muted-foreground">Active Providers</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-600 md:text-2xl">
                    {calendarData.stats.totalPendingBookings}
                  </div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-600 md:text-2xl">
                    {Math.round(calendarData.stats.totalBookedHours)}
                  </div>
                  <div className="text-xs text-muted-foreground">Booked Hours</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600 md:text-2xl">
                    {calendarData.stats.coverageGaps}
                  </div>
                  <div className="text-xs text-muted-foreground">Coverage Gaps</div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Controls and Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="min-w-[200px] text-center text-lg font-semibold">
                    {getViewTitle()}
                  </h2>
                  <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                  Today
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Utilization View</span>
                  <Switch checked={showUtilizationOnly} onCheckedChange={setShowUtilizationOnly} />
                </div>

                <Select
                  value={viewMode}
                  onValueChange={(value: CalendarViewMode) => setViewMode(value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="3-day">3-Day</SelectItem>
                    <SelectItem value="week" className="hidden sm:block">
                      Week
                    </SelectItem>
                    <SelectItem value="month" className="hidden sm:block">
                      Month
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>

                {onCreateAvailability && (
                  <Button size="sm" onClick={() => onCreateAvailability()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Availability
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-12 gap-4">
              {/* Provider Sidebar */}
              <div className="col-span-3 space-y-2">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-sm font-medium">Providers ({displayedProviders.length})</h4>
                  <Button variant="ghost" size="sm" onClick={toggleAllProviders}>
                    {selectedProviders.length === filteredProviders.length ? 'None' : 'All'}
                  </Button>
                </div>

                <div className="max-h-[600px] space-y-2 overflow-y-auto">
                  {filteredProviders.map((provider) => (
                    <div
                      key={provider.id}
                      className={`flex cursor-pointer items-center space-x-3 rounded-lg border p-2 transition-colors ${
                        selectedProviders.includes(provider.id)
                          ? 'border-blue-200 bg-blue-50'
                          : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                      } `}
                      onClick={() => toggleProvider(provider.id)}
                    >
                      <Checkbox
                        checked={selectedProviders.includes(provider.id)}
                        onChange={() => {}}
                      />

                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {provider.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{provider.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {provider.type}
                        </div>
                        {showUtilizationOnly && (
                          <div className="mt-1 flex items-center space-x-1">
                            <div className="text-xs font-medium">
                              {Math.round(provider.utilizationRate)}%
                            </div>
                            <div
                              className={`rounded px-1 py-0.5 text-xs ${
                                provider.utilizationRate > 80
                                  ? 'bg-green-100 text-green-700'
                                  : provider.utilizationRate > 60
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                              } `}
                            >
                              {provider.utilizationRate > 80
                                ? 'High'
                                : provider.utilizationRate > 60
                                  ? 'Med'
                                  : 'Low'}
                            </div>
                          </div>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onProviderClick?.(provider)}>
                            <Eye className="mr-2 h-3 w-3" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onManageProvider?.(provider)}>
                            <Settings className="mr-2 h-3 w-3" />
                            Manage
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onCreateAvailability?.(provider.id)}>
                            <Plus className="mr-2 h-3 w-3" />
                            Add Availability
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="col-span-9">
                {viewMode === 'week' && (
                  <OrganizationWeekView
                    currentDate={currentDate}
                    providers={displayedProviders}
                    onEventClick={onEventClick}
                    onTimeSlotClick={onTimeSlotClick}
                    getEventStyle={getEventStyle}
                    showUtilizationOnly={showUtilizationOnly}
                  />
                )}

                {viewMode === 'day' && (
                  <OrganizationDayView
                    currentDate={currentDate}
                    providers={displayedProviders}
                    onEventClick={onEventClick}
                    onTimeSlotClick={onTimeSlotClick}
                    getEventStyle={getEventStyle}
                    showUtilizationOnly={showUtilizationOnly}
                  />
                )}

                {viewMode === '3-day' && (
                  <OrganizationWeekView
                    currentDate={currentDate}
                    providers={displayedProviders}
                    onEventClick={onEventClick}
                    onTimeSlotClick={onTimeSlotClick}
                    getEventStyle={getEventStyle}
                    showUtilizationOnly={showUtilizationOnly}
                  />
                )}

                {viewMode === 'month' && (
                  <OrganizationMonthView
                    currentDate={currentDate}
                    providers={displayedProviders}
                    onEventClick={onEventClick}
                    getEventStyle={getEventStyle}
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded border border-green-300 bg-green-100"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded border border-blue-300 bg-blue-100"></div>
                <span>Booked</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded border border-orange-300 bg-orange-100"></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded border border-red-300 bg-red-100"></div>
                <span>Blocked</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coverage Gaps Analysis - Temporarily disabled to avoid server imports */}
        {/* {showCoverageGaps && (
        <CoverageGapsPanel
          providers={displayedProviders}
          startDate={(() => {
            const start = new Date(currentDate);
            if (viewMode === 'week') {
              start.setDate(start.getDate() - start.getDay());
            } else if (viewMode === 'month') {
              start.setDate(1);
            }
            return start;
          })()}
          endDate={(() => {
            const end = new Date(currentDate);
            if (viewMode === 'week') {
              end.setDate(end.getDate() - end.getDay() + 6);
            } else if (viewMode === 'month') {
              end.setMonth(end.getMonth() + 1, 0);
            }
            return end;
          })()}
          organizationId={organizationId}
          onGapClick={onGapClick}
          onRecommendationClick={onRecommendationClick}
        />
      )} */}
      </div>
    </CalendarErrorBoundary>
  );
}

// Organization Week View Component
function OrganizationWeekView({
  currentDate,
  providers,
  onEventClick,
  onTimeSlotClick,
  getEventStyle,
  showUtilizationOnly,
}: OrganizationWeekViewProps) {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });

  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

  const getEventsForProviderDateAndHour = (
    provider: OrganizationProvider,
    date: Date,
    hour: number
  ) => {
    return provider.events.filter((event) => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.toDateString() === date.toDateString() &&
        eventDate.getHours() <= hour &&
        new Date(event.endTime).getHours() > hour
      );
    });
  };

  if (showUtilizationOnly) {
    return (
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Provider Utilization Overview</h4>
        <div className="grid gap-3">
          {providers.map((provider) => (
            <div key={provider.id} className="flex items-center space-x-4 rounded-lg border p-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {provider.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="text-sm font-medium">{provider.name}</div>
                <div className="text-xs text-muted-foreground">{provider.type}</div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-lg font-bold">{Math.round(provider.utilizationRate)}%</div>
                  <div className="text-xs text-muted-foreground">Utilization</div>
                </div>

                <div className="text-center">
                  <div className="text-lg font-bold">{provider.totalBookings}</div>
                  <div className="text-xs text-muted-foreground">Bookings</div>
                </div>

                {provider.pendingBookings > 0 && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">
                      {provider.pendingBookings}
                    </div>
                    <div className="text-xs text-muted-foreground">Pending</div>
                  </div>
                )}

                <div
                  className={`rounded px-2 py-1 text-xs font-medium ${
                    provider.utilizationRate > 80
                      ? 'bg-green-100 text-green-700'
                      : provider.utilizationRate > 60
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                  } `}
                >
                  {provider.utilizationRate > 80
                    ? 'High'
                    : provider.utilizationRate > 60
                      ? 'Medium'
                      : 'Low'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="mb-2 grid grid-cols-8 gap-1">
          <div className="p-2 text-center text-sm font-medium">Provider</div>
          {days.map((day, index) => (
            <div key={index} className="border-b p-2 text-center text-sm font-medium">
              <div>{day.toLocaleDateString([], { weekday: 'short' })}</div>
              <div className="text-xs text-muted-foreground">{day.getDate()}</div>
            </div>
          ))}
        </div>

        {/* Provider Rows */}
        {providers.map((provider) => (
          <div key={provider.id} className="mb-1 grid grid-cols-8 gap-1">
            <div className="flex items-center space-x-2 border-r bg-gray-50 p-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {provider.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium">{provider.name}</div>
                <div className="truncate text-xs text-muted-foreground">{provider.type}</div>
              </div>
            </div>

            {days.map((day, dayIndex) => {
              const dayEvents = provider.events.filter(
                (event) => new Date(event.startTime).toDateString() === day.toDateString()
              );

              return (
                <div
                  key={`${provider.id}-${dayIndex}`}
                  className="min-h-[60px] cursor-pointer border border-gray-200 p-1 hover:bg-gray-50"
                  onClick={() => onTimeSlotClick?.(day, 9, provider)}
                >
                  {dayEvents.slice(0, 3).map((event) => (
                    <TooltipProvider key={event.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`mb-1 cursor-pointer truncate rounded border p-1 text-xs ${getEventStyle(event)} `}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventClick?.(event, provider);
                            }}
                          >
                            {event.type === 'booking'
                              ? event.customer?.name || 'Booking'
                              : event.title}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <div className="font-medium">{event.title}</div>
                            <div className="text-sm">
                              {event.startTime.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              -
                              {event.endTime.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground">+{dayEvents.length - 3}</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// Organization Day View Component
function OrganizationDayView({
  currentDate,
  providers,
  onEventClick,
  onTimeSlotClick,
  getEventStyle,
  showUtilizationOnly,
}: OrganizationWeekViewProps) {
  if (showUtilizationOnly) {
    return (
      <OrganizationWeekView
        currentDate={currentDate}
        providers={providers}
        onEventClick={onEventClick}
        onTimeSlotClick={onTimeSlotClick}
        getEventStyle={getEventStyle}
        showUtilizationOnly={true}
      />
    );
  }

  const hours = Array.from({ length: 12 }, (_, i) => i + 8);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">
        {currentDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
      </h4>

      {providers.map((provider) => {
        const dayEvents = provider.events.filter(
          (event) => new Date(event.startTime).toDateString() === currentDate.toDateString()
        );

        return (
          <div key={provider.id} className="rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {provider.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium">{provider.name}</div>
                  <div className="text-xs text-muted-foreground">{provider.type}</div>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Utilization: </span>
                  <span className="font-medium">{Math.round(provider.utilizationRate)}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Bookings: </span>
                  <span className="font-medium">
                    {dayEvents.filter((e) => e.type === 'booking').length}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-1">
              {dayEvents.length > 0 ? (
                dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`cursor-pointer rounded border p-2 ${getEventStyle(event)} `}
                    onClick={() => onEventClick?.(event, provider)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{event.title}</div>
                        <div className="text-xs opacity-75">
                          {event.startTime.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          -
                          {event.endTime.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                      {event.customer && <div className="text-xs">{event.customer.name}</div>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  No appointments scheduled
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Organization Month View Component
function OrganizationMonthView({
  currentDate,
  providers,
  onEventClick,
  getEventStyle,
}: OrganizationMonthViewProps) {
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const firstDayOfCalendar = new Date(firstDayOfMonth);
  firstDayOfCalendar.setDate(firstDayOfCalendar.getDate() - firstDayOfCalendar.getDay());

  const days = Array.from({ length: 42 }, (_, i) => {
    const day = new Date(firstDayOfCalendar);
    day.setDate(firstDayOfCalendar.getDate() + i);
    return day;
  });

  const getEventsForDay = (date: Date) => {
    const allEvents: Array<{ event: CalendarEvent; provider: OrganizationProvider }> = [];
    providers.forEach((provider) => {
      provider.events.forEach((event) => {
        if (new Date(event.startTime).toDateString() === date.toDateString()) {
          allEvents.push({ event, provider });
        }
      });
    });
    return allEvents;
  };

  return (
    <div className="grid grid-cols-7 gap-1">
      {/* Day headers */}
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
        <div key={day} className="p-2 text-center text-sm font-medium">
          {day}
        </div>
      ))}

      {/* Calendar days */}
      {days.map((day, index) => {
        const dayEventData = getEventsForDay(day);
        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
        const isToday = day.toDateString() === new Date().toDateString();

        return (
          <div
            key={index}
            className={`min-h-[100px] cursor-pointer border border-gray-200 p-1 hover:bg-gray-50 ${!isCurrentMonth ? 'bg-gray-50 text-muted-foreground' : ''} ${isToday ? 'border-blue-300 bg-blue-50' : ''} `}
          >
            <div className="mb-1 text-sm font-medium">{day.getDate()}</div>
            <div className="space-y-1">
              {dayEventData.slice(0, 2).map(({ event, provider }, i) => (
                <div
                  key={`${event.id}-${i}`}
                  className={`cursor-pointer truncate rounded border p-1 text-xs ${getEventStyle(event)} `}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick?.(event, provider);
                  }}
                  title={`${provider.name}: ${event.title}`}
                >
                  {provider.name.split(' ')[0]}:{' '}
                  {event.type === 'booking' ? event.customer?.name || 'Booking' : 'Available'}
                </div>
              ))}
              {dayEventData.length > 2 && (
                <div className="text-xs text-muted-foreground">+{dayEventData.length - 2} more</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
