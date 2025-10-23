/**
 * Core permission checking utilities and role hierarchy logic
 *
 * This module provides the core functionality for checking user permissions
 * across the platform, including role-based access control and context-aware
 * permission validation.
 */
import { UserRole as PrismaUserRole } from '@prisma/client';
import { Session } from 'next-auth';

import {
  getRolePermissions,
  isHigherOrganizationRole,
  isHigherSystemRole,
  roleHasPermission,
} from '@/lib/auth/roles';
import {
  OrganizationRole,
  Permission,
  PermissionCheck,
  PermissionContext,
  ProviderRole,
  SystemRole,
  UserPermissions,
} from '@/types/permissions';

/**
 * Extended session user interface with all possible fields
 *
 * Note: Only id and role are guaranteed to be in the session.
 * organizationRoles, providerRole, and providerId may be populated
 * separately via database queries when needed for permission checks.
 *
 * Uses PrismaUserRole to match NextAuth session type exactly.
 */
interface ExtendedSessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  role: PrismaUserRole; // Must match NextAuth session user type
  // Optional fields that might be populated from database
  organizationRoles?: Array<{
    organizationId: string;
    role: OrganizationRole;
  }>;
  providerRole?: ProviderRole;
  providerId?: string;
}

/**
 * Type guard to validate session user structure
 *
 * Performs runtime validation to ensure the user object has the
 * required fields and optional fields are properly typed.
 */
function isExtendedSessionUser(user: unknown): user is ExtendedSessionUser {
  if (typeof user !== 'object' || user === null) {
    return false;
  }

  const u = user as Record<string, unknown>;

  // Validate required fields
  if (typeof u.id !== 'string' || !u.id) {
    return false;
  }

  if (typeof u.role !== 'string' || !u.role) {
    return false;
  }

  // Validate optional fields when present
  if (u.email !== undefined && u.email !== null && typeof u.email !== 'string') {
    return false;
  }

  if (u.name !== undefined && u.name !== null && typeof u.name !== 'string') {
    return false;
  }

  if (u.organizationRoles !== undefined && !Array.isArray(u.organizationRoles)) {
    return false;
  }

  if (u.providerRole !== undefined && typeof u.providerRole !== 'string') {
    return false;
  }

  if (u.providerId !== undefined && typeof u.providerId !== 'string') {
    return false;
  }

  return true;
}

/**
 * Check if a user has a specific permission in the given context
 */
export function hasPermission(
  userPermissions: UserPermissions,
  permission: Permission,
  context?: PermissionContext
): boolean {
  // System-level permissions
  if (roleHasPermission(userPermissions.systemRole, permission)) {
    return true;
  }

  // Provider-level permissions
  if (userPermissions.providerRole && roleHasPermission(userPermissions.providerRole, permission)) {
    // Check provider context if required
    if (context?.providerId && userPermissions.providerId !== context.providerId) {
      return false;
    }
    return true;
  }

  // Organization-level permissions
  if (context?.organizationId) {
    const orgRole = userPermissions.organizationRoles.find(
      (role) => role.organizationId === context.organizationId
    );

    if (orgRole && roleHasPermission(orgRole.role, permission)) {
      return true;
    }
  } else {
    // Check if user has permission in any organization
    return userPermissions.organizationRoles.some((orgRole) =>
      roleHasPermission(orgRole.role, permission)
    );
  }

  return false;
}

/**
 * Check multiple permissions - can require all or any
 */
export function hasPermissions(
  userPermissions: UserPermissions,
  checks: PermissionCheck[]
): boolean {
  return checks.every((check) => {
    if (check.requireAll && Array.isArray(check.permission)) {
      return (check.permission as Permission[]).every((permission) =>
        hasPermission(userPermissions, permission, check.context)
      );
    }

    if (Array.isArray(check.permission)) {
      return (check.permission as Permission[]).some((permission) =>
        hasPermission(userPermissions, permission, check.context)
      );
    }

    return hasPermission(userPermissions, check.permission, check.context);
  });
}

/**
 * Check if user is system admin (ADMIN or SUPER_ADMIN)
 */
