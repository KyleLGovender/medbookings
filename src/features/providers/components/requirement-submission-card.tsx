'use client';

import { Calendar, Check, FileText, X } from 'lucide-react';

import { StatusBadge } from '@/components/status-badge';
import { NavigationLink } from '@/components/ui/navigation-link';
import { extractFilenameFromUrl } from '@/lib/utils/document-utils';

interface RequirementSubmission {
  id: string;
  status?: string;
  createdAt: string;
  submittedAt?: string;
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
}

export function RequirementSubmissionCard({
  submission,
  showViewDocumentButton = true,
  className = '',
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

  return (
    <div className={`rounded-md border p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h3 className="text-sm font-medium">
            {submission.requirementType?.name || 'Requirement'}
            {submission.status && (
              <span className="ml-2">
                <StatusBadge status={submission.status} />
              </span>
            )}
          </h3>
        </div>
      </div>

      {submission.requirementType?.description && (
        <p className="mt-1 text-xs text-muted-foreground">
          {submission.requirementType.description}
        </p>
      )}

      {/* Display appropriate content based on validation type */}
      <div className="mt-4 rounded-md border bg-muted/40 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">{renderContent()}</div>

          {/* Show view document button only for document type */}
          {shouldShowViewButton && (
            <div className="flex gap-2">
              <NavigationLink
                href={submission.documentMetadata!.value}
                className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                View Document
              </NavigationLink>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}