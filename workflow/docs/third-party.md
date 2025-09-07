# Third-Party Technologies Documentation

This document provides an index of third-party technology documentation for the MedBookings application. Each technology has been analyzed and documented with practical examples.

## Frameworks

### 🚀 [Next.js 14](./frameworks/next-js-14.md)

- **Version**: 14.2.15
- **Key Features**: App Router, Server Components, Server Actions, Route Handlers
- **Usage**: Core framework for the MedBookings web application

### 📝 [React Hook Form v7](./frameworks/react-hook-form-v7.md)

- **Version**: 7.57.0
- **Key Features**: Form validation, type safety, performance optimization
- **Usage**: Form handling throughout the application

## APIs & Data Management

### 🔐 [NextAuth.js v4](./apis/nextauth-v4.md)

- **Version**: 4.24.10
- **Key Features**: OAuth providers, JWT/database sessions, middleware protection
- **Usage**: Authentication and authorization system

### 🗄️ [Prisma 5](./apis/prisma-5.md)

- **Version**: 5.22.0
- **Key Features**: Type-safe database client, schema management, migrations
- **Usage**: Primary ORM for PostgreSQL database operations

### 🔄 [TanStack Query v5](./apis/tanstack-query-v5.md)

- **Version**: 5.60.6
- **Key Features**: Server state management, caching, mutations, optimistic updates
- **Usage**: API data fetching and state management

## Libraries

### ✅ [Zod v3](./libraries/zod-v3.md)

- **Version**: 3.25.48
- **Key Features**: Schema validation, type inference, runtime validation
- **Usage**: Data validation and type safety

## UI & Styling

### 🎨 [Tailwind CSS](./ui/tailwind-css.md)

- **Version**: 3.4.1
- **Key Features**: Utility-first CSS, responsive design, dark mode
- **Usage**: Primary styling solution

### 🎨 [shadcn/ui](./ui/shadcn-ui.md)

- **Key Features**: Copy-paste components, Radix UI primitives, full customization
- **Usage**: Primary component library built on Radix UI and Tailwind CSS

## Quick Reference

### Package Versions in Use

```json
{
  "next": "14.2.15",
  "@prisma/client": "5.22.0",
  "next-auth": "4.24.10",
  "@tanstack/react-query": "5.60.6",
  "react-hook-form": "7.57.0",
  "zod": "3.25.48",
  "tailwindcss": "3.4.1"
}
```

### Development Commands

- `npm run dev` - Start development server
- `npm run build` - Production build (includes Prisma generate)
- `npx prisma generate` - Generate Prisma client
- `npx prisma migrate dev` - Apply database migrations
- `pnpm dlx shadcn@latest add [component]` - Add shadcn/ui components

## Architecture Notes

The MedBookings application follows these architectural patterns:

1. **Feature-based structure** - Each feature has its own components, hooks, and API layers
2. **Type-safe development** - Comprehensive use of TypeScript and Zod validation
3. **Server-first approach** - Leveraging Next.js Server Components and Server Actions
4. **Optimistic UI updates** - Using TanStack Query for smooth user experiences
5. **Form-first design** - React Hook Form with Zod validation for all user inputs
6. **Component-driven UI** - shadcn/ui components with Tailwind CSS styling

## Directory Structure

```
/workflow/docs/
├── frameworks/          # Web frameworks and form libraries
├── apis/               # APIs and data management tools
├── libraries/          # Utility libraries (validation, etc.)
├── ui/                 # UI frameworks and styling solutions
└── third-party-apis.md # This index file
```

Last updated: January 2025
