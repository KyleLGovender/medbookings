/**
 * Admin override actions for accessing any account
 * 
 * Secure system for administrators to temporarily access and manage
 * any user account for support and dispute resolution purposes.
 */

'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, invalidateUserPermissions } from '@/features/auth/lib/session-helper';
import { requirePermission } from '@/lib/auth/permissions';
import { Permission } from '@/types/permissions';

export interface OverrideSession {
  originalAdminId: string;
  targetUserId: string;
  targetUserEmail: string;
  reason: string;
  startedAt: Date;
  expiresAt: Date;
}

export interface OverrideResult {
  success: boolean;
  message: string;
  error?: string;
  redirectUrl?: string;
}

/**
 * Initiate admin override to access another user's account
 */
export async function initiateAccountOverride(
  targetUserEmail: string,
  reason: string,
  durationMinutes: number = 30
): Promise<OverrideResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, message: 'Not authenticated' };
    }
    
    // Only super admins can override accounts
    requirePermission(currentUser.permissions, Permission.ACCESS_ANY_ACCOUNT);
    
    if (!reason.trim()) {
      return { success: false, message: 'Override reason is required' };
    }
    
    if (durationMinutes < 5 || durationMinutes > 120) {
      return { success: false, message: 'Duration must be between 5 and 120 minutes' };
    }
    
    // Find target user
    const targetUser = await prisma.user.findUnique({
      where: { email: targetUserEmail.toLowerCase() },
      include: {
        serviceProvider: true,
        organizationMemberships: {
          include: { organization: true }
        }
      }
    });
    
    if (!targetUser) {
      return { success: false, message: 'Target user not found' };
    }
    
    // Cannot override another admin's account
    if (targetUser.role === 'ADMIN' || targetUser.role === 'SUPER_ADMIN') {
      return { 
        success: false, 
        message: 'Cannot override administrator accounts' 
      };
    }
    
    // Check for existing active override
    const existingOverride = await getActiveOverride(currentUser.user.id);
    if (existingOverride) {
      return { 
        success: false, 
        message: 'You already have an active account override session' 
      };
    }
    
    // Create override session
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
    const overrideSession: OverrideSession = {
      originalAdminId: currentUser.user.id,
      targetUserId: targetUser.id,
      targetUserEmail: targetUser.email,
      reason,
      startedAt: new Date(),
      expiresAt
    };
    
    // Store in session/cache (in production, use secure session storage)
    await storeOverrideSession(currentUser.user.id, overrideSession);
    
    // Log the override action
    await logOverrideAction(
      currentUser.user.id,
      'INITIATE_OVERRIDE',
      `Started override session for ${targetUserEmail}: ${reason}`,
      {
        targetUserId: targetUser.id,
        targetUserEmail,
        reason,
        durationMinutes
      }
    );
    
    // Invalidate current session permissions to force reload
    await invalidateUserPermissions(currentUser.user.email);
    
    // Determine redirect URL based on user type
    let redirectUrl = '/profile';
    if (targetUser.serviceProvider) {
      redirectUrl = `/providers/${targetUser.serviceProvider.id}`;
    } else if (targetUser.organizationMemberships.length > 0) {
      redirectUrl = `/organizations/${targetUser.organizationMemberships[0].organizationId}`;
    }
    
    return {
      success: true,
      message: `Override session started for ${targetUserEmail}`,
      redirectUrl
    };
  } catch (error) {
    console.error('Error initiating account override:', error);
    return {
      success: false,
      message: 'Failed to initiate account override',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * End current admin override session
 */
export async function endAccountOverride(): Promise<OverrideResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, message: 'Not authenticated' };
    }
    
    const overrideSession = await getActiveOverride(currentUser.user.id);
    if (!overrideSession) {
      return { success: false, message: 'No active override session found' };
    }
    
    // Remove override session
    await removeOverrideSession(currentUser.user.id);
    
    // Log the end of override
    await logOverrideAction(
      overrideSession.originalAdminId,
      'END_OVERRIDE',
      `Ended override session for ${overrideSession.targetUserEmail}`,
      {
        targetUserId: overrideSession.targetUserId,
        targetUserEmail: overrideSession.targetUserEmail,
        duration: Date.now() - overrideSession.startedAt.getTime()
      }
    );
    
    // Invalidate session permissions
    await invalidateUserPermissions(currentUser.user.email);
    
    return {
      success: true,
      message: 'Override session ended',
      redirectUrl: '/admin'
    };
  } catch (error) {
    console.error('Error ending account override:', error);
    return {
      success: false,
      message: 'Failed to end account override',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get current active override session for admin
 */
export async function getActiveOverride(adminId: string): Promise<OverrideSession | null> {
  try {
    // In production, retrieve from secure session storage (Redis, etc.)
    const stored = overrideSessions.get(adminId);
    if (!stored) return null;
    
    // Check if expired
    if (stored.expiresAt < new Date()) {
      overrideSessions.delete(adminId);
      return null;
    }
    
    return stored;
  } catch (error) {
    console.error('Error getting active override:', error);
    return null;
  }
}

/**
 * Check if current session is an override and get details
 */
export async function getCurrentOverrideSession(): Promise<OverrideSession | null> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return null;
    
    // Check if this is an override session
    for (const [adminId, session] of overrideSessions.entries()) {
      if (session.targetUserId === currentUser.user.id) {
        // Verify session is still valid
        if (session.expiresAt < new Date()) {
          overrideSessions.delete(adminId);
          return null;
        }
        return session;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current override session:', error);
    return null;
  }
}

/**
 * In-memory storage for override sessions
 * In production, use Redis or similar secure session store
 */
const overrideSessions = new Map<string, OverrideSession>();

/**
 * Store override session securely
 */
async function storeOverrideSession(adminId: string, session: OverrideSession): Promise<void> {
  overrideSessions.set(adminId, session);
  
  // Auto-cleanup expired session
  setTimeout(() => {
    const stored = overrideSessions.get(adminId);
    if (stored && stored.expiresAt < new Date()) {
      overrideSessions.delete(adminId);
    }
  }, session.expiresAt.getTime() - Date.now());
}

/**
 * Remove override session
 */
async function removeOverrideSession(adminId: string): Promise<void> {
  overrideSessions.delete(adminId);
}

/**
 * Log override actions for security audit
 */
async function logOverrideAction(
  adminId: string,
  action: string,
  description: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    // High-priority security log
    console.log('ADMIN_OVERRIDE_ACTION', {
      timestamp: new Date().toISOString(),
      adminId,
      action,
      description,
      metadata,
      severity: 'HIGH',
      type: 'SECURITY_AUDIT'
    });
    
    // In production, also send to security monitoring system
  } catch (error) {
    console.error('Error logging override action:', error);
  }
}

/**
 * API route handler for override operations
 */
export async function handleOverrideRequest(
  action: 'initiate' | 'end',
  params: any
): Promise<OverrideResult> {
  switch (action) {
    case 'initiate':
      return initiateAccountOverride(
        params.targetUserEmail,
        params.reason,
        params.durationMinutes
      );
    case 'end':
      return endAccountOverride();
    default:
      return { success: false, message: 'Invalid override action' };
  }
}