import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import type { Account, CallbacksOptions, DefaultSession, Profile, Session, User } from 'next-auth';
import type { AdapterUser } from 'next-auth/adapters';
import type { JWT } from 'next-auth/jwt';
import GoogleProvider from 'next-auth/providers/google';

// The module we're testing
import { authOptions } from './auth-options';

// For mocking env vars used by authOptions

// Individual mock functions for Prisma methods
// Using var due to Jest hoisting: jest.mock factory needs these to be accessible.
var mockUserFindUnique = jest.fn();
var mockUserCreate = jest.fn();
var mockUserUpdate = jest.fn();
// Add other mock functions for user model methods if needed by your signIn callback or adapter
// Add mock functions for other models like account, session, verificationToken if used by the adapter
// e.g., const mockAccountFindUnique = jest.fn();

// Custom types for testing session callback results
// Assuming UserRole is something like 'USER' | 'ADMIN' based on Session['user'] requirements
type UserRole = 'USER' | 'ADMIN'; // Define or import UserRole if available elsewhere

type TestSessionUser = DefaultSession['user'] & {
  id: string; // Made id required
  role: UserRole; // Added role as required
};

interface TestSession extends Session {
  user: TestSessionUser; // Made user non-optional
}

// More specific mock types
const MOCK_DB_USER: User & { id: string } = {
  id: 'user-id-123',
  name: 'Test User from DB',
  email: 'test.db@example.com',
  image: 'test-db-image.jpg',
  role: 'USER', // Added role
};

const MOCK_ADAPTER_USER: AdapterUser = {
  id: MOCK_DB_USER.id,
  email: MOCK_DB_USER.email!,
  emailVerified: null, // emailVerified is standard for AdapterUser
  name: MOCK_DB_USER.name,
  image: MOCK_DB_USER.image,
  role: 'USER', // Added role, assuming it's part of your extended AdapterUser/User
};

const MOCK_ACCOUNT: Account = {
  provider: 'google',
  type: 'oauth',
  providerAccountId: 'google-account-id-123',
  access_token: 'mock_access_token',
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'Bearer',
  scope: 'openid email profile',
  id_token: 'mock_id_token',
  userId: MOCK_DB_USER.id,
};

const MOCK_PROFILE: Profile = {
  name: 'Test User from Profile',
  email: 'test.profile@example.com',
  image: 'test-profile-image.jpg',
};

const MOCK_INITIAL_JWT: JWT = {
  name: 'Initial JWT Name',
  email: 'initial.jwt@example.com',
  picture: 'initial-jwt-image.jpg', // 'picture' is a common claim from providers
  sub: 'subject-123',
};

const MOCK_ENRICHED_JWT: JWT = {
  // Token as it would be after our jwt callback
  id: MOCK_DB_USER.id,
  name: MOCK_DB_USER.name,
  email: MOCK_DB_USER.email,
  image: MOCK_DB_USER.image,
  sub: MOCK_DB_USER.id,
  // other standard JWT claims like iat, exp, jti might be added by NextAuth
};

const MOCK_SESSION_INPUT: Session = {
  user: {
    // DefaultSessionUser structure + custom fields
    id: 'session-user-id-placeholder', // Added id
    name: 'Initial Session User',
    email: 'initial.session@example.com',
    image: 'initial-session.jpg',
    role: 'USER', // Added role
  },
  expires: 'some-future-date-string', // ISO date string
};

// Mock PrismaClient to use individual mock functions
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: mockUserFindUnique,
      create: mockUserCreate,
      update: mockUserUpdate,
    },
    // account: { findUnique: mockAccountFindUnique, ... }, // if mocking account methods
    // Add other models as needed
  })),
}));

// Mock PrismaAdapter
jest.mock('@next-auth/prisma-adapter', () => ({
  PrismaAdapter: jest.fn((prismaInstance) => {
    console.log(
      'TRACE: PrismaAdapter mock factory called with:', // Log message updated for clarity
      prismaInstance !== undefined ? 'prisma instance' : 'undefined prisma instance'
    );
    // For now, return a basic mock adapter object.
    // This might need to be expanded if authOptions directly calls methods on the adapter.
    return { mockAdapterProperty: true };
  }),
}));

// Mock GoogleProvider
jest.mock('next-auth/providers/google', () => ({
  __esModule: true, // This is important for ES6 modules
  default: jest.fn().mockReturnValue({ id: 'google', name: 'Google', type: 'oauth' }), // Mock return value
}));

