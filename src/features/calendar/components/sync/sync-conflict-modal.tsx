'use client';

import { format } from 'date-fns';
import { AlertTriangle, Calendar, CheckCircle2, Clock, Users, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// Import conflict types from detection library
export interface ConflictDetails {
  conflictId: string;
  conflictType: 'EVENT_OVERLAPS_BOOKING' | 'DOUBLE_BOOKING' | 'SLOT_STATE_MISMATCH';
  calendarEvent?: {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    externalEventId: string;
  };
  booking?: {
    id: string;
    status: string;
    startTime: Date;
    endTime: Date;
    clientName?: string;
  };
  slot: {
    id: string;
    startTime: Date;
    endTime: Date;
    status: string;
  };
  detectedAt: Date;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  autoResolvable: boolean;
  suggestedResolution?: string;
}

interface SyncConflictModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;
  /**
   * Callback when modal is closed
   */
  onOpenChange: (open: boolean) => void;
  /**
   * List of conflicts to display
   */
  conflicts: ConflictDetails[];
  /**
   * Callback when user resolves a conflict
   * @param conflictId - ID of conflict to resolve
   * @param resolution - Resolution action chosen by user
   */
  onResolve?: (
    conflictId: string,
    resolution: 'KEEP_BOOKING_REMOVE_EVENT' | 'KEEP_EVENT_CANCEL_BOOKING' | 'AUTO_RESOLVE'
  ) => Promise<void>;
  /**
   * Whether a resolution is currently being processed
   */
  isResolving?: boolean;
}

/**
 * SyncConflictModal Component
 *
 * Modal dialog for displaying and resolving calendar sync conflicts.
 *
 * Features:
 * - Display list of conflicts with details
 * - Severity badges (LOW, MEDIUM, HIGH, CRITICAL)
 * - Conflict type icons and descriptions
 * - Resolution actions (Keep booking, Keep event, Auto-resolve)
 * - Suggested resolutions for guidance
 *
 * @example
 * ```tsx
 * <SyncConflictModal
 *   open={showConflicts}
 *   onOpenChange={setShowConflicts}
 *   conflicts={detectedConflicts}
 *   onResolve={handleResolveConflict}
 * />
 * ```
 */
export function SyncConflictModal({
  open,
  onOpenChange,
  conflicts,
  onResolve,
  isResolving = false,
}: SyncConflictModalProps) {
  const getSeverityBadge = (severity: ConflictDetails['severity']) => {
    const variants = {
      LOW: { variant: 'secondary' as const, icon: CheckCircle2, label: 'Low' },
      MEDIUM: { variant: 'outline' as const, icon: Clock, label: 'Medium' },
      HIGH: { variant: 'default' as const, icon: AlertTriangle, label: 'High' },
      CRITICAL: { variant: 'destructive' as const, icon: XCircle, label: 'Critical' },
    };

    const config = variants[severity];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getConflictTypeLabel = (type: ConflictDetails['conflictType']) => {
    const labels = {
      EVENT_OVERLAPS_BOOKING: 'External Event Overlaps Booking',
      DOUBLE_BOOKING: 'Double Booking Detected',
      SLOT_STATE_MISMATCH: 'Slot Status Mismatch',
    };
    return labels[type];
  };

  const handleResolve = async (
    conflictId: string,
    resolution: 'KEEP_BOOKING_REMOVE_EVENT' | 'KEEP_EVENT_CANCEL_BOOKING' | 'AUTO_RESOLVE'
  ) => {
    if (onResolve) {
      await onResolve(conflictId, resolution);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Calendar Sync Conflicts ({conflicts.length})
          </DialogTitle>
          <DialogDescription>
            Conflicts were detected during calendar synchronization. Review and resolve each
            conflict below.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[500px] pr-4">
          <div className="space-y-4">
            {conflicts.length === 0 ? (
              <div className="rounded-md border border-dashed p-8 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">No conflicts detected</p>
              </div>
            ) : (
              conflicts.map((conflict, index) => (
                <div key={conflict.conflictId} className="space-y-3 rounded-lg border p-4">
                  {/* Conflict Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {getConflictTypeLabel(conflict.conflictType)}
                        </span>
                        {getSeverityBadge(conflict.severity)}
                        {conflict.autoResolvable && (
                          <Badge variant="outline" className="text-xs">
                            Auto-Resolvable
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Detected {format(conflict.detectedAt, 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Conflict Details */}
                  <div className="space-y-3">
                    {/* Calendar Event */}
                    {conflict.calendarEvent && (
                      <div className="rounded-md bg-muted/50 p-3">
                        <div className="flex items-start gap-2">
                          <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">{conflict.calendarEvent.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(conflict.calendarEvent.startTime, 'MMM d, h:mm a')} -{' '}
                              {format(conflict.calendarEvent.endTime, 'h:mm a')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Booking */}
                    {conflict.booking && (
                      <div className="rounded-md bg-muted/50 p-3">
                        <div className="flex items-start gap-2">
                          <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">
                              Booking
                              {conflict.booking.clientName && `: ${conflict.booking.clientName}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(conflict.booking.startTime, 'MMM d, h:mm a')} -{' '}
                              {format(conflict.booking.endTime, 'h:mm a')}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {conflict.booking.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Suggested Resolution */}
                    {conflict.suggestedResolution && (
                      <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-950">
                        <p className="text-xs text-blue-900 dark:text-blue-100">
                          <span className="font-medium">Suggestion:</span>{' '}
                          {conflict.suggestedResolution}
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Resolution Actions */}
                  <div className="flex flex-wrap gap-2">
                    {conflict.autoResolvable && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleResolve(conflict.conflictId, 'AUTO_RESOLVE')}
                        disabled={isResolving}
                      >
                        Auto-Resolve
                      </Button>
                    )}

                    {conflict.conflictType === 'EVENT_OVERLAPS_BOOKING' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleResolve(conflict.conflictId, 'KEEP_BOOKING_REMOVE_EVENT')
                          }
                          disabled={isResolving}
                        >
                          Keep Booking
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleResolve(conflict.conflictId, 'KEEP_EVENT_CANCEL_BOOKING')
                          }
                          disabled={isResolving}
                        >
                          Cancel Booking
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isResolving}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
