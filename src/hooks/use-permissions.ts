/**
 * React hook for permission checking in components
 *
 * This hook provides a convenient way to check permissions in React components
 * and handle permission-based UI rendering.
 */
import { useMemo } from 'react';

import { useSession } from 'next-auth/react';

import { EnhancedSession } from '@/features/auth/lib/session-helper';
import {
  getOrganizationRole,
  getUserPermissionsFromSession,
  hasPermission,
  hasPermissions,
  isOrganizationAdmin,
  isProvider,
  isSuperAdmin,
  isSystemAdmin,
} from '@/lib/auth/permissions';
import {
  Permission,
  PermissionCheck,
  PermissionContext,
  UserPermissions,
} from '@/types/permissions';

export interface UsePermissionsReturn {
  // Core permission checking
  hasPermission: (permission: Permission, context?: PermissionContext) => boolean;
  hasPermissions: (checks: PermissionCheck[]) => boolean;

  // Role checking utilities
  isSystemAdmin: boolean;
  isSuperAdmin: boolean;
  isProvider: boolean;
  isOrganizationAdmin: (organizationId: string) => boolean;
  getOrganizationRole: (organizationId: string) => string | null;

  // Loading and error states
  isLoading: boolean;
  error: string | null;

  // Raw permissions for advanced use cases
  permissions: UserPermissions | null;

  // Session management
  refreshPermissions: () => void;
}

/**
 * Hook for checking user permissions in components
 */
export function usePermissions(context?: PermissionContext): UsePermissionsReturn {
  const {
    data: session,
    status,
    update,
  } = useSession() as {
    data: EnhancedSession | null;
    status: string;
    update: () => void;
  };

  const permissions = useMemo(() => {
    if (session?.permissions) {
      return session.permissions.permissions;
    }
    return getUserPermissionsFromSession(session);
  }, [session]);

  const isLoading = status === 'loading';
  const error = status === 'unauthenticated' ? 'Not authenticated' : null;

  // Core permission checking functions
  const checkPermission = (permission: Permission, permissionContext?: PermissionContext) => {
    if (!permissions) return false;
    return hasPermission(permissions, permission, permissionContext || context);
  };

  const checkPermissions = (checks: PermissionCheck[]) => {
    if (!permissions) return false;
    return hasPermissions(permissions, checks);
  };

  // Role checking utilities
  const roleChecks = useMemo(() => {
    if (!permissions) {
      return {
        isSystemAdmin: false,
        isSuperAdmin: false,
        isProvider: false,
      };
    }

    return {
      isSystemAdmin: isSystemAdmin(permissions),
      isSuperAdmin: isSuperAdmin(permissions),
      isProvider: isProvider(permissions),
    };
  }, [permissions]);

  const checkOrganizationAdmin = (organizationId: string) => {
    if (!permissions) return false;
    return isOrganizationAdmin(permissions, organizationId);
  };

  const getOrgRole = (organizationId: string) => {
    if (!permissions) return null;
    return getOrganizationRole(permissions, organizationId);
  };

  const refreshPermissions = () => {
    update();
  };

  return {
    hasPermission: checkPermission,
    hasPermissions: checkPermissions,
    isSystemAdmin: roleChecks.isSystemAdmin,
    isSuperAdmin: roleChecks.isSuperAdmin,
    isProvider: roleChecks.isProvider,
    isOrganizationAdmin: checkOrganizationAdmin,
    getOrganizationRole: getOrgRole,
    isLoading,
    error,
    permissions,
    refreshPermissions,
  };
}

/**
 * Hook for organization-specific permissions
 */
export function useOrganizationPermissions(organizationId: string) {
  const basePermissions = usePermissions({ organizationId });

  const organizationRole = basePermissions.getOrganizationRole(organizationId);
  const isAdmin = basePermissions.isOrganizationAdmin(organizationId);

  return {
    ...basePermissions,
    organizationRole,
    isAdmin,
    hasOrganizationPermission: (permission: Permission) =>
      basePermissions.hasPermission(permission, { organizationId }),
  };
}

/**
 * Hook for provider-specific permissions
 */
export function useProviderPermissions(providerId?: string) {
  const basePermissions = usePermissions({ providerId });

  const canManageProvider = basePermissions.hasPermission(Permission.MANAGE_PROVIDER_PROFILE, {
    providerId,
  });

  const canManageAvailability = basePermissions.hasPermission(Permission.MANAGE_AVAILABILITY, {
    providerId,
  });

  return {
    ...basePermissions,
    canManageProvider,
    canManageAvailability,
    hasProviderPermission: (permission: Permission) =>
      basePermissions.hasPermission(permission, { providerId }),
  };
}
