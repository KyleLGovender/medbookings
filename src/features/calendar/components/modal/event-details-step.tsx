import React from 'react';
import { AvailabilityStatus } from '@prisma/client';
import { Calendar, Check, Edit, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import type { CalendarEvent } from '@/features/calendar/types/types';
import type { CalendarEventPermissions, CalendarEventAction, SeriesActionScope } from '@/features/calendar/types/modal';

interface EventDetailsStepProps {
  event: CalendarEvent;
  scope: SeriesActionScope | null;
  permissions: CalendarEventPermissions;
  customActions?: CalendarEventAction[];
  onActionClick: (action: CalendarEventAction) => void;
  onClose: () => void;
}

export function EventDetailsStep({
  event,
  scope,
  permissions,
  customActions = [],
  onActionClick,
  onClose,
}: EventDetailsStepProps) {
  const scopeText = scope === 'single' ? 'This Occurrence' : 
                   scope === 'future' ? 'This & Future' : 
                   scope === 'all' ? 'All Occurrences' : '';

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Event Details
          {scope && scope !== 'single' && (
            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
              {scopeText}
            </span>
          )}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6">
        {/* Event Information */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-lg font-medium">{event.title}</div>
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
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {renderActionButtons(event, permissions, customActions, onActionClick)}
            </div>
          </div>
        </div>

        {/* Creator Information */}
        <div className="rounded-lg border bg-gray-50 p-4">
          <div className="mb-2 text-sm font-medium text-gray-700">
            {event.isProviderCreated
              ? 'Provider Created'
              : `${event.organization?.name || 'Organization'} Created`}
          </div>
          <div className="text-sm">
            {event.createdBy && (
              <>
                <div className="mb-1 text-xs text-gray-600">Created by</div>
                <div className="text-sm font-medium">{event.createdBy.name}</div>
              </>
            )}
          </div>
        </div>

        {/* Event Details Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Service Details */}
          {event.service && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Service Details</div>
              <div className="text-sm">
                <strong>Service:</strong> {event.service.name}
              </div>
              {event.service.duration && (
                <div className="text-sm">
                  <strong>Duration:</strong> {event.service.duration} minutes
                </div>
              )}
              {event.service.price && (
                <div className="text-sm">
                  <strong>Price:</strong> R{event.service.price}
                </div>
              )}
            </div>
          )}

          {/* Additional Information */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Additional Information</div>
            {event.location && (
              <div className="text-sm">
                <strong>Location:</strong>{' '}
                {event.location.isOnline ? 'Online' : event.location.name}
              </div>
            )}
            {event.customer && (
              <div className="text-sm">
                <strong>Customer:</strong> {event.customer.name}
              </div>
            )}
            <div className="text-sm">
              <strong>Status:</strong>{' '}
              <span className="capitalize">
                {event.status.toLowerCase().replace('_', ' ')}
              </span>
            </div>
            {event.isRecurring && (
              <div className="text-sm">
                <strong>Recurring:</strong> Yes
                {event.seriesId && (
                  <div className="text-xs text-gray-600">
                    Series ID: {event.seriesId}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </>
  );
}

function renderActionButtons(
  event: CalendarEvent,
  permissions: CalendarEventPermissions,
  customActions: CalendarEventAction[],
  onActionClick: (action: CalendarEventAction) => void
) {
  const buttons: React.ReactNode[] = [];

  // Provider-created availability buttons
  if (event.isProviderCreated) {
    if (permissions.canEdit) {
      buttons.push(
        <Button
          key="edit"
          variant="outline"
          size="sm"
          className="border-blue-300 bg-blue-50 text-blue-700 hover:border-blue-400 hover:bg-blue-100"
          onClick={() => onActionClick('edit')}
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      );
    }

    if (permissions.canDelete) {
      buttons.push(
        <Button
          key="delete"
          variant="outline"
          size="sm"
          className="border-red-300 bg-red-50 text-red-700 hover:border-red-400 hover:bg-red-100"
          onClick={() => onActionClick('delete')}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      );
    }

  } else {
    // Organization-created availability buttons
    if (event.status === AvailabilityStatus.PENDING) {
      if (permissions.canAccept) {
        buttons.push(
          <Button
            key="accept"
            variant="outline"
            size="sm"
            className="border-green-300 bg-green-50 text-green-700 hover:border-green-400 hover:bg-green-100"
            onClick={() => onActionClick('accept')}
          >
            <Check className="mr-2 h-4 w-4" />
            Accept
          </Button>
        );
      }

      if (permissions.canReject) {
        buttons.push(
          <Button
            key="reject"
            variant="outline"
            size="sm"
            className="border-red-300 bg-red-50 text-red-700 hover:border-red-400 hover:bg-red-100"
            onClick={() => onActionClick('reject')}
          >
            <X className="mr-2 h-4 w-4" />
            Reject
          </Button>
        );
      }
    }

  }

  // Add custom actions
  customActions.forEach(action => {
    buttons.push(
      <Button
        key={action}
        variant="outline" 
        size="sm"
        onClick={() => onActionClick(action)}
      >
        {action.charAt(0).toUpperCase() + action.slice(1)}
      </Button>
    );
  });

  // Show message if no actions available
  if (buttons.length === 0) {
    return (
      <div className="px-2 py-1.5 text-xs text-gray-500">
        No actions available for status: {event.status}
      </div>
    );
  }

  return buttons;
}