'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

interface NavigationLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  showLoadingIcon?: boolean;
  replace?: boolean;
  onNavigationStart?: () => void;
}

export function NavigationLink({
  href,
  children,
  className,
  showLoadingIcon = true,
  replace = false,
  onNavigationStart,
}: NavigationLinkProps) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  // Reset loading state when pathname changes
  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  const handleClick = () => {
    // Only show loading if we're navigating to a different page
    if (pathname !== href) {
      setIsLoading(true);
      onNavigationStart?.();
      
      // Fallback reset in case pathname doesn't change (e.g., same page navigation)
      setTimeout(() => {
        setIsLoading(false);
      }, 3000);
    }
  };

  return (
    <Link
      href={href}
      replace={replace}
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-2 transition-opacity',
        isLoading && 'opacity-75',
        className
      )}
    >
      {isLoading && showLoadingIcon && (
        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </Link>
  );
}