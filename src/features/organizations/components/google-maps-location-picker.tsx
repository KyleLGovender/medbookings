'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { AlertCircle, Loader2, MapPin, Navigation, Search, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isDevelopment } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { nowUTC } from '@/lib/timezone';

interface GoogleMapsLocationPickerProps {
  onLocationSelect: (locationData: {
    googlePlaceId: string;
    formattedAddress: string;
    coordinates: { lat: number; lng: number };
  }) => void;
  initialLocation?: {
    coordinates: { lat: number; lng: number };
    formattedAddress: string;
  };
  className?: string;
}

declare global {
  interface Window {
    google: any;
    [key: string]: any;
  }
}

export function GoogleMapsLocationPicker({
  // @ts-ignore - False positive: function props are valid between client components
  onLocationSelect,
  initialLocation,
  className,
}: GoogleMapsLocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const initializationAttempted = useRef(false);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if we have the API key
  // eslint-disable-next-line no-process-env
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const processLocationResult = useCallback(
    async (result: any) => {
      try {
        logger.debug('maps', 'Processing location result', {
          hasResult: !!result,
          hasPlaceId: !!result?.place_id,
        });

        if (!result || !result.place_id) {
          logger.error('Invalid location result', { hasResult: !!result });
          return;
        }

        // Ensure we have valid coordinates
        let coordinates;
        if (result.geometry.location.lat && result.geometry.location.lng) {
          coordinates = {
            lat: result.geometry.location.lat(),
            lng: result.geometry.location.lng(),
          };
        } else if (result.geometry.location.lat && result.geometry.location.lng) {
          coordinates = {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
          };
        } else {
          logger.error('Invalid coordinates in result');
          return;
        }

        const locationData = {
          googlePlaceId: result.place_id,
          formattedAddress: result.formatted_address,
          coordinates,
        };

        logger.debug('maps', 'Final location data', {
          placeId: locationData.googlePlaceId,
          hasAddress: !!locationData.formattedAddress,
          coordinates: locationData.coordinates,
        });

        setSelectedLocation(locationData);
        onLocationSelect(locationData);
      } catch (error) {
        logger.error('Error processing location result', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
    [onLocationSelect]
  );

  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      if (!window.google || typeof lat !== 'number' || typeof lng !== 'number') return;

      const geocoder = new window.google.maps.Geocoder();

      try {
        const response = await new Promise((resolve, reject) => {
          geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
            if (status === 'OK' && results && results.length > 0) {
              resolve(results);
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          });
        });

        const results = response as unknown[];
        if (Array.isArray(results) && results[0]) {
          processLocationResult(results[0]);
        }
      } catch (error) {
        logger.error('Reverse geocoding error', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
    [processLocationResult]
  );

  const placeMarker = useCallback(
    async (mapInstance: any, position: { lat: number; lng: number }) => {
      if (!mapInstance || !window.google || !position) return;

      try {
        // Remove existing marker
        if (marker) {
          marker.map = null;
        }

        // Import the marker library
        const markerLibrary = (await window.google.maps.importLibrary('marker')) as {
          AdvancedMarkerElement: any;
        };
        const { AdvancedMarkerElement } = markerLibrary;

        // Create new advanced marker
        const newMarker = new AdvancedMarkerElement({
          position,
          map: mapInstance,
          gmpDraggable: true,
        });

        // Add drag listener
        newMarker.addListener('dragend', (event: any) => {
          try {
            if (event && event.latLng) {
              const lat = event.latLng.lat();
              const lng = event.latLng.lng();
              if (typeof lat === 'number' && typeof lng === 'number') {
                reverseGeocode(lat, lng);
              }
            }
          } catch (error) {
            logger.error('Error handling advanced marker drag', {
              error: error instanceof Error ? error.message : String(error),
            });
          }
        });

        setMarker(newMarker);
      } catch (error) {
        logger.error('Error placing marker', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
    [marker, reverseGeocode]
  );

  const handleMapClick = useCallback(
    (event: any) => {
      try {
        if (!event || !event.latLng) {
          logger.error('Invalid map click event');
          return;
        }

        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        if (typeof lat !== 'number' || typeof lng !== 'number') {
          logger.error('Invalid coordinates from map click');
          return;
        }

        placeMarker(map, { lat, lng }).catch((error) =>
          logger.error('Error placing marker from map click', {
            error: error instanceof Error ? error.message : String(error),
          })
        );
        reverseGeocode(lat, lng);
      } catch (error) {
        logger.error('Error handling map click', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
    [map, placeMarker, reverseGeocode]
  );

  // Initialize the map with retry logic
  const initializeMap = useCallback(async () => {
    // Prevent multiple initialization attempts
    if (initializationAttempted.current) {
      return;
    }

    logger.debug('maps', 'Attempting to initialize map');

    // Wait for ref to be available with retry
    let retries = 0;
    const maxRetries = 10;

    while (!mapRef.current && retries < maxRetries) {
      logger.debug('maps', 'Waiting for map ref', { attempt: retries + 1 });
      await new Promise((resolve) => setTimeout(resolve, 100));
      retries++;
    }

    if (!mapRef.current) {
      logger.error('Map ref still not available after retries');
      setError('Map container not ready');
      setIsLoading(false);
      return;
    }

    if (!window.google || !window.google.maps) {
      logger.error('Google Maps not available');
      setError('Google Maps API not loaded');
      setIsLoading(false);
      return;
    }

    initializationAttempted.current = true;

    try {
      const defaultCenter = initialLocation?.coordinates || { lat: -26.2041, lng: 28.0473 }; // Johannesburg

      logger.debug('maps', 'Creating map instance', { center: defaultCenter });

      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 13,
        mapId: '545f6767a9ed78ab9792513f', // Use the provided Map ID
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      logger.debug('maps', 'Map instance created successfully');

      setMap(mapInstance);
      setIsLoading(false);
      setError(null);

      // Add click listener for placing pins
      mapInstance.addListener('click', (event: any) => {
        if (event && event.latLng) {
          handleMapClick(event);
        }
      });

      // If there's an initial location, place a marker
      if (initialLocation && initialLocation.coordinates) {
        placeMarker(mapInstance, initialLocation.coordinates).catch((error) =>
          logger.error('Error placing initial marker', {
            error: error instanceof Error ? error.message : String(error),
          })
        );
      }

      logger.debug('maps', 'Map initialized successfully');
    } catch (error) {
      logger.error('Error initializing map', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError(`Failed to initialize map: ${error}`);
      setIsLoading(false);
      initializationAttempted.current = false; // Allow retry
    }
  }, [initialLocation, handleMapClick, placeMarker]);

  // Load Google Maps API
  const loadGoogleMapsAPI = useCallback(() => {
    // Check if we have an API key
    if (!apiKey) {
      setError('Google Maps API key is not configured');
      setIsLoading(false);
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      logger.debug('maps', 'Google Maps already loaded');
      initializeMap();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      logger.debug('maps', 'Google Maps script already exists, waiting for load');
      // Wait for it to load
      const checkLoaded = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkLoaded);
          logger.debug('maps', 'Google Maps loaded from existing script');
          initializeMap();
        }
      }, 100);

      // Timeout after 15 seconds
      setTimeout(() => {
        clearInterval(checkLoaded);
        if (!window.google || !window.google.maps) {
          setError('Google Maps failed to load (timeout)');
          setIsLoading(false);
        }
      }, 15000);
      return;
    }

    logger.debug('maps', 'Loading Google Maps API');

    // Create a unique callback name
    const callbackName = `initGoogleMaps_${nowUTC().getTime()}_${Math.random().toString(36).substring(2, 11)}`;

    // Set up the callback
    window[callbackName] = () => {
      logger.debug('maps', 'Google Maps API loaded successfully via callback');
      initializeMap();
      // Clean up the callback
      delete window[callbackName];
    };

    // Load the Google Maps JavaScript API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&v=weekly&callback=${callbackName}&loading=async`;
    script.async = true;
    script.defer = true;
    script.onerror = (error) => {
      logger.error('Failed to load Google Maps API', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Failed to load Google Maps API');
      setIsLoading(false);
      // Clean up the callback
      delete window[callbackName];
    };

    document.head.appendChild(script);
  }, [apiKey, initializeMap]);

  // Load API when component mounts
  useEffect(() => {
    // Small delay to ensure component is fully rendered
    const timer = setTimeout(() => {
      loadGoogleMapsAPI();
    }, 100);

    return () => clearTimeout(timer);
  }, [loadGoogleMapsAPI]);

  const searchPlaces = async (query: string) => {
    if (!query.trim() || !window.google || !map) return;

    setIsSearching(true);

    try {
      // Use the new Places API SearchNearby
      const placesLibrary = (await window.google.maps.importLibrary('places')) as {
        Place: any;
        SearchNearbyRankPreference: any;
      };
      const { Place, SearchNearbyRankPreference } = placesLibrary;

      // Create the request
      const request = {
        textQuery: query.trim(),
        fields: ['id', 'displayName', 'formattedAddress', 'location', 'addressComponents'],
        locationBias: map.getCenter(),
        maxResultCount: 5,
        rankPreference: SearchNearbyRankPreference.DISTANCE,
      };

      // Perform the search
      const { places } = await Place.searchByText(request);

      if (places && places.length > 0) {
        // Convert new API results to the format expected by the component
        const convertedResults = places.map((place: any) => ({
          place_id: place.id,
          name: place.displayName?.text || place.displayName || '', // Map displayName to name
          formatted_address: place.formattedAddress,
          geometry: {
            location: {
              lat: () => place.location.lat(),
              lng: () => place.location.lng(),
            },
          },
          address_components: place.addressComponents || [],
        }));

        setSearchResults(convertedResults);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      logger.error('Places search error', {
        error: error instanceof Error ? error.message : String(error),
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result: any) => {
    try {
      if (!result || !result.geometry || !result.geometry.location) {
        logger.error('Invalid search result');
        return;
      }

      let location;
      if (result.geometry.location.lat && result.geometry.location.lng) {
        location = {
          lat: result.geometry.location.lat(),
          lng: result.geometry.location.lng(),
        };
      } else {
        location = {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        };
      }

      // Center map on selected location and add marker
      map.setCenter(location);
      map.setZoom(16);
      placeMarker(map, location).catch((error) =>
        logger.error('Error placing marker', {
          error: error instanceof Error ? error.message : String(error),
        })
      );

      processLocationResult(result);
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      logger.error('Error selecting search result', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const location = { lat, lng };

          map.setCenter(location);
          map.setZoom(16);
          placeMarker(map, location).catch((error) =>
            logger.error('Error placing marker', {
              error: error instanceof Error ? error.message : String(error),
            })
          );
          reverseGeocode(lat, lng);
        } catch (error) {
          logger.error('Error processing current location', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      },
      (error) => {
        logger.error('Error getting current location', {
          error: error instanceof Error ? error.message : String(error),
        });
        alert('Unable to get your current location. Please search for your location instead.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const clearSelection = () => {
    setSelectedLocation(null);
    if (marker) {
      marker.map = null;
      setMarker(null);
    }
  };

  const retryInitialization = () => {
    initializationAttempted.current = false;
    setError(null);
    setIsLoading(true);
    loadGoogleMapsAPI();
  };

  // Show error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <div className="font-medium text-destructive">Google Maps Error</div>
                <div className="text-sm text-destructive/80">{error}</div>
                {!apiKey && (
                  <div className="mt-1 text-xs text-destructive/60">
                    Please ensure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set in your environment
                    variables.
                  </div>
                )}
              </div>
            </div>
            <Button onClick={retryInitialization} variant="outline" className="w-full">
              Retry Loading Map
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Select Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Interface */}
        <div className="space-y-2">
          <Label htmlFor="location-search">Search for a location</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="location-search"
                placeholder="Search for your practice location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchPlaces(searchQuery)}
                disabled={isLoading || !!error}
              />
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-md border bg-background shadow-lg">
                  {searchResults.map((result) => (
                    <div
                      key={result.place_id}
                      className="cursor-pointer border-b p-3 last:border-b-0 hover:bg-accent"
                      onClick={() => selectSearchResult(result)}
                    >
                      <div className="font-medium">{result.name || 'Unknown Location'}</div>
                      <div className="text-sm text-muted-foreground">
                        {result.formatted_address}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => searchPlaces(searchQuery)}
              disabled={isSearching || isLoading || !searchQuery.trim() || !!error}
              className="flex items-center gap-2"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={getCurrentLocation}
              disabled={isLoading || !!error}
              className="flex items-center gap-2"
            >
              <Navigation className="h-4 w-4" />
              Current
            </Button>
          </div>
        </div>

        {/* Map Container - Always rendered */}
        <div className="space-y-2">
          <Label>Click on the map to place a pin</Label>
          <div className="relative h-64 w-full overflow-hidden rounded-lg border bg-muted">
            {/* Map div - always present */}
            <div ref={mapRef} className="h-full w-full" />

            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <div className="text-center">
                  <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-muted-foreground" />
                  <div className="text-muted-foreground">Loading Google Maps...</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    API Key: {apiKey ? '✓ Configured' : '✗ Missing'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected Location Display */}
        {selectedLocation && (
          <div className="rounded-lg border bg-accent/50 p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Selected Location</Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-sm font-medium">{selectedLocation.formattedAddress}</div>
                <div className="text-xs text-muted-foreground">
                  Coordinates: {selectedLocation.coordinates.lat.toFixed(6)},{' '}
                  {selectedLocation.coordinates.lng.toFixed(6)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Debug info */}
        {isDevelopment && (
          <div className="rounded bg-muted/50 p-2 text-xs text-muted-foreground">
            <div>Debug Info:</div>
            <div>API Key: {apiKey ? '✓ Present' : '✗ Missing'}</div>
            <div>Map Ref: {mapRef.current ? '✓ Available' : '✗ Not available'}</div>
            <div>Google Maps: {window.google ? '✓ Loaded' : '✗ Not loaded'}</div>
            <div>Map Instance: {map ? '✓ Created' : '✗ Not created'}</div>
            <div>Initialization Attempted: {initializationAttempted.current ? '✓' : '✗'}</div>
            {selectedLocation && (
              <div className="mt-2">
                <div>Selected Location Debug:</div>
                <div>{JSON.stringify(selectedLocation)}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
