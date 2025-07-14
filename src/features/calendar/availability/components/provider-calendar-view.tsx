'use client';

import React, { useMemo, useState } from 'react';

import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin, Plus } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AvailabilityStatus,
  AvailabilityWithRelations,
  CalculatedAvailabilitySlotWithRelations,
  CalendarEvent,
  SchedulingRule,
} from '@/features/calendar/availability/types/types';
import { useProvider } from '@/features/providers/hooks/use-provider';

import { useAvailabilitySearch } from '../hooks/use-availability';

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
  viewMode?: 'day' | 'week' | 'month';
  initialDate?: Date;
}

type ViewMode = 'day' | 'week' | 'month';

export function ProviderCalendarView({
  providerId,
  onEventClick,
  onTimeSlotClick,
  onCreateAvailability,
  onEditEvent,
  viewMode: initialViewMode = 'week',
  initialDate = new Date(),
}: ProviderCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<AvailabilityStatus | 'ALL'>('ALL');

  // Fetch real data from API
  const { data: provider, isLoading: isProviderLoading } = useProvider(providerId);

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

  const { data: availabilityData, isLoading: isAvailabilityLoading } = useAvailabilitySearch({
    serviceProviderId: providerId,
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

      events.push({
        id: availability.id,
        type: 'availability',
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
        createdBy: availability.createdBy ? {
          id: availability.createdBy.id,
          name: availability.createdBy.name || 'Unknown',
          type: isProviderCreated ? 'provider' : 'organization',
        } : undefined,
        organization: availability.organization
          ? {
              id: availability.organization.id,
              name: availability.organization.name,
            }
          : undefined,
      });

      // Add booked slots from this availability's calculated slots
      availability.calculatedSlots
        ?.filter((slot) => slot.status === 'BOOKED')
        .forEach((slot) => {
          events.push({
            id: slot.id,
            type: 'booking',
            title: slot.service?.name || 'Appointment',
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
            service:
              slot.service && slot.serviceConfig
                ? {
                    id: slot.service.id,
                    name: slot.service.name,
                    duration: slot.serviceConfig.duration || 30,
                    price: Number(slot.serviceConfig.price) || 0,
                  }
                : undefined,
            // TODO: Add customer data when booking relationship is available
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
      providerType: provider.serviceProviderType?.name || 'Healthcare Provider',
      workingHours: { start: '09:00', end: '17:00' }, // TODO: Get from provider settings
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

  const getViewTitle = (): string => {
    switch (viewMode) {
      case 'day':
        return currentDate.toLocaleDateString([], {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
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
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {calendarData.stats.utilizationRate}%
                  </div>
                  <div className="text-xs text-muted-foreground">Utilization</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {calendarData.stats.bookedHours}
                  </div>
                  <div className="text-xs text-muted-foreground">Booked Hours</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {calendarData.stats.pendingBookings}
                  </div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
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
              <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
                <SelectTrigger className="w-32">
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
                <SelectTrigger className="w-40">
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
                <Button size="sm" onClick={onCreateAvailability}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Availability
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {viewMode === 'week' && (
            <WeekView
              currentDate={currentDate}
              events={calendarData.events}
              workingHours={calendarData.workingHours}
              onEventClick={onEventClick}
              onTimeSlotClick={onTimeSlotClick}
              getEventStyle={getEventStyle}
            />
          )}

          {viewMode === 'day' && (
            <DayView
              currentDate={currentDate}
              events={calendarData.events}
              workingHours={calendarData.workingHours}
              onEventClick={onEventClick}
              onTimeSlotClick={onTimeSlotClick}
              getEventStyle={getEventStyle}
            />
          )}

          {viewMode === 'month' && (
            <MonthView
              currentDate={currentDate}
              events={calendarData.events}
              onEventClick={onEventClick}
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

// Week View Component
interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  workingHours: { start: string; end: string };
  onEventClick?: (event: CalendarEvent, clickEvent: React.MouseEvent) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
  getEventStyle: (event: CalendarEvent) => string;
}

function WeekView({
  currentDate,
  events,
  workingHours,
  onEventClick,
  onTimeSlotClick,
  getEventStyle,
}: WeekViewProps) {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const workingStartHour = parseInt(workingHours.start.split(':')[0]);
  const workingEndHour = parseInt(workingHours.end.split(':')[0]);

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const calculateEventPosition = (event: CalendarEvent) => {
    const startHour = new Date(event.startTime).getHours();
    const endHour = new Date(event.endTime).getHours();

    // Each time slot: 60px height + 4px gap + 1px border = 65px total per hour
    const slotHeight = 65;
    const top = startHour * slotHeight;
    const duration = endHour - startHour;
    const height = duration * slotHeight - 20; // Subtract gap to not overlap into next hour

    return { top, height };
  };

  return (
    <div className="overflow-auto">
      <div className="relative min-w-[800px]">
        <div className="grid grid-cols-8 gap-1">
          {/* Header */}
          <div className="p-2 text-center font-medium">Time</div>
          {days.map((day, index) => (
            <div key={index} className="border-b p-2 text-center font-medium">
              <div className="text-sm">{day.toLocaleDateString([], { weekday: 'short' })}</div>
              <div className="text-xs text-muted-foreground">{day.getDate()}</div>
            </div>
          ))}

          {/* Time slots background grid */}
          {hours.map((hour) => (
            <React.Fragment key={hour}>
              <div className="border-r p-2 text-right text-xs text-muted-foreground">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {days.map((day, dayIndex) => {
                const isWorkingHour = hour >= workingStartHour && hour < workingEndHour;
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                return (
                  <div
                    key={`${dayIndex}-${hour}`}
                    className={`min-h-[60px] cursor-pointer border border-gray-200 hover:bg-gray-50 ${!isWorkingHour || isWeekend ? 'bg-gray-50' : ''} `}
                    onClick={() => onTimeSlotClick?.(day, hour)}
                  />
                );
              })}
            </React.Fragment>
          ))}

          {/* Event overlays */}
          {days.map((day, dayIndex) => {
            const dayEvents = getEventsForDate(day);

            return (
              <div
                key={`events-${dayIndex}`}
                className="absolute inset-0"
                style={{
                  left: `${((dayIndex + 1) / 8) * 100}%`,
                  width: `${(1 / 8) * 100}%`,
                  top: '52px', // Account for header height with padding and border
                }}
              >
                {dayEvents.map((event) => {
                  const { top, height } = calculateEventPosition(event);

                  return (
                    <TooltipProvider key={event.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`absolute left-1 right-1 cursor-pointer rounded border p-2 text-xs ${getEventStyle(event)} shadow-sm`}
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              zIndex: 10,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventClick?.(event, e);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="truncate font-medium">{event.title}</div>
                              {event.type === 'availability' && (
                                <div className="ml-1 text-xs">
                                  {event.status === AvailabilityStatus.PENDING && '🟡'}
                                  {event.status === AvailabilityStatus.ACCEPTED && '✅'}
                                  {event.status === AvailabilityStatus.CANCELLED && '⏸️'}
                                  {event.status === AvailabilityStatus.REJECTED && '❌'}
                                </div>
                              )}
                            </div>
                            {event.type === 'availability' && event.createdBy && height > 70 && (
                              <div className="mt-1 text-xs opacity-75">
                                {event.isProviderCreated ? (
                                  <span className="text-green-600">Provider Created</span>
                                ) : (
                                  <span className="text-blue-600">
                                    {event.organization?.name || 'Organization'}
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="mt-1 text-xs opacity-75">
                              {event.startTime.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                              {' - '}
                              {event.endTime.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                            {event.location && height > 50 && (
                              <div className="mt-1 flex items-center text-xs opacity-75">
                                {event.location.isOnline ? (
                                  <span>Online</span>
                                ) : (
                                  <>
                                    <MapPin className="mr-1 h-3 w-3" />
                                    <span className="truncate">{event.location.name}</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="max-w-xs space-y-2">
                            <div className="font-medium">{event.title}</div>
                            <div className="text-sm">
                              {event.startTime.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              -{' '}
                              {event.endTime.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                            {event.service && (
                              <div className="space-y-1">
                                <div className="text-sm">Service: {event.service.name}</div>
                                {event.service.duration && (
                                  <div className="text-sm">
                                    Duration: {event.service.duration} minutes
                                  </div>
                                )}
                                {event.service.price && (
                                  <div className="text-sm">Price: R{event.service.price}</div>
                                )}
                              </div>
                            )}
                            {event.location && (
                              <div className="text-sm">
                                Location: {event.location.isOnline ? 'Online' : event.location.name}
                              </div>
                            )}
                            {event.customer && (
                              <div className="text-sm">Customer: {event.customer.name}</div>
                            )}
                            <div className="text-sm capitalize">
                              Status: {event.status.toLowerCase().replace('_', ' ')}
                            </div>
                            {event.type === 'availability' && event.createdBy && (
                              <div className="text-sm">
                                Creator:{' '}
                                {event.isProviderCreated
                                  ? 'Provider'
                                  : event.organization?.name || 'Organization'}
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Day View Component
function DayView({
  currentDate,
  events,
  workingHours,
  onEventClick,
  onTimeSlotClick,
  getEventStyle,
}: WeekViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const workingStartHour = parseInt(workingHours.start.split(':')[0]);
  const workingEndHour = parseInt(workingHours.end.split(':')[0]);

  const dayEvents = events.filter((event) => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === currentDate.toDateString();
  });

  const calculateEventPosition = (event: CalendarEvent) => {
    const startHour = new Date(event.startTime).getHours();
    const startMinutes = new Date(event.startTime).getMinutes();
    const endHour = new Date(event.endTime).getHours();
    const endMinutes = new Date(event.endTime).getMinutes();

    const top = (startHour + startMinutes / 60) * 80; // 80px per hour
    const duration = endHour - startHour + (endMinutes - startMinutes) / 60;
    const height = Math.max(duration * 80, 40); // Minimum 40px height

    return { top, height };
  };

  return (
    <div className="relative">
      {/* Time grid background */}
      <div className="space-y-1">
        {hours.map((hour) => {
          const isWorkingHour = hour >= workingStartHour && hour < workingEndHour;

          return (
            <div
              key={hour}
              className={`flex min-h-[80px] cursor-pointer border border-gray-200 hover:bg-gray-50 ${!isWorkingHour ? 'bg-gray-50' : ''} `}
              onClick={() => onTimeSlotClick?.(currentDate, hour)}
            >
              <div className="w-20 border-r p-2 text-sm text-muted-foreground">
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div className="flex-1 p-2" />
            </div>
          );
        })}
      </div>

      {/* Event overlays */}
      <div className="absolute inset-0" style={{ left: '80px' }}>
        {dayEvents.map((event) => {
          const { top, height } = calculateEventPosition(event);

          return (
            <TooltipProvider key={event.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`absolute left-2 right-2 cursor-pointer rounded border p-2 text-sm ${getEventStyle(event)} shadow-sm`}
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      zIndex: 10,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event, e);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="truncate font-medium">{event.title}</div>
                      {event.type === 'availability' && (
                        <div className="ml-1 text-xs">
                          {event.status === AvailabilityStatus.PENDING && '🟡'}
                          {event.status === AvailabilityStatus.ACCEPTED && '✅'}
                          {event.status === AvailabilityStatus.CANCELLED && '⏸️'}
                          {event.status === AvailabilityStatus.REJECTED && '❌'}
                        </div>
                      )}
                    </div>
                    <div className="mt-1 text-xs opacity-75">
                      {event.startTime.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' - '}
                      {event.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {event.location && height > 60 && (
                      <div className="mt-1 truncate text-xs opacity-75">
                        {event.location.isOnline ? 'Online' : event.location.name}
                      </div>
                    )}
                    {event.customer && height > 80 && (
                      <div className="mt-1 truncate text-xs opacity-75">{event.customer.name}</div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-xs space-y-2">
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm">
                      {event.startTime.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      -{' '}
                      {event.endTime.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    {event.service && (
                      <div className="space-y-1">
                        <div className="text-sm">Service: {event.service.name}</div>
                        {event.service.duration && (
                          <div className="text-sm">Duration: {event.service.duration} minutes</div>
                        )}
                        {event.service.price && (
                          <div className="text-sm">Price: ${event.service.price}</div>
                        )}
                      </div>
                    )}
                    {event.location && (
                      <div className="text-sm">
                        Location: {event.location.isOnline ? 'Online' : event.location.name}
                      </div>
                    )}
                    {event.customer && (
                      <div className="text-sm">Customer: {event.customer.name}</div>
                    )}
                    <div className="text-sm capitalize">
                      Status: {event.status.toLowerCase().replace('_', ' ')}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
}

// Month View Component
interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent, clickEvent: React.MouseEvent) => void;
  getEventStyle: (event: CalendarEvent) => string;
}

function MonthView({ currentDate, events, onEventClick, getEventStyle }: MonthViewProps) {
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const firstDayOfCalendar = new Date(firstDayOfMonth);
  firstDayOfCalendar.setDate(firstDayOfCalendar.getDate() - firstDayOfCalendar.getDay());

  const days = Array.from({ length: 42 }, (_, i) => {
    const day = new Date(firstDayOfCalendar);
    day.setDate(firstDayOfCalendar.getDate() + i);
    return day;
  });

  const getEventsForDay = (date: Date) => {
    return events.filter(
      (event) => new Date(event.startTime).toDateString() === date.toDateString()
    );
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
        const dayEvents = getEventsForDay(day);
        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
        const isToday = day.toDateString() === new Date().toDateString();

        return (
          <div
            key={index}
            className={`min-h-[120px] cursor-pointer border border-gray-200 p-1 hover:bg-gray-50 ${!isCurrentMonth ? 'bg-gray-50 text-muted-foreground' : ''} ${isToday ? 'border-blue-300 bg-blue-50' : ''} `}
          >
            <div className="mb-1 text-sm font-medium">{day.getDate()}</div>
            <div className="space-y-1">
              {dayEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className={`cursor-pointer rounded border p-1 text-xs ${getEventStyle(event)} `}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick?.(event, e);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="truncate">{event.title}</div>
                    {event.type === 'availability' && (
                      <div className="ml-1 text-xs">
                        {event.status === AvailabilityStatus.PENDING && '🟡'}
                        {event.status === AvailabilityStatus.ACCEPTED && '✅'}
                        {event.status === AvailabilityStatus.CANCELLED && '⏸️'}
                        {event.status === AvailabilityStatus.REJECTED && '❌'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-xs text-muted-foreground">+{dayEvents.length - 3} more</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