// Mock server environment variables
jest.mock('@/config/env/server', () => ({
  __esModule: true,
  default: {
    GOOGLE_CLIENT_ID: 'test_google_client_id',
    GOOGLE_CLIENT_SECRET: 'test_google_client_secret',
    NEXTAUTH_URL: 'http://localhost:3000', // Used for baseUrl in redirect
    BASE_URL: 'http://localhost:3000', // Explicitly define if used directly
    // Add other env vars if authOptions starts depending on them
  },
}));

// Test suite for authOptions

// New describe block for initialization tests
describe('authOptions Module Initialization', () => {
  // This block intentionally does NOT have jest.clearAllMocks() in a beforeEach,
  // as we are testing the calls made during the initial module import of authOptions.

  test('should be configured by calling PrismaAdapter and GoogleProvider upon module load', () => {
    // authOptions is already initialized due to the top-level import at the start of this file.
    // We expect PrismaAdapter and GoogleProvider to have been called once during that process.

    expect(PrismaAdapter).toHaveBeenCalledTimes(1);
    // Check that PrismaAdapter was called with the prisma client instance.
    // The prisma client instance itself is mocked, so we use expect.any(Object)
    expect(PrismaAdapter).toHaveBeenCalledWith(expect.any(Object));

    expect(GoogleProvider).toHaveBeenCalledTimes(1);
    expect(GoogleProvider).toHaveBeenCalledWith({
      clientId: 'test_google_client_id',
      clientSecret: 'test_google_client_secret',
    });
  });
});

