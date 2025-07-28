/**
 * TypeScript types for permissions and roles system
 *
 * Defines the comprehensive permission structure for the MedBookings platform
 * including system-level, organization-level, and provider-level roles and permissions.
 */

export enum SystemRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum OrganizationRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
}

export enum ProviderRole {
  PROVIDER = 'PROVIDER',
}

export type UserRole = SystemRole | OrganizationRole | ProviderRole;

export enum Permission {
  // System-level permissions
  MANAGE_PLATFORM = 'MANAGE_PLATFORM',
  APPROVE_PROVIDERS = 'APPROVE_PROVIDERS',
  APPROVE_ORGANIZATIONS = 'APPROVE_ORGANIZATIONS',
  ACCESS_ANY_ACCOUNT = 'ACCESS_ANY_ACCOUNT',
  MANAGE_ADMINS = 'MANAGE_ADMINS',

  // Organization permissions
  MANAGE_ORGANIZATION = 'MANAGE_ORGANIZATION',
  INVITE_MEMBERS = 'INVITE_MEMBERS',
  MANAGE_MEMBERS = 'MANAGE_MEMBERS',
  MANAGE_LOCATIONS = 'MANAGE_LOCATIONS',
  MANAGE_BILLING = 'MANAGE_BILLING',
  VIEW_ORGANIZATION = 'VIEW_ORGANIZATION',

  // Provider permissions
  MANAGE_PROVIDER_PROFILE = 'MANAGE_PROVIDER_PROFILE',
  MANAGE_AVAILABILITY = 'MANAGE_AVAILABILITY',
  MANAGE_SERVICES = 'MANAGE_SERVICES',
  VIEW_PROVIDER_ANALYTICS = 'VIEW_PROVIDER_ANALYTICS',

  // Calendar permissions
  CREATE_AVAILABILITY = 'CREATE_AVAILABILITY',
  PROPOSE_AVAILABILITY = 'PROPOSE_AVAILABILITY',
  MANAGE_BOOKINGS = 'MANAGE_BOOKINGS',

  // General permissions
  VIEW_PROFILE = 'VIEW_PROFILE',
  EDIT_PROFILE = 'EDIT_PROFILE',
}

export interface PermissionContext {
  organizationId?: string;
  providerId?: string;
  userId?: string;
}

export interface UserPermissions {
  systemRole: SystemRole;
  organizationRoles: Array<{
    organizationId: string;
    role: OrganizationRole;
  }>;
  providerRole?: ProviderRole;
  providerId?: string;
}

export interface PermissionCheck {
  permission: Permission;
  context?: PermissionContext;
  requireAll?: boolean; // For multiple permissions
}

export interface RoleHierarchy {
  role: UserRole;
  inherits: UserRole[];
  permissions: Permission[];
}

export interface SessionPermissions {
  user: {
    id: string;
    email: string;
  };
  permissions: UserPermissions;
  currentContext?: PermissionContext;
  lastUpdated: Date;
}
