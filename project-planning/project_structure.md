# MedBookings Project Structure

```text
src/
│
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Auth-related routes grouped
│   │   └── login/                    # Google OAuth login page
│   │
│   ├── (dashboard)/                  # Protected dashboard routes
│   │   ├── admin/                    # Admin dashboard for SUPER_ADMIN & ADMIN roles
│   │   ├── bookings/                 # Booking management
│   │   │   ├── [id]/                 # Single booking view
│   │   │   └── calendar/             # Calendar view
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
│   │   ├── providers/                # Provider management
│   │   │   ├── [id]/                 # Single provider view
│   │   │   │   ├── availability/     # Provider availability
│   │   │   │   ├── compliance/       # Provider compliance
│   │   │   │   ├── services/         # Provider services
│   │   │   │   └── settings/         # Provider settings
│   │   │   └── new/                  # Create new provider
│   │   │
│   │   └── settings/                 # User settings
│   │
│   ├── (dynamic-content)/            # Public interactive content
│   │   ├── bookings/                 # User's bookings
│   │   │   ├── [id]/                 # Single booking view
│   │   │   │   ├── cancel/           # Cancel booking
│   │   │   │   ├── confirm/          # Confirm booking
│   │   │   │   ├── decline/          # Decline booking
│   │   │   │   ├── delete/           # Delete booking
│   │   │   │   └── edit/             # Edit booking
│   │   │   ├── new/                  # Create new booking
│   │   │   │   └── [slotId]/         # Create booking for specific slot
│   │   │   └── success/              # Booking success page
│   │   │
│   │   └── providers/                # Browse providers
│   │       └── [id]/                 # Single provider view
│   │           └── calendar/         # Provider's calendar for booking
│   │
│   ├── (static-content)/             # Public static content pages
│   │   ├── about/                    # About page
│   │   ├── contact/                  # Contact page
│   │   ├── features/                 # Features showcase
│   │   ├── pricing/                  # Pricing page
│   │   ├── privacy-policy/           # Privacy policy page
│   │   └── terms-of-use/             # Terms of use page
│   │
│   ├── api/                          # API routes
│   │   ├── auth/                     # Auth API endpoints
│   │   │   └── [...nextauth]/         # NextAuth.js API route
│   │   ├── availability/             # Availability API endpoints
│   │   ├── billing/                  # Billing API endpoints
│   │   ├── bookings/                 # Booking API endpoints
│   │   ├── communications/           # Communications API endpoints
│   │   ├── compliance/               # Compliance API endpoints
│   │   ├── locations/                # Location API endpoints
│   │   ├── organizations/            # Organization API endpoints
│   │   ├── providers/                # Provider API endpoints
│   │   ├── reviews/                  # Review API endpoints
│   │   ├── services/                 # Service API endpoints
│   │   └── users/                    # User API endpoints
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
│   │   ├── api/                      # Admin API handlers
│   │   ├── components/               # Admin-specific components
│   │   ├── hooks/                    # Admin-related hooks
│   │   ├── index.ts                  # Public exports
│   │   ├── lib/                      # Admin utilities and services
│   │   └── types/                    # Admin types and schemas
│   │
│   ├── auth/                         # Authentication feature (Google OAuth)
│   │   ├── api/                      # Auth API handlers
│   │   ├── components/               # Auth-specific components (e.g., AuthButton.tsx)
│   │   ├── hooks/                    # Auth-related hooks (e.g., useAuth.ts)
│   │   ├── index.ts                  # Public exports
│   │   ├── lib/                      # Auth utilities and services (e.g., auth-options.ts)
│   │   └── types/                    # Auth types and schemas
│   │
│   ├── availability/                 # Availability management feature
│   ├── billing/                      # Billing and subscription feature
│   ├── bookings/                     # Booking management feature
│   ├── communications/               # Communications feature
│   ├── compliance/                   # Compliance feature
│   ├── locations/                    # Location management feature
│   ├── organizations/                # Organization management feature
│   ├── providers/                    # Provider management feature
│   ├── reviews/                      # Reviews feature
│   ├── services/                     # Service management feature
│   └── users/                        # User management feature
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
