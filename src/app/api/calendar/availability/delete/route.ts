import { NextRequest, NextResponse } from 'next/server';

import { deleteAvailability } from '@/features/calendar/availability/lib/actions';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Availability ID is required' }, { status: 400 });
    }

    const result = await deleteAvailability(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete availability' },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: 'Availability deleted successfully' });
  } catch (error) {
    console.error('Error in delete availability API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
