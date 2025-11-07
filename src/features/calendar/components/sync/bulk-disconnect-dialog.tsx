'use client';

import { useState } from 'react';

import { AlertTriangle, Loader2, MapPin } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Location {
  id: string;
  name: string;
}

interface BulkDisconnectDialogProps {
  /**
   * Dialog open state
   */
  open: boolean;
  /**
   * Callback when open state changes
   */
  onOpenChange: (open: boolean) => void;
  /**
   * Organization name
   */
  organizationName: string;
  /**
   * List of locations that will be disconnected
   */
  locations: Location[];
  /**
   * Callback when user confirms bulk disconnect
   * Called only if user types the correct organization name
   */
  onConfirm: () => void | Promise<void>;
  /**
   * Whether bulk disconnect operation is in progress
   * Shows spinner on confirm button when true
   */
  isDisconnecting?: boolean;
}

/**
 * BulkDisconnectDialog Component
 *
 * Type-to-confirm dialog for bulk disconnecting ALL organization calendar integrations.
 *
 * Features:
 * - Shows list of all locations that will be affected
 * - User must type exact organization name (case-insensitive) to confirm
 * - Shows total count of integrations
 * - Disabled confirm button until name matches
 * - Loading state during bulk disconnect operation
 * - Summary of affected locations with scroll area
 *
 * Security:
 * - Prevents accidental bulk disconnects with type-to-confirm pattern
 * - Clear visual indication of scope (number of locations affected)
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 * const bulkDisconnectMutation = api.calendarSync.disconnectAllOrganizationCalendars.useMutation();
 *
 * <BulkDisconnectDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   organizationName="Acme Medical Group"
 *   locations={[
 *     { id: '1', name: 'Downtown Clinic' },
 *     { id: '2', name: 'Westside Clinic' },
 *   ]}
 *   onConfirm={() => bulkDisconnectMutation.mutate({ organizationId })}
 *   isDisconnecting={bulkDisconnectMutation.isPending}
 * />
 * ```
 */
export function BulkDisconnectDialog({
  open,
  onOpenChange,
  organizationName,
  locations,
  onConfirm,
  isDisconnecting = false,
}: BulkDisconnectDialogProps) {
  const [inputValue, setInputValue] = useState('');

  // Reset input when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setInputValue('');
    }
    onOpenChange(newOpen);
  };

  // Check if input matches organization name (case-insensitive, trimmed)
  const isMatch = inputValue.trim().toLowerCase() === organizationName.trim().toLowerCase();

  const handleConfirm = async () => {
    if (!isMatch || isDisconnecting) {
      return;
    }

    await onConfirm();
    // Dialog will close via onOpenChange from parent after successful disconnect
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Disconnect All Calendar Integrations
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div className="rounded-md border-2 border-destructive/50 bg-destructive/10 p-4">
              <p className="font-semibold text-destructive">
                This will disconnect ALL {locations.length} location calendar integration
                {locations.length !== 1 ? 's' : ''} for this organization.
              </p>
            </div>

            <p>
              Any slots currently blocked by calendar events at any location will become available
              again. Historical sync data will be preserved for audit purposes.
            </p>

            {/* Locations List */}
            <div className="space-y-2">
              <Label className="text-foreground">Locations that will be disconnected:</Label>
              <ScrollArea className="h-32 rounded-md border bg-muted/30 p-3">
                <div className="space-y-2">
                  {locations.map((location) => (
                    <div
                      key={location.id}
                      className="flex items-center gap-2 rounded-sm bg-background p-2"
                    >
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{location.name}</span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        Integrated
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Type to Confirm */}
            <div className="space-y-2 pt-2">
              <Label htmlFor="confirm-org-name" className="text-foreground">
                To confirm, type <span className="font-bold">{organizationName}</span> below:
              </Label>
              <Input
                id="confirm-org-name"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`Type ${organizationName}`}
                disabled={isDisconnecting}
                autoComplete="off"
                className="font-mono"
              />
              {inputValue && !isMatch && (
                <p className="text-xs text-destructive">Organization name does not match</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDisconnecting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault(); // Prevent default close behavior
              void handleConfirm();
            }}
            disabled={!isMatch || isDisconnecting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDisconnecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Disconnecting All...
              </>
            ) : (
              `Disconnect All ${locations.length} Location${locations.length !== 1 ? 's' : ''}`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
