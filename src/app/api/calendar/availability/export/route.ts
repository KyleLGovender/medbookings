import { NextRequest, NextResponse } from 'next/server';

import { CalendarExportService } from '@/features/calendar/availability/lib/calendar-export-service';

export async function POST(request: NextRequest) {
  try {
    const { events, providers, config } = await request.json();

    // Create export service instance
    const exportService = new CalendarExportService(config.customization?.timezone || 'UTC');

    // Export calendar
    const result = await exportService.exportCalendar(events, providers || [], config);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Calendar export error:', error);
    return NextResponse.json({ error: 'Failed to export calendar' }, { status: 500 });
  }
}
