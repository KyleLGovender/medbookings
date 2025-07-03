'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Settings, Filter, Download, Eye, Plus, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CalendarEvent, ProviderCalendarData } from './provider-calendar-view';
import { CoverageGapsPanel } from './coverage-gaps-panel';
import { CoverageGap } from '../lib/coverage-gap-analyzer';
import { AvailabilityStatus, SlotStatus } from '../types';

export interface OrganizationProvider {
  id: string;
  name: string;
  type: string;
  specialization?: string;
  isActive: boolean;
  workingHours: { start: string; end: string };
  utilizationRate: number;
  totalBookings: number;
  pendingBookings: number;
  avatar?: string;
  events: CalendarEvent[];
}

export interface OrganizationCalendarData {
  organizationId: string;
  organizationName: string;
  providers: OrganizationProvider[];
  locations: Array<{
    id: string;
    name: string;
    address: string;
    providerCount: number;
  }>;
  stats: {
    totalProviders: number;
    activeProviders: number;
    totalAvailableHours: number;
    totalBookedHours: number;
    averageUtilization: number;
    totalPendingBookings: number;
    coverageGaps: number;
  };
}

export interface OrganizationCalendarViewProps {
  organizationId: string;
  onProviderClick?: (provider: OrganizationProvider) => void;
  onEventClick?: (event: CalendarEvent, provider: OrganizationProvider) => void;
  onTimeSlotClick?: (date: Date, hour: number, provider: OrganizationProvider) => void;
  onCreateAvailability?: (providerId?: string) => void;
  onManageProvider?: (provider: OrganizationProvider) => void;
  onGapClick?: (gap: CoverageGap) => void;
  onRecommendationClick?: (recommendation: string) => void;
  viewMode?: 'day' | 'week' | 'month';
  initialDate?: Date;
  showCoverageGaps?: boolean;
}

