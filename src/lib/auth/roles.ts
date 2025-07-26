/**
 * Role definitions and constants for system, organization, and provider roles
 * 
 * This module defines the role hierarchy and permission mappings for the 
 * comprehensive user roles system.
 */

import {
  SystemRole,
  OrganizationRole,
  ProviderRole,
  Permission,
  RoleHierarchy,
  UserRole
} from '@/types/permissions';

/**
 * Role hierarchy definitions - roles inherit permissions from lower-level roles
 */
// System role hierarchies
export const SYSTEM_ROLE_HIERARCHIES: Record<SystemRole, RoleHierarchy> = {
  [SystemRole.SUPER_ADMIN]: {
    role: SystemRole.SUPER_ADMIN,
    inherits: [SystemRole.ADMIN, SystemRole.USER],
    permissions: [
      Permission.MANAGE_PLATFORM,
      Permission.APPROVE_PROVIDERS,
      Permission.APPROVE_ORGANIZATIONS,
      Permission.ACCESS_ANY_ACCOUNT,
      Permission.MANAGE_ADMINS
    ]
  },
  
  [SystemRole.ADMIN]: {
    role: SystemRole.ADMIN,
    inherits: [SystemRole.USER],
    permissions: [
      Permission.APPROVE_PROVIDERS,
      Permission.APPROVE_ORGANIZATIONS,
      Permission.ACCESS_ANY_ACCOUNT
    ]
  },
  
  [SystemRole.USER]: {
    role: SystemRole.USER,
    inherits: [],
    permissions: [
      Permission.VIEW_PROFILE,
      Permission.EDIT_PROFILE
    ]
  }
};

// Organization role hierarchies
export const ORGANIZATION_ROLE_HIERARCHIES: Record<OrganizationRole, RoleHierarchy> = {
  [OrganizationRole.OWNER]: {
    role: OrganizationRole.OWNER,
    inherits: [OrganizationRole.ADMIN, OrganizationRole.MANAGER, OrganizationRole.STAFF],
    permissions: [
      Permission.MANAGE_ORGANIZATION,
      Permission.MANAGE_BILLING,
      Permission.INVITE_MEMBERS,
      Permission.MANAGE_MEMBERS
    ]
  },
  
  [OrganizationRole.ADMIN]: {
    role: OrganizationRole.ADMIN,
    inherits: [OrganizationRole.MANAGER, OrganizationRole.STAFF],
    permissions: [
      Permission.INVITE_MEMBERS,
      Permission.MANAGE_MEMBERS,
      Permission.MANAGE_LOCATIONS
    ]
  },
  
  [OrganizationRole.MANAGER]: {
    role: OrganizationRole.MANAGER,
    inherits: [OrganizationRole.STAFF],
    permissions: [
      Permission.PROPOSE_AVAILABILITY,
      Permission.MANAGE_BOOKINGS
    ]
  },
  
  [OrganizationRole.STAFF]: {
    role: OrganizationRole.STAFF,
    inherits: [],
    permissions: [
      Permission.VIEW_ORGANIZATION
    ]
  }
};

// Provider role hierarchies
export const PROVIDER_ROLE_HIERARCHIES: Record<ProviderRole, RoleHierarchy> = {
  [ProviderRole.PROVIDER]: {
    role: ProviderRole.PROVIDER,
    inherits: [],
    permissions: [
      Permission.MANAGE_PROVIDER_PROFILE,
      Permission.MANAGE_AVAILABILITY,
      Permission.MANAGE_SERVICES,
      Permission.VIEW_PROVIDER_ANALYTICS,
      Permission.CREATE_AVAILABILITY
    ]
  }
};

/**
 * Get all permissions for a role including inherited permissions
 */
export function getRolePermissions(role: UserRole): Permission[] {
  let hierarchy: RoleHierarchy | undefined;
  
  // Find the role in the appropriate hierarchy
  if (Object.values(SystemRole).includes(role as SystemRole)) {
    hierarchy = SYSTEM_ROLE_HIERARCHIES[role as SystemRole];
  } else if (Object.values(OrganizationRole).includes(role as OrganizationRole)) {
    hierarchy = ORGANIZATION_ROLE_HIERARCHIES[role as OrganizationRole];
  } else if (Object.values(ProviderRole).includes(role as ProviderRole)) {
    hierarchy = PROVIDER_ROLE_HIERARCHIES[role as ProviderRole];
  }
  
  if (!hierarchy) return [];
  
  const permissions = new Set(hierarchy.permissions);
  
  // Add inherited permissions
  hierarchy.inherits.forEach(inheritedRole => {
    const inheritedPermissions = getRolePermissions(inheritedRole);
    inheritedPermissions.forEach(permission => permissions.add(permission));
  });
  
  return Array.from(permissions);
}

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = getRolePermissions(role);
  return permissions.includes(permission);
}

/**
 * Check if a role inherits from another role
 */
export function roleInheritsFrom(role: UserRole, inheritedRole: UserRole): boolean {
  let hierarchy: RoleHierarchy | undefined;
  
  // Find the role in the appropriate hierarchy
  if (Object.values(SystemRole).includes(role as SystemRole)) {
    hierarchy = SYSTEM_ROLE_HIERARCHIES[role as SystemRole];
  } else if (Object.values(OrganizationRole).includes(role as OrganizationRole)) {
    hierarchy = ORGANIZATION_ROLE_HIERARCHIES[role as OrganizationRole];
  } else if (Object.values(ProviderRole).includes(role as ProviderRole)) {
    hierarchy = PROVIDER_ROLE_HIERARCHIES[role as ProviderRole];
  }
  
  if (!hierarchy) return false;
  
  if (hierarchy.inherits.includes(inheritedRole)) return true;
  
  // Check recursive inheritance
  return hierarchy.inherits.some(parentRole => 
    roleInheritsFrom(parentRole, inheritedRole)
  );
}

/**
 * System role priority for hierarchy checking
 */
export const SYSTEM_ROLE_PRIORITY: Record<SystemRole, number> = {
  [SystemRole.USER]: 1,
  [SystemRole.ADMIN]: 2,
  [SystemRole.SUPER_ADMIN]: 3
};

/**
 * Organization role priority for hierarchy checking
 */
export const ORGANIZATION_ROLE_PRIORITY: Record<OrganizationRole, number> = {
  [OrganizationRole.STAFF]: 1,
  [OrganizationRole.MANAGER]: 2,
  [OrganizationRole.ADMIN]: 3,
  [OrganizationRole.OWNER]: 4
};

/**
 * Check if one system role is higher than another
 */
export function isHigherSystemRole(role1: SystemRole, role2: SystemRole): boolean {
  return SYSTEM_ROLE_PRIORITY[role1] > SYSTEM_ROLE_PRIORITY[role2];
}

/**
 * Check if one organization role is higher than another
 */
export function isHigherOrganizationRole(role1: OrganizationRole, role2: OrganizationRole): boolean {
  return ORGANIZATION_ROLE_PRIORITY[role1] > ORGANIZATION_ROLE_PRIORITY[role2];
}