describe('authOptions Properties and Runtime Behavior', () => {
  beforeEach(() => {
    // Clear all mock instances and calls before each test for this suite.
    // This is important for tests that trigger actions (e.g., callbacks)
    // and need a clean slate for mock call counts.
    jest.clearAllMocks();
    // Re-initialize PrismaClient mock for PrismaAdapter if needed per test
    (PrismaClient as jest.Mock).mockClear();
    // GoogleProvider might be called again in specific callback tests if they re-evaluate providers,
    // so clearing it here can be useful.
    (GoogleProvider as jest.Mock).mockClear();
  });

  test('session strategy should be jwt', () => {
    expect(authOptions.session?.strategy).toBe('jwt');
  });

  test('signIn page should be /login', () => {
    expect(authOptions.pages?.signIn).toBe('/login');
  });

  describe('callbacks', () => {
    // describe('jwt callback', () => {
    test('should add user details to token if user object is present (initial sign-in)', async () => {
      const resultToken = await authOptions.callbacks!.jwt!({
        token: { ...MOCK_INITIAL_JWT },
        user: MOCK_ADAPTER_USER,
        account: MOCK_ACCOUNT,
        profile: MOCK_PROFILE,
        isNewUser: true,
        trigger: 'signIn',
      });
      expect(resultToken.id).toBe(MOCK_DB_USER.id);
      expect(resultToken.name).toBe(MOCK_DB_USER.name);
      expect(resultToken.email).toBe(MOCK_DB_USER.email);
      expect(resultToken.image).toBe(MOCK_DB_USER.image);
      // Check if initial JWT properties (not overridden) persist if that's desired behavior
      // For example, if MOCK_INITIAL_JWT had 'custom_claim', it should still be there if not touched.
      // Our current jwt callback overrides name, email, image, and adds id.
      // It preserves other token fields like 'sub' from MOCK_INITIAL_JWT if not overridden.
      expect(resultToken.sub).toBe(MOCK_INITIAL_JWT.sub);
    });

    test('should return original token (with existing claims) if user object is not present (subsequent calls)', async () => {
      // This token would be one that was already processed by a previous jwt call
      const subsequentTokenInput = { ...MOCK_ENRICHED_JWT };
      const resultToken = await authOptions.callbacks!.jwt!({
        token: subsequentTokenInput,
        user: MOCK_ADAPTER_USER, // Must be User | AdapterUser
        account: MOCK_ACCOUNT, // Must be Account | null
        profile: MOCK_PROFILE, // Optional, but providing for consistency
        isNewUser: false, // Optional, but providing for consistency
        trigger: undefined, // Crucial for the test logic (not 'signIn')
      });
      // It should return the token as is because the `if (user)` condition is false
      expect(resultToken).toEqual(subsequentTokenInput);
      expect(resultToken.id).toBe(MOCK_DB_USER.id); // Already enriched
    });
    // });

    // describe('session callback', () => {
    test('should add enriched token details to session.user', async () => {
      // Deep copy MOCK_SESSION_INPUT to prevent test pollution
      const currentSessionInput = JSON.parse(JSON.stringify(MOCK_SESSION_INPUT)) as Session;

      const resultSession = (await authOptions.callbacks!.session!({
        session: currentSessionInput,
        token: MOCK_ENRICHED_JWT, // Token from jwt callback
        user: MOCK_ADAPTER_USER, // User from DB adapter
        newSession: undefined, // Add newSession
        trigger: 'update', // Add trigger as 'update'
      })) as TestSession; // Cast to our custom session type

      expect(resultSession.user).toBeDefined();
      if (resultSession.user) {
        expect(resultSession.user.id).toBe(MOCK_ENRICHED_JWT.id);
        expect(resultSession.user.name).toBe(MOCK_ENRICHED_JWT.name);
        expect(resultSession.user.email).toBe(MOCK_ENRICHED_JWT.email);
        expect(resultSession.user.image).toBe(MOCK_ENRICHED_JWT.image);
      }
      expect(resultSession.expires).toBe(MOCK_SESSION_INPUT.expires); // Expires should persist
    });

    test('should handle session.user being initially undefined (though types expect it)', async () => {
      const sessionWithoutInitialUser: Session = {
        expires: 'some-future-date-string',
        // user property is missing, which might not strictly conform to Session type but tests robustness
      } as Session; // Cast needed if Session type strictly requires user

      const resultSession = (await authOptions.callbacks!.session!({
        session: sessionWithoutInitialUser,
        token: MOCK_ENRICHED_JWT,
        user: MOCK_ADAPTER_USER,
        newSession: undefined, // Add newSession
        trigger: 'update', // Add trigger as 'update'
      })) as TestSession; // Cast to our custom session type

      // The callback creates session.user if token is present
      expect(resultSession.user).toBeDefined();
      if (resultSession.user) {
        expect(resultSession.user.id).toBe(MOCK_ENRICHED_JWT.id);
      }
    });

    test('should return session with undefined user fields if token is empty and session.user exists', async () => {
      const currentSessionInput = JSON.parse(JSON.stringify(MOCK_SESSION_INPUT)) as Session;
      const emptyToken: JWT = {}; // An empty token

      const resultSession = (await authOptions.callbacks!.session!({
        session: currentSessionInput,
        token: emptyToken,
        user: MOCK_ADAPTER_USER,
        newSession: undefined, // Add newSession
        trigger: 'update', // Add trigger as 'update'
      })) as TestSession; // Cast to our custom session type

      // The current callback assigns properties from token. If token is empty, these will be undefined.
      expect(resultSession.user).toBeDefined();
      if (resultSession.user) {
        expect(resultSession.user.id).toBeUndefined();
        expect(resultSession.user.name).toBeUndefined();
        expect(resultSession.user.email).toBeUndefined();
        expect(resultSession.user.image).toBeUndefined();
      }
    });
  });

  describe('signIn callback', () => {
    beforeEach(() => {
      (mockUserFindUnique as jest.Mock).mockReset();
      (mockUserCreate as jest.Mock).mockReset();
      (mockUserUpdate as jest.Mock).mockReset();
    });

    test('should always return true, as PrismaAdapter handles user logic (existing user scenario)', async () => {
      const params: Parameters<CallbacksOptions['signIn']>[0] = {
        user: MOCK_ADAPTER_USER,
        account: MOCK_ACCOUNT,
        profile: MOCK_PROFILE,
        email: { verificationRequest: false },
        credentials: {},
      };
      const result = await authOptions.callbacks!.signIn!(params);
      expect(result).toBe(true);
      // No direct DB calls expected from this callback itself
      expect(mockUserFindUnique).not.toHaveBeenCalled();
      expect(mockUserCreate).not.toHaveBeenCalled();
      expect(mockUserUpdate).not.toHaveBeenCalled();
    });

    test('should always return true, as PrismaAdapter handles user logic (new user scenario)', async () => {
      const params: Parameters<CallbacksOptions['signIn']>[0] = {
        user: {
          email: MOCK_PROFILE.email,
          name: MOCK_PROFILE.name,
          image: MOCK_PROFILE.image,
        } as AdapterUser,
        account: MOCK_ACCOUNT,
        profile: MOCK_PROFILE,
        email: { verificationRequest: false },
        credentials: {},
      };
      const result = await authOptions.callbacks!.signIn!(params);
      expect(result).toBe(true);
      // No direct DB calls expected from this callback itself
      expect(mockUserFindUnique).not.toHaveBeenCalled();
      expect(mockUserCreate).not.toHaveBeenCalled();
    });

    test('should still return true, as PrismaAdapter handles logic (missing user.id scenario)', async () => {
      const params: Parameters<CallbacksOptions['signIn']>[0] = {
        user: { name: MOCK_PROFILE.name, email: MOCK_PROFILE.email } as AdapterUser, // Missing id
        account: MOCK_ACCOUNT,
        profile: MOCK_PROFILE,
        email: { verificationRequest: false },
        credentials: {},
      };
      const result = await authOptions.callbacks!.signIn!(params);
      expect(result).toBe(true);
    });

    test('should still return true, as PrismaAdapter handles logic (missing account/provider scenario)', async () => {
      const params1: Parameters<CallbacksOptions['signIn']>[0] = {
        user: MOCK_ADAPTER_USER,
        account: null, // Test with null account
        profile: MOCK_PROFILE,
        email: { verificationRequest: false },
        credentials: {},
      };
      let result = await authOptions.callbacks!.signIn!(params1);
      expect(result).toBe(true);

      const params2: Parameters<CallbacksOptions['signIn']>[0] = {
        user: MOCK_ADAPTER_USER,
        account: { ...MOCK_ACCOUNT, providerAccountId: null as any },
        profile: MOCK_PROFILE,
        email: { verificationRequest: false },
        credentials: {},
      };
      result = await authOptions.callbacks!.signIn!(params2);
      expect(result).toBe(true);
    });

    test('should still return true, as PrismaAdapter handles logic (missing profile/email scenario)', async () => {
      const params1: Parameters<CallbacksOptions['signIn']>[0] = {
        user: MOCK_ADAPTER_USER,
        account: MOCK_ACCOUNT,
        profile: undefined, // Missing profile
        email: { verificationRequest: false },
        credentials: {},
      };
      let result = await authOptions.callbacks!.signIn!(params1);
      expect(result).toBe(true);

      const params2: Parameters<CallbacksOptions['signIn']>[0] = {
        user: MOCK_ADAPTER_USER,
        account: MOCK_ACCOUNT,
        profile: { ...MOCK_PROFILE, email: null as any },
        email: { verificationRequest: false },
        credentials: {},
      };
      result = await authOptions.callbacks!.signIn!(params2);
      expect(result).toBe(true);
    });
    // });

    // describe('redirect callback', () => {
    // const baseUrl = 'http://localhost:3000';

    // test('should redirect to /profile if url is baseUrl', async () => {
    //   const redirectUrl = await authOptions.callbacks!.redirect!({ url: baseUrl, baseUrl });
    //   expect(redirectUrl).toBe(`${baseUrl}/profile`);
    // });

    // test('should allow relative callback URLs', async () => {
    //   const relativeUrl = '/dashboard';
    //   const redirectUrl = await authOptions.callbacks!.redirect!({ url: relativeUrl, baseUrl });
    //   expect(redirectUrl).toBe(`${baseUrl}${relativeUrl}`);
    // });

    // test('should allow callback URLs on the same origin', async () => {
    //   const sameOriginUrl = `${baseUrl}/custom/path`;
    //   const redirectUrl = await authOptions.callbacks!.redirect!({ url: sameOriginUrl, baseUrl });
    //   expect(redirectUrl).toBe(sameOriginUrl);
    // });

    // test('should default to baseUrl for external URLs', async () => {
    //   const externalUrl = 'http://external.com/path';
    //   const redirectUrl = await authOptions.callbacks!.redirect!({ url: externalUrl, baseUrl });
    //   expect(redirectUrl).toBe(baseUrl);
    // });

    // test('should default to baseUrl for invalid URLs that cause new URL() to fail (e.g. mailto:)', async () => {
    //   const invalidUrl = 'mailto:test@example.com';
    //   const redirectUrl = await authOptions.callbacks!.redirect!({ url: invalidUrl, baseUrl });
    //   expect(redirectUrl).toBe(baseUrl);
    // });
    // });
  });
});
