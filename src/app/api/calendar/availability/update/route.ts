import { NextRequest, NextResponse } from 'next/server';

import { updateAvailability } from '@/features/calendar/availability/lib/actions';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await updateAvailability(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update availability' },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in update availability API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
