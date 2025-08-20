import React, { useState } from 'react';
import { AlertTriangle, Calendar, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import type { CalendarEvent } from '@/features/calendar/types/types';
import type { SeriesActionScope, CalendarEventAction } from '@/features/calendar/types/modal';

interface ScopeSelectionStepProps {
  event: CalendarEvent;
  action: CalendarEventAction | null;
  onSelect: (scope: SeriesActionScope) => void;
  onCancel: () => void;
}

export function ScopeSelectionStep({
  event,
  action,
  onSelect,
  onCancel,
}: ScopeSelectionStepProps) {
  const [selectedScope, setSelectedScope] = useState<SeriesActionScope>('single');

  const actionText = action || 'view';
  const actionLabel = actionText.charAt(0).toUpperCase() + actionText.slice(1);

  const handleConfirm = () => {
    onSelect(selectedScope);
  };

  const getScopeDescription = (scope: SeriesActionScope): string => {
    const eventDate = event.startTime.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });

    switch (scope) {
      case 'single':
        return `${actionLabel} only this occurrence (${eventDate})`;
      case 'future':
        return `${actionLabel} this and all future occurrences`;
      case 'all':
        return `${actionLabel} all occurrences in this series`;
      default:
        return '';
    }
  };

  const isDestructive = ['delete', 'cancel'].includes(actionText);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {actionLabel} Recurring Availability
        </DialogTitle>
        <DialogDescription>
          You are about to {actionText} a recurring availability. Choose which occurrences you want to affect:
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
              {event.seriesId && (
                <div className="mt-1 text-xs text-gray-500">
                  Series ID: {event.seriesId}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scope Selection */}
        <div className="space-y-4">
          <RadioGroup
            value={selectedScope}
            onValueChange={(value) => setSelectedScope(value as SeriesActionScope)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="single" id="single" />
              <Label htmlFor="single" className="text-sm font-normal">
                {getScopeDescription('single')}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="future" id="future" />
              <Label htmlFor="future" className="text-sm font-normal">
                {getScopeDescription('future')}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="text-sm font-normal">
                {getScopeDescription('all')}
              </Label>
            </div>
          </RadioGroup>

          {/* Warning Messages */}
          {selectedScope === 'all' && isDestructive && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-red-600" />
                <p className="text-sm text-red-700">
                  <strong>Warning:</strong> This will permanently {actionText} all occurrences of this recurring availability.
                </p>
              </div>
            </div>
          )}

          {selectedScope === 'future' && isDestructive && (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-700">
                  <strong>Notice:</strong> This will {actionText} the current occurrence and all future occurrences.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant={isDestructive ? 'destructive' : 'default'}
          >
            {actionLabel}
          </Button>
        </div>
      </div>
    </>
  );
}