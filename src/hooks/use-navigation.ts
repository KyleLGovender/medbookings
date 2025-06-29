'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface UseNavigationOptions {
  onError?: (error: Error) => void;
  onStart?: () => void;
  onComplete?: () => void;
}

export function useNavigation(options?: UseNavigationOptions) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  const navigate = async (url: string) => {
    if (isNavigating) return; // Prevent double-clicking

    try {
      setIsNavigating(true);
      setNavigatingTo(url);
      options?.onStart?.();

      await router.push(url);

      options?.onComplete?.();
    } catch (error) {
      setIsNavigating(false);
      setNavigatingTo(null);
      options?.onError?.(error as Error);
    }
  };

  const replace = async (url: string) => {
    if (isNavigating) return;

    try {
      setIsNavigating(true);
      setNavigatingTo(url);
      options?.onStart?.();

      await router.replace(url);

      options?.onComplete?.();
    } catch (error) {
      setIsNavigating(false);
      setNavigatingTo(null);
      options?.onError?.(error as Error);
    }
  };

  const back = () => {
    if (isNavigating) return;

    setIsNavigating(true);
    setNavigatingTo('back');
    options?.onStart?.();

    router.back();

    // Reset after a short delay since back() doesn't return a promise
    setTimeout(() => {
      setIsNavigating(false);
      setNavigatingTo(null);
      options?.onComplete?.();
    }, 100);
  };

  const reset = () => {
    setIsNavigating(false);
    setNavigatingTo(null);
  };

  return {
    navigate,
    replace,
    back,
    reset,
    isNavigating,
    navigatingTo,
    isNavigatingTo: (url: string) => navigatingTo === url,
  };
}
