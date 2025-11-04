/**
 * Next.js middleware for route protection
 *
 * Implements comprehensive route-based access control with
 * role and permission checking for different user types.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { type JWT, getToken } from 'next-auth/jwt';
import { withAuth } from 'next-auth/middleware';
import { v4 as uuidv4 } from 'uuid';

import { createAuditLog } from '@/lib/audit';
import { logger, sanitizeEmail } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { fromTimestamp, nowUTC, toISOStringUTC } from '@/lib/timezone';

/**
 * Route patterns and their required permissions
 */
const ROUTE_PERMISSIONS = {
  // Admin routes
  '/admin': ['ADMIN', 'SUPER_ADMIN'],

  // Organization routes (VERIFIED + ADMIN/SUPER_ADMIN only)
  '/organizations/new': ['ADMIN', 'SUPER_ADMIN'], // Only admins can manage organizations
  '/organizations/[id]': ['ADMIN', 'SUPER_ADMIN'], // Only admins can view org details
  '/organizations/[id]/edit': ['ADMIN', 'SUPER_ADMIN'], // Only admins can edit orgs
  '/organizations/[id]/members': ['ADMIN', 'SUPER_ADMIN'],
  '/organizations/[id]/manage-calendar': ['ADMIN', 'SUPER_ADMIN'],

  // Provider routes (VERIFIED only)
  '/providers/new': 'VERIFIED_USER', // Only verified users can become providers
  '/providers/[id]/edit': 'VERIFIED_USER', // Only verified users can edit provider profiles
  '/providers/[id]/manage-calendar': 'VERIFIED_USER', // Only verified users can manage calendars

  // Calendar routes (VERIFIED only)
  '/calendar': 'VERIFIED_USER', // Only verified users can access calendar
  '/calendar/availability': 'VERIFIED_USER', // Only verified users can manage availability

  // Availability routes (VERIFIED only)
  '/availability': 'VERIFIED_USER', // Only verified users can access availability
  '/availability/create': 'VERIFIED_USER', // Only verified users can create availability

  // Booking routes (VERIFIED only)
  '/bookings': 'VERIFIED_USER', // Only verified users can access bookings
  '/my-bookings': 'VERIFIED_USER', // Only verified users can view their bookings

  // Profile routes (any authenticated user)
  '/profile': ['USER'], // Any authenticated user can view profile

  // General dashboard (any authenticated user)
  '/dashboard': ['USER'], // Any authenticated user can access dashboard

  // Settings (any authenticated user)
  '/settings': ['USER'], // Any authenticated user can access settings
};

/**
 * Check if user has required role
 */
function hasRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * Check if user email is verified
 */
function isEmailVerified(emailVerified: Date | null): boolean {
  return emailVerified !== null;
}

/**
 * Check if user meets verification requirements
 */
function checkVerificationRequirement(requirement: string | string[], token: JWT): boolean {
  if (Array.isArray(requirement)) {
    // Standard role check
    return hasRole(token.role as string, requirement);
  }

  if (requirement === 'VERIFIED_USER') {
    // Must be verified user
    return isEmailVerified(token.emailVerified ?? null);
  }

  return false;
}

/**
 * Extract dynamic segments from pathname
 */
function extractRouteParams(pathname: string): Record<string, string> {
  const segments = pathname.split('/').filter(Boolean);
  const params: Record<string, string> = {};

  // Simple pattern matching for [id] segments
  if (segments.length >= 2 && segments[0] === 'organizations') {
    params.organizationId = segments[1];
  }
  if (segments.length >= 2 && segments[0] === 'providers') {
    params.providerId = segments[1];
  }

  return params;
}

/**
 * Check route-specific permissions
 */
