// Removed unused import - OrganizationBillingModel validation now handled in tRPC procedure
import { OrganizationRole } from '@prisma/client';

import { OrganizationRegistrationData } from '@/features/organizations/types/types';
import { getCurrentUser } from '@/lib/auth';
import { logger, sanitizeEmail } from '@/lib/logger';
import { addMilliseconds, nowUTC } from '@/lib/timezone';

/**
 * Validates organization registration data and handles business logic
 * @param data Organization registration data
 * @returns Minimal metadata for tRPC procedure to use
 */
export async function registerOrganization(
  data: OrganizationRegistrationData
): Promise<
  | { success: false; error: string }
  | { success: true; userId: string; validatedData: OrganizationRegistrationData }
> {
  const currentUser = await getCurrentUser();
  if (!currentUser || !currentUser.id) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    // Business validations only
    if (!data.organization.name || data.organization.name.trim().length === 0) {
      return { success: false, error: 'Organization name is required' };
    }

    if (data.locations && data.locations.length > 10) {
      return { success: false, error: 'Maximum 10 locations allowed per organization' };
    }

    // Email sent in tRPC procedure (see organizations.ts:create)
    // Server actions return metadata only per CLAUDE.md architecture

    // Return minimal metadata for tRPC procedure to create organization
    return {
      success: true,
      userId: currentUser.id,
      validatedData: data,
    };
  } catch (error) {
    logger.error('Organization registration validation error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: 'Failed to validate organization data. Please try again.',
    };
  }
}

// =============================================================================
// MEMBER MANAGEMENT BUSINESS LOGIC
// =============================================================================
// Business logic functions that return minimal metadata for tRPC procedures

export interface MemberManagementResult {
  success: boolean;
  message: string;
  error?: string;
  data?: {
    currentUserId?: string;
    currentUserEmail?: string;
  };
}

/**
 * Validates member invitation data and handles business logic
 * @param invitationData The invitation data to validate
 * @returns Minimal metadata for tRPC procedure to use
 */
export async function validateMemberInvitation(invitationData: {
  email: string;
  role: string;
  organizationId: string;
  message?: string;
}): Promise<MemberManagementResult & { invitationToken?: string; expiresAt?: Date }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, message: 'Not authenticated' };
    }

    const { email, role, organizationId } = invitationData;

    // Validate inputs
    if (!email || !role || !organizationId) {
      return { success: false, message: 'Missing required fields' };
    }

    const validRoles = Object.values(OrganizationRole);
    if (!validRoles.includes(role as OrganizationRole)) {
      return { success: false, message: 'Invalid role specified' };
    }

    // Generate invitation token and expiry
    const invitationToken = crypto.randomUUID();
    const expiresAt = addMilliseconds(nowUTC(), 7 * 24 * 60 * 60 * 1000); // 7 days

    // Email sent in tRPC procedure (see organizations.ts:inviteMember)
    // Server actions return metadata only per CLAUDE.md architecture

    return {
      success: true,
      message: 'Invitation validated successfully',
      data: { currentUserId: currentUser.id },
      invitationToken,
      expiresAt,
    };
  } catch (error) {
    logger.error('Member invitation validation error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      message: 'Failed to validate invitation data',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validates invitation acceptance and handles business logic
 * @param token The invitation token
 * @returns Minimal metadata for tRPC procedure to use
 */
export async function validateInvitationAcceptance(token: string): Promise<MemberManagementResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, message: 'Not authenticated' };
    }

    if (!token || token.trim().length === 0) {
      return { success: false, message: 'Invalid invitation token' };
    }

    // Email sent in tRPC procedure (see organizations.ts:acceptInvitation)
    // Server actions return metadata only per CLAUDE.md architecture

    return {
      success: true,
      message: 'Invitation acceptance validated',
      data: {
        currentUserId: currentUser.id,
        currentUserEmail: currentUser.email ?? undefined,
      },
    };
  } catch (error) {
    logger.error('Invitation acceptance validation error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      message: 'Failed to validate invitation acceptance',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validates invitation rejection and handles business logic
 * @param token The invitation token
 * @returns Minimal metadata for tRPC procedure to use
 */
export async function validateInvitationRejection(token: string): Promise<MemberManagementResult> {
  try {
    if (!token || token.trim().length === 0) {
      return { success: false, message: 'Invalid invitation token' };
    }

    // Email sent in tRPC procedure (see organizations.ts:rejectInvitation)
    // Server actions return metadata only per CLAUDE.md architecture

    return {
      success: true,
      message: 'Invitation rejection validated',
    };
  } catch (error) {
    logger.error('Invitation rejection validation error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      message: 'Failed to validate invitation rejection',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validates member role change and handles business logic
 * @param organizationId Organization ID
 * @param memberId Member ID
 * @param newRole New role to assign
 * @returns Minimal metadata for tRPC procedure to use
 */
export async function validateMemberRoleChange(
  organizationId: string,
  memberId: string,
  newRole: string
): Promise<MemberManagementResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, message: 'Not authenticated' };
    }

    // Validate inputs
    if (!organizationId || !memberId || !newRole) {
      return { success: false, message: 'Missing required fields' };
    }

    const validRoles = Object.values(OrganizationRole);
    if (!validRoles.includes(newRole as OrganizationRole)) {
      return { success: false, message: 'Invalid role specified' };
    }

    // Email sent in tRPC procedure (see organizations.ts:changeMemberRole)
    // Server actions return metadata only per CLAUDE.md architecture

    return {
      success: true,
      message: 'Role change validated',
      data: { currentUserId: currentUser.id },
    };
  } catch (error) {
    logger.error('Member role change validation error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      message: 'Failed to validate role change',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validates member removal and handles business logic
 * @param organizationId Organization ID
 * @param memberId Member ID
 * @returns Minimal metadata for tRPC procedure to use
 */
export async function validateMemberRemoval(
  organizationId: string,
  memberId: string
): Promise<MemberManagementResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, message: 'Not authenticated' };
    }

    // Validate inputs
    if (!organizationId || !memberId) {
      return { success: false, message: 'Missing required fields' };
    }

    // Email sent in tRPC procedure (see organizations.ts:removeMember)
    // Server actions return metadata only per CLAUDE.md architecture

    return {
      success: true,
      message: 'Member removal validated',
      data: { currentUserId: currentUser.id },
    };
  } catch (error) {
    logger.error('Member removal validation error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      message: 'Failed to validate member removal',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validates invitation cancellation and handles business logic
 * @param organizationId Organization ID
 * @param invitationId Invitation ID
 * @returns Minimal metadata for tRPC procedure to use
 */
export async function validateInvitationCancellation(
  organizationId: string,
  invitationId: string
): Promise<MemberManagementResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, message: 'Not authenticated' };
    }

    // Validate inputs
    if (!organizationId || !invitationId) {
      return { success: false, message: 'Missing required fields' };
    }

    // Email sent in tRPC procedure (see organizations.ts:cancelMemberInvitation)
    // Server actions return metadata only per CLAUDE.md architecture

    return {
      success: true,
      message: 'Invitation cancellation validated',
      data: { currentUserId: currentUser.id },
    };
  } catch (error) {
    logger.error('Invitation cancellation validation error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      message: 'Failed to validate invitation cancellation',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
