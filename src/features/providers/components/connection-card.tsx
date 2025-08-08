'use client';

import { useState } from 'react';

import { format } from 'date-fns';
import {
  Building2,
  Globe,
  Mail,
  MoreVertical,
  Pause,
  Phone,
  Play,
  Trash2,
  User,
} from 'lucide-react';

import { ConnectionStatus } from '@prisma/client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
  useDeleteConnection,
  useUpdateConnection,
} from '@/features/providers/hooks/use-organization-connections';
import { type RouterOutputs } from '@/utils/api';

type OrganizationConnectionWithDetails = RouterOutputs['providers']['getOrganizationConnections'][number];
import { useToast } from '@/hooks/use-toast';

interface ConnectionCardProps {
  connection: OrganizationConnectionWithDetails;
  showActions?: boolean;
}

// Status configuration for badges
const statusConfig = {
  [ConnectionStatus.PENDING]: {
    label: 'Pending',
    variant: 'secondary' as const,
    description: 'Connection is being established',
  },
  [ConnectionStatus.ACCEPTED]: {
    label: 'Active',
    variant: 'default' as const,
    description: 'You can schedule availability',
  },
  [ConnectionStatus.REJECTED]: {
    label: 'Rejected',
    variant: 'destructive' as const,
    description: 'Connection was rejected',
  },
  [ConnectionStatus.SUSPENDED]: {
    label: 'Suspended',
    variant: 'outline' as const,
    description: 'Connection is temporarily suspended',
  },
};

