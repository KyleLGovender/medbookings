'use client';

import { useCallback, useMemo, useState } from 'react';

import { format, formatDistanceToNow } from 'date-fns';
import { AlertCircle, Calendar, CheckCircle2, Clock, RefreshCw, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CalendarConnectButton } from '@/features/calendar/components/sync/calendar-connect-button';
import { CalendarIntegrationSettings } from '@/features/calendar/components/sync/calendar-integration-settings';
import { CalendarSyncButton } from '@/features/calendar/components/sync/calendar-sync-button';
import { useCalendarSync } from '@/features/calendar/hooks/use-calendar-sync';

interface ProviderCalendarSyncDashboardProps {
  /**
   * ID of the provider
   */
  providerId: string;
  /**
   * Callback when disconnect is requested
   */
  onDisconnect?: () => void;
}

/**
 * ProviderCalendarSyncDashboard Component
 *
 * Complete dashboard for managing provider calendar sync.
 *
 * Features:
 * - Sync statistics (last sync, total operations, success rate)
 * - Manual sync button with operation type selection
 * - Integration settings display
 * - Recent sync operations table with status
 * - Real-time updates (5-second refresh)
 *
 * @example
 * ```tsx
 * <ProviderCalendarSyncDashboard
 *   providerId={provider.id}
 *   onDisconnect={() => handleDisconnect()}
 * />
 * ```
 */
export function ProviderCalendarSyncDashboard({
  providerId,
  onDisconnect,
}: ProviderCalendarSyncDashboardProps) {
  const { status, integrated, integration, recentOperations, isLoading, isSyncing, refetch } =
    useCalendarSync({ providerId, refetchInterval: 5000 });

  // Calculate sync statistics - must be at top level before any returns
  const syncStats = useMemo(() => {
    const totalOperations = recentOperations.length;
    const successfulOperations = recentOperations.filter((op) => op.status === 'SUCCESS').length;
    const failedOperations = recentOperations.filter((op) => op.status === 'FAILED').length;
    const successRate =
      totalOperations > 0 ? Math.round((successfulOperations / totalOperations) * 100) : 0;

    return { totalOperations, successfulOperations, failedOperations, successRate };
  }, [recentOperations]);

  const getOperationStatusBadge = useCallback((status: string) => {
    const variants = {
      PENDING: { variant: 'secondary' as const, icon: Clock, label: 'Pending' },
      IN_PROGRESS: { variant: 'default' as const, icon: RefreshCw, label: 'In Progress' },
      SUCCESS: { variant: 'outline' as const, icon: CheckCircle2, label: 'Success' },
      FAILED: { variant: 'destructive' as const, icon: XCircle, label: 'Failed' },
      CONFLICT_DETECTED: { variant: 'destructive' as const, icon: AlertCircle, label: 'Conflict' },
      SKIPPED: { variant: 'secondary' as const, icon: XCircle, label: 'Skipped' },
    };

    const config = variants[status as keyof typeof variants] || variants.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex w-fit items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Calendar Sync</CardTitle>
            <CardDescription>Loading sync dashboard...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!integrated) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Calendar Sync</CardTitle>
            <CardDescription>Connect your Google Calendar to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-dashed p-8 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Calendar Integration</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Connect your Google Calendar to automatically sync availability and bookings.
              </p>
              <CalendarConnectButton providerId={providerId} className="mt-4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Sync Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Calendar Sync</h2>
          <p className="text-muted-foreground">
            Manage your Google Calendar integration and sync settings
          </p>
        </div>
        <CalendarSyncButton providerId={providerId} />
      </div>

      {/* Sync Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Synced</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {integration?.lastSyncedAt
                ? formatDistanceToNow(integration.lastSyncedAt, { addSuffix: true })
                : 'Never'}
            </div>
            {integration?.lastSyncedAt && (
              <p className="text-xs text-muted-foreground">
                {format(integration.lastSyncedAt, 'MMM d, yyyy h:mm a')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncStats.totalOperations}</div>
            <p className="text-xs text-muted-foreground">Recent sync operations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncStats.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {syncStats.successfulOperations}/{syncStats.totalOperations} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sync Status</CardTitle>
          </CardHeader>
          <CardContent>
            {integration?.syncEnabled ? (
              <>
                <div className="text-2xl font-bold text-green-600 dark:text-green-500">Active</div>
                <p className="text-xs text-muted-foreground">Sync enabled</p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
                  Disabled
                </div>
                <p className="text-xs text-muted-foreground">Sync paused</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Integration Settings */}
      <CalendarIntegrationSettings providerId={providerId} onDisconnect={onDisconnect} />

      {/* Recent Sync Operations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Sync Operations</CardTitle>
              <CardDescription>Latest calendar synchronization activity</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isSyncing}>
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentOperations.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No sync operations yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Events Processed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOperations.map((operation) => (
                  <TableRow key={operation.id}>
                    <TableCell className="font-medium">
                      <Badge variant="outline">{operation.operationType}</Badge>
                    </TableCell>
                    <TableCell>{getOperationStatusBadge(operation.status)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm">
                          {formatDistanceToNow(operation.createdAt, { addSuffix: true })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(operation.createdAt, 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {operation.completedAt
                        ? `${Math.round((operation.completedAt.getTime() - operation.createdAt.getTime()) / 1000)}s`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">{operation.eventsProcessed || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
