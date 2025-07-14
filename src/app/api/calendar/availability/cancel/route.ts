import { NextRequest, NextResponse } from 'next/server';

import { cancelAvailability } from '@/features/calendar/availability/lib/actions';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, reason } = body;

    if (!id) {
      return NextResponse.json({ error: 'Availability ID is required' }, { status: 400 });
    }

    const result = await cancelAvailability(id, reason);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to cancel availability' },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: 'Availability cancelled successfully' });
  } catch (error) {
    console.error('Error in cancel availability API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
