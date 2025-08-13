'use client';

import { useState } from 'react';

import { OrganizationStatus } from '@prisma/client';

import { Badge } from '@/components/ui/badge';
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
import type { AdminFilterStatus } from '@/features/admin/types/types';
import {
  useApproveOrganization,
  useRejectOrganization,
} from '@/features/organizations/hooks/use-admin-organization-approval';
import { useAdminOrganizations } from '@/features/organizations/hooks/use-admin-organizations';
import { type RouterOutputs } from '@/utils/api';

import { StatusBadge } from '../../../../components/status-badge';
import { ApprovalButtons } from '../ui/approval-buttons';
import { RejectionModal } from '../ui/rejection-modal';

type AdminOrganizations = RouterOutputs['admin']['getOrganizations'];
type AdminOrganization = AdminOrganizations[number];

interface OrganizationListProps {
  initialStatus?: AdminFilterStatus;
}

export function OrganizationList({ initialStatus }: OrganizationListProps) {
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectionModal, setRejectionModal] = useState<{
    isOpen: boolean;
    organizationId: string;
    organizationName: string;
  }>({
    isOpen: false,
    organizationId: '',
    organizationName: '',
  });

  const {
    data: organizations,
    isLoading,
    error,
  } = useAdminOrganizations(
    statusFilter === 'all' ? undefined : (statusFilter as AdminFilterStatus)
  );

  const approveOrganizationMutation = useApproveOrganization();
  const rejectOrganizationMutation = useRejectOrganization();

  const filteredOrganizations = organizations?.filter((organization: AdminOrganization) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      organization.name?.toLowerCase().includes(query) ||
      organization.email?.toLowerCase().includes(query) ||
      organization.description?.toLowerCase().includes(query)
    );
  });

  const handleApprove = async (organizationId: string) => {
    await approveOrganizationMutation.mutateAsync({ organizationId });
  };

  const handleRejectClick = (organizationId: string, organizationName: string) => {
    setRejectionModal({
      isOpen: true,
      organizationId,
      organizationName,
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
            Error loading organizations: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization Management</CardTitle>
          <CardDescription>Review and manage organization applications</CardDescription>
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
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value={OrganizationStatus.APPROVED}>Approved</SelectItem>
                  <SelectItem value={OrganizationStatus.REJECTED}>Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-[300px]"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredOrganizations?.length || 0} organizations
            </div>
          </div>

          {/* Organization Table */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
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
                    <TableHead>Organization</TableHead>
                    <TableHead>Billing Model</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Locations</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrganizations?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center">
                        No organizations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrganizations?.map((organization: AdminOrganization) => (
                      <TableRow key={organization.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <NavigationLink
                              href={`/admin/organizations/${organization.id}`}
                              className="font-medium hover:underline"
                            >
                              {organization.name || 'Unknown'}
                            </NavigationLink>
                            <div className="text-sm text-muted-foreground">
                              {organization.email}
                            </div>
                            {organization.description && (
                              <div className="mt-1 max-w-[200px] truncate text-xs text-muted-foreground">
                                {organization.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {organization.billingModel?.replace('_', ' ') || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={
                              organization.status === OrganizationStatus.PENDING_APPROVAL
                                ? 'PENDING'
                                : organization.status === OrganizationStatus.REJECTED
                                  ? 'REJECTED'
                                  : organization.status === OrganizationStatus.SUSPENDED
                                    ? 'SUSPENDED'
                                    : 'APPROVED'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {organization.memberships?.length ?? 0} members
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {organization.locations?.length ?? 0} locations
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {new Date(organization.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {organization.status === OrganizationStatus.PENDING_APPROVAL ? (
                            <div className="flex justify-end gap-2">
                              <NavigationOutlineButton
                                href={`/admin/organizations/${organization.id}`}
                                size="sm"
                              >
                                View Details
                              </NavigationOutlineButton>
                              <ApprovalButtons
                                onApprove={() => handleApprove(organization.id)}
                                onReject={() =>
                                  handleRejectClick(
                                    organization.id,
                                    organization.name || 'Organization'
                                  )
                                }
                                isApproving={approveOrganizationMutation.isPending}
                                isRejecting={rejectOrganizationMutation.isPending}
                                size="sm"
                              />
                            </div>
                          ) : (
                            <NavigationOutlineButton
                              href={`/admin/organizations/${organization.id}`}
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
        title={`Reject ${rejectionModal.organizationName}`}
        description="Please provide a reason for rejecting this organization application. This will be sent to the organization."
        entityName="Organization"
        isLoading={rejectOrganizationMutation.isPending}
      />
    </div>
  );
}
