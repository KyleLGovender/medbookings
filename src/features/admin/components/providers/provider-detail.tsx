'use client';

import { useEffect, useState } from 'react';

import { ProviderStatus, RequirementsValidationStatus } from '@prisma/client';

import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProviderDetailSkeleton } from '@/features/admin/components/ui/admin-loading-states';
import { ApprovalButtons } from '@/features/admin/components/ui/approval-buttons';
import { RejectionModal } from '@/features/admin/components/ui/rejection-modal';
import { RequirementSubmissionCard } from '@/features/providers/components/requirement-submission-card';
import {
  useApproveProvider,
  useApproveRequirement,
  useRejectProvider,
  useRejectRequirement,
  useResetProviderStatus,
} from '@/features/providers/hooks/use-admin-provider-approval';
import {
  useAdminProvider,
  useAdminProviderRequirements,
} from '@/features/providers/hooks/use-admin-providers';
import { type RouterOutputs } from '@/utils/api';

// Infer types from tRPC router outputs
type AdminProvider = RouterOutputs['admin']['getProviderById'];
type AdminProviderRequirements = RouterOutputs['admin']['getProviderRequirements'];
type RequirementSubmission = AdminProviderRequirements[number];
type TypeAssignment = NonNullable<AdminProvider>['typeAssignments'][number];
type Service = NonNullable<AdminProvider>['services'][number];

interface ProviderDetailProps {
  providerId: string;
}