async function checkRoutePermissions(pathname: string, token: JWT): Promise<boolean> {
  // Check admin routes
  if (pathname.startsWith('/admin')) {
    return hasRole(token.role as string, ['ADMIN', 'SUPER_ADMIN']);
  }

  // Check organization routes - membership validation
  if (pathname.startsWith('/organizations')) {
    // Super admins can access all organizations
    if (token.role === 'SUPER_ADMIN') {
      return true;
    }

    // /organizations/new route - only admins can create organizations
    if (pathname === '/organizations/new' || pathname === '/organizations/new/') {
      return hasRole(token.role as string, ['ADMIN', 'SUPER_ADMIN']);
    }

    // Extract organization ID from path: /organizations/[id] or /organizations/[id]/...
    const orgIdMatch = pathname.match(/^\/organizations\/([^\/]+)/);

    if (!orgIdMatch) {
      // Path doesn't match expected pattern, deny access
      logger.warn('Invalid organization route pattern', {
        pathname,
        userId: token.sub,
      });
      return false;
    }

    const organizationId = orgIdMatch[1];
    const userId = token.sub;

    if (!userId) {
      return false;
    }

    // Check if user is an active member of the organization
    try {
      const membership = await prisma.organizationMembership.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId,
          },
        },
        select: {
          status: true,
          role: true,
        },
      });

      if (!membership || membership.status !== 'ACTIVE') {
        logger.warn('Unauthorized organization access attempt', {
          userId,
          organizationId,
          pathname,
          membershipStatus: membership?.status || 'NOT_FOUND',
        });
        return false;
      }

      // User is an active member, grant access
      return true;
    } catch (error) {
      logger.error('Error checking organization membership', {
        error,
        userId,
        organizationId,
        pathname,
      });
      // Fail closed - deny access on error
      return false;
    }
  }

  // Check provider routes (verified users only)
  if (
    pathname.startsWith('/providers/new') ||
    (pathname.startsWith('/providers/') &&
      (pathname.includes('/edit') || pathname.includes('/manage-calendar')))
  ) {
    return checkVerificationRequirement('VERIFIED_USER', token);
  }

  // Check calendar routes (verified users only)
  if (pathname.startsWith('/calendar') || pathname.startsWith('/availability')) {
    return checkVerificationRequirement('VERIFIED_USER', token);
  }

  // Check booking routes (verified users only)
  if (pathname.startsWith('/bookings') || pathname.startsWith('/my-bookings')) {
    return checkVerificationRequirement('VERIFIED_USER', token);
  }

  // Allow access to profile, dashboard, and settings for any authenticated user
  if (
    pathname.startsWith('/profile') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/settings')
  ) {
    return true;
  }

  // Default to allowing access for authenticated users
  return true;
}

