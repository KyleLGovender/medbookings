import { NextRequest, NextResponse } from 'next/server';

import { searchSlotsByTime } from '@/features/calendar/availability/lib/time-search-service';

export async function POST(request: NextRequest) {
  try {
    const params = await request.json();

    const results = await searchSlotsByTime(params);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching slots by time:', error);
    return NextResponse.json({ error: 'Failed to search slots' }, { status: 500 });
  }
}
