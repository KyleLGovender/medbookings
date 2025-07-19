import { NextResponse } from 'next/server';

import { getAvailableServiceTypes } from '@/features/calendar/lib/service-filter-service';

export async function GET() {
  try {
    const serviceTypes = await getAvailableServiceTypes();

    return NextResponse.json(serviceTypes);
  } catch (error) {
    console.error('Error fetching service types:', error);
    return NextResponse.json({ error: 'Failed to fetch service types' }, { status: 500 });
  }
}
