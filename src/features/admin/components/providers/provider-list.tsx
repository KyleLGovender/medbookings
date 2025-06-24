'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useApproveServiceProvider,
  useRejectServiceProvider,
} from '@/features/providers/hooks/use-admin-provider-approval';
import { useAdminProviders } from '@/features/providers/hooks/use-admin-providers';

import { StatusBadge } from '../../../../components/status-badge';
import { ApprovalButtons } from '../ui/approval-buttons';
import { RejectionModal } from '../ui/rejection-modal';

interface ProviderListProps {
  initialStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
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
  } = useAdminProviders(statusFilter === 'all' ? undefined : (statusFilter as any));

  const approveProviderMutation = useApproveServiceProvider();
  const rejectProviderMutation = useRejectServiceProvider();

  const filteredProviders = providers?.filter((provider: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      provider.user?.name?.toLowerCase().includes(query) ||
      provider.user?.email?.toLowerCase().includes(query) ||
      provider.serviceProviderType?.name?.toLowerCase().includes(query)
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
      serviceProviderId: rejectionModal.providerId,
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
          <CardDescription>Review and manage service provider applications</CardDescription>
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
                    filteredProviders?.map((provider: any) => (
                      <TableRow key={provider.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <Link
                              href={`/admin/providers/${provider.id}`}
                              className="font-medium hover:underline"
                            >
                              {provider.user?.name || 'Unknown'}
                            </Link>
                            <div className="text-sm text-muted-foreground">
                              {provider.user?.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {provider.serviceProviderType?.name || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={provider.status} />
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {provider.requirementSubmissions?.filter(
                              (req: any) => req.status === 'APPROVED'
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
                          {provider.status === 'PENDING' ? (
                            <ApprovalButtons
                              onApprove={() => handleApprove(provider.id)}
                              onReject={() =>
                                handleRejectClick(provider.id, provider.user?.name || 'Provider')
                              }
                              isApproving={approveProviderMutation.isPending}
                              isRejecting={rejectProviderMutation.isPending}
                              size="sm"
                            />
                          ) : (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/admin/providers/${provider.id}`}>View Details</Link>
                            </Button>
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
