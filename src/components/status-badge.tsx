'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          label: 'Pending',
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        };
      case 'APPROVED':
        return {
          label: 'Approved',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        };
      case 'REJECTED':
        return {
          label: 'Rejected',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        };
      case 'SUSPENDED':
        return {
          label: 'Suspended',
          variant: 'outline' as const,
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
        };
      default:
        return {
          label: status,
          variant: 'secondary' as const,
          className: '',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
