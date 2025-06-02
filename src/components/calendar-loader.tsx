'use client';

import { useEffect, useState } from 'react';

import { Calendar, Loader2 } from 'lucide-react';

interface CalendarLoaderProps {
  message?: string;
  submessage?: string;
  showAfterMs?: number;
}

export default function CalendarLoader({
  message = 'Loading...',
  submessage = 'We will be with you shortly',
  showAfterMs = 300,
}: CalendarLoaderProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, showAfterMs);

    return () => clearTimeout(timer);
  }, [showAfterMs]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-slate-950">
      <div className="flex max-w-md flex-col items-center justify-center space-y-6 px-4 text-center">
        <div className="relative">
          <Calendar className="h-16 w-16 text-teal-600 dark:text-teal-500" />
          <div className="absolute inset-0 animate-ping rounded-full bg-teal-500/20" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {message}
        </h2>

        <p className="text-slate-500 dark:text-slate-400">{submessage}</p>

        <div className="flex items-center justify-center gap-2 text-teal-600 dark:text-teal-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Please wait...</span>
        </div>
      </div>
    </div>
  );
}
