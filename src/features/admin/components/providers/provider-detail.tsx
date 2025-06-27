'use client';

import { useState } from 'react';

import { NavigationLink } from '@/components/ui/navigation-link';

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
  useApproveRequirement,
  useApproveServiceProvider,
  useRejectRequirement,
  useRejectServiceProvider,
} from '@/features/providers/hooks/use-admin-provider-approval';
import { useAdminProvider } from '@/features/providers/hooks/use-admin-providers';

import { StatusBadge } from '../../../../components/status-badge';
import { ApprovalButtons } from '../ui/approval-buttons';
import { ProviderDetailSkeleton } from '../ui/admin-loading-states';
import { RejectionModal } from '../ui/rejection-modal';

interface ProviderDetailProps {
  providerId: string;
}

export function ProviderDetail({ providerId }: ProviderDetailProps) {
  const { data: provider, isLoading, error } = useAdminProvider(providerId);

  const [rejectionModal, setRejectionModal] = useState<{
    isOpen: boolean;
    type: 'provider' | 'requirement';
    id: string;
    name: string;
  }>({
    isOpen: false,
    type: 'provider',
    id: '',
    name: '',
  });

  const approveProviderMutation = useApproveServiceProvider();
  const rejectProviderMutation = useRejectServiceProvider();
  const approveRequirementMutation = useApproveRequirement();
  const rejectRequirementMutation = useRejectRequirement();

  const handleApproveProvider = async () => {
    await approveProviderMutation.mutateAsync(providerId);
  };

  const handleRejectProviderClick = () => {
    setRejectionModal({
      isOpen: true,
      type: 'provider',
      id: providerId,
      name: provider?.user?.name || 'Provider',
    });
  };

  const handleApproveRequirement = async (requirementSubmissionId: string) => {
    await approveRequirementMutation.mutateAsync({ requirementSubmissionId });
  };

  const handleRejectRequirementClick = (
    requirementSubmissionId: string,
    requirementName: string
  ) => {
    setRejectionModal({
      isOpen: true,
      type: 'requirement',
      id: requirementSubmissionId,
      name: requirementName,
    });
  };

  const handleReject = async (reason: string) => {
    if (rejectionModal.type === 'provider') {
      await rejectProviderMutation.mutateAsync({
        serviceProviderId: rejectionModal.id,
        rejectionReason: reason,
      });
    } else {
      await rejectRequirementMutation.mutateAsync({
        requirementSubmissionId: rejectionModal.id,
        rejectionReason: reason,
      });
    }
  };

  const closeRejectionModal = () => {
    setRejectionModal({
      isOpen: false,
      type: 'provider',
      id: '',
      name: '',
    });
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">Error loading provider: {error.message}</div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <ProviderDetailSkeleton />;
  }

  const approvedRequirements =
    provider?.requirementSubmissions?.filter((req: any) => req.status === 'APPROVED').length || 0;
  const totalRequirements = provider?.requirementSubmissions?.length || 0;
  const allRequirementsApproved =
    approvedRequirements === totalRequirements && totalRequirements > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{provider?.user?.name || 'Unknown Provider'}</h1>
          <p className="text-muted-foreground">{provider?.user?.email}</p>
        </div>
        <div className="flex items-center gap-4">
          <StatusBadge status={provider?.status} />
          {provider?.status === 'PENDING' && allRequirementsApproved && (
            <ApprovalButtons
              onApprove={handleApproveProvider}
              onReject={handleRejectProviderClick}
              isApproving={approveProviderMutation.isPending}
              isRejecting={rejectProviderMutation.isPending}
            />
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Provider Information */}
          <Card>
            <CardHeader>
              <CardTitle>Provider Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-sm font-semibold">{provider?.user?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm">{provider?.user?.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="text-sm">{provider?.user?.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">WhatsApp</label>
                  <p className="text-sm">{provider?.user?.whatsapp || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Provider Type</label>
                  <p className="text-sm">
                    <Badge variant="outline">
                      {provider?.serviceProviderType?.name || 'Unknown'}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="text-sm">
                    <StatusBadge status={provider?.status} />
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Submitted</label>
                  <p className="text-sm">
                    {provider?.createdAt
                      ? new Date(provider.createdAt).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-sm">
                    {provider?.updatedAt
                      ? new Date(provider.updatedAt).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Services Offered */}
              {provider?.services && provider.services.length > 0 && (
                <div className="mt-6">
                  <label className="text-sm font-medium text-muted-foreground">Services Offered</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {provider.services.map((service: any) => (
                      <Badge key={service.id} variant="secondary">
                        {service.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio/Description */}
              {provider?.bio && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-muted-foreground">Bio</label>
                  <p className="mt-1 text-sm">{provider.bio}</p>
                </div>
              )}

              {provider?.rejectionReason && (
                <div className="mt-4 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                  <label className="text-sm font-medium text-red-800 dark:text-red-300">
                    Rejection Reason
                  </label>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                    {provider.rejectionReason}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Requirements Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Requirements Summary</CardTitle>
              <CardDescription>
                {approvedRequirements} of {totalRequirements} requirements approved
                {totalRequirements > 0 && (
                  <span className="ml-2">
                    ({Math.round((approvedRequirements / totalRequirements) * 100)}% complete)
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {provider?.requirementSubmissions?.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    No requirements submitted
                  </div>
                ) : (
                  provider?.requirementSubmissions?.map((requirement: any) => (
                    <div
                      key={requirement.id}
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{requirement.requirement?.name}</p>
                          {requirement.requirement?.required && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {requirement.requirement?.description}
                        </p>
                        {requirement.submittedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Submitted: {new Date(requirement.submittedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {requirement.documents?.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {requirement.documents.length} doc{requirement.documents.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        <StatusBadge status={requirement.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requirements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Requirement Submissions</CardTitle>
              <CardDescription>Review and approve individual requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Requirement</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Documents</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {provider?.requirementSubmissions?.map((requirement: any) => (
                      <TableRow key={requirement.id}>
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{requirement.requirement?.name}</p>
                              {requirement.requirement?.required && (
                                <Badge variant="destructive" className="text-xs">
                                  Required
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {requirement.requirement?.description}
                            </p>
                            {requirement.adminNotes && (
                              <p className="text-xs text-blue-600 mt-1">
                                Admin notes: {requirement.adminNotes}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={requirement.status} />
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            <div>{new Date(requirement.createdAt).toLocaleDateString()}</div>
                            {requirement.submittedAt && (
                              <div className="text-xs">
                                Submitted: {new Date(requirement.submittedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {requirement.documents?.length > 0 ? (
                            <div className="space-y-1">
                              {requirement.documents.map((doc: any) => (
                                <div key={doc.id} className="text-sm">
                                  <NavigationLink
                                    href={doc.url}
                                    className="text-blue-600 hover:underline"
                                  >
                                    {doc.fileName}
                                  </NavigationLink>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No documents</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {requirement.status === 'PENDING' ? (
                            <ApprovalButtons
                              onApprove={() => handleApproveRequirement(requirement.id)}
                              onReject={() =>
                                handleRejectRequirementClick(
                                  requirement.id,
                                  requirement.requirement?.name || 'Requirement'
                                )
                              }
                              isApproving={approveRequirementMutation.isPending}
                              isRejecting={rejectRequirementMutation.isPending}
                              size="sm"
                            />
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              {requirement.status.toLowerCase()}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
                {provider?.approvedAt && (
                  <div className="flex items-center space-x-4 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-300">
                        Provider Approved
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {new Date(provider.approvedAt).toLocaleString()}
                        {provider.approvedBy && ` by ${provider.approvedBy.name}`}
                      </p>
                    </div>
                  </div>
                )}

                {provider?.rejectedAt && (
                  <div className="flex items-center space-x-4 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                    <div>
                      <p className="font-medium text-red-800 dark:text-red-300">
                        Provider Rejected
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {new Date(provider.rejectedAt).toLocaleString()}
                      </p>
                      {provider.rejectionReason && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          Reason: {provider.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <div>
                    <p className="font-medium text-blue-800 dark:text-blue-300">
                      Application Submitted
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      {new Date(provider?.createdAt).toLocaleString()}
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
        title={`Reject ${rejectionModal.name}`}
        description={
          rejectionModal.type === 'provider'
            ? 'Please provide a reason for rejecting this provider application.'
            : 'Please provide a reason for rejecting this requirement submission.'
        }
        entityName={rejectionModal.type === 'provider' ? 'Provider' : 'Requirement'}
        isLoading={
          rejectionModal.type === 'provider'
            ? rejectProviderMutation.isPending
            : rejectRequirementMutation.isPending
        }
      />
    </div>
  );
}
