// =============================================================================
// ADMIN FEATURE TYPE GUARDS
// =============================================================================
// Runtime type validation for admin-specific types and API responses
import { isValidDateString, isValidEmail, isValidPhone, isValidUUID } from '@/types/guards';
import { UserRole } from '@prisma/client';
import { AdminActionType, AdminAction } from './types';

// =============================================================================
// ENUM GUARDS
// =============================================================================

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && Object.values(UserRole).includes(value as UserRole);
}

export function isAdminActionType(value: unknown): value is AdminActionType {
  // Use the AdminAction enum values to validate
  return typeof value === 'string' && Object.values(AdminAction).includes(value as any);
}

export function isEntityType(
  value: unknown
): value is 'USER' | 'PROVIDER' | 'ORGANIZATION' | 'LOCATION' | 'SERVICE' {
  return (
    typeof value === 'string' &&
    ['USER', 'PROVIDER', 'ORGANIZATION', 'LOCATION', 'SERVICE'].includes(value)
  );
}

export function isAuditActionType(
  value: unknown
): value is 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'SUSPEND' | 'LOGIN' | 'LOGOUT' {
  return (
    typeof value === 'string' &&
    ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'SUSPEND', 'LOGIN', 'LOGOUT'].includes(
      value
    )
  );
}

// =============================================================================
// USER MANAGEMENT GUARDS
// =============================================================================

export function isValidUserCreationData(value: unknown): value is {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'email' in value &&
    typeof (value as any).name === 'string' &&
    (value as any).name.length > 0 &&
    isValidEmail((value as any).email) &&
    (!(value as any).phone || isValidPhone((value as any).phone)) &&
    (!(value as any).role || isUserRole((value as any).role)) &&
    (!(value as any).isActive || typeof (value as any).isActive === 'boolean')
  );
}

export function isValidUserUpdateData(value: unknown): value is {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    isValidUUID((value as any).id) &&
    (!(value as any).name ||
      (typeof (value as any).name === 'string' && (value as any).name.length > 0)) &&
    (!(value as any).email || isValidEmail((value as any).email)) &&
    (!(value as any).phone || isValidPhone((value as any).phone)) &&
    (!(value as any).role || isUserRole((value as any).role)) &&
    (!(value as any).isActive || typeof (value as any).isActive === 'boolean')
  );
}

// =============================================================================
// ADMIN ACTION GUARDS
// =============================================================================

export function isValidAdminAction(value: unknown): value is {
  action: string;
  entityType: string;
  entityId: string;
  reason?: string;
  metadata?: Record<string, any>;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'action' in value &&
    'entityType' in value &&
    'entityId' in value &&
    isAdminActionType((value as any).action) &&
    isEntityType((value as any).entityType) &&
    isValidUUID((value as any).entityId) &&
    (!(value as any).reason || typeof (value as any).reason === 'string') &&
    (!(value as any).metadata || typeof (value as any).metadata === 'object')
  );
}

export function isValidBulkAdminAction(value: unknown): value is {
  action: string;
  entityType: string;
  entityIds: string[];
  reason?: string;
  confirmBulkAction: boolean;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'action' in value &&
    'entityType' in value &&
    'entityIds' in value &&
    'confirmBulkAction' in value &&
    isAdminActionType((value as any).action) &&
    isEntityType((value as any).entityType) &&
    Array.isArray((value as any).entityIds) &&
    (value as any).entityIds.length > 0 &&
    (value as any).entityIds.every((id: unknown) => isValidUUID(id)) &&
    typeof (value as any).confirmBulkAction === 'boolean' &&
    (value as any).confirmBulkAction === true &&
    (!(value as any).reason || typeof (value as any).reason === 'string')
  );
}

// =============================================================================
// AUDIT LOG GUARDS
// =============================================================================

export function isValidAuditLogEntry(value: unknown): value is {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'userId' in value &&
    'action' in value &&
    'entityType' in value &&
    'entityId' in value &&
    'timestamp' in value &&
    isValidUUID((value as any).id) &&
    isValidUUID((value as any).userId) &&
    isAuditActionType((value as any).action) &&
    isEntityType((value as any).entityType) &&
    isValidUUID((value as any).entityId) &&
    isValidDateString((value as any).timestamp) &&
    (!(value as any).details || typeof (value as any).details === 'object') &&
    (!(value as any).ipAddress || typeof (value as any).ipAddress === 'string') &&
    (!(value as any).userAgent || typeof (value as any).userAgent === 'string')
  );
}

