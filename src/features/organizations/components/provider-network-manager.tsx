'use client';

import { useState } from 'react';

import { Building2, Mail, Plus, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrganizationProviderConnections } from '@/features/organizations/hooks/use-provider-connections';
import { useProviderInvitations } from '@/features/organizations/hooks/use-provider-invitations';

import { ProviderConnectionCard } from './provider-connection-card';
import { ProviderInvitationForm } from './provider-invitation-form';
import { ProviderInvitationList } from './provider-invitation-list';

interface ProviderNetworkManagerProps {
  organizationId: string;
}

export function ProviderNetworkManager({ organizationId }: ProviderNetworkManagerProps) {
  const [connectionsStatusFilter, setConnectionsStatusFilter] = useState<string>('all');
  const [invitationsStatusFilter, setInvitationsStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  const {
    data: connectionsData,
    isLoading: isLoadingConnections,
    error: connectionsError,
  } = useOrganizationProviderConnections(
    organizationId,
    connectionsStatusFilter === 'all' ? undefined : connectionsStatusFilter
  );

  const { data: invitationsData, isLoading: isLoadingInvitations } = useProviderInvitations(
    organizationId,
    invitationsStatusFilter === 'all' ? undefined : invitationsStatusFilter
  );

  const connections = connectionsData?.connections || [];
  const invitations = invitationsData?.invitations || [];

  // Filter data based on search query
  const filteredConnections = connections.filter((connection) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      connection.serviceProvider.name.toLowerCase().includes(query) ||
      connection.serviceProvider.email.toLowerCase().includes(query) ||
      connection.serviceProvider.serviceProviderType?.name.toLowerCase().includes(query)
    );
  });

  const filteredInvitations = invitations.filter((invitation) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      invitation.email.toLowerCase().includes(query) ||
      invitation.invitedBy?.name?.toLowerCase().includes(query)
    );
  });

  // Count pending invitations for tab badge
  const pendingInvitationsCount = invitations.filter(
    (inv) => inv.status === 'PENDING' && new Date(inv.expiresAt) > new Date()
  ).length;

  const handleInvitationSuccess = () => {
    setIsInviteDialogOpen(false);
  };

  const LoadingCards = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-[200px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 flex-1" />
                  <Skeleton className="h-9 flex-1" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const EmptyState = ({
    icon: Icon,
    title,
    description,
  }: {
    icon: any;
    title: string;
    description: string;
  }) => (
    <Card>
      <CardContent className="py-12">
        <div className="text-center">
          <Icon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-medium">{title}</h3>
          <p className="mx-auto max-w-md text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );

  const ErrorState = ({ message }: { message: string }) => (
    <Card>
      <CardContent className="py-8">
        <div className="text-center text-muted-foreground">
          <p className="text-destructive">{message}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Provider Network</h2>
          <p className="text-muted-foreground">
            Manage your connected providers and send new invitations.
          </p>
        </div>

        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Invite Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Invite Healthcare Provider</DialogTitle>
              <DialogDescription>
                Send an invitation to a healthcare provider to join your organization network.
              </DialogDescription>
            </DialogHeader>
            <ProviderInvitationForm
              organizationId={organizationId}
              onSuccess={handleInvitationSuccess}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search providers and invitations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="connections" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="invitations" className="relative">
            Invitations
            {pendingInvitationsCount > 0 && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {pendingInvitationsCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-6">
          {/* Connections Filters */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <Select value={connectionsStatusFilter} onValueChange={setConnectionsStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Connections</SelectItem>
                <SelectItem value="ACCEPTED">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Connections List */}
          {connectionsError ? (
            <ErrorState message={connectionsError.message} />
          ) : isLoadingConnections ? (
            <LoadingCards />
          ) : filteredConnections.length === 0 ? (
            <EmptyState
              icon={Users}
              title={searchQuery ? 'No connections match your search' : 'No provider connections'}
              description={
                searchQuery
                  ? 'Try adjusting your search terms or filters.'
                  : 'Invite healthcare providers to establish connections and expand your network.'
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredConnections.map((connection) => (
                <ProviderConnectionCard
                  key={connection.id}
                  connection={connection}
                  organizationId={organizationId}
                  showActions={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invitations" className="space-y-6">
          {/* Invitations Filters */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <Select value={invitationsStatusFilter} onValueChange={setInvitationsStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Invitations</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invitations List */}
          {isLoadingInvitations ? (
            <LoadingCards />
          ) : filteredInvitations.length === 0 ? (
            <EmptyState
              icon={Mail}
              title={searchQuery ? 'No invitations match your search' : 'No invitations sent'}
              description={
                searchQuery
                  ? 'Try adjusting your search terms or filters.'
                  : 'Send your first invitation to start building your provider network.'
              }
            />
          ) : (
            <ProviderInvitationList
              organizationId={organizationId}
              invitations={filteredInvitations}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
