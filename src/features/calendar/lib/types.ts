import { Prisma } from '@prisma/client';
import {
  AvailabilitySchema,
  BookingSchema,
  BookingStatusSchema,
  NotificationChannelSchema,
  NotificationLogSchema,
  ServiceProviderSchema,
  UserSchema,
  type Availability as ZodAvailability,
  type Booking as ZodBooking,
  type NotificationPreference as ZodNotificationPreference,
} from '@prisma/zod';
import { z } from 'zod';

export type ViewType = 'day' | 'week' | 'schedule';

// Form Schemas
export const BookingFormSchema = z
  .object({
    // Booking type
    bookingType: z.enum(['USER', 'GUEST']),

    // User booking fields
    clientId: z.string().optional(),

    // Guest booking fields
    clientName: z.string().optional(),
    clientEmail: z.string().email().optional(),
    clientPhone: z.string().optional(),
    clientWhatsapp: z.string().optional(),

    // Notification preferences
    notifyViaEmail: z.boolean().default(false),
    notifyViaSMS: z.boolean().default(false),
    notifyViaWhatsapp: z.boolean().default(false),

    // Booking details
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    duration: z.number().int(),
    price: z.number().min(0),
    isOnline: z.boolean(),
    location: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    serviceProviderId: z.string(),
    status: z.lazy(() => BookingStatusSchema).default('PENDING'),
    guestName: z.string().optional(),
    guestEmail: z.string().email().optional(),
    guestPhone: z.string().optional(),
    guestWhatsapp: z.string().optional(),
    notificationPreferences: z
      .object({
        email: z.boolean(),
        sms: z.boolean(),
        whatsapp: z.boolean(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      // Validate user booking has clientId
      if (data.bookingType === 'USER' && !data.clientId) {
        return false;
      }
      // Validate guest booking has required fields
      if (data.bookingType === 'GUEST' && !data.clientName) {
        return false;
      }
      // Validate notification methods have corresponding contact info
      if (data.notifyViaEmail && !data.clientEmail) {
        return false;
      }
      if (data.notifyViaSMS && !data.clientPhone) {
        return false;
      }
      if (data.notifyViaWhatsapp && !data.clientWhatsapp) {
        return false;
      }
      return true;
    },
    {
      message: 'Invalid booking data',
    }
  );

export type BookingFormData = z.infer<typeof BookingFormSchema>;

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

// Derived Types
export type BookingFormValues = z.infer<typeof BookingFormSchema>;
export type AvailabilityFormValues = z.infer<typeof availabilityFormSchema>;

// Interface Definitions
export interface Availability
  extends Omit<
    ZodAvailability,
    'price' | 'startTime' | 'endTime' | 'recurrenceEndDate' | 'createdAt' | 'updatedAt'
  > {
  price: number;
  startTime: string;
  endTime: string;
  recurrenceEndDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Booking
  extends Omit<
    ZodBooking,
    'price' | 'startTime' | 'endTime' | 'cancelledAt' | 'createdAt' | 'updatedAt'
  > {
  price: number;
  startTime: string;
  endTime: string;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
  };
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  guestWhatsapp: string | null;
  notifyViaEmail: boolean;
  notifyViaSMS: boolean;
  notifyViaWhatsapp: boolean;
}

export interface NotificationPreference
  extends Omit<ZodNotificationPreference, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

// Schedule type for calendar views
export interface Schedule extends Availability {
  type: 'AVAILABILITY';
  bookings: (Omit<Booking, 'client'> & {
    type: 'BOOKING';
    client: {
      name: string | null;
    };
  })[];
}

// Helper functions
export function transformAvailability(availability: any): Availability {
  return {
    ...availability,
    price:
      typeof availability.price === 'object' && 'toNumber' in availability.price
        ? availability.price.toNumber()
        : Number(availability.price),
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

export function transformBooking(booking: any): Booking {
  return {
    ...booking,
    price:
      booking.price instanceof Prisma.Decimal ? booking.price.toNumber() : Number(booking.price),
    startTime: new Date(booking.startTime).toISOString(),
    endTime: new Date(booking.endTime).toISOString(),
    status: BookingStatusSchema.parse(booking.status),
    notifications: booking.notifications?.map(transformNotification) ?? [],
  };
}

export function transformNotification(notification: any) {
  return {
    ...notification,
    createdAt: new Date(notification.createdAt).toISOString(),
    updatedAt: new Date(notification.updatedAt).toISOString(),
  };
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
  client?: z.infer<typeof UserSchema>;
  serviceProvider: z.infer<typeof ServiceProviderSchema>;
  availability: z.infer<typeof AvailabilitySchema>;
  notifications: z.infer<typeof NotificationLogSchema>[];
}

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
}