export function isValidAuditLogFilter(value: unknown): value is {
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  ipAddress?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    (!(value as any).userId || isValidUUID((value as any).userId)) &&
    (!(value as any).action || isAuditActionType((value as any).action)) &&
    (!(value as any).entityType || isEntityType((value as any).entityType)) &&
    (!(value as any).entityId || isValidUUID((value as any).entityId)) &&
    (!(value as any).startDate || isValidDateString((value as any).startDate)) &&
    (!(value as any).endDate || isValidDateString((value as any).endDate)) &&
    (!(value as any).ipAddress || typeof (value as any).ipAddress === 'string')
  );
}

// =============================================================================
// SYSTEM CONFIGURATION GUARDS
// =============================================================================

export function isValidSystemConfig(value: unknown): value is {
  key: string;
  value: string | number | boolean | null;
  description?: string;
  isPublic?: boolean;
  category?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'key' in value &&
    'value' in value &&
    typeof (value as any).key === 'string' &&
    (value as any).key.length > 0 &&
    ((value as any).value === null ||
      typeof (value as any).value === 'string' ||
      typeof (value as any).value === 'number' ||
      typeof (value as any).value === 'boolean') &&
    (!(value as any).description || typeof (value as any).description === 'string') &&
    (!(value as any).isPublic || typeof (value as any).isPublic === 'boolean') &&
    (!(value as any).category || typeof (value as any).category === 'string')
  );
}

export function isValidSystemConfigUpdate(value: unknown): value is {
  key: string;
  value: string | number | boolean | null;
  description?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'key' in value &&
    'value' in value &&
    typeof (value as any).key === 'string' &&
    (value as any).key.length > 0 &&
    ((value as any).value === null ||
      typeof (value as any).value === 'string' ||
      typeof (value as any).value === 'number' ||
      typeof (value as any).value === 'boolean') &&
    (!(value as any).description || typeof (value as any).description === 'string')
  );
}

// =============================================================================
// ANALYTICS AND METRICS GUARDS
// =============================================================================

export function isValidMetricsFilter(value: unknown): value is {
  startDate?: string;
  endDate?: string;
  entityType?: string;
  granularity?: 'hour' | 'day' | 'week' | 'month';
  groupBy?: string[];
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    (!(value as any).startDate || isValidDateString((value as any).startDate)) &&
    (!(value as any).endDate || isValidDateString((value as any).endDate)) &&
    (!(value as any).entityType || isEntityType((value as any).entityType)) &&
    (!(value as any).granularity ||
      ['hour', 'day', 'week', 'month'].includes((value as any).granularity)) &&
    (!(value as any).groupBy ||
      (Array.isArray((value as any).groupBy) &&
        (value as any).groupBy.every((field: unknown) => typeof field === 'string')))
  );
}

export function isValidSystemMetrics(value: unknown): value is {
  totalUsers: number;
  activeUsers: number;
  totalProviders: number;
  activeProviders: number;
  totalOrganizations: number;
  activeOrganizations: number;
  totalBookings: number;
  recentBookings: number;
  systemLoad: number;
  uptime: number;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'totalUsers' in value &&
    'activeUsers' in value &&
    'totalProviders' in value &&
    'activeProviders' in value &&
    'totalOrganizations' in value &&
    'activeOrganizations' in value &&
    'totalBookings' in value &&
    'recentBookings' in value &&
    'systemLoad' in value &&
    'uptime' in value &&
    typeof (value as any).totalUsers === 'number' &&
    typeof (value as any).activeUsers === 'number' &&
    typeof (value as any).totalProviders === 'number' &&
    typeof (value as any).activeProviders === 'number' &&
    typeof (value as any).totalOrganizations === 'number' &&
    typeof (value as any).activeOrganizations === 'number' &&
    typeof (value as any).totalBookings === 'number' &&
    typeof (value as any).recentBookings === 'number' &&
    typeof (value as any).systemLoad === 'number' &&
    typeof (value as any).uptime === 'number' &&
    (value as any).totalUsers >= 0 &&
    (value as any).activeUsers >= 0 &&
    (value as any).totalProviders >= 0 &&
    (value as any).activeProviders >= 0 &&
    (value as any).totalOrganizations >= 0 &&
    (value as any).activeOrganizations >= 0 &&
    (value as any).totalBookings >= 0 &&
    (value as any).recentBookings >= 0 &&
    (value as any).systemLoad >= 0 &&
    (value as any).uptime >= 0
  );
}

