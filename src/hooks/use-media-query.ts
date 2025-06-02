'use client';

import { useEffect, useState } from 'react';

/**
 * Custom hook to detect if a media query matches
 * @param query The media query to check
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Create the media query list
    const mediaQuery = window.matchMedia(query);

    // Set the initial value
    setMatches(mediaQuery.matches);

    // Define the event listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add the event listener
    mediaQuery.addEventListener('change', listener);

    // Clean up
    return () => {
      mediaQuery.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
}
