This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## ⚡ Quick Start

### Environment Setup (REQUIRED)

1. **Create your local environment file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in required values** (see [Environment Setup Guide](/docs/setup/ENVIRONMENT-SETUP.md))
   - Database URL (local PostgreSQL)
   - Authentication secrets
   - API keys (OAuth, SendGrid, Twilio)

3. **IMPORTANT:**
   - ✅ Use `.env.local` for development (gitignored)
   - ❌ NEVER commit secrets to git
   - 📚 Full guide: [`/docs/setup/ENVIRONMENT-SETUP.md`](/docs/setup/ENVIRONMENT-SETUP.md)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Starting docker

There is a docker-compose.yaml file that defines the services to run locally on Docker
First make sure docker is running on the system then execute this command

```bash
docker compose up
```

This will start a postgres database for local development

### Prisma

To reset the database and delete all migrations

Delete the migrations folder

```bash
rd /s /q prisma\migrations
```

Delete the generated Prisma client

```bash
rd /s /q node_modules\.prisma
```

Delete the generated client from node_modules

```bash
rd /s /q node_modules\@prisma
```

Delete the Prisma generated types

```bash
del /f /q prisma\zod\*
```

NPM Install

```bash
npm install
```

Push the schema directly to the database (skips migrations)

```bash
npx prisma db push
```

Generate the prisma client

```bash
npx prisma generate
```

Seed the database

```bash
npx prisma db seed
```

To see the database run the following command

```bash
npx prisma studio
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

This project is deployed on Vercel. See [VERCEL-DEPLOYMENT.md](./docs/deployment/VERCEL-DEPLOYMENT.md) for complete deployment instructions.

## Booking System

### Use Cases

The booking system supports the following scenarios:

1. Service Provider booking for guest
2. Service Provider booking for user
3. Guest booking for themselves
4. User booking for themselves
5. User booking for a guest (e.g., booking for a friend)
6. Admin/staff making bookings (non-service provider staff)

### Implementation Details

#### Form Components

The booking system uses the following components:

```mermaid
graph TD
A[@prisma/zod/index.ts] --> |Exports| B[AvailabilitySchema]
A --> |Exports| C[BookingSchema]

B --> |z.infer| D[Availability type]
C --> |z.infer| E[Booking type]

B --> |z.extend| F[availabilityFormSchema]
C --> |z.extend| G[BookingFormSchema]

F --> |z.infer| H[AvailabilityFormValues]
G --> |z.infer| I[BookingFormValues]

style A fill:#f9f,stroke:#333
style B fill:#bbf,stroke:#333
style C fill:#bbf,stroke:#333
style D fill:#dfd,stroke:#333
style E fill:#dfd,stroke:#333
style F fill:#fdb,stroke:#333
style G fill:#fdb,stroke:#333
style H fill:#dfd,stroke:#333
style I fill:#dfd,stroke:#333
```

```typescript
// components/booking/booking-form.tsx
- BookingForm: Main form component with dynamic fields based on booking type
- UserSelector: Autocomplete component for selecting registered users
- GuestForm: Form for guest details when booking for non-registered users
- ServiceSelector: Component for selecting available services
- DateTimePicker: Component for selecting booking date and time
```

#### Validation Schemas

```typescript
// lib/validations/booking.ts
export const bookingSchema = z.object({
  bookingType: z.enum(['SELF', 'OTHER_USER', 'GUEST']),
  userId: z.string().optional(),
  guestDetails: z
    .object({
      firstName: z.string().min(2),
      lastName: z.string().min(2),
      email: z.string().email(),
      phone: z.string().optional(),
    })
    .optional(),
  serviceId: z.string(),
  dateTime: z.date(),
  notes: z.string().optional(),
});
```

#### Server Actions

```typescript
// app/actions/booking.ts
- createBooking: Handles all booking creation scenarios
- validateBookingAccess: Checks authorization for booking operations
- handleGuestBooking: Processes guest bookings
- handleUserBooking: Processes user bookings
```

#### Authorization

The following checks are implemented:

- Service providers can book for anyone
- Users can book for themselves
- Admin staff have full booking privileges
- Guests can only book for themselves

For detailed implementation and usage examples, refer to the documentation in each component and utility file.

## Deployment to Vercel

This project is deployed on **Vercel** with **Neon PostgreSQL** database and **Vercel Blob Storage** for file uploads.

### Quick Deploy

The easiest way to deploy is to use the Vercel Platform:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/KyleLGovender/medbookings)

### Prerequisites

1. Vercel account (free tier available)
2. PostgreSQL database (Neon, Supabase, or similar)
3. Vercel Blob Storage (included with Vercel)
4. GitHub repository access

### Deployment Steps

1. **Connect Repository to Vercel:**
   - Log in to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `master` branch for production

2. **Configure Environment Variables:**
   Add these in Vercel Dashboard → Project → Settings → Environment Variables:
   ```bash
   # Database
   DATABASE_URL=postgresql://user:pass@db-host:5432/dbname?sslmode=require

   # Authentication
   NEXTAUTH_SECRET=your-secure-random-string-min-32-chars
   NEXTAUTH_URL=https://your-domain.vercel.app

   # Google OAuth
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-api-key

   # Vercel Blob Storage (auto-configured)
   BLOB_READ_WRITE_TOKEN=vercel-auto-generates-this

   # Communications
   TWILIO_ACCOUNT_SID=your-twilio-sid
   TWILIO_AUTH_TOKEN=your-twilio-token
   TWILIO_PHONE_NUMBER=your-phone-number
   SENDGRID_API_KEY=your-sendgrid-key
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com

   # Admin
   ADMIN_EMAILS=admin@yourdomain.com
   ADMIN_NOTIFICATION_EMAIL=admin@yourdomain.com
   ```

3. **Database Setup:**
   ```bash
   # Run migrations
   npx prisma migrate deploy

   # Seed initial data
   npm run seed:production
   ```

4. **Deploy:**
   - Automatic: Push to `master` branch triggers deployment
   - Manual: Vercel Dashboard → "Deploy" button

For detailed deployment guide, see [VERCEL-DEPLOYMENT.md](./docs/deployment/VERCEL-DEPLOYMENT.md)

### Production Considerations

- Set `NEXTAUTH_URL` to your production domain
- Configure custom domain in Vercel Dashboard
- Enable automatic SSL certificates (Vercel handles this)
- Set up Google OAuth callback URL: `https://your-domain.com/api/auth/callback/google`
- Configure rate limiting with Upstash Redis (see [UPSTASH-REDIS-SETUP.md](./docs/deployment/UPSTASH-REDIS-SETUP.md))
- Review security checklist (see [SECURITY-CHECKLIST.md](./docs/compliance/SECURITY-CHECKLIST.md))

//Testing changes
