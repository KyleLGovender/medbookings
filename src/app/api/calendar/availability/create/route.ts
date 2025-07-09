import { NextRequest, NextResponse } from 'next/server';

import { createAvailability } from '@/features/calendar/availability/lib/actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createAvailability(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create availability' },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('Error in create availability API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
