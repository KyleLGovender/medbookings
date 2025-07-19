import { NextRequest, NextResponse } from 'next/server';

import { searchAvailability } from '@/features/calendar/lib/actions';
import { AvailabilityStatus } from '@/features/calendar/types/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params = {
      serviceProviderId: searchParams.get('serviceProviderId') || undefined,
      organizationId: searchParams.get('organizationId') || undefined,
      locationId: searchParams.get('locationId') || undefined,
      serviceId: searchParams.get('serviceId') || undefined,
      startDate: searchParams.get('startDate')
        ? new Date(searchParams.get('startDate')!)
        : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      status: (searchParams.get('status') as AvailabilityStatus) || undefined,
      seriesId: searchParams.get('seriesId') || undefined,
    };

    console.log('API: Received availability search params:', params);
    const result = await searchAvailability(params);
    console.log('API: Search result:', result);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch availability' },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data || []);
  } catch (error) {
    console.error('Error in availability API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
