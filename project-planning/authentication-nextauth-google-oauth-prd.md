# PRD: Authentication with NextAuth and Google OAuth

## 1. Introduction/Overview

This document outlines the requirements for implementing user authentication in the MedBookings application using NextAuth.js (v4) with an exclusive focus on Google OAuth. The primary goal is to provide a secure, seamless, and user-friendly way for users to sign up and sign in, leveraging their existing Google accounts. This approach aligns with the long-term strategy of tight integration with Google services (e.g., Google Calendar).

This implementation will refactor existing authentication logic into the new project structure defined in `project-planning/project_structure.md`, specifically under `src/features/auth/` and `src/app/api/auth/`.

## 2. Goals

- Implement a robust Google OAuth 2.0 sign-up and sign-in flow using NextAuth.js v4.
- Securely manage user sessions.
- Store essential user information (email, name, profile picture) from Google in the application database (Prisma).
- Refactor existing NextAuth.js implementation into the new standardized project structure.
- Provide a clear and intuitive UI for authentication actions (sign-in, sign-out, display user status).
- Ensure that only authenticated users can access protected routes.

## 3. User Stories

- **As a new user,** I want to sign up for MedBookings quickly using my Google account so that I don't have to create and remember new credentials.
- **As a returning user,** I want to sign in to MedBookings easily using my Google account so that I can access my information and the platform's features.
- **As an authenticated user,** I want my basic profile information (name, email, profile picture) from Google to be visible within the application where appropriate.
- **As an authenticated user,** I want to be able to sign out of MedBookings securely.
- **As a developer,** I want the authentication logic to be well-structured, maintainable, and centralized within the `src/features/auth/` directory.

## 4. Functional Requirements

- **Google OAuth Sign-Up/Sign-In:**
  - FR1.1: The system must allow users to initiate sign-up/sign-in via a "Sign in with Google" button.
  - FR1.2: Upon successful Google authentication, the system must retrieve the user's email, full name, and profile picture URL from Google.
  - FR1.3: For first-time Google sign-ins, a new user record must be created in the Prisma database with the retrieved Google profile information.
  - FR1.4: For returning users, the system must log them in and potentially update their name or profile picture in the database if it has changed on Google's end.
  - FR1.5: Users should be redirected to `/profile` after successful sign-in.
- **Session Management:**
  - FR2.1: The system must use NextAuth.js to manage user sessions, employing JWTs (JSON Web Tokens) stored in secure, HTTP-only cookies. Database sessions (via Prisma `Session` model) will not be used for this iteration.
  - FR2.2: Sessions must persist across browser restarts until explicitly logged out or the session cookie expires (default NextAuth.js behavior, e.g., 30 days, configurable).
- **Sign Out:**
  - FR3.1: Authenticated users must be able to sign out of the application.
  - FR3.2: Upon sign-out, the user session must be invalidated, and the user should be redirected to a public page (e.g., homepage).
- **User Interface:**
  - FR4.1: A clear "Sign in with Google" button must be available for unauthenticated users (e.g., in the application navbar).
  - FR4.2: For authenticated users, the UI should display their status (e.g., profile picture/initials and name in the navbar) and provide a "Sign out" option.
- **Route Protection:**
  - FR5.1: The system must protect all routes within the `src/app/(dashboard)/` route group (e.g., `/dashboard/*`, `/profile/*`, `/organizations/*`, `/providers/*`, `/bookings/*`, `/settings/*`) and other specified protected routes like `/admin/*`, ensuring only authenticated users can access them. The `matcher` configuration in `src/middleware.ts` will be updated accordingly.
  - FR5.2: Unauthenticated users attempting to access these protected routes should be redirected to a designated sign-in page (e.g., a page within `src/app/(auth)/login/` or a general access denied/redirect page).