// =============================================================================
// NOTIFICATION AND COMMUNICATION GUARDS
// =============================================================================

export function isValidAdminNotification(value: unknown): value is {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'type' in value &&
    'title' in value &&
    'message' in value &&
    'priority' in value &&
    'isRead' in value &&
    'createdAt' in value &&
    isValidUUID((value as any).id) &&
    ['info', 'warning', 'error', 'success'].includes((value as any).type) &&
    typeof (value as any).title === 'string' &&
    (value as any).title.length > 0 &&
    typeof (value as any).message === 'string' &&
    (value as any).message.length > 0 &&
    ['low', 'medium', 'high', 'critical'].includes((value as any).priority) &&
    typeof (value as any).isRead === 'boolean' &&
    isValidDateString((value as any).createdAt) &&
    (!(value as any).expiresAt || isValidDateString((value as any).expiresAt))
  );
}

export function isValidBroadcastMessage(value: unknown): value is {
  title: string;
  message: string;
  recipientType: 'all' | 'users' | 'providers' | 'organizations' | 'admins';
  recipientIds?: string[];
  scheduledAt?: string;
  expiresAt?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'title' in value &&
    'message' in value &&
    'recipientType' in value &&
    typeof (value as any).title === 'string' &&
    (value as any).title.length > 0 &&
    typeof (value as any).message === 'string' &&
    (value as any).message.length > 0 &&
    ['all', 'users', 'providers', 'organizations', 'admins'].includes(
      (value as any).recipientType
    ) &&
    (!(value as any).recipientIds ||
      (Array.isArray((value as any).recipientIds) &&
        (value as any).recipientIds.every((id: unknown) => isValidUUID(id)))) &&
    (!(value as any).scheduledAt || isValidDateString((value as any).scheduledAt)) &&
    (!(value as any).expiresAt || isValidDateString((value as any).expiresAt))
  );
}

// =============================================================================
// MIGRATION NOTES - API RESPONSE GUARDS REMOVED
// =============================================================================
//
// API response guards for server data structures have been removed as part of
// the dual-source type safety architecture migration. These validated server
// response shapes that are now handled by tRPC's automatic type inference.
//
// Removed guards:
// - isUserListResponse (server data validation)
// - isAuditLogListResponse (server data validation)  
// - isSystemConfigListResponse (server data validation)
//
// Domain logic guards (enum validation, user input validation, etc.) remain
// below as they represent client-side business logic validation.

// =============================================================================
// SEARCH AND FILTER GUARDS
// =============================================================================

export function isValidAdminSearchParams(value: unknown): value is {
  query?: string;
  entityType?: string;
  status?: string;
  role?: string;
  dateRange?: { start: string; end: string };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    (!(value as any).query || typeof (value as any).query === 'string') &&
    (!(value as any).entityType || isEntityType((value as any).entityType)) &&
    (!(value as any).status || typeof (value as any).status === 'string') &&
    (!(value as any).role || isUserRole((value as any).role)) &&
    (!(value as any).dateRange ||
      (typeof (value as any).dateRange === 'object' &&
        (value as any).dateRange !== null &&
        'start' in (value as any).dateRange &&
        'end' in (value as any).dateRange &&
        isValidDateString((value as any).dateRange.start) &&
        isValidDateString((value as any).dateRange.end))) &&
    (!(value as any).sortBy || typeof (value as any).sortBy === 'string') &&
    (!(value as any).sortOrder || ['asc', 'desc'].includes((value as any).sortOrder)) &&
    (!(value as any).page ||
      (typeof (value as any).page === 'number' && (value as any).page > 0)) &&
    (!(value as any).limit ||
      (typeof (value as any).limit === 'number' && (value as any).limit > 0))
  );
}
