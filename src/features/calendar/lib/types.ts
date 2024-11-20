import type { Availability as PrismaAvailability, Booking as PrismaBooking } from '@prisma/client';
import { z } from 'zod';

export type ViewType = 'day' | 'week' | 'schedule';

export const availabilityFormSchema = z.object({
  startTime: z.date(),
  endTime: z.date(),
  duration: z.number().min(1),
  price: z.number().min(0),
  isOnlineAvailable: z.boolean(),
  isInPersonAvailable: z.boolean(),
  location: z.string(),
  isRecurring: z.boolean(),
  recurringDays: z.array(z.number()).optional().default([]),
  recurrenceEndDate: z.date().nullable().optional(),
});

export type AvailabilityFormValues = z.infer<typeof availabilityFormSchema>;

// Extend Prisma types with frontend-specific modifications
export interface Availability extends Omit<PrismaAvailability, 'price'> {
  price: number; // Convert Decimal to number for frontend
  maxBookings: number;
  remainingSpots: number;
  serviceProviderId: string;
  isRecurring: boolean;
  recurringDays: number[];
  recurrenceEndDate: Date | null;
}

export interface Booking extends Omit<PrismaBooking, 'price'> {
  price: number;
  client: {
    name: string;
  };
  status: 'PENDING' | 'CONFIRMED' | 'NO_SHOW' | 'CANCELLED' | 'COMPLETED';
  isOnline: boolean;
}

export interface AvailabilityWithBookings extends Availability {
  bookings: (Omit<Booking, 'client'> & {
    client: {
      name: string | null;
    };
  })[];
}
