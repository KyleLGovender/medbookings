import { NextRequest, NextResponse } from 'next/server';

import { rejectAvailabilityProposal } from '@/features/calendar/lib/actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, reason } = body;

    if (!id) {
      return NextResponse.json({ error: 'Availability ID is required' }, { status: 400 });
    }

    const result = await rejectAvailabilityProposal(id, reason);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to reject availability proposal' },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: 'Availability proposal rejected successfully' });
  } catch (error) {
    console.error('Error in reject availability API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
