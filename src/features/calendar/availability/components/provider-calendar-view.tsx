'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus, Filter, Settings, Download, Users, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { AvailabilityStatus, SlotStatus, SchedulingRule } from '../types';

export interface CalendarEvent {
  id: string;
  type: 'availability' | 'booking' | 'blocked';
  title: string;
  startTime: Date;
  endTime: Date;
  status: AvailabilityStatus | SlotStatus | 'blocked';
  schedulingRule?: SchedulingRule;
  isRecurring?: boolean;
  seriesId?: string;
  location?: {
    id: string;
    name: string;
    isOnline: boolean;
  };
  service?: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
  customer?: {
    name: string;
    email: string;
    phone?: string;
  };
  requiresConfirmation?: boolean;
  notes?: string;
}

export interface ProviderCalendarData {
  providerId: string;
  providerName: string;
  providerType: string;
  workingHours: {
    start: string; // "09:00"
    end: string;   // "17:00"
  };
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
  onEventClick?: (event: CalendarEvent) => void;
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
  const [calendarData, setCalendarData] = useState<ProviderCalendarData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  // Mock data - in real implementation, this would come from API
  useEffect(() => {
    const loadCalendarData = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockData: ProviderCalendarData = {
        providerId,
        providerName: 'Dr. Sarah Johnson',
        providerType: 'General Practitioner',
        workingHours: { start: '09:00', end: '17:00' },
        events: generateMockEvents(currentDate),
        stats: {
          totalAvailabilityHours: 40,
          bookedHours: 28,
          utilizationRate: 70,
          pendingBookings: 3,
          completedBookings: 12,
        },
      };
      
      setCalendarData(mockData);
      setIsLoading(false);
    };

    loadCalendarData();
  }, [providerId, currentDate]);

  const generateMockEvents = (baseDate: Date): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    for (let day = 0; day < 7; day++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + day);
      
      // Skip weekends for this example
      if (currentDay.getDay() === 0 || currentDay.getDay() === 6) continue;

      // Morning availability block
      events.push({
        id: `avail-${day}-morning`,
        type: 'availability',
        title: 'Available - General Consultation',
        startTime: new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate(), 9, 0),
        endTime: new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate(), 12, 0),
        status: AvailabilityStatus.ACTIVE,
        schedulingRule: SchedulingRule.FIXED_INTERVAL,
        isRecurring: true,
        seriesId: 'series-1',
        location: { id: 'loc-1', name: 'Main Clinic', isOnline: false },
        service: { id: 'svc-1', name: 'General Consultation', duration: 30, price: 150 },
      });

      // Afternoon availability block
      events.push({
        id: `avail-${day}-afternoon`,
        type: 'availability',
        title: 'Available - Follow-up Appointments',
        startTime: new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate(), 14, 0),
        endTime: new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate(), 17, 0),
        status: AvailabilityStatus.ACTIVE,
        schedulingRule: SchedulingRule.CONTINUOUS,
        location: { id: 'loc-1', name: 'Main Clinic', isOnline: false },
        service: { id: 'svc-2', name: 'Follow-up Appointment', duration: 15, price: 75 },
      });

      // Some bookings
      if (day < 4) {
        events.push({
          id: `booking-${day}-1`,
          type: 'booking',
          title: 'John Smith - General Consultation',
          startTime: new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate(), 10, 0),
          endTime: new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate(), 10, 30),
          status: SlotStatus.BOOKED,
          location: { id: 'loc-1', name: 'Main Clinic', isOnline: false },
          service: { id: 'svc-1', name: 'General Consultation', duration: 30, price: 150 },
          customer: { name: 'John Smith', email: 'john@example.com', phone: '+1234567890' },
          requiresConfirmation: false,
        });

        if (day < 2) {
          events.push({
            id: `booking-${day}-2`,
            type: 'booking',
            title: 'Online Consultation - Maria Garcia',
            startTime: new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate(), 15, 0),
            endTime: new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate(), 15, 30),
            status: SlotStatus.BOOKED,
            location: { id: 'online', name: 'Online', isOnline: true },
            service: { id: 'svc-1', name: 'General Consultation', duration: 30, price: 150 },
            customer: { name: 'Maria Garcia', email: 'maria@example.com' },
            requiresConfirmation: true,
          });
        }
      }

      // Blocked time for lunch
      events.push({
        id: `blocked-${day}-lunch`,
        type: 'blocked',
        title: 'Lunch Break',
        startTime: new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate(), 12, 0),
        endTime: new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate(), 14, 0),
        status: 'blocked',
      });
    }

    return events;
  };

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
          day: 'numeric' 
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
        switch (event.status) {
          case AvailabilityStatus.ACTIVE:
            return 'bg-green-100 border-green-300 text-green-800';
          case AvailabilityStatus.PENDING:
            return 'bg-yellow-100 border-yellow-300 text-yellow-800';
          default:
            return 'bg-gray-100 border-gray-300 text-gray-800';
        }
      case 'booking':
        switch (event.status) {
          case SlotStatus.BOOKED:
            return 'bg-blue-100 border-blue-300 text-blue-800';
          case SlotStatus.PENDING:
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
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!calendarData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
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
                  {calendarData.providerName.split(' ').map(n => n[0]).join('')}
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
                  <div className="text-2xl font-bold text-blue-600">{calendarData.stats.utilizationRate}%</div>
                  <div className="text-xs text-muted-foreground">Utilization</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{calendarData.stats.bookedHours}</div>
                  <div className="text-xs text-muted-foreground">Booked Hours</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{calendarData.stats.pendingBookings}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{calendarData.stats.completedBookings}</div>
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
                <h2 className="text-lg font-semibold min-w-[200px] text-center">
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

              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>

              {onCreateAvailability && (
                <Button size="sm" onClick={onCreateAvailability}>
                  <Plus className="h-4 w-4 mr-2" />
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300"></div>
              <span>Booked</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300"></div>
              <span>Pending</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-red-100 border border-red-300"></div>
              <span>Blocked</span>
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
  onEventClick?: (event: CalendarEvent) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
  getEventStyle: (event: CalendarEvent) => string;
}

function WeekView({ currentDate, events, workingHours, onEventClick, onTimeSlotClick, getEventStyle }: WeekViewProps) {
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

  const getEventsForDateAndHour = (date: Date, hour: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString() &&
             eventDate.getHours() <= hour &&
             new Date(event.endTime).getHours() > hour;
    });
  };

  return (
    <div className="overflow-auto">
      <div className="grid grid-cols-8 gap-1 min-w-[800px]">
        {/* Header */}
        <div className="p-2 text-center font-medium">Time</div>
        {days.map((day, index) => (
          <div key={index} className="p-2 text-center font-medium border-b">
            <div className="text-sm">{day.toLocaleDateString([], { weekday: 'short' })}</div>
            <div className="text-xs text-muted-foreground">{day.getDate()}</div>
          </div>
        ))}

        {/* Time slots */}
        {hours.map(hour => (
          <React.Fragment key={hour}>
            <div className="p-2 text-xs text-muted-foreground text-right border-r">
              {hour.toString().padStart(2, '0')}:00
            </div>
            {days.map((day, dayIndex) => {
              const dayEvents = getEventsForDateAndHour(day, hour);
              const isWorkingHour = hour >= workingStartHour && hour < workingEndHour;
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              
              return (
                <div
                  key={`${dayIndex}-${hour}`}
                  className={`
                    min-h-[60px] p-1 border border-gray-200 cursor-pointer hover:bg-gray-50
                    ${!isWorkingHour || isWeekend ? 'bg-gray-50' : ''}
                  `}
                  onClick={() => onTimeSlotClick?.(day, hour)}
                >
                  {dayEvents.map(event => (
                    <TooltipProvider key={event.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`
                              p-1 mb-1 rounded text-xs border cursor-pointer
                              ${getEventStyle(event)}
                            `}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventClick?.(event);
                            }}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            {event.location && (
                              <div className="flex items-center text-xs opacity-75">
                                {event.location.isOnline ? (
                                  <span>Online</span>
                                ) : (
                                  <>
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {event.location.name}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <div className="font-medium">{event.title}</div>
                            <div className="text-sm">
                              {event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                              {event.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {event.customer && (
                              <div className="text-sm">Customer: {event.customer.name}</div>
                            )}
                            {event.service && (
                              <div className="text-sm">Service: {event.service.name}</div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// Day View Component
function DayView({ currentDate, events, workingHours, onEventClick, onTimeSlotClick, getEventStyle }: WeekViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const workingStartHour = parseInt(workingHours.start.split(':')[0]);
  const workingEndHour = parseInt(workingHours.end.split(':')[0]);

  const getEventsForHour = (hour: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === currentDate.toDateString() &&
             eventDate.getHours() <= hour &&
             new Date(event.endTime).getHours() > hour;
    });
  };

  return (
    <div className="space-y-1">
      {hours.map(hour => {
        const hourEvents = getEventsForHour(hour);
        const isWorkingHour = hour >= workingStartHour && hour < workingEndHour;
        
        return (
          <div
            key={hour}
            className={`
              flex min-h-[80px] border border-gray-200 cursor-pointer hover:bg-gray-50
              ${!isWorkingHour ? 'bg-gray-50' : ''}
            `}
            onClick={() => onTimeSlotClick?.(currentDate, hour)}
          >
            <div className="w-20 p-2 text-sm text-muted-foreground border-r">
              {hour.toString().padStart(2, '0')}:00
            </div>
            <div className="flex-1 p-2">
              {hourEvents.map(event => (
                <div
                  key={event.id}
                  className={`
                    p-2 mb-2 rounded border cursor-pointer
                    ${getEventStyle(event)}
                  `}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick?.(event);
                  }}
                >
                  <div className="font-medium">{event.title}</div>
                  <div className="text-sm opacity-75">
                    {event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                    {event.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {event.customer && (
                    <div className="text-sm">Customer: {event.customer.name}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Month View Component
interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  getEventStyle: (event: CalendarEvent) => string;
}

function MonthView({ currentDate, events, onEventClick, getEventStyle }: MonthViewProps) {
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
    return events.filter(event => 
      new Date(event.startTime).toDateString() === date.toDateString()
    );
  };

  return (
    <div className="grid grid-cols-7 gap-1">
      {/* Day headers */}
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
        <div key={day} className="p-2 text-center font-medium text-sm">
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
            className={`
              min-h-[120px] p-1 border border-gray-200 cursor-pointer hover:bg-gray-50
              ${!isCurrentMonth ? 'bg-gray-50 text-muted-foreground' : ''}
              ${isToday ? 'bg-blue-50 border-blue-300' : ''}
            `}
          >
            <div className="text-sm font-medium mb-1">{day.getDate()}</div>
            <div className="space-y-1">
              {dayEvents.slice(0, 3).map(event => (
                <div
                  key={event.id}
                  className={`
                    p-1 rounded text-xs border cursor-pointer truncate
                    ${getEventStyle(event)}
                  `}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick?.(event);
                  }}
                >
                  {event.title}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{dayEvents.length - 3} more
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}