export function ProviderDetail({ providerId }: ProviderDetailProps) {
  const {
    data: provider,
    isLoading: providerLoading,
    error: providerError,
  } = useAdminProvider(providerId);
  const {
    data: requirements,
    isLoading: requirementsLoading,
    error: requirementsError,
  } = useAdminProviderRequirements(providerId);

  const isLoading = providerLoading || requirementsLoading;
  const error = providerError || requirementsError;

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

  // Track which requirement is being processed
  const [processingRequirementId, setProcessingRequirementId] = useState<string | null>(null);

  const approveProviderMutation = useApproveProvider();
  const rejectProviderMutation = useRejectProvider();
  const approveRequirementMutation = useApproveRequirement();
  const rejectRequirementMutation = useRejectRequirement();
  const resetProviderStatusMutation = useResetProviderStatus();

  const handleApproveProvider = async () => {
    console.log('Attempting to approve provider:', {
      providerId,
      requiredSubmissions: requiredSubmissions.length,
      approvedRequired: approvedRequiredSubmissions.length,
      allRequiredApproved: allRequiredRequirementsApproved,
      status: provider?.status,
    });

    try {
      await approveProviderMutation.mutateAsync({ id: providerId });
      console.log('Provider approval successful');
    } catch (error) {
      console.error('Provider approval failed:', error);
    }
  };

  const handleRejectProviderClick = () => {
    setRejectionModal({
      isOpen: true,
      type: 'provider',
      id: providerId,
      name: provider?.user?.name || 'Provider',
    });
  };

  const handleResetProviderStatus = async () => {
    console.log('Attempting to reset provider status:', {
      providerId,
      currentStatus: provider?.status,
    });

    try {
      await resetProviderStatusMutation.mutateAsync({ id: providerId });
      console.log('Provider status reset successful');
    } catch (error) {
      console.error('Provider status reset failed:', error);
    }
  };

  const handleApproveRequirement = async (requirementSubmissionId: string) => {
    console.log('Starting requirement approval:', { requirementSubmissionId, providerId });
    setProcessingRequirementId(requirementSubmissionId);
    try {
      const result = await approveRequirementMutation.mutateAsync({
        providerId,
        requirementId: requirementSubmissionId,
      });
      console.log('Requirement approval successful:', result);
    } catch (error) {
      console.error('Requirement approval failed:', error);
    } finally {
      setProcessingRequirementId(null);
    }
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
        id: rejectionModal.id,
        reason: reason,
      });
    } else {
      setProcessingRequirementId(rejectionModal.id);
      try {
        await rejectRequirementMutation.mutateAsync({
          providerId,
          requirementId: rejectionModal.id,
          reason: reason,
        });
      } finally {
        setProcessingRequirementId(null);
      }
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

  // Debug logging - Must be before conditional returns to maintain hook order
  useEffect(() => {
    if (requirements) {
      console.log('Provider requirements updated:', {
        total: requirements.length,
        submissions: requirements.map((sub: RequirementSubmission) => ({
          id: sub.id,
          name: sub.requirementType?.name,
          status: sub.status,
          isRequired: sub.requirementType?.isRequired,
        })),
      });
    }
  }, [requirements]);

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
    requirements?.filter(
      (req: RequirementSubmission) => req.status === RequirementsValidationStatus.APPROVED
    ).length || 0;
  const totalRequirements = requirements?.length || 0;

  // Check if all REQUIRED requirements are approved (to match server-side logic)
  const requiredSubmissions =
    requirements?.filter((req: RequirementSubmission) => req.requirementType?.isRequired) || [];
  const approvedRequiredSubmissions = requiredSubmissions.filter(
    (req: RequirementSubmission) => req.status === RequirementsValidationStatus.APPROVED
  );
  const allRequiredRequirementsApproved =
    requiredSubmissions.length > 0 &&
    approvedRequiredSubmissions.length === requiredSubmissions.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{provider?.user?.name || 'Unknown Provider'}</h1>
          <p className="text-muted-foreground">{provider?.user?.email}</p>
        </div>
        <div className="flex items-center gap-4">
          <StatusBadge
            status={
              provider?.status === ProviderStatus.PENDING_APPROVAL
                ? 'PENDING'
                : provider?.status === ProviderStatus.TRIAL ||
                    provider?.status === ProviderStatus.TRIAL_EXPIRED ||
                    provider?.status === ProviderStatus.ACTIVE ||
                    provider?.status === ProviderStatus.PAYMENT_OVERDUE ||
                    provider?.status === ProviderStatus.CANCELLED
                  ? 'APPROVED'
                  : provider?.status === ProviderStatus.SUSPENDED
                    ? 'SUSPENDED'
                    : provider?.status === ProviderStatus.REJECTED
                      ? 'REJECTED'
                      : 'PENDING'
            }
          />
          {provider?.status === ProviderStatus.PENDING_APPROVAL &&
            allRequiredRequirementsApproved && (
              <ApprovalButtons
                onApprove={handleApproveProvider}
                onReject={handleRejectProviderClick}
                isApproving={approveProviderMutation.isPending}
                isRejecting={rejectProviderMutation.isPending}
              />
            )}
          {provider?.status === ProviderStatus.REJECTED && (
            <Button
              onClick={handleResetProviderStatus}
              disabled={resetProviderStatusMutation.isPending}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20"
            >
              {resetProviderStatusMutation.isPending ? 'Resetting...' : 'Reset to Pending'}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Provider Information */}
        <Card>
          <CardHeader>
            <CardTitle>Provider Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Provider Image */}
            {provider?.image && (
              <div className="mb-6 flex justify-start">
                <img
                  src={provider.image}
                  alt={provider.user?.name || 'Provider'}
                  className="h-32 w-32 rounded-full border-2 border-gray-200 object-cover dark:border-gray-700"
                />
              </div>
            )}

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
                <p className="text-sm">N/A</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">WhatsApp</label>
                <p className="text-sm">N/A</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Provider Types</label>
                <div className="flex flex-wrap gap-1">
                  {provider?.typeAssignments?.map((assignment: TypeAssignment, index: number) => (
                    <Badge key={index} variant="outline">
                      {assignment.providerType?.name || 'Unknown'}
                    </Badge>
                  )) || <Badge variant="outline">Unknown</Badge>}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="text-sm">
                  <StatusBadge
                    status={
                      provider?.status === ProviderStatus.PENDING_APPROVAL
                        ? 'PENDING'
                        : provider?.status === ProviderStatus.TRIAL ||
                            provider?.status === ProviderStatus.TRIAL_EXPIRED ||
                            provider?.status === ProviderStatus.ACTIVE ||
                            provider?.status === ProviderStatus.PAYMENT_OVERDUE ||
                            provider?.status === ProviderStatus.CANCELLED
                          ? 'APPROVED'
                          : provider?.status === ProviderStatus.SUSPENDED
                            ? 'SUSPENDED'
                            : provider?.status === ProviderStatus.REJECTED
                              ? 'REJECTED'
                              : 'PENDING'
                    }
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Submitted</label>
                <p className="text-sm">
                  {provider?.createdAt ? new Date(provider.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="text-sm">
                  {provider?.updatedAt ? new Date(provider.updatedAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            {/* Services Offered */}
            {provider?.services && provider.services.length > 0 && (
              <div className="mt-6">
                <label className="text-sm font-medium text-muted-foreground">
                  Services Offered
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {provider.services.map((service: Service) => (
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
            <CardTitle className="flex items-center gap-2">
              Requirements Summary
              {allRequiredRequirementsApproved && (
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                >
                  All Requirements Met
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {approvedRequirements} of {totalRequirements} requirements approved
              {totalRequirements > 0 && (
                <span className="ml-2">
                  ({Math.round((approvedRequirements / totalRequirements) * 100)}% complete)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Overview */}
            {totalRequirements > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Completion Progress</span>
                  <span className="text-muted-foreground">
                    {Math.round((approvedRequirements / totalRequirements) * 100)}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                    style={{
                      width: `${Math.round((approvedRequirements / totalRequirements) * 100)}%`,
                    }}
                  ></div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="rounded-lg bg-green-50 p-2 text-center dark:bg-green-900/20">
                    <div className="font-semibold text-green-700 dark:text-green-300">
                      {requirements?.filter(
                        (req: RequirementSubmission) =>
                          req.status === RequirementsValidationStatus.APPROVED
                      ).length || 0}
                    </div>
                    <div className="text-green-600 dark:text-green-400">Approved</div>
                  </div>
                  <div className="rounded-lg bg-yellow-50 p-2 text-center dark:bg-yellow-900/20">
                    <div className="font-semibold text-yellow-700 dark:text-yellow-300">
                      {requirements?.filter(
                        (req: RequirementSubmission) =>
                          req.status === RequirementsValidationStatus.PENDING
                      ).length || 0}
                    </div>
                    <div className="text-yellow-600 dark:text-yellow-400">Pending</div>
                  </div>
                  <div className="rounded-lg bg-red-50 p-2 text-center dark:bg-red-900/20">
                    <div className="font-semibold text-red-700 dark:text-red-300">
                      {requirements?.filter(
                        (req: RequirementSubmission) =>
                          req.status === RequirementsValidationStatus.REJECTED
                      ).length || 0}
                    </div>
                    <div className="text-red-600 dark:text-red-400">Rejected</div>
                  </div>
                </div>
              </div>
            )}

            {/* Requirements List */}
            <div className="space-y-4">
              {totalRequirements === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <div className="mb-2">📋</div>
                  <h3 className="font-medium">No requirements submitted</h3>
                  <p className="text-sm">This provider has not submitted any requirements yet.</p>
                </div>
              ) : (
                requirements
                  ?.slice()
                  .sort((a: RequirementSubmission, b: RequirementSubmission) => {
                    // Sort by requirementType displayPriority to maintain consistent order
                    const priorityA = a.requirementType?.displayPriority ?? 999;
                    const priorityB = b.requirementType?.displayPriority ?? 999;
                    return priorityA - priorityB;
                  })
                  .map((submission: RequirementSubmission) => (
                    <RequirementSubmissionCard
                      key={submission.id}
                      submission={{
                        ...submission,
                        createdAt: submission.createdAt.toISOString(),
                        notes: submission.notes || undefined,
                        documentMetadata: submission.documentMetadata as Record<string, any> | null,
                      }}
                      isAdminView={true}
                      onApprove={() => handleApproveRequirement(submission.id)}
                      onReject={() =>
                        handleRejectRequirementClick(
                          submission.id,
                          submission.requirementType?.name || 'Requirement'
                        )
                      }
                      isApproving={
                        processingRequirementId === submission.id &&
                        approveRequirementMutation.isPending
                      }
                      isRejecting={
                        processingRequirementId === submission.id &&
                        rejectRequirementMutation.isPending
                      }
                    />
                  ))
              )}
            </div>

            {/* Action Note */}
            {totalRequirements > 0 && !allRequiredRequirementsApproved && (
              <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
                <div className="flex items-start gap-2">
                  <div className="text-amber-600 dark:text-amber-400">⚠️</div>
                  <div>
                    <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      Approval Pending
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      All requirements must be approved before this provider can be activated.
                      Review each requirement below and approve or reject them individually.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {allRequiredRequirementsApproved &&
              provider?.status === ProviderStatus.PENDING_APPROVAL && (
                <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                  <div className="flex items-start gap-2">
                    <div className="text-green-600 dark:text-green-400">✅</div>
                    <div>
                      <h4 className="text-sm font-medium text-green-800 dark:text-green-300">
                        Ready for Approval
                      </h4>
                      <p className="text-xs text-green-700 dark:text-green-400">
                        All requirements have been approved. This provider is ready for final
                        approval.
                      </p>
                    </div>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>

        {/* History */}
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
                      {provider.approvedById && ' by Admin'}
                    </p>
                  </div>
                </div>
              )}

              {provider?.rejectedAt && (
                <div className="flex items-center space-x-4 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-300">Provider Rejected</p>
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
                    {provider?.createdAt
                      ? new Date(provider.createdAt).toLocaleString()
                      : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
