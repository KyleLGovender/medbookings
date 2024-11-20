import { z } from 'zod';

export type ViewType = 'day' | 'week' | 'month' | 'consults' | 'schedule';

export const availabilityFormSchema = z.object({
  startTime: z.date(),
  endTime: z.date(),
  duration: z.number().min(1),
  price: z.number().min(0),
  isOnlineAvailable: z.boolean(),
  isInPersonAvailable: z.boolean(),
  location: z.string().optional(),
  isRecurring: z.boolean(),
  recurringDays: z.array(z.number().int().min(0).max(6)).optional(),
  recurrenceEndDate: z.date().optional(),
});

export type AvailabilityFormValues = z.infer<typeof availabilityFormSchema>;
