'use client';

import { Calendar } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CalendarConnectButtonProps {
  /**
   * Provider ID (for provider calendar integration)
   * Must provide either providerId OR organizationId (not both)
   */
  providerId?: string;
  /**
   * Organization ID (for organization calendar integration)
   * Must provide either providerId OR organizationId (not both)
   */
  organizationId?: string;
  /**
   * Location ID (optional, for location-specific organization integration)
   * Only used when organizationId is provided
   */
  locationId?: string;
  /**
   * Button variant
   */
  variant?: ButtonProps['variant'];
  /**
   * Button size
   */
  size?: ButtonProps['size'];
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Button text (optional, defaults to "Connect Google Calendar")
   */
  children?: React.ReactNode;
}

/**
 * CalendarConnectButton Component
 *
 * Button to initiate Google Calendar OAuth flow for providers or organizations.
 *
 * Features:
 * - Validates that either providerId OR organizationId is provided (not both)
 * - Redirects to appropriate OAuth endpoint
 * - Supports location-specific organization integrations
 * - Customizable appearance
 *
 * @example Provider Integration
 * ```tsx
 * <CalendarConnectButton providerId={provider.id} />
 * ```
 *
 * @example Organization Integration (org-wide)
 * ```tsx
 * <CalendarConnectButton organizationId={org.id} />
 * ```
 *
 * @example Organization Integration (location-specific)
 * ```tsx
 * <CalendarConnectButton
 *   organizationId={org.id}
 *   locationId={location.id}
 * />
 * ```
 */
export function CalendarConnectButton({
  providerId,
  organizationId,
  locationId,
  variant = 'default',
  size = 'default',
  className,
  children,
}: CalendarConnectButtonProps) {
  // Validation: Must provide exactly one of providerId or organizationId
  if (!providerId && !organizationId) {
    return null;
  }

  if (providerId && organizationId) {
    return null;
  }

  const handleConnect = () => {
    // Provider OAuth flow
    if (providerId) {
      const url = `/api/auth/google/calendar?providerId=${providerId}`;
      window.location.href = url;
      return;
    }

    // Organization OAuth flow
    if (organizationId) {
      let url = `/api/auth/google/organization-calendar?organizationId=${organizationId}`;
      if (locationId) {
        url += `&locationId=${locationId}`;
      }
      window.location.href = url;
      return;
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleConnect}
      className={cn('gap-2', className)}
    >
      <Calendar className="h-4 w-4" />
      {children || 'Connect Google Calendar'}
    </Button>
  );
}
