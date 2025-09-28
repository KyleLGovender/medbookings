'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  className?: string;
  validationType?: string; // For requirement-specific status display
}

export function StatusBadge({ status, className, validationType }: StatusBadgeProps) {
  const getStatusConfig = (status: string, validationType?: string) => {
    // Provide context-specific labels for requirement validation
    const getLabel = (status: string) => {
      if (validationType) {
        switch (status) {
          case 'PENDING':
            return validationType === 'DOCUMENT' ? 'Document Pending' : 'Pending Review';
          case 'APPROVED':
            return validationType === 'DOCUMENT' ? 'Document Approved' : 'Approved';
          case 'REJECTED':
            return validationType === 'DOCUMENT' ? 'Document Rejected' : 'Rejected';
          default:
            return status;
        }
      }

      // Default labels for non-requirement contexts
      switch (status) {
        case 'PENDING':
          return 'Pending';
        case 'APPROVED':
          return 'Approved';
        case 'REJECTED':
          return 'Rejected';
        case 'SUSPENDED':
          return 'Suspended';
        default:
          return status;
      }
    };

    switch (status) {
      case 'PENDING':
        return {
          label: getLabel(status),
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        };
      case 'APPROVED':
        return {
          label: getLabel(status),
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        };
      case 'REJECTED':
        return {
          label: getLabel(status),
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        };
      case 'SUSPENDED':
        return {
          label: getLabel(status),
          variant: 'outline' as const,
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
        };
      default:
        return {
          label: getLabel(status),
          variant: 'secondary' as const,
          className: '',
        };
    }
  };

  const config = getStatusConfig(status, validationType);

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
