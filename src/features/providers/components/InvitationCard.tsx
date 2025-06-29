'use client';

import { useState } from 'react';

import { format, formatDistanceToNow } from 'date-fns';
import { 
  Building2, 
  Check, 
  Clock, 
  Mail, 
  MessageSquare, 
  User, 
  X,
  AlertTriangle,
  Globe,
  Phone
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useRespondToInvitation } from '@/features/providers/hooks/use-organization-connections';
import type { ProviderInvitationWithOrganization } from '@/features/providers/types';
import { useToast } from '@/hooks/use-toast';

interface InvitationCardProps {
  invitation: ProviderInvitationWithOrganization;
  showActions?: boolean;
}

// Status configuration for badges and icons
const statusConfig = {
  PENDING: {
    icon: Clock,
    label: 'Pending',
    variant: 'secondary' as const,
    description: 'Awaiting your response',
  },
  ACCEPTED: {
    icon: Check,
    label: 'Accepted',
    variant: 'default' as const,
    description: 'You have joined this organization',
  },
  REJECTED: {
    icon: X,
    label: 'Rejected',
    variant: 'destructive' as const,
    description: 'You declined this invitation',
  },
  CANCELLED: {
    icon: X,
    label: 'Cancelled',
    variant: 'outline' as const,
    description: 'Invitation was cancelled',
  },
  EXPIRED: {
    icon: AlertTriangle,
    label: 'Expired',
    variant: 'destructive' as const,
    description: 'Invitation has expired',
  },
  DELIVERY_FAILED: {
    icon: Mail,
    label: 'Delivery Failed',
    variant: 'destructive' as const,
    description: 'Email could not be delivered',
  },
};

export function InvitationCard({ invitation, showActions = true }: InvitationCardProps) {
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const { toast } = useToast();

  const respondToInvitationMutation = useRespondToInvitation({
    onSuccess: (data, variables) => {
      const action = variables.response.action === 'accept' ? 'accepted' : 'declined';
      toast({
        title: `Invitation ${action}`,
        description: `You have ${action} the invitation from ${invitation.organization.name}.`,
      });
      setIsRejectDialogOpen(false);
      setRejectionReason('');
    },
    onError: (error) => {
      toast({
        title: 'Failed to respond to invitation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAccept = () => {
    respondToInvitationMutation.mutate({
      token: invitation.token,
      response: { action: 'accept' }
    });
  };

  const handleReject = () => {
    respondToInvitationMutation.mutate({
      token: invitation.token,
      response: { 
        action: 'reject',
        rejectionReason: rejectionReason || undefined
      }
    });
  };

  const StatusBadge = ({ status }: { status: keyof typeof statusConfig }) => {
    const config = statusConfig[status];
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const isExpired = new Date(invitation.expiresAt) < new Date();
  const isPending = invitation.status === 'PENDING' && !isExpired;

  return (
    <>
      <Card className={`transition-all duration-200 ${isPending ? 'border-primary/50 bg-primary/5' : ''}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {invitation.organization.logo ? (
                <img
                  src={invitation.organization.logo}
                  alt={invitation.organization.name}
                  className="h-12 w-12 rounded-lg object-cover border"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <CardTitle className="text-lg">{invitation.organization.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <StatusBadge status={invitation.status} />
                  {isPending && (
                    <span className="text-sm text-primary font-medium">
                      Action Required
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Organization Description */}
          {invitation.organization.description && (
            <div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {invitation.organization.description}
              </p>
            </div>
          )}

          {/* Custom Message */}
          {invitation.customMessage && (
            <div className="rounded-md bg-muted/50 p-3">
              <div className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium mb-1">Personal Message:</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {invitation.customMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Organization Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {invitation.organization.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={`mailto:${invitation.organization.email}`}
                  className="text-primary hover:underline truncate"
                >
                  {invitation.organization.email}
                </a>
              </div>
            )}
            {invitation.organization.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={`tel:${invitation.organization.phone}`}
                  className="text-primary hover:underline"
                >
                  {invitation.organization.phone}
                </a>
              </div>
            )}
          </div>

          <Separator />

          {/* Invitation Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Invited by:</span>
              </div>
              <p className="text-muted-foreground ml-6">
                {invitation.invitedBy?.name || 'Unknown'}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {isExpired ? 'Expired:' : 'Expires:'}
                </span>
              </div>
              <p className={`ml-6 ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`}>
                {format(new Date(invitation.expiresAt), 'MMM d, yyyy')}
                <span className="text-xs ml-2">
                  ({formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true })})
                </span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          {showActions && isPending && (
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                onClick={handleAccept}
                disabled={respondToInvitationMutation.isPending}
                className="flex items-center gap-2 flex-1"
              >
                <Check className="h-4 w-4" />
                Accept Invitation
              </Button>
              <Button 
                variant="outline"
                onClick={() => setIsRejectDialogOpen(true)}
                disabled={respondToInvitationMutation.isPending}
                className="flex items-center gap-2 flex-1"
              >
                <X className="h-4 w-4" />
                Decline
              </Button>
            </div>
          )}

          {/* Status Messages */}
          {invitation.status === 'ACCEPTED' && invitation.connection && (
            <div className="rounded-md bg-green-50 dark:bg-green-950/30 p-3">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✅ You are connected to this organization and can now schedule availability with them.
              </p>
            </div>
          )}

          {invitation.status === 'REJECTED' && (
            <div className="rounded-md bg-red-50 dark:bg-red-950/30 p-3">
              <p className="text-sm text-red-800 dark:text-red-200">
                You declined this invitation.
                {invitation.rejectionReason && (
                  <span className="block mt-1 text-xs">
                    Reason: {invitation.rejectionReason}
                  </span>
                )}
              </p>
            </div>
          )}

          {isExpired && invitation.status === 'PENDING' && (
            <div className="rounded-md bg-orange-50 dark:bg-orange-950/30 p-3">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                ⏰ This invitation has expired. Contact the organization if you're still interested.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Invitation</DialogTitle>
            <DialogDescription>
              Are you sure you want to decline the invitation from {invitation.organization.name}?
              You can optionally provide a reason.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">
                Reason (Optional)
              </label>
              <Textarea
                placeholder="Let them know why you're declining..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsRejectDialogOpen(false)}
              disabled={respondToInvitationMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleReject}
              disabled={respondToInvitationMutation.isPending}
            >
              {respondToInvitationMutation.isPending ? 'Declining...' : 'Decline Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}