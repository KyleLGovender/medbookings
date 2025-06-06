'use client';

import { ReactNode } from 'react';

import CalendarLoader from '@/components/calendar-loader';

interface QueryLoaderProps {
  isLoading: boolean;
  children: ReactNode;
  message?: string;
  submessage?: string;
}

export default function QueryLoader({
  isLoading,
  children,
  message = 'Loading Data',
  submessage = 'Retrieving your information...',
}: QueryLoaderProps) {
  if (isLoading) {
    return <CalendarLoader message={message} submessage={submessage} />;
  }

  return <>{children}</>;
}
