import type { CalendarEventPermissions } from '@/features/calendar/types/modal';
import type { CalendarEvent } from '@/features/calendar/types/types';
import type { User } from '@prisma/client';

// Session user type (subset of full User)
type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
};

// Provider context permissions
export function getProviderCalendarPermissions(
  event: CalendarEvent | null,
  currentUser: SessionUser | null,
  currentProvider: any | null // Provider with relations
): CalendarEventPermissions {
  if (!event || !currentUser) {
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canAccept: false,
      canReject: false,
    };
  }

  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';
  const isProviderCreated = event.isProviderCreated;
  const isPending = event.status === 'PENDING';
  const isAccepted = event.status === 'ACCEPTED';

  return {
    canView: true,
    // Provider can edit their own provider-created availabilities always, or accepted org-created ones
    canEdit: isProviderCreated || (isAccepted && !isProviderCreated) || isAdmin,
    // Provider can delete their own provider-created availabilities always
    canDelete: isProviderCreated || isAdmin,
    // Provider can accept organization-proposed availabilities that are pending
    canAccept: !isProviderCreated && isPending,
    // Provider can reject organization-proposed availabilities that are pending
    canReject: !isProviderCreated && isPending,
  };
}

// Organization context permissions  
export function getOrganizationCalendarPermissions(
  event: CalendarEvent | null,
  currentUser: SessionUser | null,
  membership: any | null // OrganizationMembership with permissions
): CalendarEventPermissions {
  if (!event || !currentUser || !membership) {
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canAccept: false,
      canReject: false,
    };
  }

  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';
  const canManageAvailability = 
    membership.permissions?.includes('MANAGE_AVAILABILITY') || 
    ['OWNER', 'ADMIN'].includes(membership.role);
  
  const isOrganizationCreated = !event.isProviderCreated;
  const isPending = event.status === 'PENDING';

  return {
    canView: true,
    canEdit: (canManageAvailability && isOrganizationCreated) || isAdmin,
    canDelete: (canManageAvailability && isOrganizationCreated) || isAdmin,
    canAccept: false, // Organizations don't accept their own availability
    canReject: false, // Organizations don't reject their own availability
  };
}

// Admin context permissions (full access)
export function getAdminCalendarPermissions(
  event: CalendarEvent | null,
  currentUser: SessionUser | null
): CalendarEventPermissions {
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';
  
  return {
    canView: true,
    canEdit: isAdmin,
    canDelete: isAdmin,
    canAccept: isAdmin,
    canReject: isAdmin,
  };
}

// Helper to get action label based on context
export function getActionLabel(action: string, context: 'provider' | 'organization' | 'admin'): string {
  const labels: Record<string, Record<string, string>> = {
    provider: {
      accept: 'Accept Proposal',
      reject: 'Reject Proposal',
      edit: 'Edit Availability',
      delete: 'Delete Availability',
    },
    organization: {
      edit: 'Edit Availability',
      delete: 'Remove Availability',
    },
    admin: {
      accept: 'Force Accept',
      reject: 'Force Reject', 
      edit: 'Edit Availability',
      delete: 'Delete Availability',
    },
  };

  return labels[context]?.[action] || action.charAt(0).toUpperCase() + action.slice(1);
}