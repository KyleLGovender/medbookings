# MedBookings Project Structure

```text
src/
│
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Auth-related routes grouped
│   │   └── login/                    # Google OAuth login page
│   │
│   ├── (compliance)/                 # Legal and compliance pages
│   │   ├── privacy-policy/           # Privacy policy
│   │   └── terms-of-use/             # Terms of use
│   │
│   ├── (dashboard)/                  # Protected dashboard routes
│   │   ├── admin/                    # Admin dashboard for SUPER_ADMIN & ADMIN roles
│   │   ├── calendar/                 # Calendar management
│   │   │   ├── availability/         # Availability management
│   │   │   └── bookings/             # Booking management
│   │   │       ├── [id]/             # Single booking view
│   │   │       └── calendar/         # Calendar view
│   │   │
│   │   ├── dashboard/                # Main dashboard
│   │   ├── organizations/            # Organization management
│   │   │   ├── [id]/                 # Single organization view
│   │   │   │   ├── billing/          # Organization billing
│   │   │   │   ├── locations/        # Organization locations
│   │   │   │   ├── members/          # Organization members
│   │   │   │   └── settings/         # Organization settings
│   │   │   └── new/                  # Create new organization
│   │   │
│   │   ├── profile/                  # User profile
│   │   ├── service-providers/        # Provider management
│   │   │   ├── [id]/                 # Single provider view
│   │   │   │   ├── compliance/       # Provider compliance
│   │   │   │   ├── services/         # Provider services
│   │   │   │   └── settings/         # Provider settings
│   │   │   └── new/                  # Create new provider
│   │   │
│   │   └── settings/                 # User settings
│   │
│   ├── bookings/                     # Public booking routes
│   │   ├── [id]/                     # Single booking view
│   │   ├── new/                      # Create new booking
│   │   └── success/                  # Booking success page
│   │
│   ├── join-medbookings/             # Onboarding and signup pages
│   │
│   ├── providers/                    # Public provider discovery
│   │   ├── [id]/                     # Single provider view
│   │   └── bookings/                 # Provider's bookings page
│   │
│   ├── api/                          # API routes
│   │   ├── auth/                     # Auth API endpoints
│   │   ├── billing/                  # Billing API endpoints
│   │   ├── calendar/                 # Calendar API endpoints
│   │   │   ├── availability/         # Availability API endpoints
│   │   │   └── bookings/             # Bookings API endpoints
│   │   ├── communications/           # Communications API endpoints
│   │   ├── debug-session/            # Debug session API endpoints
│   │   ├── organizations/            # Organizations API endpoints (includes locations)
│   │   ├── profile/                  # Profile API endpoints
│   │   ├── providers/                # Providers API endpoints (includes compliance)
│   │   ├── reviews/                  # Reviews API endpoints
│   │   └── whatsapp-callback/        # WhatsApp webhook callback
│   │
│   ├── error.tsx                     # Global error handling
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Homepage
│
├── components/                       # Shared UI components
│   ├── data-display/                 # Data display components
│   │   ├── card.tsx                  # Card component
│   │   ├── table.tsx                 # Table component
│   │   └── ...                       # Other data display components
│   │
│   ├── forms/                        # Form-related components
│   │   ├── form-field.tsx            # Form field
│   │   ├── form.tsx                  # Form wrapper
│   │   └── ...                       # Other form components
│   │
│   ├── layout/                       # Layout components
│   │   ├── footer.tsx                # Footer component
│   │   ├── header.tsx                # Header component
│   │   ├── sidebar.tsx               # Sidebar component
│   │   └── ...                       # Other layout components
│   │
│   └── ui/                           # Base UI components
│       ├── button.tsx                # Button component
│       ├── input.tsx                 # Input component
│       ├── modal.tsx                 # Modal component
│       ├── select.tsx                # Select component
│       └── ...                       # Other UI components
│
├── config/                           # Application configuration
│   ├── constants.ts                  # Constants
│   ├── features.ts                   # Feature flags
│   └── site.ts                       # Site metadata
│
├── features/                         # Feature modules
│   ├── admin/                        # Admin feature (management for ADMIN/SUPER_ADMIN)
│   │   ├── components/               # Admin-specific components
│   │   ├── hooks/                    # Admin-related hooks
│   │   ├── index.ts                  # Public exports
│   │   ├── lib/                      # Admin utilities and services (including API handlers)
│   │   └── types/                    # Admin types and schemas
│   │
│   ├── auth/                         # Authentication feature (Google OAuth)
│   ├── billing/                      # Billing and subscription feature
│   ├── calendar/                     # Calendar management feature
│   │   ├── availability/             # Availability management subfolder
│   │   └── bookings/                 # Bookings management subfolder
│   │
│   ├── communications/               # Communications feature
│   ├── organizations/                # Organization management feature (includes locations)
│   ├── providers/                    # Provider management feature (includes services and compliance)
│   ├── profile/                      # User profile and account management
│   └── reviews/                      # Reviews feature
│
├── hooks/                            # Shared hooks
│   ├── use-form.ts                   # Form handling hook
│   ├── use-media-query.ts            # Media query hook
│   ├── use-toast.ts                  # Toast notification hook
│   └── ...                           # Other shared hooks
│
├── lib/                              # Shared utilities and services
│   ├── api/                          # API-related utilities
│   │   ├── api-client.ts             # API client for frontend
│   │   ├── api-handler.ts            # API handler factory
│   │   ├── error-handling.ts         # Error handling utilities
│   │   └── middleware.ts             # API middleware
│   │
│   ├── auth/                         # Auth utilities
│   │   ├── permissions.ts            # Permission utilities
│   │   └── session.ts                # Session management
│   │
│   ├── db/                           # Database utilities
│   │   ├── prisma.ts                 # Prisma client
│   │   └── transaction.ts            # Transaction utilities
│   │
│   ├── utils/                        # Miscellaneous utilities
│   │   ├── date.ts                   # Date utilities
│   │   ├── format.ts                 # Formatting utilities
│   │   └── ...                       # Other utilities
│   │
│   └── validation/                   # Validation utilities
│       ├── helpers.ts                # Validation helpers
│       └── schemas/                  # Shared Zod schemas
│
├── styles/                           # Global styles
│   ├── globals.css                   # Global CSS
│   └── theme.ts                      # Theme configuration
│
└── types/                            # Shared TypeScript types
    ├── api.ts                        # API-related types
    ├── auth.ts                       # Auth-related types
    ├── common.ts                     # Common types
    └── ...                           # Other type definitions
```
