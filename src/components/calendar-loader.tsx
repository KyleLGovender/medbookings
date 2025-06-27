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
  const [show, setShow] = useState(showAfterMs <= 0);

  useEffect(() => {
    // If showAfterMs is 0 or negative, show immediately
    if (showAfterMs <= 0) return;

    const timer = setTimeout(() => {
      setShow(true);
    }, showAfterMs);

    return () => clearTimeout(timer);
  }, [showAfterMs]);

  if (!show) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <div className="flex max-w-md flex-col items-center justify-center space-y-6 px-4 text-center">
        <div className="relative">
          <Calendar className="h-16 w-16 text-primary" />
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-foreground">{message}</h2>

        <p className="text-muted-foreground">{submessage}</p>

        <div className="flex items-center justify-center gap-2 text-primary">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Please wait...</span>
        </div>
      </div>
    </div>
  );
}
