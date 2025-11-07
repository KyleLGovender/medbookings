'use client';

import { ChevronDown, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import { useCalendarSync } from '@/features/calendar/hooks/use-calendar-sync';

interface CalendarSyncButtonProps {
  providerId: string;
  /**
   * Button variant style
   * @default "default"
   */
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  /**
   * Button size
   * @default "default"
   */
  size?: 'default' | 'sm' | 'lg';
  /**
   * Show as split button with dropdown (default)
   * or compact button that only shows dropdown
   * @default false
   */
  compact?: boolean;
}

/**
 * CalendarSyncButton Component
 *
 * Provides manual Google Calendar sync trigger with operation type selection.
 *
 * Features:
 * - Primary "Sync Now" button with loading spinner
 * - Dropdown menu to select Full Sync vs Incremental Sync
 * - Automatically disabled when integration not connected or sync in progress
 * - Toast notifications handled by useCalendarSync hook
 *
 * @example
 * ```tsx
 * <CalendarSyncButton providerId={provider.id} />
 * ```
 */
export function CalendarSyncButton({
  providerId,
  variant = 'default',
  size = 'default',
  compact = false,
}: CalendarSyncButtonProps) {
  const { integrated, isSyncing, sync } = useCalendarSync({ providerId });

  const handleSync = async (operationType: 'FULL_SYNC' | 'INCREMENTAL_SYNC') => {
    await sync(operationType);
  };

  const isDisabled = !integrated || isSyncing;

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} disabled={isDisabled}>
            {isSyncing ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Calendar
                <ChevronDown className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleSync('INCREMENTAL_SYNC')}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Incremental Sync (Recent Changes)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSync('FULL_SYNC')}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Full Sync (Last 90 Days)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Split button layout (default)
  return (
    <div className="flex items-center gap-1">
      <Button
        variant={variant}
        size={size}
        onClick={() => handleSync('INCREMENTAL_SYNC')}
        disabled={isDisabled}
        className="rounded-r-none"
      >
        {isSyncing ? (
          <>
            <Spinner className="mr-2 h-4 w-4" />
            Syncing...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync Now
          </>
        )}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            disabled={isDisabled}
            className="rounded-l-none border-l px-2"
          >
            <ChevronDown className="h-4 w-4" />
            <span className="sr-only">Sync options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleSync('INCREMENTAL_SYNC')}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Incremental Sync (Recent Changes)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSync('FULL_SYNC')}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Full Sync (Last 90 Days)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
