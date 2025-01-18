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