- **Database Integration:**
  - FR6.1: User profiles (email, name, Google profile picture URL, Google ID) must be stored in the Prisma `User` table.
  - FR6.2: The `User` and `Account` models in `prisma/schema.prisma` are essential for storing user data and linking OAuth accounts. The `Session` model is not required due to the use of JWT sessions. The `VerificationToken` model is not strictly required for Google OAuth but may be included for Prisma adapter completeness or potential future use cases (e.g., if other auth methods are added).
- **Code Structure & Refactoring:**
  - FR7.1: All NextAuth.js core configuration (providers, callbacks, adapter setup) must be centralized, ideally in a new file like `src/features/auth/lib/auth-options.ts`.
  - FR7.2: The existing NextAuth API route (`src/app/api/auth/[...nextauth]/route.ts`) should be simplified to import and use these centralized options.
  - FR7.3: The existing `AuthButton` component (`src/components/app-navbar/auth-button.tsx`) should be reviewed and moved to `src/features/auth/components/AuthButton.tsx`.
  - FR7.4: The existing `middleware.ts` should be reviewed and updated to align with the new structure and any changes in authentication logic.
  - FR7.5: Create necessary subdirectories and placeholder files within `src/features/auth/` (api, components, hooks, lib, types, index.ts) as per `project_structure.md`.

## 5. Non-Goals (Out of Scope for this PRD)

- Traditional email/password authentication.
- Authentication with any OAuth providers other than Google.
- Detailed Role-Based Access Control (RBAC) beyond basic "authenticated" vs. "unauthenticated" status and the existing simple "ADMIN" role check in middleware.
- Account linking features (e.g., linking multiple social accounts to one MedBookings account).
- Specific implementation of linking Google services (like Calendar); this PRD focuses on establishing the Google-based identity.
- User profile management features beyond displaying Google-provided information (e.g., editing profile details within MedBookings).
- Two-Factor Authentication (2FA).
- Login activity tracking (e.g., recording login timestamps, IP addresses). This can be considered as a future enhancement.

## 6. Design Considerations (Optional)

- Start with a standard "Sign in with Google" button implementation, adhering to Google's branding guidelines.
- The display of user authentication status (profile picture/initials, name) in the navbar should be clean and unobtrusive.
- Refer to `src/components/app-navbar/auth-button.tsx` for the current UI implementation, which can be adapted.

## 7. Technical Considerations

- **NextAuth.js v4:** The implementation must use NextAuth.js version 4.
- **Prisma:** User data will be stored using Prisma. This will involve using or configuring the NextAuth.js Prisma Adapter, primarily for `User` and `Account` model interactions. The `Session` model is not required for JWT-based sessions. The `VerificationToken` model will not be added for this iteration, as it's not strictly necessary for a Google-only OAuth flow with JWT sessions.
- **Project Structure:** Adhere to the directory structure outlined in `project-planning/project_structure.md`.
  - NextAuth configuration: `src/features/auth/lib/auth-options.ts` (new file).
  - API route: `src/app/api/auth/[...nextauth]/route.ts` (refactor).
  - Auth UI components: e.g., `src/features/auth/components/AuthButton.tsx` (refactor/move).
  - Middleware: `src/middleware.ts` (refactor/review).
- **Environment Variables:** Google OAuth client ID and secret must be stored securely as environment variables (e.g., `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`).
- **Error Handling:** Implement basic error handling for authentication failures (e.g., Google sign-in fails, user cancels).

## 8. Success Metrics

- Users can successfully sign up and sign in using their Google accounts.
- Protected routes are inaccessible to unauthenticated users and accessible to authenticated users.
- User data (name, email, profile picture) from Google is correctly stored and displayed.
- The authentication codebase is successfully refactored into the new project structure.
- Session persistence and sign-out functionality work as expected.

## 9. Decisions & Clarifications

- The `VerificationToken` model will not be added to `prisma/schema.prisma` for this iteration. It is not strictly required for the Google-only OAuth flow with JWT sessions.
- The specific redirection URL after login will be `/profile`.

---

This PRD will guide the implementation of the authentication feature. Further clarifications can be sought as development progresses.
