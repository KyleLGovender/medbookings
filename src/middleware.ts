import { NextResponse } from 'next/server';

import { withAuth } from 'next-auth/middleware';

export default withAuth(
  (req) => {
    const { token } = req.nextauth;

    const isAdmin = token?.role === 'ADMIN';
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');

    if (isAdminRoute && !isAdmin) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/profile/:path*', '/admin/:path*'],
};
