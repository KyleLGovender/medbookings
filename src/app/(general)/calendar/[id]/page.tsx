'use client';

import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import CalendarLoader from '@/components/calendar-loader';
import { ProviderCalendarSlotView } from '@/features/calendar/components/provider-calendar-slot-view';

interface ProviderBookingPageProps {
  params: {
    id: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
}

function ProviderBookingPageContent({ params, searchParams }: ProviderBookingPageProps) {
  // Validate provider ID format
  if (!params.id || typeof params.id !== 'string') {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6">
        <ProviderCalendarSlotView providerId={params.id} searchParams={searchParams} />
      </div>
    </div>
  );
}

export default function ProviderBookingPage({ params, searchParams }: ProviderBookingPageProps) {
  return (
    <Suspense
      fallback={
        <CalendarLoader
          message="Loading provider availability"
          submessage="Fetching available appointment slots..."
          showAfterMs={300}
        />
      }
    >
      <ProviderBookingPageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
