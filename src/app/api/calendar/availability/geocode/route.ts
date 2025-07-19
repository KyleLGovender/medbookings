import { NextRequest, NextResponse } from 'next/server';

import { geocodeAddress } from '@/features/calendar/lib/location-search-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 });
    }

    const result = await geocodeAddress(address);

    if (!result) {
      return NextResponse.json(
        { error: 'Could not geocode the provided address' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error geocoding address:', error);
    return NextResponse.json({ error: 'Failed to geocode address' }, { status: 500 });
  }
}
