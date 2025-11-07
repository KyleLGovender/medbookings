'use client';

import { useState } from 'react';

import { AlertTriangle, Loader2 } from 'lucide-react';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DisconnectConfirmationDialogProps {
  /**
   * Dialog open state
   */
  open: boolean;
  /**
   * Callback when open state changes
   */
  onOpenChange: (open: boolean) => void;
  /**
   * Entity name to display (e.g., provider name or organization name)
   */
  entityName: string;
  /**
   * Entity type for customizing warning text
   */
  entityType: 'provider' | 'organization';
  /**
   * Callback when user confirms disconnect
   * Called only if user types the correct entity name
   */
  onConfirm: () => void | Promise<void>;
  /**
   * Whether disconnect operation is in progress
   * Shows spinner on confirm button when true
   */
  isDisconnecting?: boolean;
}

/**
 * DisconnectConfirmationDialog Component
 *
 * Type-to-confirm dialog for disconnecting calendar integrations.
 *
 * Features:
 * - User must type exact entity name (case-insensitive) to confirm
 * - Shows specific warnings based on entity type
 * - Disabled confirm button until name matches
 * - Loading state during disconnect operation
 *
 * Security:
 * - Prevents accidental disconnects with type-to-confirm pattern
 * - Trims input and compares case-insensitively
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 * const disconnectMutation = api.calendarSync.disconnectProviderCalendar.useMutation();
 *
 * <DisconnectConfirmationDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   entityName="Dr. Smith"
 *   entityType="provider"
 *   onConfirm={() => disconnectMutation.mutate({ providerId })}
 *   isDisconnecting={disconnectMutation.isPending}
 * />
 * ```
 */
export function DisconnectConfirmationDialog({
  open,
  onOpenChange,
  entityName,
  entityType,
  onConfirm,
  isDisconnecting = false,
}: DisconnectConfirmationDialogProps) {
  const [inputValue, setInputValue] = useState('');

  // Reset input when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setInputValue('');
    }
    onOpenChange(newOpen);
  };

  // Check if input matches entity name (case-insensitive, trimmed)
  const isMatch = inputValue.trim().toLowerCase() === entityName.trim().toLowerCase();

  const handleConfirm = async () => {
    if (!isMatch || isDisconnecting) {
      return;
    }

    await onConfirm();
    // Dialog will close via onOpenChange from parent after successful disconnect
  };

  // Warning text based on entity type
  const getWarningText = () => {
    if (entityType === 'provider') {
      return 'This will disconnect your Google Calendar integration. Any slots currently blocked by calendar events will become available again.';
    }
    return 'This will disconnect the Google Calendar integration for this organization. Any slots currently blocked by calendar events will become available again.';
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Disconnect Calendar Integration
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>{getWarningText()}</p>

            <div className="rounded-md bg-muted p-4">
              <p className="text-sm font-medium text-foreground">
                Historical sync data will be preserved for audit purposes.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-name" className="text-foreground">
                To confirm, type <span className="font-bold">{entityName}</span> below:
              </Label>
              <Input
                id="confirm-name"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`Type ${entityName}`}
                disabled={isDisconnecting}
                autoComplete="off"
                className="font-mono"
              />
              {inputValue && !isMatch && (
                <p className="text-xs text-destructive">Name does not match</p>
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
                Disconnecting...
              </>
            ) : (
              'Disconnect'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
