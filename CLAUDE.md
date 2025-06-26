# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development

- `npm run dev` - Start development server
- `npm run build` - Build for production (includes Prisma generate)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm test` - Run Jest tests

### Database Operations

- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema to database (development)
- `npx prisma migrate deploy` - Deploy migrations (production)
- `npx prisma studio` - Open database GUI
- `npx prisma db seed` - Seed database with sample data

### Docker Development

- `docker compose up` - Start PostgreSQL database locally

## Architecture Overview

### Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth
- **UI**: Radix UI + Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query for server state
- **Validation**: Zod schemas
- **Testing**: Jest with Testing Library

### Project Structure

This is a medical booking platform with a feature-based architecture:

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Dashboard route group (protected)
│   ├── (general)/         # Public route group
│   └── api/              # API routes
├── features/             # Feature modules
│   ├── auth/            # Authentication
│   ├── calendar/        # Booking & availability management
│   ├── providers/       # Service provider management
│   ├── organizations/   # Organization management
│   ├── admin/          # Admin functionality
│   ├── communications/ # Email/SMS notifications
│   ├── billing/        # Billing and pricing
│   ├── profile/        # User profile management
│   └── reviews/        # Review system
├── components/         # Shared UI components
├── lib/               # Shared utilities
└── hooks/            # Shared React hooks
```

### Feature Module Pattern

Each feature follows a consistent structure:

```
feature/
├── components/     # Feature-specific components
├── hooks/         # Feature-specific hooks
├── lib/          # Actions, queries, helpers
├── types/        # TypeScript types and schemas
└── index.ts      # Public API exports
```

### Key Architectural Patterns

1. **Route Groups**: Separate layouts for dashboard (protected) vs general (public) pages
2. **Server Actions**: Use Next.js server actions for mutations
3. **TanStack Query**: Client-side data fetching and caching
4. **Prisma**: Database operations with type-safe queries
5. **Zod Validation**: Schema validation on both client and server
6. **Role-based Access**: USER, ADMIN, SUPER_ADMIN roles

### Core Domain Models

- **User**: Base user with roles (USER/ADMIN/SUPER_ADMIN)
- **ServiceProvider**: Healthcare providers offering services
- **Organization**: Healthcare organizations with multiple providers
- **Booking**: Appointments between clients and providers
- **Availability**: Provider time slots for bookings
- **Service**: Services offered by providers

### Important Guidelines

- Database schema changes require Prisma migrations
- All forms use react-hook-form with Zod validation
- Server actions are located in feature `lib/actions.ts` files
- Always run `npm run lint` after code changes
- Authentication is handled via NextAuth.js with Google OAuth
- The `.cursorrules` file specifies to ask clarifying questions before implementing (95% confidence rule)
