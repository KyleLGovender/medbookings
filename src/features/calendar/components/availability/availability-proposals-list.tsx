'use client';

import { useState } from 'react';

import { Building, Calendar, Check, Clock, MapPin, Monitor, X } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  useAcceptAvailabilityProposal,
  useProviderAvailability,
  useRejectAvailabilityProposal,
} from '@/features/calendar/hooks/use-availability';
import {
  AvailabilityStatus,
  AvailabilityWithRelations,
  SchedulingRule,
  ServiceAvailabilityConfigWithRelations,
} from '@/features/calendar/types/types';
import { useToast } from '@/hooks/use-toast';

interface AvailabilityProposalsListProps {
  providerId: string;
}

export function AvailabilityProposalsList({ providerId }: AvailabilityProposalsListProps) {
  const { toast } = useToast();

  // Fetch pending proposals for the provider
  const { data: allAvailability = [], isLoading, error } = useProviderAvailability(providerId);

  // Filter for pending proposals only
  const pendingProposals = allAvailability.filter(
    (availability: AvailabilityWithRelations) => availability.status === AvailabilityStatus.PENDING
  );

  const acceptMutation = useAcceptAvailabilityProposal({
    onSuccess: (data) => {
      toast({
        title: 'Proposal Accepted',
        description: 'The availability proposal has been accepted and is now active',
      });
    },
  });

  const rejectMutation = useRejectAvailabilityProposal({
    onSuccess: () => {
      toast({
        title: 'Proposal Rejected',
        description: 'The availability proposal has been rejected',
      });
    },
  });

  const handleAccept = async (proposalId: string) => {
    try {
      await acceptMutation.mutateAsync({ id: proposalId });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleReject = async (proposalId: string, reason?: string) => {
    try {
      await rejectMutation.mutateAsync({ id: proposalId, reason });
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">Loading proposals...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load availability proposals: {error.message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (pendingProposals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Availability Proposals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <Calendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p className="text-lg font-medium">No pending proposals</p>
            <p className="text-sm">
              Organizations will send availability proposals for you to review here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Availability Proposals</h2>
        <Badge variant="secondary">{pendingProposals.length} pending</Badge>
      </div>

      <div className="space-y-4">
        {pendingProposals.map((proposal: AvailabilityWithRelations) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            onAccept={() => handleAccept(proposal.id)}
            onReject={(reason) => handleReject(proposal.id, reason)}
            isAccepting={acceptMutation.isPending}
            isRejecting={rejectMutation.isPending}
          />
        ))}
      </div>
    </div>
  );
}

interface ProposalCardProps {
  proposal: AvailabilityWithRelations;
  onAccept: () => void;
  onReject: (reason?: string) => void;
  isAccepting: boolean;
  isRejecting: boolean;
}

function ProposalCard({
  proposal,
  onAccept,
  onReject,
  isAccepting,
  isRejecting,
}: ProposalCardProps) {
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const formatSchedulingRule = (rule: SchedulingRule) => {
    switch (rule) {
      case SchedulingRule.CONTINUOUS:
        return 'Continuous scheduling';
      case SchedulingRule.ON_THE_HOUR:
        return 'On the hour';
      case SchedulingRule.ON_THE_HALF_HOUR:
        return 'On the half hour';
      default:
        return 'Standard scheduling';
    }
  };

  const handleRejectWithReason = () => {
    onReject(rejectReason || undefined);
    setIsRejectDialogOpen(false);
    setRejectReason('');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building className="h-4 w-4" />
              {proposal.organization?.name || 'Organization'}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {proposal.startTime.toLocaleDateString()}
              {' • '}
              {proposal.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {' - '}
              {proposal.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <Badge variant="outline">Pending Review</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Proposal Details */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Scheduling Details</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                {formatSchedulingRule(proposal.schedulingRule)}
              </div>
              {proposal.isOnlineAvailable && (
                <div className="flex items-center gap-2">
                  <Monitor className="h-3 w-3" />
                  Online appointments available
                </div>
              )}
              {proposal.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  {proposal.location.name}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Services & Billing</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>{proposal.availableServices?.length || 0} service(s) configured</p>
              <p>Organization billed for slots</p>
              {proposal.requiresConfirmation && <p>Manual booking confirmation required</p>}
            </div>
          </div>
        </div>

        {/* Recurrence Information */}
        {proposal.isRecurring && proposal.recurrencePattern && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-1 text-sm font-medium">
              <Calendar className="h-3 w-3" />
              Recurring Schedule
            </h4>
            <div className="rounded bg-muted/50 p-2 text-sm text-muted-foreground">
              <p>Type: {proposal.recurrencePattern.option}</p>
              {proposal.recurrencePattern.weeklyDay !== undefined && (
                <p>Weekly on: Day {proposal.recurrencePattern.weeklyDay}</p>
              )}
              {proposal.recurrencePattern.customDays &&
                proposal.recurrencePattern.customDays.length > 0 && (
                  <p>Custom days: {proposal.recurrencePattern.customDays.join(', ')}</p>
                )}
              {proposal.recurrencePattern.endDate && (
                <p>Ends on: {proposal.recurrencePattern.endDate}</p>
              )}
            </div>
          </div>
        )}

        {/* Services List */}
        {proposal.availableServices && proposal.availableServices.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Proposed Services</h4>
            <div className="space-y-1">
              {proposal.availableServices.map(
                (serviceConfig: ServiceAvailabilityConfigWithRelations, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded bg-muted/50 p-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">
                        {serviceConfig.service?.name || 'Service'}
                      </span>
                      <span className="ml-2 text-muted-foreground">
                        {serviceConfig.duration} min
                      </span>
                    </div>
                    {proposal.provider.showPrice && (
                      <span className="font-medium">${serviceConfig.price.toString()}</span>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                disabled={isAccepting || isRejecting}
              >
                <X className="h-4 w-4" />
                Reject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject Availability Proposal</DialogTitle>
                <DialogDescription>
                  Are you sure you want to reject this availability proposal? You can optionally
                  provide a reason for the organization.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Let the organization know why you're rejecting this proposal..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsRejectDialogOpen(false)}
                  disabled={isRejecting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRejectWithReason}
                  disabled={isRejecting}
                >
                  {isRejecting ? 'Rejecting...' : 'Reject Proposal'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            onClick={onAccept}
            disabled={isAccepting || isRejecting}
            className="flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            {isAccepting ? 'Accepting...' : 'Accept Proposal'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
