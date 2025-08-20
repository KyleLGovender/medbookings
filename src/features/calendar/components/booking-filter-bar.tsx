'use client';

import React from 'react';

import { Calendar, Clock, Filter, MapPin, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FilterBarProps } from '@/features/calendar/types/booking-types';

export function BookingFilterBar({ filters, provider }: FilterBarProps) {
  const { activeFilters, updateFilter, clearAllFilters, hasActiveFilters } = filters;

  // Mock data for dropdowns - these would come from API
  const providerTypes = ['General Practitioner', 'Specialist', 'Therapist'];
  const services = ['Consultation', 'Follow-up', 'Assessment', 'Therapy Session'];

  return (
    <Card>
      <CardContent className="py-4">
        <div className="space-y-4">
          {/* Filter Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Label className="text-sm font-medium">Filter Appointments</Label>
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="gap-2"
              >
                <X className="h-3 w-3" />
                Clear All
              </Button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            {/* Date Range Filter */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Start Date</Label>
              <DatePicker
                date={activeFilters.dateRange?.start}
                onChange={(date) => 
                  updateFilter('dateRange', {
                    ...activeFilters.dateRange,
                    start: date || new Date(),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">End Date</Label>
              <DatePicker
                date={activeFilters.dateRange?.end}
                onChange={(date) => 
                  updateFilter('dateRange', {
                    ...activeFilters.dateRange,
                    end: date,
                  })
                }
              />
            </div>

            {/* Time Range Filter */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Start Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={activeFilters.timeRange?.startTime || ''}
                  onChange={(e) =>
                    updateFilter('timeRange', {
                      ...activeFilters.timeRange,
                      startTime: e.target.value,
                    })
                  }
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">End Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={activeFilters.timeRange?.endTime || ''}
                  onChange={(e) =>
                    updateFilter('timeRange', {
                      ...activeFilters.timeRange,
                      endTime: e.target.value,
                    })
                  }
                  className="pl-10"
                />
              </div>
            </div>

            {/* Location Filter */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Location</Label>
              <Select
                value={activeFilters.location || 'all'}
                onValueChange={(value: 'online' | 'in-person' | 'all') => 
                  updateFilter('location', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger>
                  <MapPin className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="online">Online Only</SelectItem>
                  <SelectItem value="in-person">In-Person Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Service Filter */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Service</Label>
              <Select
                value={activeFilters.services?.[0] || 'all'}
                onValueChange={(value) => 
                  updateFilter('services', value === 'all' ? undefined : [value])
                }
              >
                <SelectTrigger>
                  <Search className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="All Services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {services.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Filters Row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {/* Duration Filter */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Duration (minutes)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={activeFilters.duration?.min || ''}
                  onChange={(e) =>
                    updateFilter('duration', {
                      ...activeFilters.duration,
                      min: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="text-xs"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={activeFilters.duration?.max || ''}
                  onChange={(e) =>
                    updateFilter('duration', {
                      ...activeFilters.duration,
                      max: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="text-xs"
                />
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Price Range ($)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={activeFilters.priceRange?.min || ''}
                  onChange={(e) =>
                    updateFilter('priceRange', {
                      ...activeFilters.priceRange,
                      min: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="text-xs"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={activeFilters.priceRange?.max || ''}
                  onChange={(e) =>
                    updateFilter('priceRange', {
                      ...activeFilters.priceRange,
                      max: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="text-xs"
                />
              </div>
            </div>

            {/* Provider Type Filter */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Provider Type</Label>
              <Select
                value={activeFilters.providerTypes?.[0] || 'all'}
                onValueChange={(value) => 
                  updateFilter('providerTypes', value === 'all' ? undefined : [value])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {providerTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}