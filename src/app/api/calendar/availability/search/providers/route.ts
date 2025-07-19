import { NextRequest, NextResponse } from 'next/server';

import { searchProvidersByLocation } from '@/features/calendar/lib/location-search-service';

export async function POST(request: NextRequest) {
  try {
    const params = await request.json();

    // Validate required parameters
    if (
      !params.coordinates ||
      typeof params.coordinates.lat !== 'number' ||
      typeof params.coordinates.lng !== 'number'
    ) {
      return NextResponse.json({ error: 'Invalid coordinates provided' }, { status: 400 });
    }

    const results = await searchProvidersByLocation(params);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching providers by location:', error);
    return NextResponse.json({ error: 'Failed to search providers' }, { status: 500 });
  }
}
