import {
  AvailabilitySchema,
  BookingSchema,
  NotificationChannelSchema,
  NotificationLogSchema,
  ServiceProviderSchema,
  UserSchema,
} from '@prisma/zod';
import { z } from 'zod';

export type ViewType = 'day' | 'week' | 'schedule';

export const BookingTypeSchema = z.enum([
  'USER_SELF',
  'USER_GUEST',
  'GUEST_SELF',
  'PROVIDER_GUEST',
]);

// Define base availability type from schema
export type Availability = z.infer<typeof AvailabilitySchema> & {
  price: number; // Ensure price is always number
  startTime: string; // ISO string
  endTime: string; // ISO string
  recurrenceEndDate: string | null;
  recurringDays: number[];
};

// Define the availability form schema using the base schema
export const AvailabilityFormSchema = AvailabilitySchema.extend({
  isOnlineAvailable: z.boolean(),
  isInPersonAvailable: z.boolean(),
  isRecurring: z.boolean(),
  recurringDays: z.array(z.number()),
  recurrenceEndDate: z.date().nullable(),
}).superRefine((data, ctx) => {
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

export type AvailabilityFormValues = z.infer<typeof AvailabilityFormSchema>;

export type Booking = z.infer<typeof BookingTypeSchema>;

// Define booking schema extending the base schema
export const BookingFormSchema = BookingSchema.extend({
  bookingType: BookingTypeSchema,
  notificationPreferences: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    whatsapp: z.boolean(),
  }),
  guestInfo: z
    .object({
      name: z.string().min(1, 'Guest name is required'),
      email: z.string().email('Invalid email').optional(),
      phone: z.string().optional(),
      whatsapp: z.string().optional(),
    })
    .optional(),
}).superRefine((data, ctx) => {
  // Keep existing validation logic from BookingFormSchema
  const hasNotificationMethod =
    data.notificationPreferences.email ||
    data.notificationPreferences.sms ||
    data.notificationPreferences.whatsapp;

  if (!hasNotificationMethod) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one notification method must be selected',
      path: ['notificationPreferences'],
    });
  }

  // Add validation for guest contact info based on notification preferences
  if (data.guestInfo) {
    if (data.notificationPreferences.email && !data.guestInfo.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Email is required for email notifications',
        path: ['guestInfo.email'],
      });
    }
    if (data.notificationPreferences.sms && !data.guestInfo.phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Phone number is required for SMS notifications',
        path: ['guestInfo.phone'],
      });
    }
    if (data.notificationPreferences.whatsapp && !data.guestInfo.whatsapp) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'WhatsApp number is required for WhatsApp notifications',
        path: ['guestInfo.whatsapp'],
      });
    }
  }
});

export type BookingFormValues = z.infer<typeof BookingFormSchema>;

// Schedule type using the new schemas
export interface Schedule extends Availability {
  type: 'AVAILABILITY';
  bookings: Array<
    Booking & {
      type: 'BOOKING';
      client: {
        name: string | null;
      };
    }
  >;
}

export const NotificationPreferencesSchema = z.object({
  channels: z.array(NotificationChannelSchema),
  email: z.boolean(),
  sms: z.boolean(),
  whatsapp: z.boolean(),
  phoneNumber: z.string().nullable(),
  whatsappNumber: z.string().nullable(),
  reminderHours: z.number().int(),
});

export const BookingCreateSchema = z
  .object({
    serviceProviderId: BookingSchema.shape.serviceProviderId,
    availabilityId: BookingSchema.shape.availabilityId,
    bookingType: z.enum(['USER', 'GUEST']),
    userId: z.string().optional(),
    guestInfo: z
      .object({
        name: z.string(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        whatsapp: z.string().optional(),
      })
      .optional(),
    notificationChannels: z.array(NotificationChannelSchema),
    duration: BookingSchema.shape.duration,
    startTime: BookingSchema.shape.startTime,
    endTime: BookingSchema.shape.endTime,
    isOnline: BookingSchema.shape.isOnline,
    location: BookingSchema.shape.location,
  })
  .superRefine((data, ctx) => {
    // Validate booking time is within availability time range
    const bookingStart = new Date(data.startTime);
    const bookingEnd = new Date(data.endTime);

    // Ensure booking start is before end
    if (bookingStart >= bookingEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Booking start time must be before end time',
        path: ['startTime'],
      });
    }

    // Ensure duration matches start/end time difference
    const durationInMinutes = (bookingEnd.getTime() - bookingStart.getTime()) / (1000 * 60);
    if (durationInMinutes !== data.duration) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Booking duration must match the time difference between start and end times',
        path: ['duration'],
      });
    }

    // Validate notification channels have corresponding contact info
    if (data.bookingType === 'GUEST' && data.guestInfo) {
      data.notificationChannels.forEach((channel) => {
        switch (channel) {
          case 'EMAIL':
            if (!data.guestInfo?.email) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Email is required for email notifications',
                path: ['guestInfo.email'],
              });
            }
            break;
          case 'SMS':
            if (!data.guestInfo?.phone) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Phone number is required for SMS notifications',
                path: ['guestInfo.phone'],
              });
            }
            break;
          case 'WHATSAPP':
            if (!data.guestInfo?.whatsapp) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'WhatsApp number is required for WhatsApp notifications',
                path: ['guestInfo.whatsapp'],
              });
            }
            break;
        }
      });
    }
  });

export interface BookingWithRelations extends z.infer<typeof BookingSchema> {
  // Client is optional since guest bookings won't have a client
  client?: z.infer<typeof UserSchema>;
  // Guest information for non-user bookings
  guestInfo?: {
    name: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
  };
  serviceProvider: z.infer<typeof ServiceProviderSchema>;
  availability: z.infer<typeof AvailabilitySchema>;
  notifications: z.infer<typeof NotificationLogSchema>[];
  // Add bookingType to track the type of booking
  bookingType: BookingType;
}

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
}
