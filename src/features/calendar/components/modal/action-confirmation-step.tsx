import React, { useState } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import type { CalendarEvent } from '@/features/calendar/types/types';
import type { CalendarEventAction, SeriesActionScope } from '@/features/calendar/types/modal';

interface ActionConfirmationStepProps {
  event: CalendarEvent;
  action: CalendarEventAction | null;
  scope: SeriesActionScope | null;
  onConfirm: () => void;
  onCancel: () => void;
  onSetActionData: (data: Record<string, any>) => void;
}

export function ActionConfirmationStep({
  event,
  action,
  scope,
  onConfirm,
  onCancel,
  onSetActionData,
}: ActionConfirmationStepProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!action) return null;

  const actionText = action.charAt(0).toUpperCase() + action.slice(1);
  const isDestructive = ['delete', 'cancel', 'reject'].includes(action);
  const requiresReason = ['reject', 'cancel'].includes(action) && !event.isProviderCreated;

  const getScopeText = () => {
    if (!scope || scope === 'single') return 'this occurrence';
    if (scope === 'future') return 'this and all future occurrences';
    if (scope === 'all') return 'all occurrences in this series';
    return '';
  };

  const getConfirmationMessage = () => {
    const scopeText = getScopeText();
    
    switch (action) {
      case 'delete':
        return `Are you sure you want to permanently delete ${scopeText}? This action cannot be undone.`;
      case 'cancel':
        return `Are you sure you want to cancel ${scopeText}?`;
      case 'reject':
        return `Are you sure you want to reject ${scopeText}?`;
      default:
        return `Are you sure you want to ${action} ${scopeText}?`;
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    
    // Set reason data if provided
    if (reason.trim()) {
      onSetActionData({ reason: reason.trim() });
    }
    
    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 100));
    
    onConfirm();
    setIsSubmitting(false);
  };

  const handleReasonChange = (value: string) => {
    setReason(value);
    onSetActionData({ reason: value.trim() });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {isDestructive && <AlertTriangle className="h-5 w-5 text-red-500" />}
          {actionText} Availability
        </DialogTitle>
        <DialogDescription>
          {getConfirmationMessage()}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {/* Event Details */}
        <div className="rounded-lg border bg-gray-50 p-4">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-4 w-4 text-gray-500" />
            <div>
              <div className="font-medium">{event.title}</div>
              <div className="text-sm text-gray-600">
                {event.startTime.toLocaleString([], {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                -{' '}
                {event.endTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              {event.organization && (
                <div className="mt-1 text-xs text-gray-500">
                  Created by: {event.organization.name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reason Input (for reject/cancel of org-created availability) */}
        {requiresReason && (
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason for {action} {action === 'reject' ? '(optional)' : '(optional)'}
            </Label>
            <Textarea
              id="reason"
              placeholder={`Please provide a reason for ${action}ing this availability...`}
              value={reason}
              onChange={(e) => handleReasonChange(e.target.value)}
              rows={3}
            />
          </div>
        )}

        {/* Warning Messages */}
        {isDestructive && (
          <div className={`rounded-md border p-3 ${
            action === 'delete' 
              ? 'border-red-200 bg-red-50' 
              : 'border-orange-200 bg-orange-50'
          }`}>
            <div className="flex items-start gap-2">
              <AlertTriangle className={`mt-0.5 h-4 w-4 ${
                action === 'delete' ? 'text-red-600' : 'text-orange-600'
              }`} />
              <div>
                <p className={`text-sm ${
                  action === 'delete' ? 'text-red-700' : 'text-orange-700'
                }`}>
                  <strong>Warning:</strong> {getWarningMessage(action, scope)}
                </p>
                {action === 'delete' && (
                  <p className={`mt-1 text-xs ${
                    action === 'delete' ? 'text-red-600' : 'text-orange-600'
                  }`}>
                    This action cannot be undone.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant={isDestructive ? 'destructive' : 'default'}
            disabled={isSubmitting}
          >
            {isSubmitting ? `${actionText}ing...` : actionText}
          </Button>
        </div>
      </div>
    </>
  );
}

function getWarningMessage(action: CalendarEventAction, scope: SeriesActionScope | null): string {
  const scopeText = scope === 'all' ? 'all occurrences' : 
                   scope === 'future' ? 'this and all future occurrences' : 
                   'this occurrence';

  switch (action) {
    case 'delete':
      return `This will permanently delete ${scopeText} of this availability.`;
    case 'cancel':
      return `This will cancel ${scopeText} of this availability.`;
    case 'reject':
      return `This will reject ${scopeText} of this availability proposal.`;
    default:
      return `This will ${action} ${scopeText}.`;
  }
}