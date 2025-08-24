'use client';

// import { OrganizationCalendarView } from '@/features/calendar/components/organization-calendar-view';

interface OrganizationCalendarPageProps {
  params: {
    id: string;
  };
}

export default function OrganizationCalendarPage({ params }: OrganizationCalendarPageProps) {
  return (
    <div className="container mx-auto py-6">
      <div className="p-4">
        <p>Organization calendar view needs to be implemented</p>
        <p>Organization ID: {params.id}</p>
      </div>
    </div>
  );
}
