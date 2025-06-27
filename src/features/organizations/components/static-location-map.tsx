'use client';

import { useState } from 'react';

import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { AlertTriangle, MapPin } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface StaticLocationMapProps {
  coordinates: {
    lat: number;
    lng: number;
  };
  locationName: string;
}

const containerStyle = {
  width: '100%',
  height: '250px',
  borderRadius: '0.5rem',
};

const defaultMapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: true,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: true,
  gestureHandling: 'cooperative' as google.maps.GestureHandling,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'on' }],
    },
  ],
};

export function StaticLocationMap({ coordinates, locationName }: StaticLocationMapProps) {
  const [mapError, setMapError] = useState<string | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  // Validate coordinates
  const isValidCoordinates =
    coordinates &&
    typeof coordinates.lat === 'number' &&
    typeof coordinates.lng === 'number' &&
    coordinates.lat >= -90 &&
    coordinates.lat <= 90 &&
    coordinates.lng >= -180 &&
    coordinates.lng <= 180;

  if (!isValidCoordinates) {
    return (
      <div className="flex h-[250px] items-center justify-center rounded-lg border bg-muted">
        <div className="text-center">
          <MapPin className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium text-muted-foreground">Invalid coordinates</p>
          <p className="text-xs text-muted-foreground">Unable to display map location</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <Alert className="flex h-[250px] items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
          <AlertDescription className="mt-2">
            <strong>Maps Error:</strong> Unable to load Google Maps. Please check your internet
            connection or try again later.
          </AlertDescription>
        </div>
      </Alert>
    );
  }

  if (!isLoaded) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-[250px] w-full rounded-lg" />
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <Alert className="flex h-[250px] items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
          <AlertDescription className="mt-2">
            <strong>Map Error:</strong> {mapError}
          </AlertDescription>
        </div>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={coordinates}
        zoom={15}
        options={defaultMapOptions}
        onLoad={(map) => {
          // Ensure the map is properly centered
          map.setCenter(coordinates);
        }}
        onError={(error) => {
          console.error('Google Maps error:', error);
          setMapError('Failed to load map properly');
        }}
      >
        <Marker
          position={coordinates}
          title={locationName}
          animation={google.maps.Animation.DROP}
        />
      </GoogleMap>
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          📍 {locationName} • Lat: {coordinates.lat.toFixed(6)}, Lng: {coordinates.lng.toFixed(6)}
        </p>
      </div>
    </div>
  );
}
