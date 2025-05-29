import { NextResponse } from 'next/server';

import { withAuth } from 'next-auth/middleware';

export default withAuth(
  (req) => {
    // const { token } = req.nextauth; // Not needed if admin check is removed
    // const isAdmin = token?.role === 'ADMIN';
    // const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');

    // if (isAdminRoute && !isAdmin) {
    //   return NextResponse.redirect(new URL('/unauthorized', req.url));
    // }

    // If no other specific checks are needed for matched routes beyond authentication,
    // simply proceed. The `authorized` callback handles the auth check.
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/profile/:path*',
    // '/admin/:path*', // Removed as per discussion, not in project_structure.md
    '/dashboard/:path*',
    '/organizations/:path*',
    '/providers/:path*',
    '/bookings/:path*',
    '/settings/:path*',
  ],
};
