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

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { useManageOrganizationProviderConnection } from '@/features/organizations/hooks/use-provider-connections';
import { useToast } from '@/hooks/use-toast';
import { type RouterOutputs } from '@/utils/api';

// Extract ProviderConnection type from tRPC output
type ProviderConnection = RouterOutputs['organizations']['getProviderConnections'][number];

interface ProviderConnectionCardProps {
  connection: ProviderConnection;
  organizationId: string;
  showActions?: boolean;
}

const statusConfig = {
  ACCEPTED: {
    label: 'Active',
    variant: 'default' as const,
    description: 'Provider is actively connected',
  },
  PENDING: {
    label: 'Pending',
    variant: 'secondary' as const,
    description: 'Waiting for provider acceptance',
  },
  REJECTED: {
    label: 'Rejected',
    variant: 'destructive' as const,
    description: 'Provider declined connection',
  },
  SUSPENDED: {
    label: 'Suspended',
    variant: 'outline' as const,
    description: 'Connection is temporarily suspended',
  },
};

export function ProviderConnectionCard({
  connection,
  organizationId,
  showActions = true,
}: ProviderConnectionCardProps) {
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'suspend' | 'reactivate' | 'delete' | null>(
    null
  );
  const { toast } = useToast();

  const manageConnectionMutation = useManageOrganizationProviderConnection(organizationId, {
    onSuccess: (data, variables) => {
      let message = '';
      switch (variables.action) {
        case 'update':
          if (variables.data?.status === 'SUSPENDED') {
            message = 'Provider connection suspended successfully';
          } else if (variables.data?.status === 'ACCEPTED') {
            message = 'Provider connection reactivated successfully';
          }
          break;
        case 'delete':
          message = 'Provider connection deleted successfully';
          break;
      }

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
    if (pendingAction === 'delete') {
      manageConnectionMutation.mutate({
        connectionId: connection.id,
        action: 'delete',
      });
    } else if (pendingAction === 'suspend' || pendingAction === 'reactivate') {
      manageConnectionMutation.mutate({
        connectionId: connection.id,
        action: 'update',
        data: {
          status: pendingAction === 'suspend' ? 'SUSPENDED' : 'ACCEPTED',
        },
      });
    }
  };

  const StatusBadge = ({ status }: { status: keyof typeof statusConfig }) => {
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getActionDialogContent = () => {
    switch (pendingAction) {
      case 'suspend':
        return {
          title: 'Suspend Provider Connection',
          description: `Are you sure you want to suspend the connection with ${connection.provider.name}? They won&apos;t be able to schedule new availability until you reactivate the connection.`,
          confirmText: 'Suspend Connection',
          variant: 'destructive' as const,
        };
      case 'reactivate':
        return {
          title: 'Reactivate Provider Connection',
          description: `Reactivate the connection with ${connection.provider.name}? They will be able to schedule availability again.`,
          confirmText: 'Reactivate Connection',
          variant: 'default' as const,
        };
      case 'delete':
        return {
          title: 'Delete Provider Connection',
          description: `Are you sure you want to permanently delete the connection with ${connection.provider.name}? This action cannot be undone.`,
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
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={connection.provider.image || connection.provider.user.image || ''}
                  alt={connection.provider.name}
                />
                <AvatarFallback>{connection.provider.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-lg">{connection.provider.name}</CardTitle>
                <CardDescription className="mt-1 flex items-center gap-2">
                  <StatusBadge status={connection.status} />
                  {connection.provider.serviceProviderType && (
                    <span className="text-xs text-muted-foreground">
                      {connection.provider.serviceProviderType.name}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>

            {showActions && connection.status !== 'REJECTED' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={manageConnectionMutation.isPending}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {connection.status === 'ACCEPTED' && (
                    <DropdownMenuItem onClick={handleSuspend} className="flex items-center gap-2">
                      <Pause className="h-4 w-4" />
                      Suspend Connection
                    </DropdownMenuItem>
                  )}

                  {connection.status === 'SUSPENDED' && (
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
          {/* Provider Bio */}
          {connection.provider.bio && (
            <div>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {connection.provider.bio}
              </p>
            </div>
          )}

          {/* Provider Contact Info */}
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a
                href={`mailto:${connection.provider.email}`}
                className="truncate text-primary hover:underline"
              >
                {connection.provider.email}
              </a>
            </div>
            {connection.provider.whatsapp && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`https://wa.me/${connection.provider.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {connection.provider.whatsapp}
                </a>
              </div>
            )}
            {connection.provider.website && (
              <div className="flex items-center gap-2 sm:col-span-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a
                  href={connection.provider.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-primary hover:underline"
                >
                  {connection.provider.website}
                </a>
              </div>
            )}
          </div>

          <Separator />

          {/* Connection Details */}
          <div className="text-sm">
            {connection.acceptedAt && (
              <div className="mb-2 flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Connected:</span>
                <span className="text-muted-foreground">
                  {format(new Date(connection.acceptedAt), 'MMM d, yyyy')}
                </span>
              </div>
            )}

            {connection.invitation && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Invited by:</span>
                  <span className="text-muted-foreground">
                    {connection.invitation.invitedBy?.name || 'Unknown'}
                  </span>
                </div>

                {connection.invitation.customMessage && (
                  <div className="mt-2 rounded bg-muted/50 p-2">
                    <p className="mb-1 text-xs font-medium">Original invitation message:</p>
                    <p className="text-xs text-muted-foreground">
                      &quot;{connection.invitation.customMessage}&quot;
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status Messages */}
          {connection.status === 'SUSPENDED' && (
            <div className="rounded-md bg-orange-50 p-3 dark:bg-orange-950/30">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                ⏸️ This connection is suspended. The provider cannot schedule new availability.
              </p>
            </div>
          )}

          {connection.status === 'ACCEPTED' && (
            <div className="rounded-md bg-green-50 p-3 dark:bg-green-950/30">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✅ Active connection - provider can schedule availability with your organization.
              </p>
            </div>
          )}

          {connection.status === 'PENDING' && (
            <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-950/30">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                ⏳ Waiting for provider to accept the invitation.
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
                disabled={manageConnectionMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant={dialogContent.variant}
                onClick={confirmAction}
                disabled={manageConnectionMutation.isPending}
              >
                {manageConnectionMutation.isPending ? 'Processing...' : dialogContent.confirmText}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