export function ConnectionCard({ connection, showActions = true }: ConnectionCardProps) {
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'suspend' | 'reactivate' | 'delete' | null>(
    null
  );
  const { toast } = useToast();

  const updateConnectionMutation = useUpdateConnection({
    onSuccess: (data) => {
      const message =
        pendingAction === 'suspend'
          ? 'Connection suspended successfully'
          : 'Connection reactivated successfully';

      toast({
        title: 'Connection Updated',
        description: message,
      });

      setIsActionDialogOpen(false);
      setPendingAction(null);
    },
    onError: (error) => {
      toast({
        title: 'Failed to update connection',
        description: error.message,
        variant: 'destructive',
      });
      setIsActionDialogOpen(false);
      setPendingAction(null);
    },
  });

  const deleteConnectionMutation = useDeleteConnection({
    onSuccess: () => {
      toast({
        title: 'Connection Deleted',
        description: 'Connection deleted successfully',
      });

      setIsActionDialogOpen(false);
      setPendingAction(null);
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete connection',
        description: error.message,
        variant: 'destructive',
      });
      setIsActionDialogOpen(false);
      setPendingAction(null);
    },
  });

  const handleSuspend = () => {
    setPendingAction('suspend');
    setIsActionDialogOpen(true);
  };

  const handleReactivate = () => {
    setPendingAction('reactivate');
    setIsActionDialogOpen(true);
  };

  const handleDelete = () => {
    setPendingAction('delete');
    setIsActionDialogOpen(true);
  };

  const confirmAction = () => {
    if (!pendingAction) return;

    if (pendingAction === 'delete') {
      deleteConnectionMutation.mutate({ connectionId: connection.id });
    } else {
      updateConnectionMutation.mutate({
        connectionId: connection.id,
        status: pendingAction === 'suspend' ? ConnectionStatus.SUSPENDED : ConnectionStatus.ACCEPTED,
      });
    }
  };

  const StatusBadge = ({ status }: { status: ConnectionStatus }) => {
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getActionDialogContent = () => {
    switch (pendingAction) {
      case 'suspend':
        return {
          title: 'Suspend Connection',
          description: `Are you sure you want to suspend your connection with ${connection.organization.name}? You won't be able to schedule new availability until you reactivate it.`,
          confirmText: 'Suspend Connection',
          variant: 'destructive' as const,
        };
      case 'reactivate':
        return {
          title: 'Reactivate Connection',
          description: `Are you sure you want to reactivate your connection with ${connection.organization.name}? You'll be able to schedule availability again.`,
          confirmText: 'Reactivate Connection',
          variant: 'default' as const,
        };
      case 'delete':
        return {
          title: 'Delete Connection',
          description: `Are you sure you want to permanently delete your connection with ${connection.organization.name}? This action cannot be undone and you'll need a new invitation to reconnect.`,
          confirmText: 'Delete Connection',
          variant: 'destructive' as const,
        };
      default:
        return null;
    }
  };

  const dialogContent = getActionDialogContent();

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {connection.organization.logo ? (
                <img
                  src={connection.organization.logo}
                  alt={connection.organization.name}
                  className="h-12 w-12 rounded-lg border object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <CardTitle className="text-lg">{connection.organization.name}</CardTitle>
                <CardDescription className="mt-1 flex items-center gap-2">
                  <StatusBadge status={connection.status} />
                  {connection.acceptedAt && (
                    <span className="text-xs text-muted-foreground">
                      Connected {format(new Date(connection.acceptedAt), 'MMM d, yyyy')}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>

            {showActions && connection.status !== ConnectionStatus.REJECTED && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={
                      updateConnectionMutation.isPending || deleteConnectionMutation.isPending
                    }
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {connection.status === ConnectionStatus.ACCEPTED && (
                    <DropdownMenuItem onClick={handleSuspend} className="flex items-center gap-2">
                      <Pause className="h-4 w-4" />
                      Suspend Connection
                    </DropdownMenuItem>
                  )}

                  {connection.status === ConnectionStatus.SUSPENDED && (
                    <DropdownMenuItem
                      onClick={handleReactivate}
                      className="flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Reactivate Connection
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="flex items-center gap-2 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Connection
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Organization Description */}
          {connection.organization.description && (
            <div>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {connection.organization.description}
              </p>
            </div>
          )}

          {/* Organization Contact Info */}
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            {connection.organization.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${connection.organization.email}`}
                  className="truncate text-primary hover:underline"
                >
                  {connection.organization.email}
                </a>
              </div>
            )}
            {connection.organization.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`tel:${connection.organization.phone}`}
                  className="text-primary hover:underline"
                >
                  {connection.organization.phone}
                </a>
              </div>
            )}
            {connection.organization.website && (
              <div className="flex items-center gap-2 sm:col-span-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a
                  href={connection.organization.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-primary hover:underline"
                >
                  {connection.organization.website}
                </a>
              </div>
            )}
          </div>

          {/* Invitation Details */}
          {connection.invitation && (
            <>
              <Separator />
              <div className="text-sm">
                <div className="mb-2 flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Originally invited by:</span>
                </div>
                <p className="ml-6 text-muted-foreground">
                  {connection.invitation.invitedBy?.name || 'Unknown'}
                  {connection.invitation.createdAt && (
                    <span className="ml-2 text-xs">
                      on {format(new Date(connection.invitation.createdAt), 'MMM d, yyyy')}
                    </span>
                  )}
                </p>

                {connection.invitation.customMessage && (
                  <div className="mt-3 rounded bg-muted/50 p-2">
                    <p className="mb-1 text-xs font-medium">Original message:</p>
                    <p className="text-xs text-muted-foreground">
                      &quot;{connection.invitation.customMessage}&quot;
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Status Messages */}
          {connection.status === ConnectionStatus.SUSPENDED && (
            <div className="rounded-md bg-orange-50 p-3 dark:bg-orange-950/30">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                ⏸️ This connection is suspended. Reactivate it to schedule availability again.
              </p>
            </div>
          )}

          {connection.status === ConnectionStatus.ACCEPTED && (
            <div className="rounded-md bg-green-50 p-3 dark:bg-green-950/30">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✅ Active connection - you can schedule availability with this organization.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      {dialogContent && (
        <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogContent.title}</DialogTitle>
              <DialogDescription>{dialogContent.description}</DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsActionDialogOpen(false)}
                disabled={updateConnectionMutation.isPending || deleteConnectionMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant={dialogContent.variant}
                onClick={confirmAction}
                disabled={updateConnectionMutation.isPending || deleteConnectionMutation.isPending}
              >
                {updateConnectionMutation.isPending || deleteConnectionMutation.isPending
                  ? 'Processing...'
                  : dialogContent.confirmText}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
