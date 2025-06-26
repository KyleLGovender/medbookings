'use client';

import React from 'react';

import { Button, ButtonProps } from '@/components/ui/button';
import { useNavigation } from '@/hooks/use-navigation';
import { useToast } from '@/hooks/use-toast';

interface NavigationButtonProps extends Omit<ButtonProps, 'onClick'> {
  href: string;
  children: React.ReactNode;
  loadingText?: string;
  showLoadingIcon?: boolean;
  replace?: boolean;
  onNavigationStart?: () => void;
  onNavigationComplete?: () => void;
  onNavigationError?: (error: Error) => void;
}

export function NavigationButton({
  href,
  children,
  loadingText = 'Loading...',
  showLoadingIcon = true,
  replace = false,
  onNavigationStart,
  onNavigationComplete,
  onNavigationError,
  disabled,
  ...buttonProps
}: NavigationButtonProps) {
  const { toast } = useToast();
  
  const { navigate, replace: navigateReplace, isNavigatingTo } = useNavigation({
    onStart: onNavigationStart,
    onComplete: onNavigationComplete,
    onError: (error) => {
      onNavigationError?.(error);
      toast({
        title: 'Navigation Error',
        description: 'Failed to navigate. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const isLoading = isNavigatingTo(href);

  const handleClick = () => {
    if (replace) {
      navigateReplace(href);
    } else {
      navigate(href);
    }
  };

  return (
    <Button
      {...buttonProps}
      onClick={handleClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <>
          {showLoadingIcon && (
            <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

// Convenience components for common navigation patterns
export function NavigationLinkButton(props: NavigationButtonProps) {
  return <NavigationButton variant="link" {...props} />;
}

export function NavigationOutlineButton(props: NavigationButtonProps) {
  return <NavigationButton variant="outline" {...props} />;
}

export function NavigationDefaultButton(props: NavigationButtonProps) {
  return <NavigationButton variant="default" {...props} />;
}