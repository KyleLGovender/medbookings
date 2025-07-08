'use client';

import { Check, Clock, Repeat, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  AvailabilityStatus,
  AvailabilityWithRelations,
} from '@/features/calendar/availability/types/types';

interface AvailabilityStatusTrackerProps {
  availability: AvailabilityWithRelations;
  showDetails?: boolean;
}

interface StatusStep {
  status: AvailabilityStatus;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isCompleted: boolean;
  isCurrent: boolean;
  timestamp?: Date;
}

export function AvailabilityStatusTracker({
  availability,
  showDetails = true,
}: AvailabilityStatusTrackerProps) {
  const getStatusSteps = (): StatusStep[] => {
    const currentStatus = availability.status;

    const baseSteps: StatusStep[] = [
      {
        status: AvailabilityStatus.PENDING,
        label: 'Pending Review',
        description: 'Waiting for provider response',
        icon: Clock,
        isCompleted: currentStatus !== AvailabilityStatus.PENDING,
        isCurrent: currentStatus === AvailabilityStatus.PENDING,
        timestamp: availability.createdAt,
      },
    ];

    // Add the final status based on current state
    if (currentStatus === AvailabilityStatus.ACCEPTED) {
      baseSteps.push({
        status: AvailabilityStatus.ACCEPTED,
        label: 'Active',
        description: 'Provider accepted - slots generated',
        icon: Check,
        isCompleted: true,
        isCurrent: true,
        timestamp: availability.acceptedAt || undefined,
      });
    } else if (currentStatus === AvailabilityStatus.REJECTED) {
      baseSteps.push({
        status: AvailabilityStatus.REJECTED,
        label: 'Rejected',
        description: 'Provider declined the proposal',
        icon: X,
        isCompleted: true,
        isCurrent: true,
        timestamp: availability.updatedAt,
      });
    } else if (currentStatus === AvailabilityStatus.CANCELLED) {
      baseSteps.push({
        status: AvailabilityStatus.CANCELLED,
        label: 'Cancelled',
        description: 'Availability was cancelled',
        icon: X,
        isCompleted: true,
        isCurrent: true,
        timestamp: availability.updatedAt,
      });
    }

    return baseSteps;
  };

  const statusSteps = getStatusSteps();
  const currentStepIndex = statusSteps.findIndex((step) => step.isCurrent);
  const progressPercentage = ((currentStepIndex + 1) / statusSteps.length) * 100;

  const getStatusColor = (status: AvailabilityStatus) => {
    switch (status) {
      case AvailabilityStatus.PENDING:
        return 'bg-yellow-500';
      case AvailabilityStatus.ACCEPTED:
        return 'bg-green-500';
      case AvailabilityStatus.REJECTED:
        return 'bg-red-500';
      case AvailabilityStatus.CANCELLED:
        return 'bg-gray-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusBadgeVariant = (status: AvailabilityStatus) => {
    switch (status) {
      case AvailabilityStatus.PENDING:
        return 'secondary' as const;
      case AvailabilityStatus.ACCEPTED:
        return 'default' as const;
      case AvailabilityStatus.REJECTED:
        return 'destructive' as const;
      case AvailabilityStatus.CANCELLED:
        return 'outline' as const;
      default:
        return 'secondary' as const;
    }
  };

  if (!showDetails) {
    // Simple badge view
    return (
      <div className="flex items-center gap-2">
        <Badge variant={getStatusBadgeVariant(availability.status)}>
          {availability.status.replace('_', ' ').toLowerCase()}
        </Badge>
        {availability.isRecurring && (
          <Badge variant="outline" className="text-xs">
            <Repeat className="mr-1 h-3 w-3" />
            Recurring
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Availability Status</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant(availability.status)}>
              {availability.status.replace('_', ' ').toLowerCase()}
            </Badge>
            {availability.isRecurring && (
              <Badge variant="outline" className="text-xs">
                <Repeat className="mr-1 h-3 w-3" />
                Series
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Status Steps */}
        <div className="space-y-3">
          {statusSteps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <div key={step.status} className="flex items-start gap-3">
                {/* Status Icon */}
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    step.isCompleted || step.isCurrent
                      ? `${getStatusColor(step.status)} text-white`
                      : 'bg-gray-200 text-gray-400'
                  } `}
                >
                  <StepIcon className="h-4 w-4" />
                </div>

                {/* Status Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`text-sm font-medium ${
                        step.isCurrent
                          ? 'text-foreground'
                          : step.isCompleted
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </h4>
                    {step.timestamp && (
                      <span className="text-xs text-muted-foreground">
                        {step.timestamp.toLocaleDateString()}{' '}
                        {step.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs ${
                      step.isCurrent
                        ? 'text-muted-foreground'
                        : step.isCompleted
                          ? 'text-muted-foreground'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Information */}
        {availability.status === AvailabilityStatus.ACCEPTED && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3">
            <div className="flex items-center gap-2 text-green-800">
              <Check className="h-4 w-4" />
              <span className="text-sm font-medium">Active & Ready</span>
            </div>
            <p className="mt-1 text-xs text-green-700">
              {availability.calculatedSlots?.length || 0} time slots have been generated and are
              available for booking.
            </p>
          </div>
        )}

        {availability.status === AvailabilityStatus.REJECTED && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <div className="flex items-center gap-2 text-red-800">
              <X className="h-4 w-4" />
              <span className="text-sm font-medium">Proposal Rejected</span>
            </div>
            <p className="mt-1 text-xs text-red-700">
              The provider declined this availability proposal. You can create a new proposal with
              different terms.
            </p>
          </div>
        )}

        {availability.status === AvailabilityStatus.PENDING && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
            <div className="flex items-center gap-2 text-yellow-800">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Awaiting Response</span>
            </div>
            <p className="mt-1 text-xs text-yellow-700">
              The provider will receive a notification about this proposal and can accept or reject
              it.
            </p>
          </div>
        )}

        {/* Recurring Series Information */}
        {availability.isRecurring && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-center gap-2 text-blue-800">
              <Repeat className="h-4 w-4" />
              <span className="text-sm font-medium">Recurring Series</span>
            </div>
            <p className="mt-1 text-xs text-blue-700">
              This status applies to the entire recurring series. Individual occurrences inherit
              this status.
            </p>
          </div>
        )}

        {/* Created Information */}
        <div className="border-t border-muted pt-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Created by {availability.organization?.name || 'Organization'}</span>
            <span>{availability.createdAt.toLocaleDateString()}</span>
          </div>
          {availability.createdByMembership && (
            <div className="mt-1 text-xs text-muted-foreground">
              By: {availability.createdBy?.name || 'Organization Member'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
