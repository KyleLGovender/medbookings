'use client';

import { Calendar, Check, FileText, Info, X } from 'lucide-react';

import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { NavigationLink } from '@/components/ui/navigation-link';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { extractFilenameFromUrl } from '@/lib/utils/document-utils';

interface RequirementSubmission {
  id: string;
  status?: string;
  createdAt: string;
  submittedAt?: string;
  adminNotes?: string;
  rejectionReason?: string;
  notes?: string;
  documentMetadata?: {
    value?: any;
  };
  requirementType?: {
    name?: string;
    description?: string;
    validationType?: string;
    required?: boolean;
  };
}

interface RequirementSubmissionCardProps {
  submission: RequirementSubmission;
  showViewDocumentButton?: boolean;
  className?: string;
  // Admin approval props
  isAdminView?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  isApproving?: boolean;
  isRejecting?: boolean;
}

export function RequirementSubmissionCard({
  submission,
  showViewDocumentButton = true,
  className = '',
  isAdminView = false,
  onApprove,
  onReject,
  isApproving = false,
  isRejecting = false,
}: RequirementSubmissionCardProps) {
  const renderContent = () => {
    const validationType = submission.requirementType?.validationType;
    const value = submission.documentMetadata?.value;

    if (validationType === 'DOCUMENT') {
      return (
        <>
          <FileText className="h-5 w-5 text-primary" />
          <div>
            {value ? (
              <>
                <p className="font-medium">{extractFilenameFromUrl(value)}</p>
                <p className="text-xs text-muted-foreground">
                  Submitted: {new Date(submission.createdAt).toLocaleDateString()}
                </p>
              </>
            ) : (
              <p className="font-medium">No document uploaded</p>
            )}
          </div>
        </>
      );
    }

    if (validationType === 'BOOLEAN') {
      const isTrue = value === 'true' || value === true;
      return (
        <>
          {isTrue ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : (
            <X className="h-5 w-5 text-red-500" />
          )}
          <div>
            <p className="font-medium">{isTrue ? 'Yes' : 'No'}</p>
            <p className="text-xs text-muted-foreground">
              Submitted: {new Date(submission.createdAt).toLocaleDateString()}
            </p>
          </div>
        </>
      );
    }

    if (validationType?.includes('DATE')) {
      return (
        <>
          <Calendar className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">
              {value ? new Date(value.toString()).toLocaleDateString() : 'No date provided'}
            </p>
            <p className="text-xs text-muted-foreground">
              Submitted: {new Date(submission.createdAt).toLocaleDateString()}
            </p>
          </div>
        </>
      );
    }

    // Default case for text or other types
    return (
      <>
        <FileText className="h-5 w-5 text-primary" />
        <div>
          <p className="font-medium">{value?.toString() || 'No value provided'}</p>
          <p className="text-xs text-muted-foreground">
            Submitted: {new Date(submission.createdAt).toLocaleDateString()}
          </p>
        </div>
      </>
    );
  };

  const shouldShowViewButton =
    showViewDocumentButton &&
    submission.requirementType?.validationType === 'DOCUMENT' &&
    submission.documentMetadata?.value;

  const shouldShowPendingButtons =
    isAdminView && submission.status === 'PENDING' && onApprove && onReject;

  const shouldShowReapproveButton =
    isAdminView &&
    (submission.status === 'REJECTED' || submission.status?.includes('REJECT')) &&
    onApprove;

  const shouldShowStatusBadge =
    submission.status &&
    (submission.status === 'APPROVED' ||
      submission.status === 'REJECTED' ||
      submission.status?.includes('REJECT') ||
      submission.status?.includes('APPROV') ||
      submission.status === 'PENDING');

  return (
    <div className={`rounded-md border p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h3 className="text-sm font-medium">
            {submission.requirementType?.name || 'Requirement'}
          </h3>
        </div>
      </div>

      {submission.requirementType?.description && (
        <p className="mt-1 text-xs text-muted-foreground">
          {submission.requirementType.description}
        </p>
      )}

      {/* Admin Notes */}
      {submission.adminNotes && (
        <div className="mt-2 rounded-md bg-green-50 p-2 dark:bg-green-900/20">
          <div className="flex items-center gap-1 text-xs font-medium text-green-800 dark:text-green-300">
            <span>📝</span>
            Admin Notes:
          </div>
          <p className="mt-1 text-xs text-green-700 dark:text-green-400">{submission.adminNotes}</p>
        </div>
      )}

      {/* Display appropriate content based on validation type */}
      <div className="mt-4 rounded-md border bg-muted/40 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">{renderContent()}</div>

          {/* Show action buttons and status */}
          {(shouldShowViewButton ||
            shouldShowPendingButtons ||
            shouldShowReapproveButton ||
            shouldShowStatusBadge) && (
            <div className="flex items-center gap-2">
              {/* Approved/Rejected requirements: Show status badge first */}
              {shouldShowStatusBadge && (
                <div className="flex items-center gap-1">
                  <div className="scale-110">
                    <StatusBadge status={submission.status} />
                  </div>
                  {/* Show rejection details icon for rejected requirements */}
                  {(submission.status === 'REJECTED' || submission.status?.includes('REJECT')) && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                          title="View rejection reason"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="end">
                        <div className="space-y-2">
                          <h4 className="font-medium text-red-800">Rejection Details</h4>
                          {submission.rejectionReason ? (
                            <p className="text-sm text-red-700">{submission.rejectionReason}</p>
                          ) : submission.notes ? (
                            <p className="text-sm text-red-700">{submission.notes}</p>
                          ) : submission.adminNotes ? (
                            <p className="text-sm text-red-700">{submission.adminNotes}</p>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-sm text-red-700">
                                No rejection reason was provided when this requirement was rejected.
                              </p>
                              <p className="text-xs text-red-600">
                                This requirement can be re-approved by clicking the Re-approve
                                button.
                              </p>
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              )}

              {shouldShowViewButton && (
                <NavigationLink
                  href={submission.documentMetadata!.value}
                  className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  View Document
                </NavigationLink>
              )}

              {/* Pending requirements: Show both Approve and Reject buttons */}
              {shouldShowPendingButtons && (
                <>
                  <Button
                    onClick={onApprove}
                    disabled={isApproving || isRejecting}
                    size="sm"
                    className="h-8 bg-green-600 px-3 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {isApproving ? 'Approving...' : 'Approve'}
                  </Button>
                  <Button
                    onClick={onReject}
                    disabled={isApproving || isRejecting}
                    variant="destructive"
                    size="sm"
                    className="h-8 px-3 text-xs disabled:opacity-50"
                  >
                    {isRejecting ? 'Rejecting...' : 'Reject'}
                  </Button>
                </>
              )}

              {/* Rejected requirements: Show only Re-approve button */}
              {shouldShowReapproveButton && (
                <Button
                  onClick={onApprove}
                  disabled={isApproving}
                  size="sm"
                  className="h-8 bg-green-600 px-3 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {isApproving ? 'Re-approving...' : 'Re-approve'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