export function isSystemAdmin(userPermissions: UserPermissions): boolean {
  return (
    userPermissions.systemRole === SystemRole.ADMIN ||
    userPermissions.systemRole === SystemRole.SUPER_ADMIN
  );
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(userPermissions: UserPermissions): boolean {
  return userPermissions.systemRole === SystemRole.SUPER_ADMIN;
}

/**
 * Check if user is organization owner or admin
 */
export function isOrganizationAdmin(
  userPermissions: UserPermissions,
  organizationId: string
): boolean {
  const orgRole = userPermissions.organizationRoles.find(
    (role) => role.organizationId === organizationId
  );

  return orgRole?.role === OrganizationRole.OWNER || orgRole?.role === OrganizationRole.ADMIN;
}

/**
 * Check if user is provider
 */
export function isProvider(userPermissions: UserPermissions): boolean {
  return userPermissions.providerRole === ProviderRole.PROVIDER;
}

/**
 * Get user's role in specific organization
 */
export function getOrganizationRole(
  userPermissions: UserPermissions,
  organizationId: string
): OrganizationRole | null {
  const orgRole = userPermissions.organizationRoles.find(
    (role) => role.organizationId === organizationId
  );

  return orgRole?.role || null;
}

/**
 * Get all organization IDs where user has a specific role or higher
 */
export function getOrganizationsWithRole(
  userPermissions: UserPermissions,
  minimumRole: OrganizationRole
): string[] {
  return userPermissions.organizationRoles
    .filter(
      (orgRole) =>
        isHigherOrganizationRole(orgRole.role, minimumRole) || orgRole.role === minimumRole
    )
    .map((orgRole) => orgRole.organizationId);
}

/**
 * Check if user can manage another user in organization context
 */
export function canManageUser(
  managerPermissions: UserPermissions,
  targetUserPermissions: UserPermissions,
  organizationId?: string
): boolean {
  // Super admins can manage anyone
  if (isSuperAdmin(managerPermissions)) {
    return true;
  }

  // Admins can manage non-admins
  if (isSystemAdmin(managerPermissions) && !isSystemAdmin(targetUserPermissions)) {
    return true;
  }

  // Organization context management
  if (organizationId) {
    const managerRole = getOrganizationRole(managerPermissions, organizationId);
    const targetRole = getOrganizationRole(targetUserPermissions, organizationId);

    if (managerRole && targetRole) {
      return isHigherOrganizationRole(managerRole, targetRole);
    }

    // Manager has role but target doesn't
    if (managerRole && !targetRole) {
      return managerRole === OrganizationRole.OWNER || managerRole === OrganizationRole.ADMIN;
    }
  }

  return false;
}

/**
 * Extract user permissions from NextAuth session
 *
 * Uses type guard to safely extract permissions from the session.
 * Returns null if session is invalid or user doesn't have required fields.
 *
 * Note: organizationRoles, providerRole, and providerId are optional
 * and may need to be fetched separately from the database for full
 * permission checking. This function only extracts what's in the session.
 */
export function getUserPermissionsFromSession(session: Session | null): UserPermissions | null {
  if (!session?.user) {
    return null;
  }

  // Validate session user structure with type guard
  if (!isExtendedSessionUser(session.user)) {
    // Session user doesn't have required fields
    return null;
  }

  // Safe to access after type guard validation
  // Cast to ExtendedSessionUser to access optional fields
  const user = session.user as ExtendedSessionUser;

  return {
    systemRole: (user.role as SystemRole) || SystemRole.USER,
    organizationRoles: user.organizationRoles || [],
    providerRole: user.providerRole,
    providerId: user.providerId,
  };
}

/**
 * Permission validation error types
 */
export class PermissionError extends Error {
  constructor(
    message: string,
    public permission: Permission,
    public context?: PermissionContext
  ) {
    super(message);
    this.name = 'PermissionError';
  }
}

/**
 * Validate permission and throw error if not authorized
 */
export function requirePermission(
  userPermissions: UserPermissions,
  permission: Permission,
  context?: PermissionContext
): void {
  if (!hasPermission(userPermissions, permission, context)) {
    throw new PermissionError(
      `Access denied: Missing permission ${permission}`,
      permission,
      context
    );
  }
}

/**
 * Organization context switching utilities
 */
export function switchOrganizationContext(
  userPermissions: UserPermissions,
  organizationId: string
): PermissionContext | null {
  const hasAccess = userPermissions.organizationRoles.some(
    (role) => role.organizationId === organizationId
  );

  if (!hasAccess && !isSystemAdmin(userPermissions)) {
    return null;
  }

  return {
    organizationId,
    userId: undefined, // Will be set by session management
  };
}
