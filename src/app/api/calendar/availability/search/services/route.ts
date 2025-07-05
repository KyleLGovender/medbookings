import { NextRequest, NextResponse } from 'next/server';

import { searchServices } from '@/features/calendar/availability/lib/service-filter-service';

export async function POST(request: NextRequest) {
  try {
    const { query, ...params } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const results = await searchServices(query, params);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching services:', error);
    return NextResponse.json({ error: 'Failed to search services' }, { status: 500 });
  }
}
