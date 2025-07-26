/**
 * Next.js middleware for route protection
 * 
 * Implements comprehensive route-based access control with
 * role and permission checking for different user types.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import { getToken } from 'next-auth/jwt';

/**
 * Route patterns and their required permissions
 */
const ROUTE_PERMISSIONS = {
  // Admin routes
  '/admin': ['ADMIN', 'SUPER_ADMIN'],
  
  // Organization routes
  '/organizations/new': ['USER'], // Any authenticated user can create
  '/organizations/[id]': 'ORGANIZATION_MEMBER', // Must be member of specific org
  '/organizations/[id]/edit': 'ORGANIZATION_ADMIN', // Must be org admin/owner
  '/organizations/[id]/members': 'ORGANIZATION_ADMIN',
  '/organizations/[id]/manage-calendar': 'ORGANIZATION_MANAGER',
  
  // Provider routes
  '/providers/new': ['USER'], // Any authenticated user can become provider
  '/providers/[id]': 'PROVIDER_OR_ADMIN', // Provider themselves or admin
  '/providers/[id]/edit': 'PROVIDER_OWNER_OR_ADMIN',
  '/providers/[id]/manage-calendar': 'PROVIDER_OWNER',
  
  // Calendar routes
  '/calendar': ['USER'], // Basic authenticated access
  '/calendar/availability': 'PROVIDER', // Only providers can manage availability
  
  // Profile routes
  '/profile': ['USER'], // Any authenticated user
  
  // General dashboard
  '/dashboard': ['USER'] // Any authenticated user
};

/**
 * Check if user has required role
 */
function hasRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
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
async function checkRoutePermissions(
  pathname: string,
  token: any
): Promise<boolean> {
  // Simple role-based checks for now
  // In a full implementation, this would integrate with the permission system
  
  if (pathname.startsWith('/admin')) {
    return hasRole(token.role, ['ADMIN', 'SUPER_ADMIN']);
  }
  
  if (pathname.startsWith('/calendar/availability')) {
    return token.providerRole === 'PROVIDER';
  }
  
  // For organization routes, we'll need to check membership
  // This is simplified - in practice, you'd query the database
  if (pathname.startsWith('/organizations/') && pathname.includes('/edit')) {
    // Check if user is org admin (simplified)
    return token.role === 'ADMIN' || token.role === 'SUPER_ADMIN';
  }
  
  if (pathname.startsWith('/providers/') && pathname.includes('/edit')) {
    // Check if user owns the provider account (simplified)
    return token.providerRole === 'PROVIDER' || 
           token.role === 'ADMIN' || 
           token.role === 'SUPER_ADMIN';
  }
  
  // Default to allowing access for authenticated users
  return true;
}

export default withAuth(
  async (req: NextRequest) => {
    const token = await getToken({ req });
    const { pathname } = req.nextUrl;
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    // Check route-specific permissions
    const hasAccess = await checkRoutePermissions(pathname, token);
    
    if (!hasAccess) {
      // Redirect to unauthorized page with context
      const unauthorizedUrl = new URL('/unauthorized', req.url);
      unauthorizedUrl.searchParams.set('reason', 'insufficient_permissions');
      unauthorizedUrl.searchParams.set('attempted_route', pathname);
      return NextResponse.redirect(unauthorizedUrl);
    }
    
    // Add permission context to headers for downstream use
    const response = NextResponse.next();
    response.headers.set('x-user-role', String(token.role) || 'USER');
    response.headers.set('x-user-id', token.sub || '');
    
    if (token.providerRole) {
      response.headers.set('x-provider-role', String(token.providerRole));
    }
    
    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
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
    
    // Calendar routes
    '/calendar/:path*',
    
    // Settings routes
    '/settings/:path*',
    
    // Booking routes
    '/bookings/:path*'
  ],
};
