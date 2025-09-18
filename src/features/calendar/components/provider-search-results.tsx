'use client';

import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

import {
  Calendar,
  ChevronLeft,
  Clock,
  Filter,
  Globe,
  Loader2,
  MapPin,
  Star,
  Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserAvatar } from '@/components/user-avatar';
import { api } from '@/utils/api';

interface ProviderSearchFilters {
  serviceType?: string;
  location?: string;
  consultationType: 'online' | 'in-person' | 'both';
}

interface ProviderSearchResultsProps {
  filters: ProviderSearchFilters;
}

export function ProviderSearchResults({ filters }: ProviderSearchResultsProps) {
  const router = useRouter();
  const [localFilters, setLocalFilters] = useState(filters);
  const [showFilters, setShowFilters] = useState(false);

  // Stabilize date calculations to prevent infinite re-renders
  const searchDates = useMemo(() => {
    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead
    return {
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
    };
  }, []); // Empty dependency array - calculate once when component mounts

  // Search providers using the new API with proper React Query configuration
  const {
    data: providers,
    isLoading,
    error,
  } = api.calendar.searchProvidersByLocation.useQuery(
    {
      serviceType: localFilters.serviceType,
      location: localFilters.location,
      consultationType: localFilters.consultationType,
      startDate: searchDates.startDate,
      endDate: searchDates.endDate,
      limit: 20,
    },
    {
      // Prevent excessive refetching
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchInterval: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      // Only retry on mount, not on every re-render
      retry: 1,
      // Only refetch when filters actually change
      enabled: true,
    }
  );

  const handleBackToSearch = () => {
    router.push('/');
  };

  const handleBookProvider = (providerId: string) => {
    router.push(`/calendar/${providerId}`);
  };

  const handleFilterChange = (key: keyof ProviderSearchFilters, value: string) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const formatSearchCriteria = () => {
    const criteria = [];
    if (localFilters.serviceType) criteria.push(localFilters.serviceType);
    if (localFilters.location) criteria.push(`in ${localFilters.location}`);
    if (localFilters.consultationType !== 'both') {
      criteria.push(
        localFilters.consultationType === 'online' ? 'online consultations' : 'in-person visits'
      );
    }
    return criteria.length > 0 ? criteria.join(', ') : 'all providers';
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="mb-4 text-red-500">
            <Users className="mx-auto h-12 w-12" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">Search Error</h3>
          <p className="mb-4 text-gray-600">
            There was an error searching for providers. Please try again.
          </p>
          <Button onClick={handleBackToSearch} variant="outline">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button and search criteria */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleBackToSearch}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              New Search
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Healthcare Providers</h1>
          </div>
          <p className="text-gray-600">Showing results for: {formatSearchCriteria()}</p>
        </div>

        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          {showFilters ? 'Hide' : 'Refine'} Filters
        </Button>
      </div>

      {/* Expandable filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Refine Your Search</CardTitle>
            <CardDescription>
              Adjust filters to find the perfect healthcare provider
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="serviceType">Service Type</Label>
                <Input
                  id="serviceType"
                  value={localFilters.serviceType || ''}
                  onChange={(e) => handleFilterChange('serviceType', e.target.value)}
                  placeholder="e.g. Dentist, Doctor, Psychologist"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={localFilters.location || ''}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  placeholder="Enter city, suburb, or postal code"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="consultationType">Consultation Type</Label>
                <Select
                  value={localFilters.consultationType}
                  onValueChange={(value) => handleFilterChange('consultationType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Online & In-Person</SelectItem>
                    <SelectItem value="online">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Online Only
                      </div>
                    </SelectItem>
                    <SelectItem value="in-person">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        In-Person Only
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching providers...
            </span>
          ) : (
            `${providers?.length || 0} provider${providers?.length === 1 ? '' : 's'} found`
          )}
        </p>
      </div>

      {/* Provider results */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <Card className="h-80">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                      <div className="space-y-2">
                        <div className="h-4 w-24 rounded bg-gray-200"></div>
                        <div className="h-3 w-16 rounded bg-gray-200"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-full rounded bg-gray-200"></div>
                      <div className="h-3 w-2/3 rounded bg-gray-200"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-6 w-16 rounded bg-gray-200"></div>
                      <div className="h-6 w-20 rounded bg-gray-200"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : providers && providers.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <Card key={provider.id} className="transition-shadow hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <UserAvatar name={provider.name} image={provider.image} className="h-12 w-12" />
                  <div className="flex-1 space-y-1">
                    <CardTitle className="text-lg leading-tight">{provider.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {provider.specialties.length > 0
                        ? provider.specialties[0]
                        : 'Healthcare Provider'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Bio */}
                {provider.bio && (
                  <p className="line-clamp-2 text-sm text-gray-600">{provider.bio}</p>
                )}

                {/* Specialties */}
                {provider.specialties.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Specialties</div>
                    <div className="flex flex-wrap gap-1">
                      {provider.specialties.slice(0, 3).map((specialty) => (
                        <Badge key={specialty} variant="secondary" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                      {provider.specialties.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{provider.specialties.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {provider.languages.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Languages</div>
                    <div className="flex flex-wrap gap-1">
                      {provider.languages.slice(0, 3).map((language) => (
                        <Badge key={language} variant="outline" className="text-xs">
                          {language}
                        </Badge>
                      ))}
                      {provider.languages.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{provider.languages.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Reviews */}
                {provider.averageRating && provider.totalReviews > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{provider.averageRating.toFixed(1)}</span>
                    </div>
                    <span className="text-gray-500">({provider.totalReviews} reviews)</span>
                  </div>
                )}

                {/* Availability info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-sm">
                    {provider.supportsOnline && (
                      <div className="flex items-center gap-1 text-green-600">
                        <Globe className="h-4 w-4" />
                        <span>Online</span>
                      </div>
                    )}
                    {provider.supportsInPerson && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <MapPin className="h-4 w-4" />
                        <span>In-Person</span>
                      </div>
                    )}
                  </div>

                  {provider.availableSlots > 0 && (
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <Clock className="h-4 w-4" />
                      <span>{provider.availableSlots} slots available</span>
                    </div>
                  )}

                  {provider.nextAvailableSlot && (
                    <div className="text-sm text-gray-600">
                      Next: {new Date(provider.nextAvailableSlot.startTime).toLocaleDateString()} at{' '}
                      {new Date(provider.nextAvailableSlot.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  )}
                </div>

                {/* Locations */}
                {provider.locations.length > 0 && (
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {provider.locations[0].name}
                        {provider.locations.length > 1 &&
                          ` (+${provider.locations.length - 1} more)`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action button */}
                <Button
                  onClick={() => handleBookProvider(provider.id)}
                  className="mt-4 w-full"
                  disabled={provider.availableSlots === 0}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {provider.availableSlots > 0 ? 'Book Appointment' : 'No Slots Available'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No providers found</h3>
            <p className="mb-4 text-gray-600">
              No healthcare providers match your search criteria. Try adjusting your filters or
              search in a different area.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button onClick={handleBackToSearch} variant="outline">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Try New Search
              </Button>
              <Button onClick={() => setShowFilters(true)} variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Adjust Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
