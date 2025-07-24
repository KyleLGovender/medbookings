import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface CalendarErrorProps {
  error?: Error | string | null;
  onRetry?: () => void;
  title?: string;
  description?: string;
  type?: 'network' | 'server' | 'validation' | 'unknown';
  showRetry?: boolean;
}

/**
 * Reusable error component for calendar-related errors
 * Provides consistent error UI with retry functionality
 */
export function CalendarError({
  error,
  onRetry,
  title,
  description,
  type = 'unknown',
  showRetry = true,
}: CalendarErrorProps) {
  const getErrorIcon = () => {
    switch (type) {
      case 'network':
        return <WifiOff className="h-5 w-5" />;
      case 'server':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getErrorTitle = () => {
    if (title) return title;
    
    switch (type) {
      case 'network':
        return 'Connection Error';
      case 'server':
        return 'Server Error';
      case 'validation':
        return 'Validation Error';
      default:
        return 'Something Went Wrong';
    }
  };

  const getErrorDescription = () => {
    if (description) return description;
    
    switch (type) {
      case 'network':
        return 'Unable to connect to the server. Please check your internet connection and try again.';
      case 'server':
        return 'The server encountered an error while processing your request. Please try again later.';
      case 'validation':
        return 'The provided data is invalid. Please check your input and try again.';
      default:
        return 'An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.';
    }
  };

  const errorMessage = typeof error === 'string' 
    ? error 
    : error instanceof Error 
    ? error.message 
    : null;

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          {getErrorIcon()}
          {getErrorTitle()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          {getErrorDescription()}
        </p>
        
        {errorMessage && (
          <div className="rounded border border-destructive/20 bg-destructive/5 p-3">
            <p className="text-sm text-destructive">{errorMessage}</p>
          </div>
        )}

        {showRetry && onRetry && (
          <div className="flex gap-2">
            <Button onClick={onRetry} size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            {type === 'network' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
              >
                <Wifi className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Inline error component for smaller spaces
 */
export function CalendarErrorInline({
  error,
  onRetry,
  className = '',
}: Pick<CalendarErrorProps, 'error' | 'onRetry'> & { className?: string }) {
  const errorMessage = typeof error === 'string' 
    ? error 
    : error instanceof Error 
    ? error.message 
    : 'An error occurred';

  return (
    <div className={`flex items-center gap-3 rounded border border-destructive/20 bg-destructive/5 p-3 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-destructive" />
      <span className="flex-1 text-sm text-destructive">{errorMessage}</span>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

/**
 * Empty state component for when no data is available
 */
export function CalendarEmptyState({
  title = 'No data available',
  description = 'There is no calendar data to display at this time.',
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="mx-auto max-w-lg">
      <CardContent className="py-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <AlertTriangle className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-medium">{title}</h3>
        <p className="mb-4 text-muted-foreground">{description}</p>
        {action}
      </CardContent>
    </Card>
  );
}