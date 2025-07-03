'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, MapPin, Calendar, Clock, Filter, Star, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { Slider } from '@/components/ui/slider';
import { z } from 'zod';
import { searchProvidersByLocation, geocodeAddress } from '../lib/location-search-service';
import { searchSlotsByTime, findOptimalTimeSlots } from '../lib/time-search-service';
import { filterServices, getAvailableServiceTypes, searchServices } from '../lib/service-filter-service';
import { ProviderSearchResults, ProviderSearchResult as EnhancedProviderSearchResult } from './provider-search-results';
import { SearchPerformanceMonitor, useSearchPerformanceMonitor } from './search-performance-monitor';

// Search form schema
const searchFormSchema = z.object({
  query: z.string().optional(),
  serviceType: z.string().optional(),
  location: z.string().optional(),
  preferredDate: z.date().optional(),
  endDate: z.date().optional(), // For date range searches
  preferredTime: z.string().optional(),
  endTime: z.string().optional(), // For time range searches
  preferredTimes: z.array(z.string()).optional(), // Multiple preferred times
  timeFlexibility: z.number().min(0).max(180).default(30), // Minutes of flexibility
  dayOfWeek: z.array(z.number().min(0).max(6)).optional(), // Days of week
  excludeWeekends: z.boolean().optional(),
  duration: z.number().min(15).max(480).default(30),
  maxDistance: z.number().min(1).max(100).default(25),
  isOnlineAvailable: z.boolean().optional(),
  priceRange: z.object({
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional(),
  }).optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

// Extend the enhanced provider search result type
type ProviderSearchResult = EnhancedProviderSearchResult;

interface ProviderSearchInterfaceProps {
  onSelectProvider?: (provider: ProviderSearchResult) => void;
  onBookSlot?: (slotId: string, providerId: string) => void;
  defaultFilters?: Partial<SearchFormValues>;
}

export function ProviderSearchInterface({
  onSelectProvider,
  onBookSlot,
  defaultFilters = {},
}: ProviderSearchInterfaceProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ProviderSearchResult[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [availableServiceTypes, setAvailableServiceTypes] = useState<Array<{
    id: string;
    name: string;
    category: string;
    serviceCount: number;
  }>>([]);
  const [isLoadingServiceTypes, setIsLoadingServiceTypes] = useState(false);
  const performanceMonitor = useSearchPerformanceMonitor();

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      duration: 30,
      maxDistance: 25,
      timeFlexibility: 30,
      priceRange: { min: 0, max: 500 },
      excludeWeekends: false,
      ...defaultFilters,
    },
  });

  // Load available service types on component mount
  useEffect(() => {
    const loadServiceTypes = async () => {
      setIsLoadingServiceTypes(true);
      try {
        const serviceTypes = await getAvailableServiceTypes();
        setAvailableServiceTypes(serviceTypes);
      } catch (error) {
        console.error('Error loading service types:', error);
      } finally {
        setIsLoadingServiceTypes(false);
      }
    };

    loadServiceTypes();
  }, []);

  const handleSearch = async (data: SearchFormValues) => {
    setIsSearching(true);
    setLocationError(null);
    const searchStartTime = Date.now();
    
    try {
      let searchCoordinates = data.coordinates;

      // If no coordinates but location provided, try to geocode
      if (!searchCoordinates && data.location) {
        try {
          const geocodeResult = await geocodeAddress(data.location);
          if (geocodeResult) {
            searchCoordinates = {
              lat: geocodeResult.lat,
              lng: geocodeResult.lng,
            };
            // Update form with coordinates
            form.setValue('coordinates', searchCoordinates);
          } else {
            setLocationError('Could not find location. Please try a different address.');
            setSearchResults([]);
            return;
          }
        } catch (geocodeError) {
          console.error('Geocoding error:', geocodeError);
          setLocationError('Error finding location. Please try again.');
          setSearchResults([]);
          return;
        }
      }

      // If still no coordinates, show error
      if (!searchCoordinates) {
        setLocationError('Please provide a location or allow location access.');
        setSearchResults([]);
        return;
      }

      // Build service types array
      const serviceTypes = data.serviceType ? [data.serviceType] : undefined;

      // Perform service-based search if there's a text query
      let serviceFilteredProviders: string[] = [];
      if (data.query) {
        try {
          const serviceResults = await searchServices(data.query, {
            serviceTypeIds: serviceTypes,
            priceRange: data.priceRange,
            durationRange: {
              min: data.duration,
            },
            showPriceOnly: false,
          });

          // Extract unique provider IDs from service search results
          serviceFilteredProviders = Array.from(
            new Set(serviceResults.services.map(service => service.provider.id))
          );
        } catch (error) {
          console.error('Error filtering by services:', error);
        }
      }

      // Build time search parameters
      const timeParams = {
        ...(data.preferredDate && data.endDate
          ? {
              dateRange: {
                startDate: data.preferredDate,
                endDate: data.endDate,
              },
            }
          : data.preferredDate
          ? { specificDate: data.preferredDate }
          : {}),
        ...(data.preferredTime && data.endTime
          ? {
              timeRange: {
                startTime: data.preferredTime,
                endTime: data.endTime,
              },
            }
          : {}),
        ...(data.preferredTimes ? { preferredTimes: data.preferredTimes } : {}),
        timeFlexibility: data.timeFlexibility,
        dayOfWeek: data.dayOfWeek,
        excludeWeekends: data.excludeWeekends,
        minDuration: data.duration,
      };

      // Search using location-based service with enhanced time filtering
      const locationResults = await searchProvidersByLocation({
        coordinates: searchCoordinates,
        maxDistance: data.maxDistance,
        serviceTypes,
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
        duration: data.duration,
        isOnlineAvailable: data.isOnlineAvailable,
        priceRange: data.priceRange,
      });

      // Further filter results using time-based search if advanced time filters are used
      let filteredByTime = locationResults;
      
      if (
        data.endDate ||
        data.endTime ||
        data.preferredTimes ||
        data.dayOfWeek ||
        data.excludeWeekends
      ) {
        const timeSearchPromises = locationResults.map(async (provider) => {
          try {
            const timeResults = await searchSlotsByTime(timeParams, {
              serviceProviderId: provider.providerId,
            });

            // Update provider with time-filtered slots
            if (timeResults.slotsInTimeRange.length > 0) {
              const nearestSlot = timeResults.slotsInTimeRange
                .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];

              return {
                ...provider,
                nearestAvailableSlot: nearestSlot
                  ? {
                      slotId: nearestSlot.slotId,
                      startTime: nearestSlot.startTime,
                      endTime: nearestSlot.endTime,
                      isOnlineAvailable: nearestSlot.isOnlineAvailable,
                      price: nearestSlot.price,
                    }
                  : undefined,
                totalAvailableSlots: timeResults.slotsInTimeRange.length,
              };
            }
            return null;
          } catch (error) {
            console.error('Error filtering provider by time:', error);
            return provider; // Return original if time filtering fails
          }
        });

        const timeFilteredResults = await Promise.all(timeSearchPromises);
        filteredByTime = timeFilteredResults.filter(
          (provider): provider is NonNullable<typeof provider> => provider !== null
        );
      }

      // Further filter by service results if we have service-based filtering
      let finalResults = filteredByTime;
      if (serviceFilteredProviders.length > 0) {
        finalResults = filteredByTime.filter(provider =>
          serviceFilteredProviders.includes(provider.providerId)
        );
      }

      // Convert location results to provider search results format
      const searchResults: ProviderSearchResult[] = finalResults.map(result => {
        const serviceNames = result.availableServices.map(s => s.serviceName);
        const upcomingSlots = generateMockUpcomingSlots(result, serviceNames);
        const providerInfo = generateMockProviderInfo(result.providerName, result.providerType);
        
        return {
          providerId: result.providerId,
          providerName: result.providerName,
          providerType: result.providerType,
          rating: 4.5 + Math.random() * 0.5, // Mock rating - would come from database
          reviewCount: Math.floor(Math.random() * 200) + 10, // Mock review count
          distance: result.distance,
          location: result.location ? {
            name: result.location.name,
            address: result.location.address,
          } : undefined,
          availableServices: result.availableServices,
          nearestAvailableSlot: result.nearestAvailableSlot,
          totalAvailableSlots: result.totalAvailableSlots,
          upcomingSlots,
          providerInfo,
          contactInfo: {
            phone: `+1 (555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
            email: `${result.providerName.toLowerCase().replace(/\s+/g, '.')}@healthcare.com`,
            website: `www.${result.providerName.toLowerCase().replace(/\s+/g, '')}.com`,
          },
        };
      });

      // Apply additional filters
      let filteredResults = searchResults;

      if (data.query) {
        filteredResults = filteredResults.filter(
          result =>
            result.providerName.toLowerCase().includes(data.query!.toLowerCase()) ||
            result.providerType.toLowerCase().includes(data.query!.toLowerCase())
        );
      }

      setSearchResults(filteredResults);

      // Track performance metrics
      const searchEndTime = Date.now();
      performanceMonitor.trackPerformance({
        queryExecutionTime: searchEndTime - searchStartTime,
        totalResults: filteredResults.length,
        indexesUsed: [
          'ServiceAvailabilityConfig_provider_active_price_idx',
          'CalculatedAvailabilitySlot_status_time_service_idx',
          'Availability_provider_status_time_idx',
        ],
        optimizationSuggestions: filteredResults.length === 0 
          ? ['No results found - consider expanding search criteria']
          : searchEndTime - searchStartTime > 2000
          ? ['Search took longer than 2s - consider adding more specific filters']
          : [],
      });

    } catch (error) {
      console.error('Search error:', error);
      setLocationError('An error occurred while searching. Please try again.');
      setSearchResults([]);
      
      // Track error performance
      performanceMonitor.trackPerformance({
        queryExecutionTime: Date.now() - searchStartTime,
        totalResults: 0,
        indexesUsed: [],
        optimizationSuggestions: ['Search failed - check connection and try again'],
      });
    } finally {
      setIsSearching(false);
    }
  };

  const watchDuration = form.watch('duration');
  const watchMaxDistance = form.watch('maxDistance');
  const watchTimeFlexibility = form.watch('timeFlexibility');

  // Generate mock upcoming slots for enhanced display
  const generateMockUpcomingSlots = (provider: any, serviceNames: string[]) => {
    const slots = [];
    const now = new Date();
    
    for (let i = 0; i < Math.min(8, provider.totalAvailableSlots); i++) {
      const slotStart = new Date(now.getTime() + (i + 1) * 24 * 60 * 60 * 1000 + Math.random() * 12 * 60 * 60 * 1000);
      const serviceName = serviceNames[Math.floor(Math.random() * serviceNames.length)];
      const basePrice = 50 + Math.random() * 300;
      
      slots.push({
        slotId: `slot-${provider.providerId}-${i}`,
        startTime: slotStart,
        endTime: new Date(slotStart.getTime() + (30 + Math.random() * 60) * 60 * 1000),
        serviceName,
        price: Math.round(basePrice),
        isOnlineAvailable: Math.random() > 0.6,
        requiresConfirmation: Math.random() > 0.7,
      });
    }
    
    return slots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  };

  // Generate mock provider info
  const generateMockProviderInfo = (providerName: string, providerType: string) => {
    const specializations = {
      'General Practitioner': ['Family Medicine', 'Preventive Care', 'Chronic Disease Management'],
      'Physiotherapist': ['Sports Injuries', 'Post-Surgical Rehabilitation', 'Chronic Pain Management'],
      'Cardiologist': ['Heart Disease', 'Hypertension', 'Arrhythmia'],
      'Dermatologist': ['Skin Cancer', 'Acne Treatment', 'Cosmetic Dermatology'],
    };
    
    return {
      bio: `Dr. ${providerName.split(' ')[1] || providerName} is a dedicated ${providerType.toLowerCase()} with extensive experience in providing comprehensive healthcare services.`,
      specializations: specializations[providerType as keyof typeof specializations] || ['General Healthcare'],
      languages: ['English', 'French'].slice(0, Math.random() > 0.5 ? 2 : 1),
      experience: `${5 + Math.floor(Math.random() * 15)} years of experience`,
      education: ['Medical School Graduate', 'Board Certified'],
      certifications: ['Licensed Healthcare Provider'],
    };
  };

  const handleGetCurrentLocation = () => {
    setIsGeolocating(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setIsGeolocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        
        form.setValue('coordinates', coordinates);
        form.setValue('location', `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`);
        setIsGeolocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Could not get your location.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please allow location access and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        setLocationError(errorMessage);
        setIsGeolocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Healthcare Providers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSearch)} className="space-y-4">
              {/* Main Search Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="query"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider or Service</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Search providers, specialties..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            placeholder="City, address, or ZIP"
                            {...field}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGetCurrentLocation}
                            disabled={isGeolocating}
                            className="shrink-0"
                          >
                            <Navigation className="h-4 w-4" />
                            {isGeolocating ? 'Finding...' : 'Use my location'}
                          </Button>
                        </div>
                      </FormControl>
                      {locationError && (
                        <div className="text-sm text-red-600 mt-1">
                          {locationError}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferredDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-end gap-2">
                  <Button
                    type="submit"
                    disabled={isSearching}
                    className="flex-1"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="serviceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={
                                  isLoadingServiceTypes 
                                    ? "Loading services..." 
                                    : "Any service"
                                } />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">All Services</SelectItem>
                              {availableServiceTypes.map((serviceType) => (
                                <SelectItem key={serviceType.id} value={serviceType.name}>
                                  {serviceType.name} ({serviceType.serviceCount} services)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            {availableServiceTypes.length > 0 && 
                              `${availableServiceTypes.length} service types available`
                            }
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="preferredTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Time</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Find appointments around this time
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isOnlineAvailable"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-6">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Online consultations only
                            </FormLabel>
                            <FormDescription>
                              Show only virtual appointments
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Appointment Duration: {watchDuration} minutes</FormLabel>
                          <FormControl>
                            <Slider
                              min={15}
                              max={120}
                              step={15}
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                            />
                          </FormControl>
                          <FormDescription>
                            Find appointments of this duration
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxDistance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Distance: {watchMaxDistance} km</FormLabel>
                          <FormControl>
                            <Slider
                              min={1}
                              max={50}
                              step={1}
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                            />
                          </FormControl>
                          <FormDescription>
                            Search within this radius
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Service Category Filters */}
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="text-sm font-medium">Service Categories</h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Array.from(
                        new Set(availableServiceTypes.map(st => st.category))
                      ).map((category) => {
                        const categoryServices = availableServiceTypes.filter(st => st.category === category);
                        const totalServices = categoryServices.reduce((sum, st) => sum + st.serviceCount, 0);
                        
                        return (
                          <div key={category} className="text-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                // Set the first service type from this category
                                const firstServiceType = categoryServices[0];
                                if (firstServiceType) {
                                  form.setValue('serviceType', firstServiceType.name);
                                }
                              }}
                            >
                              {category}
                            </Button>
                            <p className="text-xs text-muted-foreground mt-1">
                              {totalServices} services
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Advanced Time Filters */}
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="text-sm font-medium">Advanced Time Filters</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date (Date Range)</FormLabel>
                            <FormControl>
                              <DatePicker
                                date={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormDescription>
                              Search within a date range
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Time (Time Range)</FormLabel>
                            <FormControl>
                              <Input
                                type="time"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Search within a time range
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="timeFlexibility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time Flexibility: {watchTimeFlexibility} minutes</FormLabel>
                          <FormControl>
                            <Slider
                              min={0}
                              max={120}
                              step={15}
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                            />
                          </FormControl>
                          <FormDescription>
                            Allow appointments within this many minutes of preferred time
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dayOfWeek"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Days</FormLabel>
                            <FormControl>
                              <div className="grid grid-cols-4 gap-2">
                                {[
                                  { value: 1, label: 'Mon' },
                                  { value: 2, label: 'Tue' },
                                  { value: 3, label: 'Wed' },
                                  { value: 4, label: 'Thu' },
                                  { value: 5, label: 'Fri' },
                                  { value: 6, label: 'Sat' },
                                  { value: 0, label: 'Sun' },
                                ].map((day) => (
                                  <div key={day.value} className="flex items-center space-x-2">
                                    <Checkbox
                                      checked={field.value?.includes(day.value) || false}
                                      onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        if (checked) {
                                          field.onChange([...current, day.value]);
                                        } else {
                                          field.onChange(current.filter(d => d !== day.value));
                                        }
                                      }}
                                    />
                                    <label className="text-sm">{day.label}</label>
                                  </div>
                                ))}
                              </div>
                            </FormControl>
                            <FormDescription>
                              Select preferred days of the week
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="excludeWeekends"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-6">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Exclude weekends
                              </FormLabel>
                              <FormDescription>
                                Only show weekday appointments
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Enhanced Search Results */}
      <ProviderSearchResults
        results={searchResults}
        isLoading={isSearching}
        onSelectProvider={onSelectProvider}
        onBookSlot={onBookSlot}
        onViewAllSlots={(providerId) => {
          console.log('View all slots for provider:', providerId);
          // Implementation would navigate to provider detail page
        }}
        showDetailedView={true}
      />

      {/* Performance Monitor */}
      <SearchPerformanceMonitor
        metrics={performanceMonitor.metrics}
        isVisible={performanceMonitor.isVisible}
        onClose={performanceMonitor.hideMonitor}
      />
    </div>
  );
}

