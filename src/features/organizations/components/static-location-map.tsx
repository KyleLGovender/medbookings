'use client';

import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

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

export function StaticLocationMap({ coordinates, locationName }: StaticLocationMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  if (loadError) {
    return <div>Error loading map</div>;
  }

  if (!isLoaded) {
    return <Skeleton className="h-[250px] w-full rounded-lg" />;
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={coordinates}
      zoom={15}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'cooperative',
      }}
    >
      <Marker position={coordinates} title={locationName} />
    </GoogleMap>
  );
}
