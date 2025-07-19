'use client';

import { OrganizationCalendarView } from '@/features/calendar/components/organization-calendar-view';

interface OrganizationCalendarPageProps {
  params: {
    id: string;
  };
}

export default function OrganizationCalendarPage({ params }: OrganizationCalendarPageProps) {
  return (
    <div className="container mx-auto py-6">
      <OrganizationCalendarView
        organizationId={params.id}
        viewMode="week"
        showCoverageGaps={false}
      />
    </div>
  );
}
