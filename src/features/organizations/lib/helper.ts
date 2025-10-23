import { logger } from '@/lib/logger';

// Google Maps type definitions for PlacesService
interface GoogleMap {
  getDiv(): HTMLDivElement;
}

interface PlaceResult {
  address_component?: unknown[];
  formatted_address?: string;
  geometry?: unknown;
  name?: string;
  place_id?: string;
}

// Helper function to fetch place details when address_components are missing
export const fetchPlaceDetails = async (
  placeId: string,
  map: GoogleMap
): Promise<PlaceResult | null> => {
  if (!window.google || !map) return null;

  try {
    const service = new window.google.maps.places.PlacesService(map as unknown as google.maps.Map);

    return new Promise((resolve, reject) => {
      service.getDetails(
        {
          placeId: placeId,
          fields: ['address_component', 'formatted_address', 'geometry', 'name', 'place_id'],
        },
        (result: PlaceResult | null, status: string) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && result) {
            logger.debug('maps', 'Fetched detailed place information', {
              placeId,
              hasResult: !!result,
            });
            resolve(result);
          } else {
            logger.error('Failed to fetch place details', {
              placeId,
              status,
            });
            reject(new Error(`Place details fetch failed: ${status}`));
          }
        }
      );
    });
  } catch (error) {
    logger.error('Error fetching place details', {
      placeId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};
