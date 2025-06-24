'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useApproveOrganization,
  useRejectOrganization,
} from '@/features/organizations/hooks/use-admin-organization-approval';
import { useAdminOrganization } from '@/features/organizations/hooks/use-admin-organizations';

import { StatusBadge } from '../../../../components/status-badge';
import { ApprovalButtons } from '../ui/approval-buttons';
import { RejectionModal } from '../ui/rejection-modal';

interface OrganizationDetailProps {
  organizationId: string;
}

export function OrganizationDetail({ organizationId }: OrganizationDetailProps) {
  const { data: organization, isLoading, error } = useAdminOrganization(organizationId);

  const [rejectionModal, setRejectionModal] = useState<{
    isOpen: boolean;
    organizationId: string;
    organizationName: string;
  }>({
    isOpen: false,
    organizationId: '',
    organizationName: '',
  });

  const approveOrganizationMutation = useApproveOrganization();
  const rejectOrganizationMutation = useRejectOrganization();

  const handleApproveOrganization = async () => {
    await approveOrganizationMutation.mutateAsync({ organizationId });
  };

  const handleRejectOrganizationClick = () => {
    setRejectionModal({
      isOpen: true,
      organizationId,
      organizationName: organization?.name || 'Organization',
    });
  };

  const handleReject = async (reason: string) => {
    await rejectOrganizationMutation.mutateAsync({
      organizationId: rejectionModal.organizationId,
      rejectionReason: reason,
    });
  };

  const closeRejectionModal = () => {
    setRejectionModal({
      isOpen: false,
      organizationId: '',
      organizationName: '',
    });
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading organization: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-[300px]" />
            <Skeleton className="h-4 w-[200px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{organization?.name || 'Unknown Organization'}</h1>
          <p className="text-muted-foreground">{organization?.email}</p>
        </div>
        <div className="flex items-center gap-4">
          <StatusBadge status={organization?.status} />
          {organization?.status === 'PENDING' && (
            <ApprovalButtons
              onApprove={handleApproveOrganization}
              onReject={handleRejectOrganizationClick}
              isApproving={approveOrganizationMutation.isPending}
              isRejecting={rejectOrganizationMutation.isPending}
            />
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Organization Information */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-sm">{organization?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm">{organization?.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="text-sm">{organization?.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Website</label>
                  <p className="text-sm">
                    {organization?.website ? (
                      <Link
                        href={organization.website}
                        target="_blank"
                        className="text-blue-600 hover:underline"
                      >
                        {organization.website}
                      </Link>
                    ) : (
                      'N/A'
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Billing Model</label>
                  <p className="text-sm">
                    <Badge variant="outline">
                      {organization?.billingModel?.replace('_', ' ') || 'Unknown'}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="text-sm">
                    <StatusBadge status={organization?.status} />
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Submitted</label>
                  <p className="text-sm">
                    {organization?.createdAt
                      ? new Date(organization.createdAt).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-sm">
                    {organization?.updatedAt
                      ? new Date(organization.updatedAt).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {organization?.description && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="mt-1 text-sm">{organization.description}</p>
                </div>
              )}

              {organization?.rejectionReason && (
                <div className="mt-4 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                  <label className="text-sm font-medium text-red-800 dark:text-red-300">
                    Rejection Reason
                  </label>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                    {organization.rejectionReason}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{organization?.memberships?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Active members</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{organization?.locations?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Registered locations</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Providers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {organization?.providerConnections?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Connected providers</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Members</CardTitle>
              <CardDescription>Users who are part of this organization</CardDescription>
            </CardHeader>
            <CardContent>
              {organization?.memberships?.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No members found</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {organization?.memberships?.map((membership: any) => (
                        <TableRow key={membership.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{membership.user?.name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">
                                {membership.user?.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{membership.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={membership.status} />
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {new Date(membership.createdAt).toLocaleDateString()}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Locations</CardTitle>
              <CardDescription>
                Physical locations associated with this organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {organization?.locations?.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No locations found</div>
              ) : (
                <div className="space-y-4">
                  {organization?.locations?.map((location: any) => (
                    <div key={location.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{location.name}</h4>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {location.formattedAddress}
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Added {new Date(location.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connected Providers</CardTitle>
              <CardDescription>Service providers connected to this organization</CardDescription>
            </CardHeader>
            <CardContent>
              {organization?.providerConnections?.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No providers connected</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Provider</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Connected</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {organization?.providerConnections?.map((connection: any) => (
                        <TableRow key={connection.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {connection.serviceProvider?.user?.name || 'Unknown'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {connection.serviceProvider?.user?.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {connection.serviceProvider?.serviceProviderType?.name || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={connection.serviceProvider?.status} />
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {new Date(connection.createdAt).toLocaleDateString()}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Approval History</CardTitle>
              <CardDescription>Timeline of approval actions and status changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {organization?.approvedAt && (
                  <div className="flex items-center space-x-4 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-300">
                        Organization Approved
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {new Date(organization.approvedAt).toLocaleString()}
                        {organization.approvedBy && ` by ${organization.approvedBy.name}`}
                      </p>
                    </div>
                  </div>
                )}

                {organization?.rejectedAt && (
                  <div className="flex items-center space-x-4 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                    <div>
                      <p className="font-medium text-red-800 dark:text-red-300">
                        Organization Rejected
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {new Date(organization.rejectedAt).toLocaleString()}
                      </p>
                      {organization.rejectionReason && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          Reason: {organization.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <div>
                    <p className="font-medium text-blue-800 dark:text-blue-300">
                      Organization Registered
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      {new Date(organization?.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rejection Modal */}
      <RejectionModal
        isOpen={rejectionModal.isOpen}
        onClose={closeRejectionModal}
        onReject={handleReject}
        title={`Reject ${rejectionModal.organizationName}`}
        description="Please provide a reason for rejecting this organization application. This will be sent to the organization."
        entityName="Organization"
        isLoading={rejectOrganizationMutation.isPending}
      />
    </div>
  );
}
