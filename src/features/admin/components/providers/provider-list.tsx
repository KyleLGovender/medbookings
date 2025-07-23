'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NavigationOutlineButton } from '@/components/ui/navigation-button';
import { NavigationLink } from '@/components/ui/navigation-link';
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
import type { AdminProviderListSelect } from '@/features/admin/types/types';
import type { AdminApprovalStatus } from '@/features/admin/types/enums';
import {
  useApproveProvider,
  useRejectProvider,
} from '@/features/providers/hooks/use-admin-provider-approval';
import { useAdminProviders } from '@/features/providers/hooks/use-admin-providers';

import { StatusBadge } from '../../../../components/status-badge';
import { RejectionModal } from '../ui/rejection-modal';

interface ProviderListProps {
  initialStatus?: AdminApprovalStatus;
}

export function ProviderList({ initialStatus }: ProviderListProps) {
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectionModal, setRejectionModal] = useState<{
    isOpen: boolean;
    providerId: string;
    providerName: string;
  }>({
    isOpen: false,
    providerId: '',
    providerName: '',
  });

  const {
    data: providers,
    isLoading,
    error,
  } = useAdminProviders(statusFilter === 'all' ? undefined : (statusFilter as AdminApprovalStatus));

  const approveProviderMutation = useApproveProvider();
  const rejectProviderMutation = useRejectProvider();

  const filteredProviders = providers?.filter((provider: AdminProviderListSelect) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      provider.user?.name?.toLowerCase().includes(query) ||
      provider.user?.email?.toLowerCase().includes(query) ||
      provider.typeAssignments?.some((assignment) =>
        assignment.providerType?.name?.toLowerCase().includes(query)
      )
    );
  });

  const handleApprove = async (providerId: string) => {
    await approveProviderMutation.mutateAsync(providerId);
  };

  const handleRejectClick = (providerId: string, providerName: string) => {
    setRejectionModal({
      isOpen: true,
      providerId,
      providerName,
    });
  };

  const handleReject = async (reason: string) => {
    await rejectProviderMutation.mutateAsync({
      providerId: rejectionModal.providerId,
      rejectionReason: reason,
    });
  };

  const closeRejectionModal = () => {
    setRejectionModal({
      isOpen: false,
      providerId: '',
      providerName: '',
    });
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">Error loading providers: {error.message}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Provider Management</CardTitle>
          <CardDescription>Review and manage provider applications</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Search providers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-[300px]"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredProviders?.length || 0} providers
            </div>
          </div>

          {/* Provider Table */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requirements</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProviders?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center">
                        No providers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProviders?.map((provider: AdminProviderListSelect) => (
                      <TableRow key={provider.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <NavigationLink
                              href={`/admin/providers/${provider.id}`}
                              className="font-medium hover:underline"
                            >
                              {provider.user?.name || 'Unknown'}
                            </NavigationLink>
                            <div className="text-sm text-muted-foreground">
                              {provider.user?.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {provider.typeAssignments?.map((assignment, index) => (
                              <Badge key={index} variant="outline">
                                {assignment.providerType?.name || 'Unknown'}
                              </Badge>
                            )) || <Badge variant="outline">Unknown</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={
                              provider.status === 'PENDING_APPROVAL'
                                ? 'PENDING'
                                : provider.status === 'REJECTED'
                                  ? 'REJECTED'
                                  : provider.status === 'SUSPENDED'
                                    ? 'SUSPENDED'
                                    : 'APPROVED'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {provider.requirementSubmissions?.filter(
                              (req) => req.status === 'APPROVED'
                            ).length || 0}{' '}
                            / {provider.requirementSubmissions?.length || 0} approved
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {new Date(provider.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {provider.status === 'PENDING_APPROVAL' ? (
                            (() => {
                              const approvedRequirements =
                                provider.requirementSubmissions?.filter(
                                  (req) => req.status === 'APPROVED'
                                ).length || 0;
                              const totalRequirements =
                                provider.requirementSubmissions?.length || 0;
                              const allRequirementsApproved =
                                totalRequirements > 0 && approvedRequirements === totalRequirements;

                              return (
                                <div className="flex justify-end gap-2">
                                  <NavigationOutlineButton
                                    href={`/admin/providers/${provider.id}`}
                                    size="sm"
                                  >
                                    View Details
                                  </NavigationOutlineButton>
                                  <Button
                                    onClick={() =>
                                      handleRejectClick(
                                        provider.id,
                                        provider.user?.name || 'Provider'
                                      )
                                    }
                                    disabled={rejectProviderMutation.isPending}
                                    variant="destructive"
                                    size="sm"
                                    className="disabled:opacity-50"
                                  >
                                    {rejectProviderMutation.isPending ? 'Rejecting...' : 'Reject'}
                                  </Button>
                                  {allRequirementsApproved && (
                                    <Button
                                      onClick={() => handleApprove(provider.id)}
                                      disabled={approveProviderMutation.isPending}
                                      size="sm"
                                      className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                                    >
                                      {approveProviderMutation.isPending
                                        ? 'Approving...'
                                        : 'Approve'}
                                    </Button>
                                  )}
                                </div>
                              );
                            })()
                          ) : (
                            <NavigationOutlineButton
                              href={`/admin/providers/${provider.id}`}
                              size="sm"
                            >
                              View Details
                            </NavigationOutlineButton>
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

      {/* Rejection Modal */}
      <RejectionModal
        isOpen={rejectionModal.isOpen}
        onClose={closeRejectionModal}
        onReject={handleReject}
        title={`Reject ${rejectionModal.providerName}`}
        description="Please provide a reason for rejecting this provider application. This will be sent to the provider."
        entityName="Provider"
        isLoading={rejectProviderMutation.isPending}
      />
    </div>
  );
}
