import React, { useEffect, useState } from 'react';

import { AvailabilityStatus } from '@prisma/client';
import {
  AlertTriangle,
  Calendar,
  Check,
  Clock,
  Edit,
  MapPin,
  Monitor,
  Repeat,
  Trash2,
  User,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import type {
  AvailabilityAction,
  AvailabilityPermissions,
  SeriesActionScope,
} from '@/features/calendar/types/modal';
import type { RouterOutputs } from '@/utils/api';

type AvailabilityData = RouterOutputs['calendar']['searchAvailability'][number];

type ModalStep = 'details' | 'scope-selection' | 'confirmation';

interface AvailabilityModalProps {
  isOpen: boolean;
  event: AvailabilityData | null;
  permissions: AvailabilityPermissions;
  customActions?: AvailabilityAction[];
  onEdit: (event: AvailabilityData, scope: SeriesActionScope) => void;
  onDelete: (event: AvailabilityData, scope: SeriesActionScope) => void;
  onAccept: (event: AvailabilityData) => void;
  onReject: (event: AvailabilityData, reason: string) => void;
  onClose: () => void;
}

export function AvailabilityModal({
  isOpen,
  event,
  permissions,
  customActions = [],
  onEdit,
  onDelete,
  onAccept,
  onReject,
  onClose,
}: AvailabilityModalProps) {
  const [step, setStep] = useState<ModalStep>('details');
  const [pendingAction, setPendingAction] = useState<AvailabilityAction | null>(null);
  const [selectedScope, setSelectedScope] = useState<SeriesActionScope | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [scopeForSelection, setScopeForSelection] = useState<SeriesActionScope>('single');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && event) {
      // Start with scope selection for recurring events, details for single events
      setStep(event.isRecurring ? 'scope-selection' : 'details');
      setPendingAction('view');
      setSelectedScope(event.isRecurring ? null : 'single');
      setRejectionReason('');
    }
  }, [isOpen, event]);

  if (!isOpen || !event) return null;

  const handleActionClick = (action: AvailabilityAction) => {
    setPendingAction(action);

    if (action === 'edit') {
      // We already have scope selected, execute immediately
      const scope = selectedScope || 'single';
      onEdit(event, scope);
      onClose();
    } else if (['delete', 'accept', 'reject'].includes(action)) {
      setStep('confirmation');
    }
  };

  const handleScopeSelect = () => {
    setSelectedScope(scopeForSelection);
    setStep('details');
  };

  const handleConfirm = () => {
    if (!pendingAction) return;

    const scope = selectedScope || 'single';

    switch (pendingAction) {
      case 'delete':
        onDelete(event, scope);
        break;
      case 'accept':
        onAccept(event);
        break;
      case 'reject':
        onReject(event, rejectionReason);
        break;
    }

    onClose();
  };

  const scopeText =
    selectedScope === 'single'
      ? 'This Occurrence'
      : selectedScope === 'future'
        ? 'This & Future'
        : selectedScope === 'all'
          ? 'All Occurrences'
          : '';

  const renderActionButtons = () => {
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
            onClick={() => handleActionClick('edit')}
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
            onClick={() => handleActionClick('delete')}
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
              onClick={() => handleActionClick('accept')}
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
              onClick={() => handleActionClick('reject')}
            >
              <X className="mr-2 h-4 w-4" />
              Reject
            </Button>
          );
        }
      }
    }

    // Add custom actions
    customActions.forEach((action) => {
      buttons.push(
        <Button key={action} variant="outline" size="sm" onClick={() => handleActionClick(action)}>
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
  };

  const renderDetailsStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Availability Details
          {selectedScope && selectedScope !== 'single' && (
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
              <div className="text-lg font-medium">{event.provider?.user?.name || 'Provider'}</div>
              <div className="text-sm text-gray-600">
                {new Date(event.startTime).toLocaleString([], {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                -{' '}
                {new Date(event.endTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">{renderActionButtons()}</div>
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
            {event.createdById && (
              <>
                <div className="mb-1 text-xs text-gray-600">Created by</div>
                <div className="text-sm font-medium">{event.provider?.user?.name || 'User'}</div>
              </>
            )}
          </div>
        </div>

        {/* Date and Time Information */}
        <div className="rounded-lg border bg-gray-50 p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">
                  {new Date(event.startTime).toLocaleDateString([], {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                <div className="text-xs text-gray-600">
                  {new Date(event.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  -
                  {new Date(event.endTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {(() => {
                    const diffMs =
                      new Date(event.endTime).getTime() - new Date(event.startTime).getTime();
                    const diffMins = Math.round(diffMs / (1000 * 60));
                    const hours = Math.floor(diffMins / 60);
                    const minutes = diffMins % 60;
                    const duration =
                      hours > 0 ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}` : `${minutes}m`;
                    return ` (${duration})`;
                  })()}
                </div>
              </div>
              <div
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  event.status === AvailabilityStatus.ACCEPTED
                    ? 'bg-green-100 text-green-800'
                    : event.status === AvailabilityStatus.PENDING
                      ? 'bg-yellow-100 text-yellow-800'
                      : event.status === AvailabilityStatus.REJECTED
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                }`}
              >
                {event.status.toLowerCase().replace('_', ' ')}
              </div>
            </div>
          </div>

          {/* Recurrence Pattern - integrated into same section */}
          {event.isRecurring && (
            <div className="mt-4 space-y-3 border-t pt-4">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Recurring Series</span>
              </div>
            </div>
          )}
        </div>

        {/* Services Information */}
        {event.availableServices && event.availableServices.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">Available Services</div>
              <div className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                {event.availableServices.length} service
                {event.availableServices.length !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {event.availableServices.map((service, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-md border bg-white p-3"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="text-sm font-medium">
                        {service.service?.name || 'Service'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Clock className="h-3 w-3" />
                        {service.duration} minutes
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-green-600">
                    R
                    {typeof service.price === 'string'
                      ? service.price
                      : Number(service.price)?.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location & Access */}
        {(event.location || event.isOnlineAvailable) && (
          <div>
            <div className="mb-3 text-sm font-medium text-gray-700">Location</div>
            <div className="space-y-2">
              {event.location && (
                <div className="rounded-md border bg-white p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{event.location.name}</div>
                      <div className="text-xs text-gray-600">In-person appointment</div>
                    </div>
                    <div className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                      In-Person
                    </div>
                  </div>
                </div>
              )}
              {event.isOnlineAvailable && (
                <div className="rounded-md border bg-white p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-green-700">Online Available</div>
                      <div className="text-xs text-gray-600">Video consultation</div>
                    </div>
                    <div className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                      Online
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Booking Settings */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* Scheduling Rule */}
          {event.schedulingRule && (
            <div>
              <div className="mb-2 text-sm font-medium text-gray-700">Scheduling Rule</div>
              <div className="rounded-md border bg-white p-3">
                <div className="text-sm font-medium">
                  {event.schedulingRule
                    .replace(/_/g, ' ')
                    .toLowerCase()
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </div>
                <div className="text-xs text-gray-600">How appointments are scheduled</div>
              </div>
            </div>
          )}

          {/* Requires Confirmation */}
          {event.requiresConfirmation !== undefined && (
            <div>
              <div className="mb-2 text-sm font-medium text-gray-700">Requires Confirmation</div>
              <div className="rounded-md border bg-white p-3">
                <div
                  className={`text-sm font-medium ${
                    event.requiresConfirmation ? 'text-amber-700' : 'text-green-700'
                  }`}
                >
                  {event.requiresConfirmation ? 'Yes' : 'No'}
                </div>
                <div className="text-xs text-gray-600">
                  {event.requiresConfirmation
                    ? 'Provider must confirm bookings'
                    : 'Instant booking available'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Information */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700">Status Information</div>
          <div className="flex items-center justify-between rounded-md border bg-gray-50 p-3">
            <div>
              <div className="text-sm font-medium">Current Status</div>
              <div className="text-xs text-gray-600">Availability status</div>
            </div>
            <div
              className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${
                event.status === AvailabilityStatus.ACCEPTED
                  ? 'bg-green-100 text-green-800'
                  : event.status === AvailabilityStatus.PENDING
                    ? 'bg-yellow-100 text-yellow-800'
                    : event.status === AvailabilityStatus.REJECTED
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
              }`}
            >
              {event.status.toLowerCase().replace('_', ' ')}
            </div>
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

  const getScopeDescription = (scope: SeriesActionScope): string => {
    const eventDate = new Date(event.startTime).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });

    switch (scope) {
      case 'single':
        return `View only this occurrence (${eventDate})`;
      case 'future':
        return 'View this and all future occurrences';
      case 'all':
        return 'View all occurrences in this series';
      default:
        return '';
    }
  };

  const renderScopeSelectionStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          View Recurring Availability
        </DialogTitle>
        <DialogDescription>
          You are about to view a recurring availability. Choose which occurrences you want to see:
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {/* Event Details */}
        <div className="rounded-lg border bg-gray-50 p-4">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-4 w-4 text-gray-500" />
            <div>
              <div className="font-medium">{event.provider?.user?.name || 'Provider'}</div>
              <div className="text-sm text-gray-600">
                {new Date(event.startTime).toLocaleString([], {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                -{' '}
                {new Date(event.endTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              {event.location && (
                <div className="mt-1 text-xs text-gray-500">📍 {event.location.name}</div>
              )}
            </div>
          </div>
        </div>

        {/* Scope Selection */}
        <div className="space-y-4">
          <RadioGroup
            value={scopeForSelection}
            onValueChange={(value) => setScopeForSelection(value as SeriesActionScope)}
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
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleScopeSelect}>Continue</Button>
        </div>
      </div>
    </>
  );

  const renderConfirmationStep = () => (
    <>
      <DialogHeader>
        <DialogTitle>
          Confirm {pendingAction?.charAt(0).toUpperCase()}
          {pendingAction?.slice(1)}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Are you sure you want to {pendingAction} this availability?
        </p>

        {pendingAction === 'delete' && selectedScope && selectedScope !== 'single' && (
          <div className="rounded-lg bg-yellow-50 p-3">
            <p className="text-sm text-yellow-800">
              This will {pendingAction}{' '}
              {selectedScope === 'all' ? 'all occurrences' : 'this and future occurrences'} of this
              recurring availability.
            </p>
          </div>
        )}

        {pendingAction === 'reject' && (
          <div className="space-y-2">
            <label htmlFor="reason" className="text-sm font-medium">
              Rejection Reason
            </label>
            <Textarea
              id="reason"
              placeholder="Please provide a reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant={
              pendingAction === 'delete' || pendingAction === 'reject' ? 'destructive' : 'default'
            }
            onClick={handleConfirm}
            className="flex-1"
            disabled={pendingAction === 'reject' && !rejectionReason.trim()}
          >
            {pendingAction === 'delete' && 'Delete'}
            {pendingAction === 'accept' && 'Accept'}
            {pendingAction === 'reject' && 'Reject'}
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`max-h-[90vh] overflow-y-auto ${step === 'details' ? 'max-w-2xl' : 'max-w-md'}`}
      >
        {step === 'details' && renderDetailsStep()}
        {step === 'scope-selection' && renderScopeSelectionStep()}
        {step === 'confirmation' && renderConfirmationStep()}
      </DialogContent>
    </Dialog>
  );
}