type ViewMode = 'day' | 'week' | 'month';

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
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [calendarData, setCalendarData] = useState<OrganizationCalendarData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    showOnlyActive: true,
    showOnlyWithBookings: false,
    selectedLocation: 'all',
    selectedSpecialization: 'all',
  });
  const [showUtilizationOnly, setShowUtilizationOnly] = useState(false);

  // Load organization calendar data
  useEffect(() => {
    const loadCalendarData = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockData: OrganizationCalendarData = {
        organizationId,
        organizationName: 'Downtown Medical Center',
        providers: generateMockProviders(currentDate),
        locations: [
          { id: 'main', name: 'Main Building', address: '123 Health St', providerCount: 8 },
          { id: 'annex', name: 'Annex Building', address: '456 Care Ave', providerCount: 4 },
          { id: 'online', name: 'Online Services', address: 'Virtual', providerCount: 12 },
        ],
        stats: {
          totalProviders: 12,
          activeProviders: 10,
          totalAvailableHours: 320,
          totalBookedHours: 224,
          averageUtilization: 70,
          totalPendingBookings: 18,
          coverageGaps: 3,
        },
      };
      
      setCalendarData(mockData);
      // Initialize with all providers selected
      setSelectedProviders(mockData.providers.map(p => p.id));
      setIsLoading(false);
    };

    loadCalendarData();
  }, [organizationId, currentDate]);

  const generateMockProviders = (baseDate: Date): OrganizationProvider[] => {
    const providerTypes = [
      { name: 'Dr. Sarah Johnson', type: 'General Practitioner', specialization: 'Family Medicine' },
      { name: 'Dr. Michael Chen', type: 'Cardiologist', specialization: 'Heart Disease' },
      { name: 'Dr. Emily Rodriguez', type: 'Pediatrician', specialization: 'Child Health' },
      { name: 'Dr. James Wilson', type: 'Orthopedist', specialization: 'Sports Medicine' },
      { name: 'Dr. Lisa Thompson', type: 'Dermatologist', specialization: 'Skin Care' },
      { name: 'Dr. David Kim', type: 'Neurologist', specialization: 'Brain Health' },
      { name: 'Dr. Maria Garcia', type: 'Psychiatrist', specialization: 'Mental Health' },
      { name: 'Dr. Robert Davis', type: 'Radiologist', specialization: 'Medical Imaging' },
    ];

    return providerTypes.map((providerType, index) => ({
      id: `provider-${index + 1}`,
      name: providerType.name,
      type: providerType.type,
      specialization: providerType.specialization,
      isActive: index < 6 || Math.random() > 0.3,
      workingHours: { start: '09:00', end: index % 2 === 0 ? '17:00' : '16:00' },
      utilizationRate: 50 + Math.random() * 40,
      totalBookings: Math.floor(Math.random() * 20) + 5,
      pendingBookings: Math.floor(Math.random() * 5),
      events: generateProviderEvents(baseDate, index),
    }));
  };

  const generateProviderEvents = (baseDate: Date, providerIndex: number): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    for (let day = 0; day < 7; day++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + day);
      
      // Skip weekends for most providers
      if ((currentDay.getDay() === 0 || currentDay.getDay() === 6) && providerIndex % 3 !== 0) continue;

      // Availability blocks
      if (Math.random() > 0.2) { // 80% chance of having availability
        events.push({
          id: `avail-${providerIndex}-${day}`,
          type: 'availability',
          title: 'Available for Appointments',
          startTime: new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate(), 9, 0),
          endTime: new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate(), 17, 0),
          status: AvailabilityStatus.ACTIVE,
          location: { 
            id: providerIndex % 2 === 0 ? 'main' : 'annex', 
            name: providerIndex % 2 === 0 ? 'Main Building' : 'Annex Building',
            isOnline: false 
          },
        });
      }

      // Bookings
      const bookingCount = Math.floor(Math.random() * 4) + 1;
      for (let i = 0; i < bookingCount; i++) {
        const bookingHour = 10 + (i * 2);
        if (bookingHour < 16) {
          events.push({
            id: `booking-${providerIndex}-${day}-${i}`,
            type: 'booking',
            title: `Patient ${String.fromCharCode(65 + i)} - Consultation`,
            startTime: new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate(), bookingHour, 0),
            endTime: new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate(), bookingHour, 30),
            status: Math.random() > 0.8 ? SlotStatus.PENDING : SlotStatus.BOOKED,
            customer: { name: `Patient ${String.fromCharCode(65 + i)}`, email: `patient${i}@example.com` },
            service: { id: 'svc-1', name: 'Consultation', duration: 30, price: 150 },
          });
        }
      }

      // Blocked time
      if (Math.random() > 0.7) {
        events.push({
          id: `blocked-${providerIndex}-${day}`,
          type: 'blocked',
          title: 'Administrative Time',
          startTime: new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate(), 12, 0),
          endTime: new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate(), 13, 0),
          status: 'blocked',
        });
      }
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

  const toggleProvider = (providerId: string) => {
    setSelectedProviders(prev => 
      prev.includes(providerId) 
        ? prev.filter(id => id !== providerId)
        : [...prev, providerId]
    );
  };

  const toggleAllProviders = () => {
    if (!calendarData) return;
    
    if (selectedProviders.length === calendarData.providers.length) {
      setSelectedProviders([]);
    } else {
      setSelectedProviders(calendarData.providers.map(p => p.id));
    }
  };

  const getFilteredProviders = () => {
    if (!calendarData) return [];
    
    return calendarData.providers.filter(provider => {
      if (filters.showOnlyActive && !provider.isActive) return false;
      if (filters.showOnlyWithBookings && provider.totalBookings === 0) return false;
      // Add more filters as needed
      return true;
    });
  };

  const getEventStyle = (event: CalendarEvent): string => {
    switch (event.type) {
      case 'availability':
        return 'bg-green-100 border-green-300 text-green-800';
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
            <p>No organization calendar data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredProviders = getFilteredProviders();
  const displayedProviders = filteredProviders.filter(p => selectedProviders.includes(p.id));

  return (
    <div className="space-y-6">
      {/* Organization Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">{calendarData.organizationName}</CardTitle>
                <p className="text-sm text-muted-foreground">Healthcare Provider Calendar</p>
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{calendarData.stats.averageUtilization}%</div>
                <div className="text-xs text-muted-foreground">Avg Utilization</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{calendarData.stats.activeProviders}</div>
                <div className="text-xs text-muted-foreground">Active Providers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{calendarData.stats.totalPendingBookings}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{Math.round(calendarData.stats.totalBookedHours)}</div>
                <div className="text-xs text-muted-foreground">Booked Hours</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{calendarData.stats.coverageGaps}</div>
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
              <div className="flex items-center space-x-2">
                <span className="text-sm">Utilization View</span>
                <Switch
                  checked={showUtilizationOnly}
                  onCheckedChange={setShowUtilizationOnly}
                />
              </div>

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
                <Button size="sm" onClick={() => onCreateAvailability()}>
                  <Plus className="h-4 w-4 mr-2" />
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
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium">Providers ({displayedProviders.length})</h4>
                <Button variant="ghost" size="sm" onClick={toggleAllProviders}>
                  {selectedProviders.length === filteredProviders.length ? 'None' : 'All'}
                </Button>
              </div>
              
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredProviders.map(provider => (
                  <div
                    key={provider.id}
                    className={`
                      flex items-center space-x-3 p-2 rounded-lg border cursor-pointer transition-colors
                      ${selectedProviders.includes(provider.id) 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }
                    `}
                    onClick={() => toggleProvider(provider.id)}
                  >
                    <Checkbox
                      checked={selectedProviders.includes(provider.id)}
                      onChange={() => {}}
                    />
                    
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {provider.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{provider.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{provider.type}</div>
                      {showUtilizationOnly && (
                        <div className="flex items-center space-x-1 mt-1">
                          <div className="text-xs font-medium">{Math.round(provider.utilizationRate)}%</div>
                          <div className={`
                            text-xs px-1 py-0.5 rounded
                            ${provider.utilizationRate > 80 
                              ? 'bg-green-100 text-green-700' 
                              : provider.utilizationRate > 60 
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                            }
                          `}>
                            {provider.utilizationRate > 80 ? 'High' : provider.utilizationRate > 60 ? 'Med' : 'Low'}
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
                          <Eye className="h-3 w-3 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onManageProvider?.(provider)}>
                          <Settings className="h-3 w-3 mr-2" />
                          Manage
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onCreateAvailability?.(provider.id)}>
                          <Plus className="h-3 w-3 mr-2" />
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

      {/* Coverage Gaps Analysis */}
      {showCoverageGaps && (
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
      )}
    </div>
  );
}

// Organization Week View Component
interface OrganizationWeekViewProps {
  currentDate: Date;
  providers: OrganizationProvider[];
  onEventClick?: (event: CalendarEvent, provider: OrganizationProvider) => void;
  onTimeSlotClick?: (date: Date, hour: number, provider: OrganizationProvider) => void;
  getEventStyle: (event: CalendarEvent) => string;
  showUtilizationOnly: boolean;
}

function OrganizationWeekView({ 
  currentDate, 
  providers, 
  onEventClick, 
  onTimeSlotClick, 
  getEventStyle,
  showUtilizationOnly 
}: OrganizationWeekViewProps) {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });

  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

  const getEventsForProviderDateAndHour = (provider: OrganizationProvider, date: Date, hour: number) => {
    return provider.events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString() &&
             eventDate.getHours() <= hour &&
             new Date(event.endTime).getHours() > hour;
    });
  };

  if (showUtilizationOnly) {
    return (
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Provider Utilization Overview</h4>
        <div className="grid gap-3">
          {providers.map(provider => (
            <div key={provider.id} className="flex items-center space-x-4 p-3 border rounded-lg">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {provider.name.split(' ').map(n => n[0]).join('')}
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
                    <div className="text-lg font-bold text-orange-600">{provider.pendingBookings}</div>
                    <div className="text-xs text-muted-foreground">Pending</div>
                  </div>
                )}
                
                <div className={`
                  px-2 py-1 rounded text-xs font-medium
                  ${provider.utilizationRate > 80 
                    ? 'bg-green-100 text-green-700' 
                    : provider.utilizationRate > 60 
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                  }
                `}>
                  {provider.utilizationRate > 80 ? 'High' : provider.utilizationRate > 60 ? 'Medium' : 'Low'}
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
        <div className="grid grid-cols-8 gap-1 mb-2">
          <div className="p-2 text-center font-medium text-sm">Provider</div>
          {days.map((day, index) => (
            <div key={index} className="p-2 text-center font-medium border-b text-sm">
              <div>{day.toLocaleDateString([], { weekday: 'short' })}</div>
              <div className="text-xs text-muted-foreground">{day.getDate()}</div>
            </div>
          ))}
        </div>

        {/* Provider Rows */}
        {providers.map(provider => (
          <div key={provider.id} className="grid grid-cols-8 gap-1 mb-1">
            <div className="p-2 border-r bg-gray-50 flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {provider.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium truncate">{provider.name}</div>
                <div className="text-xs text-muted-foreground truncate">{provider.type}</div>
              </div>
            </div>
            
            {days.map((day, dayIndex) => {
              const dayEvents = provider.events.filter(event => 
                new Date(event.startTime).toDateString() === day.toDateString()
              );
              
              return (
                <div
                  key={`${provider.id}-${dayIndex}`}
                  className="min-h-[60px] p-1 border border-gray-200 cursor-pointer hover:bg-gray-50"
                  onClick={() => onTimeSlotClick?.(day, 9, provider)}
                >
                  {dayEvents.slice(0, 3).map(event => (
                    <TooltipProvider key={event.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`
                              p-1 mb-1 rounded text-xs border cursor-pointer truncate
                              ${getEventStyle(event)}
                            `}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventClick?.(event, provider);
                            }}
                          >
                            {event.type === 'booking' ? event.customer?.name || 'Booking' : event.title}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <div className="font-medium">{event.title}</div>
                            <div className="text-sm">
                              {event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                              {event.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
  showUtilizationOnly 
}: OrganizationWeekViewProps) {
  if (showUtilizationOnly) {
    return <OrganizationWeekView 
      currentDate={currentDate} 
      providers={providers} 
      onEventClick={onEventClick} 
      onTimeSlotClick={onTimeSlotClick} 
      getEventStyle={getEventStyle}
      showUtilizationOnly={true}
    />;
  }

  const hours = Array.from({ length: 12 }, (_, i) => i + 8);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">
        {currentDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
      </h4>
      
      {providers.map(provider => {
        const dayEvents = provider.events.filter(event => 
          new Date(event.startTime).toDateString() === currentDate.toDateString()
        );
        
        return (
          <div key={provider.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {provider.name.split(' ').map(n => n[0]).join('')}
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
                  <span className="font-medium">{dayEvents.filter(e => e.type === 'booking').length}</span>
                </div>
              </div>
            </div>
            
            <div className="grid gap-1">
              {dayEvents.length > 0 ? (
                dayEvents.map(event => (
                  <div
                    key={event.id}
                    className={`
                      p-2 rounded border cursor-pointer
                      ${getEventStyle(event)}
                    `}
                    onClick={() => onEventClick?.(event, provider)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{event.title}</div>
                        <div className="text-xs opacity-75">
                          {event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                          {event.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      {event.customer && (
                        <div className="text-xs">{event.customer.name}</div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
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
interface OrganizationMonthViewProps {
  currentDate: Date;
  providers: OrganizationProvider[];
  onEventClick?: (event: CalendarEvent, provider: OrganizationProvider) => void;
  getEventStyle: (event: CalendarEvent) => string;
}

function OrganizationMonthView({ currentDate, providers, onEventClick, getEventStyle }: OrganizationMonthViewProps) {
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
    providers.forEach(provider => {
      provider.events.forEach(event => {
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
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
        <div key={day} className="p-2 text-center font-medium text-sm">
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
            className={`
              min-h-[100px] p-1 border border-gray-200 cursor-pointer hover:bg-gray-50
              ${!isCurrentMonth ? 'bg-gray-50 text-muted-foreground' : ''}
              ${isToday ? 'bg-blue-50 border-blue-300' : ''}
            `}
          >
            <div className="text-sm font-medium mb-1">{day.getDate()}</div>
            <div className="space-y-1">
              {dayEventData.slice(0, 2).map(({ event, provider }, i) => (
                <div
                  key={`${event.id}-${i}`}
                  className={`
                    p-1 rounded text-xs border cursor-pointer truncate
                    ${getEventStyle(event)}
                  `}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick?.(event, provider);
                  }}
                  title={`${provider.name}: ${event.title}`}
                >
                  {provider.name.split(' ')[0]}: {event.type === 'booking' ? event.customer?.name || 'Booking' : 'Available'}
                </div>
              ))}
              {dayEventData.length > 2 && (
                <div className="text-xs text-muted-foreground">
                  +{dayEventData.length - 2} more
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}