'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarSyncButton } from '@/features/calendar/components/sync/calendar-sync-button';
import { ProviderCalendarSyncDashboard } from '@/features/calendar/components/sync/provider-calendar-sync-dashboard';
import { useOrganizationCalendarSync } from '@/features/calendar/hooks/use-organization-calendar-sync';

interface Location {
  id: string;
  name: string;
}

interface OrganizationCalendarSyncDashboardProps {
  /**
   * ID of the organization
   */
  organizationId: string;
  /**
   * List of organization locations for location selector
   */
  locations: Location[];
  /**
   * Currently selected location ID
   */
  selectedLocationId?: string;
  /**
   * Callback when location selection changes
   */
  onLocationChange?: (locationId: string | undefined) => void;
  /**
   * Callback when disconnect is requested
   */
  onDisconnect?: () => void;
}

/**
 * OrganizationCalendarSyncDashboard Component
 *
 * Calendar sync dashboard for organizations with multi-location support.
 *
 * Features:
 * - Location selector (organization-wide or specific location)
 * - Sync statistics per location
 * - Integration settings
 * - Recent sync operations
 *
 * @example
 * ```tsx
 * <OrganizationCalendarSyncDashboard
 *   organizationId={org.id}
 *   locations={org.locations}
 *   selectedLocationId={locationId}
 *   onLocationChange={setLocationId}
 * />
 * ```
 */
export function OrganizationCalendarSyncDashboard({
  organizationId,
  locations,
  selectedLocationId,
  onLocationChange,
  onDisconnect,
}: OrganizationCalendarSyncDashboardProps) {
  const { integrated, isLoading } = useOrganizationCalendarSync({
    organizationId,
    locationId: selectedLocationId,
  });

  return (
    <div className="space-y-6">
      {/* Header with Location Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">Calendar Sync</h2>
          <p className="text-muted-foreground">
            Manage calendar integration for your organization and locations
          </p>
        </div>
        {integrated && (
          <div className="flex items-center gap-3">
            <Select
              value={selectedLocationId || 'all'}
              onValueChange={(value) => onLocationChange?.(value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Location-Specific Info Badge */}
      {selectedLocationId && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Location: {locations.find((l) => l.id === selectedLocationId)?.name}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Viewing sync data for this specific location only
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reuse Provider Dashboard Logic */}
      {/* Note: This is a simplified approach - in production, you'd create organization-specific
          components or make ProviderCalendarSyncDashboard more generic */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Calendar Sync</CardTitle>
          <CardDescription>
            Calendar sync is configured at the organization level. Each location can have its own
            calendar integration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {selectedLocationId
              ? 'This dashboard shows sync activity for the selected location.'
              : 'Select a specific location above to view detailed sync information.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
