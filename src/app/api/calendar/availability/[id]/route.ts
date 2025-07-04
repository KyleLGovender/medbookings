import { NextRequest, NextResponse } from 'next/server';
import { getAvailabilityById } from '@/features/calendar/availability/lib/actions';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getAvailabilityById(params.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch availability' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in availability by ID API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}