'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface LocationAutocompleteProps {
  value: string;
  onLocationSelect: (location: {
    description: string;
    place_id?: string;
  }) => void;
  placeholder?: string;
  className?: string;
}

declare global {
  interface Window {
    google: any;
    initGoogleMaps?: () => void;
  }
}

export function LocationAutocomplete({
  value,
  onLocationSelect,
  placeholder = "Search location...",
  className,
}: LocationAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [error, setError] = useState<string | null>(null);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMapsAPI = () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        setError('Google Maps API key not configured');
        return;
      }

      // Check if already loaded
      if (window.google && window.google.maps && window.google.maps.places) {
        initializeAutocomplete();
        return;
      }

      // Check if script is already loading
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        existingScript.addEventListener('load', initializeAutocomplete);
        return;
      }

      // Create callback function
      const callbackName = 'initGoogleMapsAutocomplete' + Date.now();
      window[callbackName] = initializeAutocomplete;

      // Load the script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        setError('Failed to load Google Maps API');
      };

      document.head.appendChild(script);
    };

    const initializeAutocomplete = () => {
      if (!inputRef.current || !window.google?.maps?.places) {
        setError('Google Maps Places API not available');
        return;
      }

      try {
        // Initialize autocomplete with restrictions to cities and regions
        autocompleteRef.current = new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ['locality', 'administrative_area_level_1', 'administrative_area_level_2', 'sublocality'],
            fields: ['place_id', 'formatted_address', 'name', 'address_components', 'geometry'],
            strictBounds: false,
          }
        );

        // Add listener for place selection
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();

          if (place && (place.formatted_address || place.name)) {
            // Extract city/locality information for cleaner display
            let displayName = place.name || place.formatted_address;

            if (place.address_components) {
              const locality = place.address_components.find((comp: any) =>
                comp.types.includes('locality')
              );
              const adminArea1 = place.address_components.find((comp: any) =>
                comp.types.includes('administrative_area_level_1')
              );
              const country = place.address_components.find((comp: any) =>
                comp.types.includes('country')
              );

              // Prioritize locality (city) + admin area (state/province)
              if (locality) {
                displayName = locality.long_name;
                if (adminArea1) {
                  displayName += `, ${adminArea1.long_name}`;
                }
                if (country && country.short_name !== 'US') {
                  displayName += `, ${country.long_name}`;
                }
              }
            }

            const location = {
              description: displayName,
              place_id: place.place_id,
            };

            setInputValue(location.description);
            onLocationSelect(location);
          }
        });

        setIsLoaded(true);
        setError(null);
      } catch (err) {
        console.error('Error initializing autocomplete:', err);
        setError('Failed to initialize location search');
      }
    };

    loadGoogleMapsAPI();

    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onLocationSelect]);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // If user clears the input, notify parent
    if (!newValue) {
      onLocationSelect({ description: '' });
    }
  };

  if (error) {
    return (
      <div className="relative">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={cn("pl-9", className)}
        />
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <div className="text-xs text-red-500 mt-1">{error}</div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        placeholder={isLoaded ? placeholder : "Loading location search..."}
        className={cn("pl-9", className)}
        disabled={!isLoaded}
      />
      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      {!isLoaded && (
        <div className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary"></div>
        </div>
      )}
    </div>
  );
}