'use client';

import { ProviderInvitationStatus } from '@prisma/client';
import { format, formatDistanceToNow } from 'date-fns';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  MoreVertical,
  RefreshCw,
  UserX,
  X,
  XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useCancelProviderInvitation,
  useResendProviderInvitation,
} from '@/features/organizations/hooks/use-provider-invitations';
import { useToast } from '@/hooks/use-toast';
import { nowUTC } from '@/lib/timezone';
import { type RouterOutputs } from '@/utils/api';

// Extract type from tRPC response
type ProviderInvitationsResponse = RouterOutputs['organizations']['getProviderInvitations'];
type ProviderInvitationWithDetails = ProviderInvitationsResponse[number];

interface ProviderInvitationListProps {
  organizationId: string;
  invitations: ProviderInvitationWithDetails[];
}

// Status configuration for badges and icons
const statusConfig = {
  PENDING: {
    icon: Clock,
    label: 'Pending',
    variant: 'secondary' as const,
    description: 'Invitation sent, awaiting response',
  },
  ACCEPTED: {
    icon: CheckCircle,
    label: 'Accepted',
    variant: 'default' as const,
    description: 'Provider has joined your organization',
  },
  REJECTED: {
    icon: UserX,
    label: 'Rejected',
    variant: 'destructive' as const,
    description: 'Provider declined the invitation',
  },
  CANCELLED: {
    icon: XCircle,
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

export function ProviderInvitationList({
  organizationId,
  invitations,
}: ProviderInvitationListProps) {
  const { toast } = useToast();

  const cancelInvitationMutation = useCancelProviderInvitation({
    onSuccess: () => {
      toast({
        title: 'Invitation cancelled',
        description: 'The invitation has been cancelled successfully.',
      });
    },
    onError: (error) => {
      const err = error as Error;
      toast({
        title: 'Failed to cancel invitation',
        description: err.message || 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  const resendInvitationMutation = useResendProviderInvitation({
    onSuccess: () => {
      toast({
        title: 'Invitation resent',
        description: 'The invitation has been resent successfully.',
      });
    },
    onError: (error) => {
      const err = error as Error;
      toast({
        title: 'Failed to resend invitation',
        description: err.message || 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  const handleCancelInvitation = (invitationId: string) => {
    cancelInvitationMutation.mutate({
      organizationId,
      invitationId,
    });
  };

  const handleResendInvitation = (invitationId: string) => {
    resendInvitationMutation.mutate({
      organizationId,
      invitationId,
    });
  };

  const StatusBadge = ({ status }: { status: ProviderInvitationStatus }) => {
    const config = statusConfig[status];
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Invited By</TableHead>
            <TableHead>Date Sent</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                No invitations found
              </TableCell>
            </TableRow>
          ) : (
            invitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{invitation.email}</span>
                    {invitation.connectionId && (
                      <span className="text-sm text-muted-foreground">
                        Connected (Connection ID: {invitation.connectionId})
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={invitation.status} />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm">{invitation.invitedBy?.name || 'Unknown'}</span>
                    <span className="text-xs text-muted-foreground">
                      {invitation.invitedBy?.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm">{format(invitation.createdAt, 'MMM d, yyyy')}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(invitation.createdAt, { addSuffix: true })}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm">{format(invitation.expiresAt, 'MMM d, yyyy')}</span>
                    <span
                      className={`text-xs ${
                        invitation.expiresAt < nowUTC()
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {invitation.expiresAt < nowUTC()
                        ? 'Expired'
                        : formatDistanceToNow(invitation.expiresAt, { addSuffix: true })}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {invitation.status === 'PENDING' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={
                            cancelInvitationMutation.isPending || resendInvitationMutation.isPending
                          }
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleResendInvitation(invitation.id)}
                          className="flex items-center gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Resend Invitation
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleCancelInvitation(invitation.id)}
                          className="flex items-center gap-2 text-destructive"
                        >
                          <X className="h-4 w-4" />
                          Cancel Invitation
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
