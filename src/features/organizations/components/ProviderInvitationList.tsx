'use client';

import { useState } from 'react';

import { format, formatDistanceToNow } from 'date-fns';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  Mail, 
  MoreVertical, 
  RefreshCw, 
  UserCheck, 
  UserX, 
  X, 
  XCircle,
  AlertTriangle
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  useProviderInvitations, 
  useManageProviderInvitation 
} from '@/features/organizations/hooks/use-provider-invitations';
import type { ProviderInvitationStatus } from '@/features/organizations/types/types';
import { useToast } from '@/hooks/use-toast';

interface ProviderInvitationListProps {
  organizationId: string;
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

export function ProviderInvitationList({ organizationId }: ProviderInvitationListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const {
    data: invitationsData,
    isLoading,
    error,
  } = useProviderInvitations(
    organizationId,
    statusFilter === 'all' ? undefined : statusFilter
  );

  const manageInvitationMutation = useManageProviderInvitation({
    onSuccess: (data, variables) => {
      const action = variables.action === 'cancel' ? 'cancelled' : 'resent';
      toast({
        title: `Invitation ${action}`,
        description: `The invitation has been ${action} successfully.`,
      });
    },
    onError: (error, variables) => {
      toast({
        title: `Failed to ${variables.action} invitation`,
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const invitations = invitationsData?.invitations || [];

  const filteredInvitations = invitations.filter((invitation) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      invitation.email.toLowerCase().includes(query) ||
      invitation.invitedBy?.name?.toLowerCase().includes(query)
    );
  });

  const handleCancelInvitation = (invitationId: string) => {
    manageInvitationMutation.mutate({
      organizationId,
      invitationId,
      action: 'cancel',
    });
  };

  const handleResendInvitation = (invitationId: string) => {
    manageInvitationMutation.mutate({
      organizationId,
      invitationId,
      action: 'resend',
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

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
            <p>Failed to load invitations</p>
            <p className="text-sm">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Provider Invitations
        </CardTitle>
        <CardDescription>
          Manage invitations sent to healthcare providers
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search by email or inviter name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="ACCEPTED">Accepted</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-[200px]" />
                <Skeleton className="h-10 w-[120px]" />
                <Skeleton className="h-10 w-[100px]" />
                <Skeleton className="h-10 w-[80px]" />
              </div>
            ))}
          </div>
        ) : (
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
                {filteredInvitations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? 'No invitations match your search' : 'No invitations sent yet'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{invitation.email}</span>
                          {invitation.connection?.serviceProvider && (
                            <span className="text-sm text-muted-foreground">
                              Connected as: {invitation.connection.serviceProvider.name}
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
                          <span className="text-sm">
                            {format(new Date(invitation.createdAt), 'MMM d, yyyy')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(invitation.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {format(new Date(invitation.expiresAt), 'MMM d, yyyy')}
                          </span>
                          <span className={`text-xs ${
                            new Date(invitation.expiresAt) < new Date() 
                              ? 'text-destructive' 
                              : 'text-muted-foreground'
                          }`}>
                            {new Date(invitation.expiresAt) < new Date() 
                              ? 'Expired' 
                              : formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true })
                            }
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
                                disabled={manageInvitationMutation.isPending}
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
        )}
      </CardContent>
    </Card>
  );
}