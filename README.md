This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

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

This project is configured for deployment to Vercel with PostgreSQL.

### Prerequisites

1. A Vercel account
2. A Vercel PostgreSQL database (or another PostgreSQL provider)

### Deployment Steps

1. Install the Vercel CLI:

   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:

   ```bash
   vercel login
   ```

3. Deploy the project:

   ```bash
   vercel
   ```

4. During deployment, Vercel will ask you to configure environment variables. Make sure to set up:

   - `DATABASE_URL`: Your PostgreSQL connection string
   - `AUTH_SECRET`: A secure random string for NextAuth.js
   - Other environment variables as needed (Google OAuth, Twilio, SendGrid, etc.)

5. Connect your Vercel PostgreSQL database:

   - Go to your Vercel project dashboard
   - Navigate to Storage
   - Create a new PostgreSQL database
   - Vercel will automatically set up the `DATABASE_URL` environment variable

6. Run database migrations:

   ```bash
   vercel env pull .env.production.local
   npx prisma migrate deploy
   ```

7. Your application should now be deployed and connected to the database!

### Production Considerations

- Make sure to set `NEXTAUTH_URL` to your production URL
- Configure proper CORS settings if needed
- Set up proper authentication providers for production

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

## KYLE'S Development Workflow

This project uses a structured workflow system for feature development and issue tracking.

### Quick Commands

- `feature required: [description]` - Request new feature
- `issue fix required: [description]` - Report bug/issue
- `implement feature tasks from: [file]` - Execute feature
- `implement issue tasks from: [file]` - Fix issue

All workflows automatically manage the project backlog at `/workflow/backlog.md`.

# Workflow System Documentation

## Overview

This workflow system provides structured project management through AI-assisted automation. All workflows are triggered by simple commands and automatically manage the project backlog.

## Quick Start

### Primary Commands

- `feature required: [description]` - Create a new feature with PRD and tasks
- `issue fix required: [description]` - Create an issue specification with tasks
- `implement feature tasks from: [filename]` - Execute feature implementation
- `implement issue tasks from: [filename]` - Execute issue resolution
- `quick feature note: [idea]` - Capture feature idea without full spec
- `quick issue note: [problem]` - Capture issue without full investigation

## File Structure

/workflow/
├── backlog.md # Central task tracking
├── complete.md # Completed work archive
├── prds/ # Feature specifications
│ ├── [name]-prd.md # Product Requirements Document
│ └── [name]-prd-tasks.md # Implementation Tasks
└── issues/ # Issue specifications
├── [name]-issue.md # Issue Specification
└── [name]-issue-tasks.md # Resolution Tasks

## Workflow Instructions

Workflow command files are located in `/.claude/commands/`:

- `feature-workflow.md` - Feature development flow
- `issue-workflow.md` - Issue resolution flow
- `tasks-process-enhanced.md` - Task implementation
- `quick-note-workflow.md` - Quick capture

## Key Features

- **Automatic Backlog Management**: All items automatically tracked in backlog.md
- **User Confirmation**: Requires satisfaction confirmation before marking complete
- **Git Integration**: Automatic branch creation and PR generation
- **Progress Tracking**: Visual task completion with `[x]` marks
- **Historical Archive**: Completed work preserved in complete.md

## Workflow States

| State       | Location                | Status        | Next Action         |
| ----------- | ----------------------- | ------------- | ------------------- |
| Idea        | backlog.md (quick note) | `[ ]`         | Expand to full spec |
| Specified   | /prds/ or /issues/      | `[ ]`         | Generate tasks      |
| In Progress | Task file               | `[ ]` → `[x]` | Implement           |
| Complete    | complete.md             | `[x]`         | Archived            |

## Best Practices

1. Use quick notes during meetings for rapid capture
2. Convert quick notes to full specs when ready to implement
3. Always wait for user confirmation before marking complete
4. Review backlog.md regularly for prioritization
5. Check complete.md for historical reference
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
