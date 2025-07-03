'use client';

import { useState } from 'react';

import {
  CalendarDays,
  Clock,
  Filter,
  MapPin,
  RotateCcw,
  Search,
  Settings,
  Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

// Note: Popover components might need to be created if not available
// import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AvailabilityStatus, SchedulingRule, SlotStatus } from '../types';

export interface CalendarFilters {
  // Provider filters
  selectedProviders: string[];
  providerTypes: string[];

  // Availability filters
  availabilityStatuses: AvailabilityStatus[];
  schedulingRules: SchedulingRule[];
  showRecurring: boolean;
  showOneTime: boolean;

  // Booking filters
  bookingStatuses: SlotStatus[];
  showConfirmedOnly: boolean;
  showPendingOnly: boolean;

  // Location filters
  selectedLocations: string[];
  showOnlineOnly: boolean;
  showInPersonOnly: boolean;

  // Time filters
  workingHoursOnly: boolean;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  timeRange: {
    start: string; // "09:00"
    end: string; // "17:00"
  };

  // Series filters
  showSeriesOnly: boolean;
  showIndividualOnly: boolean;
  seriesIds: string[];

  // Text search
  searchText: string;
}

export interface CalendarFiltersPanelProps {
  filters: CalendarFilters;
  onFiltersChange: (filters: CalendarFilters) => void;
  providers: Array<{
    id: string;
    name: string;
    type: string;
    specialization?: string;
  }>;
  locations: Array<{
    id: string;
    name: string;
    isOnline: boolean;
  }>;
  className?: string;
  compact?: boolean;
}

export function CalendarFiltersPanel({
  filters,
  onFiltersChange,
  providers,
  locations,
  className = '',
  compact = false,
}: CalendarFiltersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Count active filters
  const countActiveFilters = () => {
    let count = 0;
    if (filters.selectedProviders.length > 0) count++;
    if (filters.providerTypes.length > 0) count++;
    if (filters.availabilityStatuses.length > 0) count++;
    if (filters.schedulingRules.length > 0) count++;
    if (filters.bookingStatuses.length > 0) count++;
    if (filters.selectedLocations.length > 0) count++;
    if (filters.searchText.trim()) count++;
    if (filters.showRecurring !== true) count++;
    if (filters.showOneTime !== true) count++;
    if (filters.workingHoursOnly) count++;
    return count;
  };

  const updateFilter = (key: keyof CalendarFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
    setActiveFiltersCount(countActiveFilters());
  };

  const toggleArrayValue = (array: string[], value: string) => {
    return array.includes(value) ? array.filter((item) => item !== value) : [...array, value];
  };

  const resetFilters = () => {
    const defaultFilters: CalendarFilters = {
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
    };
    onFiltersChange(defaultFilters);
    setActiveFiltersCount(0);
  };

  const getProviderTypes = () => {
    const types = [...new Set(providers.map((p) => p.type))];
    return types.sort();
  };

  if (compact && !isExpanded) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="relative"
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full px-1 py-0 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <RotateCcw className="mr-1 h-4 w-4" />
            Reset
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Calendar Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} active
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {compact && (
              <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)}>
                Collapse
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <RotateCcw className="mr-1 h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Text Search */}
        <div>
          <Label className="text-sm font-medium">Search</Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              placeholder="Search providers, services, or notes..."
              value={filters.searchText}
              onChange={(e) => updateFilter('searchText', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Separator />

        {/* Provider Filters */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <Label className="text-sm font-medium">Providers</Label>
          </div>

          {/* Provider Types */}
          <div>
            <Label className="text-xs text-gray-600">Provider Types</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {getProviderTypes().map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={filters.providerTypes.includes(type)}
                    onCheckedChange={(checked) => {
                      const newTypes = checked
                        ? [...filters.providerTypes, type]
                        : filters.providerTypes.filter((t) => t !== type);
                      updateFilter('providerTypes', newTypes);
                    }}
                  />
                  <Label htmlFor={`type-${type}`} className="text-sm">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Individual Providers */}
          <div>
            <Label className="text-xs text-gray-600">Individual Providers</Label>
            <Select
              value=""
              onValueChange={(providerId) => {
                if (providerId) {
                  const newProviders = toggleArrayValue(filters.selectedProviders, providerId);
                  updateFilter('selectedProviders', newProviders);
                }
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select providers..." />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name} - {provider.type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {filters.selectedProviders.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {filters.selectedProviders.map((providerId) => {
                  const provider = providers.find((p) => p.id === providerId);
                  return provider ? (
                    <Badge
                      key={providerId}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => {
                        const newProviders = filters.selectedProviders.filter(
                          (id) => id !== providerId
                        );
                        updateFilter('selectedProviders', newProviders);
                      }}
                    >
                      {provider.name} ×
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Availability Filters */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <Label className="text-sm font-medium">Availability</Label>
          </div>

          {/* Availability Types */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-recurring"
                checked={filters.showRecurring}
                onCheckedChange={(checked) => updateFilter('showRecurring', checked)}
              />
              <Label htmlFor="show-recurring" className="text-sm">
                Recurring
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-one-time"
                checked={filters.showOneTime}
                onCheckedChange={(checked) => updateFilter('showOneTime', checked)}
              />
              <Label htmlFor="show-one-time" className="text-sm">
                One-time
              </Label>
            </div>
          </div>

          {/* Availability Status */}
          <div>
            <Label className="text-xs text-gray-600">Status</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {Object.values(AvailabilityStatus).map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={filters.availabilityStatuses.includes(status)}
                    onCheckedChange={(checked) => {
                      const newStatuses = checked
                        ? [...filters.availabilityStatuses, status]
                        : filters.availabilityStatuses.filter((s) => s !== status);
                      updateFilter('availabilityStatuses', newStatuses);
                    }}
                  />
                  <Label htmlFor={`status-${status}`} className="text-sm">
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Scheduling Rules */}
          <div>
            <Label className="text-xs text-gray-600">Scheduling Rules</Label>
            <div className="mt-2 space-y-2">
              {Object.values(SchedulingRule).map((rule) => (
                <div key={rule} className="flex items-center space-x-2">
                  <Checkbox
                    id={`rule-${rule}`}
                    checked={filters.schedulingRules.includes(rule)}
                    onCheckedChange={(checked) => {
                      const newRules = checked
                        ? [...filters.schedulingRules, rule]
                        : filters.schedulingRules.filter((r) => r !== rule);
                      updateFilter('schedulingRules', newRules);
                    }}
                  />
                  <Label htmlFor={`rule-${rule}`} className="text-sm">
                    {rule.replace('_', ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Location Filters */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <Label className="text-sm font-medium">Locations</Label>
          </div>

          {/* Location Types */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-online"
                checked={filters.showOnlineOnly}
                onCheckedChange={(checked) => {
                  updateFilter('showOnlineOnly', checked);
                  if (checked) updateFilter('showInPersonOnly', false);
                }}
              />
              <Label htmlFor="show-online" className="text-sm">
                Online only
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-in-person"
                checked={filters.showInPersonOnly}
                onCheckedChange={(checked) => {
                  updateFilter('showInPersonOnly', checked);
                  if (checked) updateFilter('showOnlineOnly', false);
                }}
              />
              <Label htmlFor="show-in-person" className="text-sm">
                In-person only
              </Label>
            </div>
          </div>

          {/* Specific Locations */}
          <div>
            <Label className="text-xs text-gray-600">Specific Locations</Label>
            <div className="mt-2 max-h-32 space-y-2 overflow-y-auto">
              {locations
                .filter((loc) => !loc.isOnline)
                .map((location) => (
                  <div key={location.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`location-${location.id}`}
                      checked={filters.selectedLocations.includes(location.id)}
                      onCheckedChange={(checked) => {
                        const newLocations = checked
                          ? [...filters.selectedLocations, location.id]
                          : filters.selectedLocations.filter((id) => id !== location.id);
                        updateFilter('selectedLocations', newLocations);
                      }}
                    />
                    <Label htmlFor={`location-${location.id}`} className="text-sm">
                      {location.name}
                    </Label>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Time Filters */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <Label className="text-sm font-medium">Time</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="working-hours-only"
              checked={filters.workingHoursOnly}
              onCheckedChange={(checked) => updateFilter('workingHoursOnly', checked)}
            />
            <Label htmlFor="working-hours-only" className="text-sm">
              Working hours only
            </Label>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-gray-600">From</Label>
              <Input
                type="time"
                value={filters.timeRange.start}
                onChange={(e) =>
                  updateFilter('timeRange', {
                    ...filters.timeRange,
                    start: e.target.value,
                  })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">To</Label>
              <Input
                type="time"
                value={filters.timeRange.end}
                onChange={(e) =>
                  updateFilter('timeRange', {
                    ...filters.timeRange,
                    end: e.target.value,
                  })
                }
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Booking Filters */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Bookings</Label>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-confirmed-only"
                checked={filters.showConfirmedOnly}
                onCheckedChange={(checked) => {
                  updateFilter('showConfirmedOnly', checked);
                  if (checked) updateFilter('showPendingOnly', false);
                }}
              />
              <Label htmlFor="show-confirmed-only" className="text-sm">
                Confirmed only
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-pending-only"
                checked={filters.showPendingOnly}
                onCheckedChange={(checked) => {
                  updateFilter('showPendingOnly', checked);
                  if (checked) updateFilter('showConfirmedOnly', false);
                }}
              />
              <Label htmlFor="show-pending-only" className="text-sm">
                Pending only
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
