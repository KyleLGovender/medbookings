import { useCallback, useMemo, useState } from 'react';

import { BookingFilters } from '@/features/calendar/types/booking-types';

export function useBookingFilters(searchParams?: { [key: string]: string | string[] | undefined }) {
  // Initialize filters from search params
  const initialFilters = useMemo(() => {
    const filters: BookingFilters = {};
    
    if (searchParams) {
      // Date range from search params
      if (searchParams.startDate && typeof searchParams.startDate === 'string') {
        filters.dateRange = {
          start: new Date(searchParams.startDate),
          end: searchParams.endDate && typeof searchParams.endDate === 'string' 
            ? new Date(searchParams.endDate) 
            : new Date(),
        };
      }
      
      // Time range from search params
      if (searchParams.startTime && typeof searchParams.startTime === 'string') {
        filters.timeRange = {
          startTime: searchParams.startTime,
          endTime: searchParams.endTime && typeof searchParams.endTime === 'string' 
            ? searchParams.endTime 
            : '23:59',
        };
      }
      
      // Location from search params
      if (searchParams.location && typeof searchParams.location === 'string') {
        const location = searchParams.location as 'online' | 'in-person' | 'all';
        if (location !== 'all') {
          filters.location = location;
        }
      }
      
      // Services from search params
      if (searchParams.services) {
        const services = Array.isArray(searchParams.services) 
          ? searchParams.services 
          : [searchParams.services];
        filters.services = services;
      }
      
      // Provider types from search params
      if (searchParams.providerTypes) {
        const types = Array.isArray(searchParams.providerTypes) 
          ? searchParams.providerTypes 
          : [searchParams.providerTypes];
        filters.providerTypes = types;
      }
      
      // Duration filter from search params
      if (searchParams.minDuration || searchParams.maxDuration) {
        const duration: { min?: number; max?: number } = {};
        if (searchParams.minDuration) {
          duration.min = parseInt(searchParams.minDuration as string);
        }
        if (searchParams.maxDuration) {
          duration.max = parseInt(searchParams.maxDuration as string);
        }
        filters.duration = duration;
      }
      
      // Price range from search params
      if (searchParams.minPrice || searchParams.maxPrice) {
        const priceRange: { min?: number; max?: number } = {};
        if (searchParams.minPrice) {
          priceRange.min = parseFloat(searchParams.minPrice as string);
        }
        if (searchParams.maxPrice) {
          priceRange.max = parseFloat(searchParams.maxPrice as string);
        }
        filters.priceRange = priceRange;
      }
    }
    
    return filters;
  }, [searchParams]);

  const [activeFilters, setActiveFilters] = useState<BookingFilters>(initialFilters);

  // Update specific filter
  const updateFilter = useCallback((key: keyof BookingFilters, value: any) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setActiveFilters({});
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.keys(activeFilters).some(key => {
      const value = activeFilters[key as keyof BookingFilters];
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(v => v !== undefined && v !== null);
      }
      return value !== undefined && value !== null;
    });
  }, [activeFilters]);

  // Convert filters to URL search params for persistence
  const filtersToSearchParams = useCallback(() => {
    const params = new URLSearchParams();
    
    if (activeFilters.dateRange) {
      if (activeFilters.dateRange.start) {
        params.set('startDate', activeFilters.dateRange.start.toISOString().split('T')[0]);
      }
      if (activeFilters.dateRange.end) {
        params.set('endDate', activeFilters.dateRange.end.toISOString().split('T')[0]);
      }
    }
    
    if (activeFilters.timeRange) {
      if (activeFilters.timeRange.startTime) {
        params.set('startTime', activeFilters.timeRange.startTime);
      }
      if (activeFilters.timeRange.endTime) {
        params.set('endTime', activeFilters.timeRange.endTime);
      }
    }
    
    if (activeFilters.location) {
      params.set('location', activeFilters.location);
    }
    
    if (activeFilters.services && activeFilters.services.length > 0) {
      activeFilters.services.forEach(service => {
        params.append('services', service);
      });
    }
    
    if (activeFilters.providerTypes && activeFilters.providerTypes.length > 0) {
      activeFilters.providerTypes.forEach(type => {
        params.append('providerTypes', type);
      });
    }
    
    if (activeFilters.duration) {
      if (activeFilters.duration.min) {
        params.set('minDuration', activeFilters.duration.min.toString());
      }
      if (activeFilters.duration.max) {
        params.set('maxDuration', activeFilters.duration.max.toString());
      }
    }
    
    if (activeFilters.priceRange) {
      if (activeFilters.priceRange.min) {
        params.set('minPrice', activeFilters.priceRange.min.toString());
      }
      if (activeFilters.priceRange.max) {
        params.set('maxPrice', activeFilters.priceRange.max.toString());
      }
    }
    
    return params;
  }, [activeFilters]);

  return {
    activeFilters,
    updateFilter,
    clearAllFilters,
    hasActiveFilters,
    filtersToSearchParams,
  };
}