'use client';

import { useState } from 'react';

import { ConnectionStatus, ProviderInvitationStatus } from '@prisma/client';
import { Building2, Mail, Users } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  useOrganizationConnections,
  useProviderInvitations,
} from '@/features/providers/hooks/use-organization-connections';
import { nowUTC } from '@/lib/timezone';

import { ConnectionCard } from './connection-card';
import { InvitationCard } from './invitation-card';

export function OrganizationConnectionsManager() {
  const [invitationsStatusFilter, setInvitationsStatusFilter] = useState<
    'all' | ProviderInvitationStatus
  >('all');
  const [connectionsStatusFilter, setConnectionsStatusFilter] = useState<'all' | ConnectionStatus>(
    'all'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: invitationsData,
    isLoading: isLoadingInvitations,
    error: invitationsError,
  } = useProviderInvitations(
    invitationsStatusFilter === 'all' ? undefined : invitationsStatusFilter
  );

  const {
    data: connectionsData,
    isLoading: isLoadingConnections,
    error: connectionsError,
  } = useOrganizationConnections(
    connectionsStatusFilter === 'all' ? undefined : connectionsStatusFilter
  );

  const invitations = invitationsData?.invitations || [];
  const connections = connectionsData?.connections || [];

  // Filter data based on search query
  const filteredInvitations = invitations.filter((invitation) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      invitation.organization.name.toLowerCase().includes(query) ||
      invitation.organization.email?.toLowerCase().includes(query) ||
      invitation.invitedBy?.name?.toLowerCase().includes(query)
    );
  });

  const filteredConnections = connections.filter((connection) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      connection.organization.name.toLowerCase().includes(query) ||
      connection.organization.email?.toLowerCase().includes(query)
    );
  });

  // Count pending invitations for tab badge
  const pendingInvitationsCount = invitations.filter(
    (inv) => inv.status === ProviderInvitationStatus.PENDING && inv.expiresAt > nowUTC()
  ).length;

  const LoadingCards = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-start gap-3">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-[200px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[80%]" />
              <div className="flex gap-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 flex-1" />
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
    icon: React.ComponentType<{ className?: string }>;
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
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Organization Network</h2>
        <p className="text-muted-foreground">
          Manage your invitations and connections with healthcare organizations.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search organizations..."
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
            <Select
              value={connectionsStatusFilter}
              onValueChange={(value) =>
                setConnectionsStatusFilter(value as typeof connectionsStatusFilter)
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Connections</SelectItem>
                <SelectItem value={ConnectionStatus.ACCEPTED}>Active</SelectItem>
                <SelectItem value={ConnectionStatus.SUSPENDED}>Suspended</SelectItem>
                <SelectItem value={ConnectionStatus.PENDING}>Pending</SelectItem>
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
              icon={Building2}
              title={
                searchQuery ? 'No connections match your search' : 'No organization connections'
              }
              description={
                searchQuery
                  ? 'Try adjusting your search terms or filters.'
                  : 'Accept invitations to establish connections with organizations and start scheduling availability.'
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredConnections.map((connection) => (
                <ConnectionCard key={connection.id} connection={connection} showActions={true} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invitations" className="space-y-6">
          {/* Invitations Filters */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <Select
              value={invitationsStatusFilter}
              onValueChange={(value) =>
                setInvitationsStatusFilter(value as typeof invitationsStatusFilter)
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Invitations</SelectItem>
                <SelectItem value={ProviderInvitationStatus.PENDING}>Pending</SelectItem>
                <SelectItem value={ProviderInvitationStatus.ACCEPTED}>Accepted</SelectItem>
                <SelectItem value={ProviderInvitationStatus.REJECTED}>Rejected</SelectItem>
                <SelectItem value={ProviderInvitationStatus.EXPIRED}>Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invitations List */}
          {invitationsError ? (
            <ErrorState message={invitationsError.message} />
          ) : isLoadingInvitations ? (
            <LoadingCards />
          ) : filteredInvitations.length === 0 ? (
            <EmptyState
              icon={Mail}
              title={searchQuery ? 'No invitations match your search' : 'No invitations received'}
              description={
                searchQuery
                  ? 'Try adjusting your search terms or filters.'
                  : 'When organizations invite you to join their network, invitations will appear here.'
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredInvitations.map((invitation) => (
                <InvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  showActions={
                    invitation.status === ProviderInvitationStatus.PENDING &&
                    invitation.expiresAt > nowUTC()
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
