import { NextRequest, NextResponse } from 'next/server';

import { CoverageGapAnalyzer } from '@/features/calendar/availability/lib/coverage-gap-analyzer';

export async function POST(request: NextRequest) {
  try {
    const { providers, startDate, endDate, requirements } = await request.json();

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Use provided requirements or default
    const analyzer = new CoverageGapAnalyzer(
      requirements || CoverageGapAnalyzer.getDefaultRequirements()
    );

    // Analyze coverage
    const analysis = analyzer.analyzeCoverage(providers, start, end);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Coverage analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze coverage gaps' }, { status: 500 });
  }
}
