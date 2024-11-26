import { z } from 'zod';

export type ViewType = 'day' | 'week' | 'schedule';

export const availabilityFormSchema = z
  .object({
    date: z.date(),
    startTime: z.date(),
    endTime: z.date(),
    duration: z.number().min(1),
    price: z.number().min(10),
    isOnlineAvailable: z.boolean(),
    isInPersonAvailable: z.boolean(),
    location: z.string(),
    isRecurring: z.boolean(),
    recurringDays: z.array(z.number()),
    recurrenceEndDate: z.date().nullable(),
  })
  .superRefine((data, ctx) => {
    if (!data.isOnlineAvailable && !data.isInPersonAvailable) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one availability type (Online or In-Person) must be selected',
        path: ['root'],
      });
    }

    if (data.isRecurring && (!data.recurringDays || data.recurringDays.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select at least one day for recurring availability',
        path: ['recurringDays'],
      });
    }
  });

export type AvailabilityFormValues = z.infer<typeof availabilityFormSchema>;

export interface Availability {
  id: string;
  serviceProviderId: string;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  recurringDays: number[];
  recurrenceEndDate: string | null;
  duration: number;
  price: number;
  isOnlineAvailable: boolean;
  isInPersonAvailable: boolean;
  location: string;
  maxBookings: number;
  remainingSpots: number;
  createdAt: string;
  updatedAt: string;
}

export function transformAvailability(availability: any): Availability {
  return {
    ...availability,
    price:
      typeof availability.price === 'object' && 'toNumber' in availability.price
        ? availability.price.toNumber()
        : Number(availability.price),
    startTime: new Date(availability.startTime).toISOString(),
    endTime: new Date(availability.endTime).toISOString(),
    recurrenceEndDate: availability.recurrenceEndDate
      ? new Date(availability.recurrenceEndDate).toISOString()
      : null,
    createdAt: new Date(availability.createdAt).toISOString(),
    updatedAt: new Date(availability.updatedAt).toISOString(),
    recurringDays: Array.isArray(availability.recurringDays)
      ? availability.recurringDays
      : JSON.parse(availability.recurringDays || '[]'),
  };
}

export interface Booking extends Omit<PrismaBooking, 'price'> {
  price: number;
  client: {
    name: string;
  };
  status: 'PENDING' | 'CONFIRMED' | 'NO_SHOW' | 'CANCELLED' | 'COMPLETED';
  isOnline: boolean;
}

export interface Schedule extends Availability {
  bookings: (Omit<Booking, 'client'> & {
    client: {
      name: string | null;
    };
  })[];
}
