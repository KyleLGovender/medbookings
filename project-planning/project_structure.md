# MedBookings Project Structure

```text
src/
│
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Auth-related routes grouped
│   │   ├── login/                    # Login page
│   │   ├── register/                 # Registration page
│   │   ├── forgot-password/          # Password recovery
│   │   └── verify-email/             # Email verification
│   │
│   ├── (dashboard)/                  # Protected dashboard routes
│   │   ├── dashboard/                # Main dashboard
│   │   ├── profile/                  # User profile
│   │   ├── organizations/            # Organization management
│   │   │   ├── [id]/                 # Single organization view
│   │   │   │   ├── members/          # Organization members
│   │   │   │   ├── locations/        # Organization locations
│   │   │   │   ├── settings/         # Organization settings
│   │   │   │   └── billing/          # Organization billing
│   │   │   └── new/                  # Create new organization
│   │   │
│   │   ├── providers/                # Provider management
│   │   │   ├── [id]/                 # Single provider view
│   │   │   │   ├── services/         # Provider services
│   │   │   │   ├── availability/     # Provider availability
│   │   │   │   ├── compliance/       # Provider compliance
│   │   │   │   └── settings/         # Provider settings
│   │   │   └── new/                  # Create new provider
│   │   │
│   │   ├── bookings/                 # Booking management
│   │   │   ├── [id]/                 # Single booking view
│   │   │   └── calendar/             # Calendar view
│   │   │
│   │   └── settings/                 # User settings
│   │
│   ├── (marketing)/                  # Public marketing pages
│   │   ├── about/                    # About page
│   │   ├── pricing/                  # Pricing page
│   │   ├── contact/                  # Contact page
│   │   └── features/                 # Features showcase
│   │
│   ├── api/                          # API routes
│   │   ├── auth/                     # Auth API endpoints
│   │   ├── users/                    # User API endpoints
│   │   ├── organizations/            # Organization API endpoints
│   │   ├── providers/                # Provider API endpoints
│   │   ├── services/                 # Service API endpoints
│   │   ├── locations/                # Location API endpoints
│   │   ├── availability/             # Availability API endpoints
│   │   ├── bookings/                 # Booking API endpoints
│   │   ├── billing/                  # Billing API endpoints
│   │   ├── communications/           # Communications API endpoints
│   │   ├── reviews/                  # Review API endpoints
│   │   └── compliance/               # Compliance API endpoints
│   │
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Homepage
│   └── error.tsx                     # Global error handling
│
├── features/                         # Feature modules
│   ├── auth/                         # Authentication feature
│   │   ├── api/                      # Auth API handlers
│   │   ├── components/               # Auth-specific components
│   │   ├── hooks/                    # Auth-related hooks
│   │   ├── lib/                      # Auth utilities and services
│   │   ├── types/                    # Auth types and schemas
│   │   └── index.ts                  # Public exports
│   │
│   ├── users/                        # User management feature
│   ├── providers/                    # Provider management feature
│   ├── organizations/                # Organization management feature
│   ├── locations/                    # Location management feature
│   ├── services/                     # Service management feature
│   ├── availability/                 # Availability management feature
│   ├── bookings/                     # Booking management feature
│   ├── billing/                      # Billing and subscription feature
│   ├── communications/               # Communications feature
│   ├── reviews/                      # Reviews feature
│   └── compliance/                   # Compliance feature
│
├── components/                       # Shared UI components
│   ├── ui/                           # Base UI components
│   │   ├── button.tsx                # Button component
│   │   ├── input.tsx                 # Input component
│   │   ├── select.tsx                # Select component
│   │   ├── modal.tsx                 # Modal component
│   │   └── ...                       # Other UI components
│   │
│   ├── layout/                       # Layout components
│   │   ├── header.tsx                # Header component
│   │   ├── footer.tsx                # Footer component
│   │   ├── sidebar.tsx               # Sidebar component
│   │   └── ...                       # Other layout components
│   │
│   ├── forms/                        # Form-related components
│   │   ├── form.tsx                  # Form wrapper
│   │   ├── form-field.tsx            # Form field
│   │   └── ...                       # Other form components
│   │
│   └── data-display/                 # Data display components
│       ├── table.tsx                 # Table component
│       ├── card.tsx                  # Card component
│       └── ...                       # Other data display components
│
├── hooks/                            # Shared hooks
│   ├── use-form.ts                   # Form handling hook
│   ├── use-toast.ts                  # Toast notification hook
│   ├── use-media-query.ts            # Media query hook
│   └── ...                           # Other shared hooks
│
├── lib/                              # Shared utilities and services
│   ├── api/                          # API-related utilities
│   │   ├── api-handler.ts            # API handler factory
│   │   ├── api-client.ts             # API client for frontend
│   │   ├── middleware.ts             # API middleware
│   │   └── error-handling.ts         # Error handling utilities
│   │
│   ├── auth/                         # Auth utilities
│   │   ├── session.ts                # Session management
│   │   └── permissions.ts            # Permission utilities
│   │
│   ├── db/                           # Database utilities
│   │   ├── prisma.ts                 # Prisma client
│   │   └── transaction.ts            # Transaction utilities
│   │
│   ├── validation/                   # Validation utilities
│   │   ├── schemas/                  # Shared Zod schemas
│   │   └── helpers.ts                # Validation helpers
│   │
│   └── utils/                        # Miscellaneous utilities
│       ├── date.ts                   # Date utilities
│       ├── format.ts                 # Formatting utilities
│       └── ...                       # Other utilities
│
├── types/                            # Shared TypeScript types
│   ├── api.ts                        # API-related types
│   ├── auth.ts                       # Auth-related types
│   ├── common.ts                     # Common types
│   └── ...                           # Other type definitions
│
├── styles/                           # Global styles
│   ├── globals.css                   # Global CSS
│   └── theme.ts                      # Theme configuration
│
└── config/                           # Application configuration
    ├── constants.ts                  # Constants
    ├── site.ts                       # Site metadata
    └── features.ts                   # Feature flags
```
