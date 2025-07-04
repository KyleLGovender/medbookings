import { NextRequest, NextResponse } from 'next/server';
import { acceptAvailabilityProposal } from '@/features/calendar/availability/lib/actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Availability ID is required' },
        { status: 400 }
      );
    }

    const result = await acceptAvailabilityProposal(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to accept availability proposal' },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in accept availability API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}