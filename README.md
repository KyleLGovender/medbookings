# MedBookings - Healthcare Appointment Management Platform

A comprehensive healthcare appointment booking and management system built with Next.js 14, tRPC, and PostgreSQL.

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **API**: tRPC for type-safe APIs
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth & Credentials
- **Styling**: Tailwind CSS + Radix UI + shadcn/ui
- **State Management**: tRPC + TanStack Query
- **Validation**: Zod schemas
- **Testing**: Playwright E2E tests
- **Deployment**: Vercel with PostgreSQL

## 📋 Features

### Core Modules
- **Authentication & Authorization**: Google OAuth, credentials login, role-based access (ADMIN, PROVIDER, USER)
- **Provider Management**: Profile creation, service offerings, availability scheduling
- **Calendar System**: Availability management, slot generation, booking conflicts prevention
- **Booking System**: Guest bookings, user bookings, provider-initiated bookings
- **Organizations**: Multi-provider practices, team management, shared resources
- **Communications**: Email (SendGrid), SMS/WhatsApp (Twilio), automated notifications
- **Admin Dashboard**: Provider approval, user management, system monitoring
- **Billing & Subscriptions**: Tiered plans, usage tracking (prepared, not fully implemented)
- **Reviews & Ratings**: Patient feedback system (module present)

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── features/              # Feature-based modules
│   ├── admin/            # Admin dashboard
│   ├── auth/             # Authentication
│   ├── billing/          # Subscription management
│   ├── calendar/         # Scheduling system
│   ├── communications/   # Notifications
│   ├── organizations/    # Multi-provider support
│   ├── providers/        # Provider management
│   └── settings/         # User settings
├── server/
│   ├── api/
│   │   ├── root.ts      # tRPC router aggregation
│   │   └── routers/     # tRPC procedure definitions
│   └── trpc.ts          # tRPC configuration
├── lib/                   # Shared utilities
├── components/            # Reusable UI components
└── types/                # TypeScript type definitions
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Docker (for local PostgreSQL)
- npm or yarn

### Environment Setup

1. **Clone and install dependencies:**
```bash
git clone <repository>
cd medbookings
npm install
```

2. **Copy environment variables:**
```bash
cp .env.example .env
```

3. **Configure required environment variables:**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/medbookings"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-secure-secret"

# Google OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Google Maps (for location services)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""

# Communications (optional)
SENDGRID_API_KEY=""
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
```

### Database Setup

1. **Start PostgreSQL with Docker:**
```bash
docker compose up -d
```

2. **Run migrations:**
```bash
npx prisma migrate dev
```

3. **Generate Prisma client:**
```bash
npx prisma generate
```

4. **Seed database (optional):**
```bash
npx prisma db seed
```

5. **View database:**
```bash
npx prisma studio
```

### Development

```bash
npm run dev
# Open http://localhost:3000
```

## 📦 Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier

### Database Management
- `npm run db:migrate` - Apply migrations
- `npm run db:migrate:dev` - Create and apply dev migrations
- `npm run db:integrity` - Check database health

### Testing
- `npm run test` - Run all E2E tests
- `npm run test:headed` - Run tests with visible browser
- `npm run test:ui` - Open Playwright test explorer
- `npm run test:auth` - Test authentication flows
- `npm run test:booking` - Test booking system
- `npm run test:provider` - Test provider features
See [README-E2E-TESTING.md](./README-E2E-TESTING.md) for detailed testing documentation.

### Vercel Production
- `npm run verceldb:migrate` - Deploy migrations to Vercel
- `npm run verceldb:studio` - Open Vercel database studio
- `npm run verceldb:seed` - Seed Vercel database

### Workflow & Validation
- `npm run workflow:check` - Check workflow configuration
- `npm run validate:all` - Run all validations
- `npm run architecture:check` - Validate architecture compliance

## 🔐 Authentication

The system supports two authentication methods:

### Google OAuth
- Automatic user creation on first login
- Profile information synced from Google

### Credentials (Email/Password)
- Manual registration required
- Email verification flow
- Password reset functionality

### User Roles
- **ADMIN**: Full system access, provider approval
- **PROVIDER**: Service provider with calendar management
- **USER**: Standard user, can book appointments
- **Guest**: No login required for basic booking

## 📊 API Architecture (tRPC)

The application uses tRPC for type-safe API communication:

```typescript
// Example: Fetching providers
import { api } from '@/utils/api';

const { data: providers } = api.providers.getAll.useQuery();
```

### Available tRPC Routers
- `admin` - Admin operations
- `auth` - Authentication procedures
- `calendar` - Availability and booking management
- `communications` - Notification handling
- `organizations` - Multi-provider practice management
- `profile` - User profile operations
- `providers` - Provider search and management
- `settings` - User preferences

## 🏥 Healthcare Compliance

### POPIA Compliance (South African Privacy Law)
- Audit trails for data access
- Consent tracking mechanisms
- Data encryption in transit and at rest
- Session timeout enforcement

### Data Security
- PHI (Protected Health Information) isolation
- Role-based access control
- Secure communication channels
- Regular security audits

## 🚢 Deployment

### Vercel Deployment

1. **Push to GitHub**
2. **Connect to Vercel**
3. **Configure environment variables** in Vercel dashboard
4. **Set up PostgreSQL database** in Vercel Storage
5. **Deploy**

### Production Environment Variables

Required for production:
- `DATABASE_URL` - Production PostgreSQL URL
- `NEXTAUTH_URL` - Production domain
- `NEXTAUTH_SECRET` - Secure random string
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - For OAuth
- Communication service keys (SendGrid, Twilio) as needed

### Database Migrations in Production

```bash
# Pull production environment
vercel env pull .env.vercel.production.local

# Run migrations
npm run verceldb:migrate

# Verify integrity
npm run db:integrity:production
```

## 🧪 Testing

Comprehensive E2E testing with Playwright. See [README-E2E-TESTING.md](./README-E2E-TESTING.md) for detailed documentation.

Quick test commands:
```bash
npm run test          # Run all tests
npm run test:headed   # Watch tests run
npm run test:debug    # Debug mode
```

## 📚 Documentation

- [E2E Testing Guide](./README-E2E-TESTING.md) - Complete testing documentation
- [CLAUDE.md](./CLAUDE.md) - AI development guidelines and patterns
- [Workflow Documentation](./.claude/WORKFLOW.md) - Development workflow

## 🛠️ Troubleshooting

### Common Issues

**Database Connection Issues:**
```bash
# Restart Docker
docker compose down
docker compose up -d

# Verify connection
npx prisma db push
```

**Build Errors:**
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

**Authentication Issues:**
- Verify `NEXTAUTH_URL` matches your domain
- Check `NEXTAUTH_SECRET` is set
- Ensure Google OAuth credentials are correct

## 🤝 Contributing

1. Follow the PRP workflow in `.claude/WORKFLOW.md`
2. Ensure all tests pass
3. Run architecture checks before PRs
4. Follow TypeScript strict mode
5. Use the established patterns in CLAUDE.md

## 📄 License

Private repository - All rights reserved

---

Built with ❤️ using Next.js, tRPC, and PostgreSQL