import {
  AccountSchema,
  BookingSchema,
  NotificationPreferenceSchema,
  RequirementSubmissionSchema,
  ReviewSchema,
  ServiceProviderSchema,
  UserSchema,
} from '@prisma/zod';
import { z } from 'zod';

export type User = z.infer<typeof UserSchema> & {
  accounts: z.infer<typeof AccountSchema>[];
  serviceProvider: z.infer<typeof ServiceProviderSchema> | null;
  bookingsCreated: z.infer<typeof BookingSchema>[];
  bookingsAsClient: z.infer<typeof BookingSchema>[];
  notificationPreferences: z.infer<typeof NotificationPreferenceSchema>[];
  reviews: z.infer<typeof ReviewSchema>[];
  validatedRequirements: z.infer<typeof RequirementSubmissionSchema>[];
};
