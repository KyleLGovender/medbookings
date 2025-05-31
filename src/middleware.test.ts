import type { NextFetchEvent } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';

import type { JWT } from 'next-auth/jwt';
import type { NextRequestWithAuth } from 'next-auth/middleware';

// eslint-disable-next-line import/order
// prettier-ignore
import middleware, { config } from './middleware';

// Mock next-auth/middleware
// The actual middleware function exported from './middleware' is the result of withAuth(...)
// So, this mock simulates what withAuth would return given our specific main handler and options.
jest.mock('next-auth/middleware', () => ({
  withAuth: jest.fn((mainMiddlewareHandler, options) => {
    // mainMiddlewareHandler is our (req) => NextResponse.next()
    // options contains our { callbacks: { authorized: ... } }
    return async (req: NextRequest) => {
      // Simulate the authorized callback logic using the token from the mocked request
      const isAuthorized = options.callbacks.authorized({ token: (req as any).nextauth?.token });

      if (!isAuthorized) {
        // Simulate redirection to the default sign-in page
        const signInUrl = new URL('/api/auth/signin', req.url);
        // Append the original path (including query params) as callbackUrl
        signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search);
        return NextResponse.redirect(signInUrl);
      }
      // If authorized, call the main middleware handler function that was passed to withAuth
      return mainMiddlewareHandler(req);
    };
  }),
}));

describe('Middleware', () => {
  const { matcher } = config;

  // Helper to create a mock request that conforms to NextRequestWithAuth
  const createMockRequestWithAuth = (
    pathname: string,
    token: JWT | null = null
  ): NextRequestWithAuth => {
    const url = new URL(pathname, 'http://localhost:3000');
    // Cast to NextRequestWithAuth and then assign the nextauth property
    const request = new NextRequest(url.toString()) as NextRequestWithAuth;
    request.nextauth = { token };
    return request;
  };

  matcher.forEach((pathPattern) => {
    // Convert matcher pattern to a concrete test path
    // e.g., /profile/:path* -> /profile/some/path
    const testPath = pathPattern.replace(/\/:path\*/g, '/test/subpath');

    describe(`Route: ${pathPattern} (tested with ${testPath})`, () => {
      it('should allow access for an authenticated user', async () => {
        const mockToken: JWT = { id: 'user123', name: 'Test User', role: 'USER' } as JWT; // Adjust if mockToken doesn't fully match JWT
        const req = createMockRequestWithAuth(testPath, mockToken);
        const event = { waitUntil: jest.fn() } as unknown as NextFetchEvent;

        const response = await middleware(req, event);

        // Ensure the response is a NextResponse object as expected for this case
        expect(response).toBeInstanceOf(NextResponse);

        // If the above assertion passes, TypeScript should infer 'response' as NextResponse
        // If it still complains, we can cast or use a non-null assertion, but toBeInstanceOf is preferred.
        // For safety, let's add a runtime check that also helps TypeScript's control flow analysis.
        if (!response) {
          // This should be unreachable if toBeInstanceOf passed, but satisfies stricter checks.
          fail('Middleware returned an undefined or null response for an authenticated user.');
        }

        // Expect NextResponse.next() behavior (passes through)
        // Check for the 'x-middleware-next' header which indicates middleware pass-through
        expect(response.headers.get('x-middleware-next')).toBe('1');
        // Ensure it's not a redirect
        expect(response.headers.get('location')).toBeNull();
        // NextResponse.next() usually results in a 200 status for the underlying response if no error.
        // For the middleware response object itself, status might be 200.
        expect(response.status).toBe(200);
      });

      it('should redirect an unauthenticated user to the sign-in page', async () => {
        const req = createMockRequestWithAuth(testPath, null);
        const event = { waitUntil: jest.fn() } as unknown as NextFetchEvent;

        const response = await middleware(req, event);

        // Ensure the response is a NextResponse object as expected for this case
        expect(response).toBeInstanceOf(NextResponse);
        if (!response) {
          // Should be unreachable if toBeInstanceOf passed
          fail('Middleware returned an undefined or null response for an unauthenticated user.');
        }

        // Expect a redirect response
        expect(response.status).toBe(307); // NextResponse.redirect defaults to 307
        const redirectUrl = new URL(response.headers.get('location')!, 'http://localhost:3000');
        expect(redirectUrl.pathname).toBe('/api/auth/signin');
        expect(redirectUrl.searchParams.get('callbackUrl')).toBe(testPath);
      });
    });
  });
});
