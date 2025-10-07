'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Building2, Clock, Filter, Globe, MapPin, Search, Star, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LocationAutocomplete } from '@/components/ui/location-autocomplete';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ProviderSearchResults } from '@/features/calendar/components/provider-search-results';
import { type RouterOutputs, api } from '@/utils/api';

// Extract types from tRPC RouterOutputs for type safety
type ProvidersSearchResult = RouterOutputs['providers']['search'];

// Note: The tRPC query has conditional includes, so we define the expected shape
// based on how we call the query (includeServices: true, includeRequirements: false)
interface ProviderWithRelations {
  id: string;
  name: string;
  bio: string | null;
  status: string;
  languages: string[];
  website: string | null;
  whatsapp: string | null;
  user: { email: string } | null;
  typeAssignments: Array<{
    providerType: {
      id: string;
      name: string;
      description: string | null;
    };
  }>;
  services: Array<{
    id: string;
    name: string;
  }>;
  availabilities?: Array<{
    id: string;
    isOnlineAvailable: boolean;
    location: {
      name: string;
      formattedAddress: string;
    } | null;
  }>;
  requirementSubmissions?: Array<{
    status: string;
  }>;
}

export default function ProvidersPage() {
  const urlSearchParams = useSearchParams();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [debouncedFirstName, setDebouncedFirstName] = useState('');
  const [debouncedLastName, setDebouncedLastName] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [serviceType, setServiceType] = useState('all'); // 'virtual', 'in-person', or 'all'
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Check if we're in landing page search mode
  const isLandingPageSearch =
    urlSearchParams.get('serviceType') || urlSearchParams.get('consultationType');

  // Debounce the name inputs to prevent excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFirstName(firstName);
    }, 300);
    return () => clearTimeout(timer);
  }, [firstName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLastName(lastName);
    }, 300);
    return () => clearTimeout(timer);
  }, [lastName]);

  // Get provider types for filtering
  const { data: providerTypes, isLoading: typesLoading } = api.providers.getProviderTypes.useQuery(
    undefined,
    {
      staleTime: Infinity, // Provider types rarely change
      refetchOnWindowFocus: false,
    }
  );

  // Memoize search parameters to prevent unnecessary re-renders
  const searchParams = useMemo(
    () => ({
      nameSearch:
        debouncedFirstName || debouncedLastName
          ? `${debouncedFirstName} ${debouncedLastName}`.trim()
          : undefined,
      typeIds: selectedTypes.length > 0 ? selectedTypes : undefined,
      status: 'APPROVED' as const,
      page: 1,
      limit: 50,
    }),
    [debouncedFirstName, debouncedLastName, selectedTypes]
  );

  // Search providers with current filters
  const {
    data: searchResults,
    isLoading: providersLoading,
    isFetching,
  } = api.providers.search.useQuery(searchParams, {
    enabled: true, // Always enabled to show initial results
    staleTime: 1000, // Prevent refetching for 1 second
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    placeholderData: (previousData) => previousData, // Prevents loading state on refetch
  });

  // Apply additional client-side filters that the API doesn't support yet
  const filteredProviders = useMemo(() => {
    // Type assertion: we know the shape because we call the query with specific includes
    const providers = searchResults?.providers as unknown as ProviderWithRelations[] | undefined;
    return providers?.filter((provider) => {
      // Location filter (if provider has availability with location or matches search)
      if (selectedLocation && selectedLocation.trim()) {
        const locationQuery = selectedLocation.toLowerCase().trim();
        const hasMatchingLocation =
          provider.availabilities?.some(
            (avail) =>
              avail.location?.name?.toLowerCase().includes(locationQuery) ||
              avail.location?.formattedAddress?.toLowerCase().includes(locationQuery)
          ) ||
          provider.name?.toLowerCase().includes(locationQuery) ||
          provider.bio?.toLowerCase().includes(locationQuery);

        if (!hasMatchingLocation) return false;
      }

      // Service type filter (virtual/in-person)
      if (serviceType && serviceType !== 'all') {
        const hasServiceType = provider.availabilities?.some((avail) => {
          if (serviceType === 'virtual') return avail.isOnlineAvailable === true;
          if (serviceType === 'in-person') return avail.isOnlineAvailable === false;
          return true;
        });
        if (!hasServiceType) return false;
      }

      return true;
    });
  }, [searchResults?.providers, selectedLocation, serviceType]);

  const handleTypeToggle = useCallback((typeId: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typeId) ? prev.filter((id) => id !== typeId) : [...prev, typeId]
    );
  }, []);

  const handleClearFilters = useCallback(() => {
    setFirstName('');
    setLastName('');
    setDebouncedFirstName('');
    setDebouncedLastName('');
    setSelectedLocation('');
    setServiceType('all');
    setSelectedTypes([]);
  }, []);

  // Show initial loading only on very first load when no data exists at all
  const isInitialLoading = providersLoading && !searchResults && typesLoading;

  // If coming from landing page, use the new search results component
  if (isLandingPageSearch) {
    const filters = {
      serviceType: urlSearchParams.get('serviceType') || undefined,
      location: urlSearchParams.get('location') || undefined,
      consultationType:
        (urlSearchParams.get('consultationType') as 'online' | 'in-person' | 'both') || 'both',
    };

    return (
      <div className="container mx-auto py-6">
        <ProviderSearchResults filters={filters} />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Healthcare Providers</h1>
        <p className="text-gray-600">Browse our network of approved healthcare professionals</p>
      </div>

      {/* Advanced Search Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Healthcare Providers
            {isFetching && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary"></div>
            )}
          </CardTitle>
          <CardDescription>Search by name, location, specialty, and service type</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary Search Fields */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="e.g., Sarah"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="e.g., Smith"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <LocationAutocomplete
                value={selectedLocation}
                onLocationSelect={(location) => setSelectedLocation(location.description)}
                placeholder="Search cities, towns, regions..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceType">Service Type</Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Any service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any service type</SelectItem>
                  <SelectItem value="virtual">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Virtual/Online
                    </div>
                  </SelectItem>
                  <SelectItem value="in-person">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      In-Person
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Specialty Types Filter */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Healthcare Specialties</Label>
                <p className="text-sm text-muted-foreground">Select one or more specialties</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                {showAdvancedFilters ? 'Hide' : 'Show'} Specialties
                <Filter className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {showAdvancedFilters && providerTypes && providerTypes.length > 0 && (
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                {providerTypes.map((type) => (
                  <Button
                    key={type.id}
                    type="button"
                    variant={selectedTypes.includes(type.id) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleTypeToggle(type.id)}
                    className="h-auto justify-start px-3 py-2"
                  >
                    <div className="text-left">
                      <div className="font-medium">{type.name}</div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClearFilters}
              disabled={
                !firstName &&
                !lastName &&
                !selectedLocation.trim() &&
                (!serviceType || serviceType === 'all') &&
                selectedTypes.length === 0
              }
            >
              Clear All Filters
            </Button>
            <div className="flex items-center text-sm text-muted-foreground">
              <Search className="mr-1 h-4 w-4" />
              Search updates automatically as you type
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {firstName ||
            lastName ||
            selectedLocation.trim() ||
            (serviceType && serviceType !== 'all') ||
            selectedTypes.length > 0
              ? 'Search Results'
              : 'All Providers'}
            <span className="ml-2 text-gray-500">
              ({filteredProviders?.length || 0} providers found)
            </span>
          </h2>
          {(firstName ||
            lastName ||
            selectedLocation.trim() ||
            (serviceType && serviceType !== 'all') ||
            selectedTypes.length > 0) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Filters active</span>
            </div>
          )}
        </div>

        {/* Show initial loading only on very first page load */}
        {isInitialLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-1/4 rounded bg-gray-200"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 rounded bg-gray-200"></div>
              ))}
            </div>
          </div>
        ) : filteredProviders && filteredProviders.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProviders.map((provider) => (
              <Card key={provider.id} className="transition-shadow hover:shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {provider.user?.email}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      {provider.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Bio */}
                  {provider.bio && (
                    <p className="line-clamp-3 text-sm text-gray-600">{provider.bio}</p>
                  )}

                  {/* Provider Types */}
                  {provider.typeAssignments && provider.typeAssignments.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-900">Specialties:</div>
                      <div className="flex flex-wrap gap-1">
                        {provider.typeAssignments.map((assignment) => (
                          <Badge
                            key={assignment.providerType.id}
                            variant="outline"
                            className="text-xs"
                          >
                            {assignment.providerType.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Services */}
                  {provider.services && provider.services.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-900">Services:</div>
                      <div className="text-sm text-gray-600">
                        {provider.services.slice(0, 3).map((service, index: number) => (
                          <span key={service.id}>
                            {service.name}
                            {index < Math.min(provider.services.length - 1, 2) && ', '}
                          </span>
                        ))}
                        {provider.services.length > 3 && (
                          <span className="text-gray-500">
                            {' '}
                            +{provider.services.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Languages */}
                  {provider.languages && provider.languages.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-900">Languages:</div>
                      <div className="flex flex-wrap gap-1">
                        {provider.languages.map((language: string) => (
                          <Badge key={language} variant="outline" className="text-xs">
                            {language}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact Information */}
                  <div className="space-y-1 text-sm">
                    {provider.website && (
                      <div>
                        <span className="font-medium">Website: </span>
                        <a
                          href={provider.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}
                    {provider.whatsapp && (
                      <div>
                        <span className="font-medium">WhatsApp: </span>
                        <span className="text-gray-600">{provider.whatsapp}</span>
                      </div>
                    )}
                  </div>

                  {/* Requirements Status */}
                  {provider.requirementSubmissions &&
                    provider.requirementSubmissions.length > 0 && (
                      <div className="border-t pt-2">
                        <div className="text-xs text-gray-500">
                          Verified Requirements:{' '}
                          {
                            provider.requirementSubmissions.filter(
                              (req) => req.status === 'APPROVED'
                            ).length
                          }
                          /{provider.requirementSubmissions.length}
                        </div>
                      </div>
                    )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button className="flex-1" size="sm">
                      <Clock className="mr-2 h-4 w-4" />
                      Book Appointment
                    </Button>
                    <Button variant="outline" size="sm">
                      <MapPin className="mr-2 h-4 w-4" />
                      View Profile
                    </Button>
                  </div>
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
                {firstName ||
                lastName ||
                selectedLocation.trim() ||
                (serviceType && serviceType !== 'all') ||
                selectedTypes.length > 0
                  ? 'No providers match your search criteria. Try adjusting your filters.'
                  : 'No approved providers are currently available.'}
              </p>
              {(firstName ||
                lastName ||
                selectedLocation.trim() ||
                (serviceType && serviceType !== 'all') ||
                selectedTypes.length > 0) && (
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear All Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stats Footer */}
      {searchResults && searchResults.providers.length > 0 && (
        <Card className="mt-8">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {searchResults.providers.length}
                </div>
                <div className="text-sm text-gray-600">
                  {firstName ||
                  lastName ||
                  selectedLocation.trim() ||
                  (serviceType && serviceType !== 'all') ||
                  selectedTypes.length > 0
                    ? 'Matching Providers'
                    : 'Total Providers'}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {searchResults.providers.reduce(
                    (acc: number, p) => acc + (p.services?.length || 0),
                    0
                  )}
                </div>
                <div className="text-sm text-gray-600">Services Available</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {
                    new Set(
                      (searchResults.providers as unknown as ProviderWithRelations[]).flatMap(
                        (p) => p.typeAssignments?.map((ta) => ta.providerType.name) || []
                      )
                    ).size
                  }
                </div>
                <div className="text-sm text-gray-600">Specialties</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
