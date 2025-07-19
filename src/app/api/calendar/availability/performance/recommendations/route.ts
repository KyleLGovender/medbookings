import { NextResponse } from 'next/server';

import { getDatabasePerformanceRecommendations } from '@/features/calendar/lib/search-performance-service';

export async function GET() {
  try {
    const recommendations = await getDatabasePerformanceRecommendations();

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Error fetching performance recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance recommendations' },
      { status: 500 }
    );
  }
}
