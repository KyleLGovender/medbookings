# Google OAuth Authentication: Implementation Tasks

## Relevant Files

- `prisma/schema.prisma` - Contains Prisma model definitions; ensure `User` and `Account` models are correctly set up for NextAuth.js.
- `.env.local` (or equivalent) - Stores environment variables like `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`.
- `src/features/auth/lib/auth-options.ts` - Centralized NextAuth.js configuration (providers, adapter, callbacks, JWT strategy).
- `src/features/auth/lib/auth-options.test.ts` - Unit tests for `auth-options.ts`.
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth.js API route handler; will import `authOptions`.
- `src/app/api/auth/[...nextauth]/route.test.ts` - (Optional) Integration tests for the API route.
- `src/features/auth/components/AuthButton.tsx` - UI component for sign-in/sign-out and displaying user status.
- `src/features/auth/components/AuthButton.test.tsx` - Unit/component tests for `AuthButton.tsx`.
- `src/middleware.ts` - Next.js middleware for protecting routes using NextAuth.js.
- `src/middleware.test.ts` - Unit tests for `middleware.ts`.
- `src/features/auth/index.ts` - Barrel file for exporting auth feature modules.
- `src/features/auth/types/index.ts` (or `auth.types.ts`) - TypeScript definitions specific to the auth feature.
- `src/app/(auth)/login/page.tsx` - (Potentially) A dedicated login page if unauthenticated users are redirected here.

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` or `npm test -- [optional/path/to/test/file]` (or `yarn test`) to run tests. Running without a path executes all tests found by the Jest configuration.
- Remember to run `npx prisma generate` after any changes to `prisma/schema.prisma`.

## Tasks

- [ ] **1.0 Initial Setup and Environment Configuration**

  - [x] 1.1 Verify and update `User` and `Account` models in `prisma/schema.prisma` for NextAuth.js Prisma adapter compatibility (ensure fields like `email`, `name`, `image` for `User`; `provider`, `providerAccountId`, `access_token`, etc., for `Account`).
  - [x] 1.2 Run `npx prisma generate` to update the Prisma client after any schema changes.
  - [x] 1.3 Obtain Google OAuth credentials (Client ID and Client Secret) from Google Cloud Console.
  - [x] 1.4 Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET` (generate a strong secret), and `NEXTAUTH_URL` (e.g., `http://localhost:3000` for development) to `.env.local`.
  - [x] 1.5 Create the directory structure: `src/features/auth/` with subdirectories: `api`, `components`, `hooks`, `lib`, `types`.
  - [x] 1.6 Create `src/features/auth/index.ts` as a barrel file.

- [ ] **2.0 Implement Core NextAuth.js Logic with Google Provider and JWT Sessions**

  - [x] 2.1 Create `src/features/auth/lib/auth-options.ts`.
  - [x] 2.2 In `auth-options.ts`, import and configure `GoogleProvider` using `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
  - [x] 2.3 In `auth-options.ts`, import and configure `PrismaAdapter` from `@next-auth/prisma-adapter`, passing your Prisma client instance.
  - [x] 2.4 In `auth-options.ts`, configure the session strategy to `jwt` (`session: { strategy: "jwt" }`).
  - [x] 2.5 Implement `callbacks.jwt` in `auth-options.ts` to include necessary user information (e.g., `id`, `email`, `name`, `image`, custom roles if any) in the JWT.
  - [x] 2.6 Implement `callbacks.session` in `auth-options.ts` to expose desired JWT data to the client-side session object.
  - [x] 2.7 Implement `callbacks.signIn` in `auth-options.ts` to handle user creation/update on first/subsequent Google sign-ins and ensure redirection to `/profile` (FR1.3, FR1.4, FR1.5).
  - [x] 2.8 Refactor `src/app/api/auth/[...nextauth]/route.ts` to import `authOptions` from `src/features/auth/lib/auth-options.ts` and export `NextAuth(authOptions)` as `GET` and `POST` handlers.

- [ ] **3.0 Develop and Refactor Authentication UI Components**

  - [x] 3.1 Create `src/features/auth/components/auth-button.tsx` (was: Review the existing `src/components/app-navbar/auth-button.tsx`).
  - [x] 3.2 Move and refactor `auth-button.tsx` to `src/features/auth/components/auth-button.tsx`
  - [x] 3.3 Update `auth-button.tsx` to use `useSession`, `signIn`, and `signOut` from `next-auth/react`.
  - [x] 3.4 Ensure `auth-button.tsx` displays a "Sign in with Google" button when `session.status === 'unauthenticated'`, calling `signIn('google')` on click.
  - [x] 3.5 Ensure `auth-button.tsx` displays user's name and profile picture (or initials) and a "Sign out" button when `session.status === 'authenticated'`, calling `signOut({ callbackUrl: '/' })` on click (FR3.2, FR4.2).
  - [x] 3.6 Integrate the new `auth-button.tsx` into the application's main navbar or relevant UI layout.
  - [x] 3.7 (Optional) If a custom sign-in page is desired for unauthenticated redirects, create `src/app/(auth)/login/page.tsx` with a sign-in button (FR5.2).

- [ ] **4.0 Implement Route Protection using Middleware**

  - [x] 4.1 Create or verify `src/middleware.ts` to protect routes based on authentication status (FR5.1).
  - [x] 4.2 Import `withAuth` from `next-auth/middleware`.
  - [x] 4.3 Configure `withAuth` with the `authOptions` from `src/features/auth/lib/auth-options.ts` if custom callbacks/pages are needed in middleware context, or use default behavior.
  - [x] 4.4 Define the `config.matcher` in `middleware.ts` to protect routes like `/profile/:path*`, `/dashboard/:path*`, `/organizations/:path*`, `/providers/:path*`, `/bookings/:path*`, `/settings/:path*`, `/admin/:path*` (FR5.1).
  - [x] 4.5 Configure `pages.signIn` in `authOptions` (if not already done) or in `withAuth` options if redirecting unauthenticated users to a custom login page (e.g., `/auth/login` from task 3.7) (FR5.2).

- [ ] **5.0 Finalize Implementation: Error Handling, Testing, and Cleanup**
  - [ ] 5.1 Implement basic UI feedback for Google sign-in errors (e.g., using query params like `?error=OAuthAccountNotLinked` on the sign-in page, or a toast notification system if available).
  - [ ] 5.2 Write unit tests for `src/features/auth/lib/auth-options.ts` (mock Prisma, providers, and verify callback logic).
  - [ ] 5.3 Write component tests for `src/features/auth/components/AuthButton.tsx` (verify rendering for authenticated/unauthenticated states and click handlers).
  - [ ] 5.4 Write unit tests for `src/middleware.ts` (mock `NextRequest` and verify redirection logic for protected/public routes).
  - [ ] 5.5 Perform end-to-end manual testing:
    - New user sign-up with Google.
    - Returning user sign-in with Google.
    - Sign-out functionality.
    - Session persistence across browser refresh/restart.
    - Access to protected routes (authenticated vs. unauthenticated).
    - Redirection to `/profile` after login.
    - Redirection from protected routes when unauthenticated.
  - [ ] 5.6 Review all code for adherence to the PRD, project structure, and coding standards.
  - [ ] 5.7 Create/update `.env.example` with necessary environment variables for authentication (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`).
  - [ ] 5.8 Verify Prisma `User` and `Account` tables are populated correctly after sign-ins.
