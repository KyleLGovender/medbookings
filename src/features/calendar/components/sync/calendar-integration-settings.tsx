'use client';

import { useCallback } from 'react';

import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, CheckCircle2, User, XCircle } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCalendarSync } from '@/features/calendar/hooks/use-calendar-sync';

interface CalendarIntegrationSettingsProps {
  providerId: string;
  /**
   * Callback when disconnect is requested
   */
  onDisconnect?: () => void;
}

/**
 * CalendarIntegrationSettings Component
 *
 * Displays connected Google Calendar account information and sync settings.
 *
 * Features:
 * - Display connected Google account (email, profile picture)
 * - Show sync status and preferences
 * - Display last sync timestamp
 * - Button to disconnect integration
 *
 * @example
 * ```tsx
 * <CalendarIntegrationSettings
 *   providerId={provider.id}
 *   onDisconnect={() => handleDisconnect()}
 * />
 * ```
 */
export function CalendarIntegrationSettings({
  providerId,
  onDisconnect,
}: CalendarIntegrationSettingsProps) {
  const { integrated, integration, isLoading } = useCalendarSync({ providerId });

  // Extract initials for avatar fallback - must be at top level before any returns
  const getInitials = useCallback((email: string) => {
    const parts = email.split('@')[0]?.split('.');
    if (!parts || parts.length === 0) return email.substring(0, 2).toUpperCase();
    if (parts.length === 1) return parts[0]!.substring(0, 2).toUpperCase();
    return (parts[0]![0] + parts[1]![0]).toUpperCase();
  }, []);

  const syncStatusBadge = useCallback(() => {
    if (!integration?.syncEnabled) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Sync Disabled
        </Badge>
      );
    }

    if (integration.syncFailureCount > 0) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Sync Issues ({integration.syncFailureCount} failures)
        </Badge>
      );
    }

    return (
      <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Active
      </Badge>
    );
  }, [integration?.syncEnabled, integration?.syncFailureCount]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Calendar Integration</CardTitle>
          <CardDescription>Loading integration settings...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!integrated || !integration) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Calendar Integration</CardTitle>
          <CardDescription>No calendar integration configured</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Connect your Google Calendar to sync availability and bookings automatically.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Calendar Integration</CardTitle>
            <CardDescription>Manage your Google Calendar connection</CardDescription>
          </div>
          {syncStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connected Account */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Connected Account</h4>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(integration.googleEmail || 'User')}&background=random`}
                alt={integration.googleEmail || 'User'}
              />
              <AvatarFallback>
                <User className="h-6 w-6" />
                {integration.googleEmail ? getInitials(integration.googleEmail) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">{integration.googleEmail || 'Unknown'}</p>
              <p className="text-xs text-muted-foreground">Google Calendar</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Sync Settings */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Sync Settings</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Background Sync</span>
              <Badge variant={integration.backgroundSyncEnabled ? 'default' : 'secondary'}>
                {integration.backgroundSyncEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Webhook Sync</span>
              <Badge variant={integration.webhookChannelId ? 'default' : 'secondary'}>
                {integration.webhookChannelId ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Auto Meet Links</span>
              <Badge variant={integration.autoCreateMeetLinks ? 'default' : 'secondary'}>
                {integration.autoCreateMeetLinks ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Sync Direction</span>
              <Badge variant="outline">{integration.syncDirection.replace('_', ' ')}</Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Last Sync */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Sync Status</h4>
          <div className="space-y-2">
            {integration.lastSyncedAt ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Synced</span>
                <span className="text-foreground">
                  {formatDistanceToNow(integration.lastSyncedAt, { addSuffix: true })}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Synced</span>
                <span className="text-muted-foreground">Never</span>
              </div>
            )}

            {integration.lastFullSyncAt && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Full Sync</span>
                <span className="text-foreground">
                  {formatDistanceToNow(integration.lastFullSyncAt, { addSuffix: true })}
                </span>
              </div>
            )}

            {integration.syncFailureCount > 0 && integration.lastErrorType && (
              <div className="rounded-md bg-destructive/10 p-3">
                <p className="text-sm font-medium text-destructive">Recent Sync Issues</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {integration.lastErrorType} ({integration.syncFailureCount} failures)
                </p>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Disconnect to stop syncing with Google Calendar
          </p>
          <Button variant="destructive" onClick={onDisconnect} disabled={!onDisconnect}>
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