export default withAuth(
  async (req: NextRequest) => {
    // Generate unique request ID for tracing
    // Check if request already has an ID (from external source like load balancer)
    const requestId = req.headers.get('x-request-id') || uuidv4();

    const token = await getToken({ req });
    const { pathname } = req.nextUrl;

    // Allow public access to provider search page
    if (pathname === '/providers') {
      const response = NextResponse.next();
      response.headers.set('x-request-id', requestId);
      return response;
    }

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // POPIA Compliance: Session Timeout Enforcement (30 minutes)
    // Check if session has expired due to inactivity
    const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes in milliseconds
    const now = nowUTC().getTime();

    // JWT `iat` (issued at) and `exp` (expiration) are in seconds, need to convert to milliseconds
    const tokenIssuedAt = ((token.iat as number) ?? 0) * 1000;
    const tokenExpiry = ((token.exp as number) ?? 0) * 1000;

    // Use lastActivity timestamp if available (tracks real user activity),
    // fallback to tokenIssuedAt for backward compatibility with old tokens
    const lastActivitySeconds = (token.lastActivity as number) ?? (token.iat as number) ?? 0;
    const lastActivityMs = lastActivitySeconds * 1000;
    const timeSinceLastActivity = now - lastActivityMs;

    // Check if session has timed out due to inactivity
    if (timeSinceLastActivity > SESSION_TIMEOUT_MS) {
      // Log the timeout event for audit purposes (POPIA requirement)
      logger.audit('Session timeout due to inactivity', {
        userId: token.sub,
        inactivityMinutes: Math.floor(timeSinceLastActivity / 1000 / 60),
        lastActivity: toISOStringUTC(fromTimestamp(lastActivityMs)),
        pathname,
        action: 'SESSION_TIMEOUT',
      });

      // Redirect to login with timeout message
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('reason', 'session_timeout');
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if token is about to expire (within 5 minutes)
    const timeUntilExpiry = tokenExpiry - now;
    const EXPIRY_WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes

    // Check route-specific permissions
    const hasAccess = await checkRoutePermissions(pathname, token);

    if (!hasAccess) {
      // Determine the specific reason for access denial
      const isEmailUnverified = !isEmailVerified(token.emailVerified ?? null);
      const reason = isEmailUnverified ? 'email_not_verified' : 'insufficient_permissions';

      // Log authorization failure for audit trail (POPIA compliance)
      await createAuditLog({
        action: 'Authorization failed',
        category: 'AUTHORIZATION',
        userId: token.sub,
        userEmail: sanitizeEmail((token.email as string) || ''),
        resource: 'Route',
        resourceId: pathname,
        ipAddress:
          req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          req.headers.get('x-real-ip') ||
          'unknown',
        metadata: {
          attemptedRoute: pathname,
          userRole: token.role || 'USER',
          emailVerified: !isEmailUnverified,
          reason,
          userAgent: req.headers.get('user-agent') || 'unknown',
        },
      });

      // Check if this is an email verification issue
      if (
        isEmailUnverified &&
        (pathname.startsWith('/providers') ||
          pathname.startsWith('/calendar') ||
          pathname.startsWith('/availability') ||
          pathname.startsWith('/bookings') ||
          pathname.startsWith('/my-bookings'))
      ) {
        // Redirect to email verification page
        const verifyUrl = new URL('/verify-email', req.url);
        verifyUrl.searchParams.set('reason', 'email_verification_required');
        verifyUrl.searchParams.set('attempted_route', pathname);
        return NextResponse.redirect(verifyUrl);
      }

      // Redirect to unauthorized page with context
      const unauthorizedUrl = new URL('/unauthorized', req.url);
      unauthorizedUrl.searchParams.set('reason', 'insufficient_permissions');
      unauthorizedUrl.searchParams.set('attempted_route', pathname);
      return NextResponse.redirect(unauthorizedUrl);
    }

    // Add permission context to headers for downstream use
    const response = NextResponse.next();
    response.headers.set('x-request-id', requestId);
    response.headers.set('x-user-role', String(token.role) || 'USER');
    response.headers.set('x-user-id', token.sub || '');
    response.headers.set('x-email-verified', String(isEmailVerified(token.emailVerified ?? null)));

    // Add session timeout warning header if approaching timeout
    if (timeUntilExpiry < EXPIRY_WARNING_THRESHOLD && timeUntilExpiry > 0) {
      response.headers.set('x-session-expiry-warning', String(Math.floor(timeUntilExpiry / 1000)));
    }

    if (token.providerRole) {
      response.headers.set('x-provider-role', String(token.providerRole));
    }

    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow public access to provider search page
        if (req.nextUrl.pathname === '/providers') {
          return true;
        }

        // Basic authentication check
        if (!token) return false;

        // Special handling for admin routes
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return token.role === 'ADMIN' || token.role === 'SUPER_ADMIN';
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    // Protected dashboard routes
    '/dashboard/:path*',

    // Admin routes
    '/admin/:path*',

    // Profile routes
    '/profile/:path*',

    // Organization routes
    '/organizations/:path*',

    // Provider routes
    '/providers/:path*',

    // Protected calendar routes
    '/calendar/:path*',
    '/availability/:path*',

    // Settings routes
    '/settings/:path*',

    // Booking routes
    '/bookings/:path*',
    '/my-bookings/:path*',
  ],
};
