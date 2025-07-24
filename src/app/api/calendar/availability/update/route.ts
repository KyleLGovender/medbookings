import { NextRequest, NextResponse } from 'next/server';

import { updateAvailability } from '@/features/calendar/lib/actions';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Additional validation for scope parameter at API level
    if (body.scope && !['single', 'future', 'all'].includes(body.scope)) {
      return NextResponse.json(
        { error: 'Invalid scope parameter. Must be "single", "future", or "all"' },
        { status: 400 }
      );
    }

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

    // Handle Zod validation errors specifically
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
