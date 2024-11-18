'use server';

import { z } from 'zod';

const availabilitySchema = z.object({
  dayOfWeek: z.string().min(1, 'Day of week is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  isRecurring: z.boolean().default(true),
});

export type AvailabilityFormData = z.infer<typeof availabilitySchema>;

export async function createAvailability(formData: FormData) {
  const validatedFields = availabilitySchema.safeParse({
    dayOfWeek: formData.get('dayOfWeek'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    isRecurring: formData.get('isRecurring') === 'on',
  });

  if (!validatedFields.success) {
    return {
      error: 'Invalid form data',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    // TODO: Add your database operation here
    // Example:
    // await db.availability.create({
    //   data: validatedFields.data
    // })

    return {
      success: true,
      data: validatedFields.data,
    };
  } catch (error) {
    return {
      error: 'Failed to create availability',
    };
  }
}
