import { AvailabilityStatus } from '@prisma/client';
import { Calendar, Check, Clock, Edit, Repeat, Trash2, X } from 'lucide-react';
import React from 'react';

import type { RouterOutputs } from '@/utils/api';

import { Button } from '@/components/ui/button';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';

import type { CalendarEventAction, CalendarEventPermissions, SeriesActionScope } from '@/features/calendar/types/modal';
import type { CalendarEvent } from '@/features/calendar/types/types';
import { DayOfWeek } from '@/features/calendar/types/types';

// Extract proper types for availability with services
type AvailabilityData = RouterOutputs['calendar']['searchAvailability'][number];
type AvailableService = AvailabilityData['availableServices'][number];

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

        {/* Date and Time Information */}
        <div className="rounded-lg border bg-gray-50 p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">
                  {event.startTime.toLocaleDateString([], {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                <div className="text-xs text-gray-600">
                  {event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                  {event.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {(() => {
                    const diffMs = event.endTime.getTime() - event.startTime.getTime();
                    const diffMins = Math.round(diffMs / (1000 * 60));
                    const hours = Math.floor(diffMins / 60);
                    const minutes = diffMins % 60;
                    const duration = hours > 0 ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}` : `${minutes}m`;
                    return ` (${duration})`;
                  })()}
                </div>
              </div>
              <div className={`rounded-full px-2 py-1 text-xs font-medium ${
                event.status === AvailabilityStatus.ACCEPTED ? 'bg-green-100 text-green-800' :
                event.status === AvailabilityStatus.PENDING ? 'bg-yellow-100 text-yellow-800' :
                event.status === AvailabilityStatus.REJECTED ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {event.status.toLowerCase().replace('_', ' ')}
              </div>
            </div>
          </div>

          {/* Recurrence Pattern - integrated into same section */}
          {(event.isRecurring || event.seriesId || event.recurrencePattern) && (
            <div className="mt-4 space-y-3 border-t pt-4">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">
                  {(() => {
                    const pattern = event.recurrencePattern;
                    
                    // Handle both object and string patterns
                    const patternData = typeof pattern === 'string' ? 
                      (() => {
                        try {
                          return JSON.parse(pattern);
                        } catch {
                          return null;
                        }
                      })() : 
                      pattern;

                    if (patternData) {
                      if (patternData.option === 'DAILY') return 'Daily Recurrence';
                      if (patternData.option === 'WEEKLY') return 'Weekly Recurrence';
                      if (patternData.option === 'custom') return 'Custom Recurrence';
                      return 'Recurring Series';
                    }
                    return event.seriesId ? 'Recurring Series' : 'Recurring Event';
                  })()}
                </span>
              </div>

              {event.recurrencePattern && (
                <div className="space-y-3">
                  {(() => {
                    const pattern = event.recurrencePattern;
                    
                    // Handle both object and string patterns  
                    const patternData = typeof pattern === 'string' ? 
                      (() => {
                        try {
                          return JSON.parse(pattern);
                        } catch {
                          return null;
                        }
                      })() : 
                      pattern;

                    if (patternData) {
                      if (patternData.option === 'custom' && patternData.customDays) {
                        return (
                          <div className="space-y-3">
                            <div className="text-sm font-medium">Repeat every 1 week</div>
                            
                            <div>
                              <div className="mb-2 text-sm font-medium">Repeat on</div>
                              <div className="flex gap-2">
                                {[
                                  { label: 'M', value: DayOfWeek.MONDAY },
                                  { label: 'T', value: DayOfWeek.TUESDAY },
                                  { label: 'W', value: DayOfWeek.WEDNESDAY },
                                  { label: 'T', value: DayOfWeek.THURSDAY },
                                  { label: 'F', value: DayOfWeek.FRIDAY },
                                  { label: 'S', value: DayOfWeek.SATURDAY },
                                  { label: 'S', value: DayOfWeek.SUNDAY },
                                ].map((day, index) => {
                                  const isSelected = patternData.customDays.includes(day.value);
                                  return (
                                    <div
                                      key={index}
                                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                                        isSelected ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                                      }`}
                                    >
                                      {day.label}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {patternData.endDate && (
                              <div>
                                <div className="mb-1 text-sm font-medium">Ends on</div>
                                <div className="text-sm text-gray-700">
                                  {new Date(patternData.endDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      if (patternData.option === 'DAILY') {
                        return (
                          <div className="space-y-2">
                            <div className="text-sm">Repeat every 1 day</div>
                            {patternData.endDate && (
                              <div className="text-xs text-gray-600">
                                Ends on {new Date(patternData.endDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      if (patternData.option === 'WEEKLY') {
                        return (
                          <div className="space-y-2">
                            <div className="text-sm">Repeat every 1 week</div>
                            {patternData.endDate && (
                              <div className="text-xs text-gray-600">
                                Ends on {new Date(patternData.endDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }
                    }
                    
                    return (
                      <div className="text-sm text-gray-600">
                        Custom recurrence pattern
                      </div>
                    );
                  })()}
                  
                  {event.seriesId && (
                    <div className="text-xs text-gray-500">
                      Series ID: {event.seriesId}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Services and Additional Information */}
        <div className="space-y-4">
          {/* Services Information */}
          {event.type === 'availability' && event.availableServices && event.availableServices.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-medium text-gray-700">Available Services</div>
                <div className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                  {event.availableServices.length} service{event.availableServices.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {event.availableServices.map((service: AvailableService, index: number) => (
                  <div key={index} className="flex items-center justify-between rounded-md border bg-white p-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-sm font-medium">{service.service?.name || 'Service'}</div>
                        <div className="text-xs text-gray-600 flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {service.duration} minutes
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-green-600">
                      R{typeof service.price === 'string' ? service.price : Number(service.price)?.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Single Service Details (for bookings) */}
          {event.service && (
            <div>
              <div className="mb-3 text-sm font-medium text-gray-700">Service Details</div>
              <div className="flex items-center justify-between rounded-md border bg-white p-3">
                <div>
                  <div className="text-sm font-medium">{event.service.name}</div>
                  <div className="text-xs text-gray-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {event.service.duration} minutes
                  </div>
                </div>
                <div className="text-sm font-semibold text-green-600">
                  R{event.service.price}
                </div>
              </div>
            </div>
          )}

          {/* Location & Access */}
          {event.location && (
            <div>
              <div className="mb-3 text-sm font-medium text-gray-700">Location</div>
              <div className="rounded-md border bg-white p-3">
                {event.location.isOnline ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-green-700">Online Available</div>
                      <div className="text-xs text-gray-600">Video consultation</div>
                    </div>
                    <div className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                      Online
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{event.location.name}</div>
                      <div className="text-xs text-gray-600">In-person appointment</div>
                    </div>
                    <div className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                      In-Person
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Booking & Scheduling Settings */}
          {event.type === 'availability' && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {/* Scheduling Rule */}
              {event.schedulingRule && (
                <div>
                  <div className="mb-2 text-sm font-medium text-gray-700">Scheduling Rule</div>
                  <div className="rounded-md border bg-white p-3">
                    <div className="text-sm font-medium">
                      {event.schedulingRule.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
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
                    <div className={`text-sm font-medium ${
                      event.requiresConfirmation ? 'text-amber-700' : 'text-green-700'
                    }`}>
                      {event.requiresConfirmation ? 'Yes' : 'No'}
                    </div>
                    <div className="text-xs text-gray-600">
                      {event.requiresConfirmation ? 'Provider must confirm bookings' : 'Instant booking available'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Customer Information */}
        {event.customer && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">Customer Information</div>
            <div className="rounded-md border bg-gray-50 p-3">
              <div className="text-sm font-medium">{event.customer.name}</div>
              {event.customer.email && (
                <div className="text-xs text-gray-600">{event.customer.email}</div>
              )}
            </div>
          </div>
        )}

        {/* Status Information */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700">Status Information</div>
          <div className="flex items-center justify-between rounded-md border bg-gray-50 p-3">
            <div>
              <div className="text-sm font-medium">Current Status</div>
              <div className="text-xs text-gray-600">Event status</div>
            </div>
            <div className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${
              event.status === AvailabilityStatus.ACCEPTED ? 'bg-green-100 text-green-800' :
              event.status === AvailabilityStatus.PENDING ? 'bg-yellow-100 text-yellow-800' :
              event.status === AvailabilityStatus.REJECTED ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
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