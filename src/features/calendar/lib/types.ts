import { Booking, Prisma } from '@prisma/client';
import {
  AvailabilitySchema,
  BookingSchema,
  BookingStatusSchema,
  NotificationChannelSchema,
  NotificationLogSchema,
  ServiceProviderSchema,
  UserSchema,
  type Availability as ZodAvailability,
  type NotificationPreference as ZodNotificationPreference,
} from '@prisma/zod';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

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

// Define the booking types more explicitly
export enum BookingType {
  USER_SELF = 'USER_SELF', // User booking for themselves
  USER_GUEST = 'USER_GUEST', // User booking for a guest
  GUEST_SELF = 'GUEST_SELF', // Guest booking for themselves
  PROVIDER_GUEST = 'PROVIDER_GUEST', // Service Provider booking for guest
}

// Base schema with common fields
const baseBookingSchema = z.object({
  serviceProviderId: z.string(),
  availabilityId: z.string(),
  startTime: z.date(),
  endTime: z.date(),
  duration: z.number().min(1),
  price: z.number().min(0),
  isOnline: z.boolean(),
  location: z.string().nullable(),
  notes: z.string().nullable(),
  notificationPreferences: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    whatsapp: z.boolean(),
  }),
});

// Guest information schema
const guestInfoSchema = z.object({
  guestName: z.string().min(1, 'Guest name is required'),
  guestEmail: z.string().email('Invalid email').optional(),
  guestPhone: z.string().optional(),
  guestWhatsapp: z.string().optional(),
});

// User information schema
const userInfoSchema = z.object({
  userId: z.string(),
  clientId: z.string(),
});

// Complete booking form schema
export const BookingFormSchema = z
  .discriminatedUnion('bookingType', [
    // Case 1: Service Provider booking for guest
    z.object({
      bookingType: z.literal(BookingType.PROVIDER_GUEST),
      ...baseBookingSchema.shape,
      ...guestInfoSchema.shape,
    }),

    // Case 2: Guest booking for themselves
    z.object({
      bookingType: z.literal(BookingType.GUEST_SELF),
      ...baseBookingSchema.shape,
      ...guestInfoSchema.shape,
    }),

    // Case 3: User booking for themselves
    z.object({
      bookingType: z.literal(BookingType.USER_SELF),
      ...baseBookingSchema.shape,
      ...userInfoSchema.shape,
    }),

    // Case 4: User booking for a guest
    z.object({
      bookingType: z.literal(BookingType.USER_GUEST),
      ...baseBookingSchema.shape,
      ...userInfoSchema.shape,
      ...guestInfoSchema.shape,
    }),
  ])
  .superRefine(async (data, ctx) => {
    // Get availability details
    const availability = await prisma.availability.findUnique({
      where: { id: data.availabilityId },
      include: {
        bookings: true, // Get existing bookings
      },
    });

    if (!availability) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Availability slot not found',
        path: ['availabilityId'],
      });
      return;
    }

    // Validate booking is within availability time range
    const bookingStart = new Date(data.startTime);
    const bookingEnd = new Date(data.endTime);
    const availabilityStart = new Date(availability.startTime);
    const availabilityEnd = new Date(availability.endTime);

    if (bookingStart < availabilityStart || bookingEnd > availabilityEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Booking must be within availability time range',
        path: ['startTime'],
      });
    }

    // Validate duration matches availability settings
    if (data.duration !== availability.duration) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Booking duration must match availability duration',
        path: ['duration'],
      });
    }

    // Validate buffer times
    const hasBufferConflict = availability.bookings.some((existingBooking) => {
      const existingStart = new Date(existingBooking.startTime);
      const existingEnd = new Date(existingBooking.endTime);

      const minBufferBefore = availability.bufferBefore * 60 * 1000; // Convert to milliseconds
      const minBufferAfter = availability.bufferAfter * 60 * 1000;

      // Check if new booking respects buffer times with existing bookings
      return (
        bookingEnd.getTime() + minBufferAfter > existingStart.getTime() ||
        bookingStart.getTime() - minBufferBefore < existingEnd.getTime()
      );
    });

    if (hasBufferConflict) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Booking conflicts with buffer time of another booking',
        path: ['startTime'],
      });
    }

    // Validate against maxBookings
    if (availability.maxBookings) {
      const existingBookingsCount = availability.bookings.length;
      if (existingBookingsCount >= availability.maxBookings) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Maximum number of bookings reached for this availability',
          path: ['availabilityId'],
        });
      }
    }

    // Validate price matches availability
    if (data.price !== availability.price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Booking price must match availability price',
        path: ['price'],
      });
    }

    // Validate location/online status matches availability
    if (data.isOnline !== availability.isOnline) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Booking online status must match availability settings',
        path: ['isOnline'],
      });
    }

    // Validate notification preferences
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

    // Validate contact information based on notification preferences
    if (
      data.bookingType === BookingType.GUEST_SELF ||
      data.bookingType === BookingType.PROVIDER_GUEST
    ) {
      if (data.notificationPreferences.email && !data.guestEmail) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Email is required for email notifications',
          path: ['guestEmail'],
        });
      }
      if (data.notificationPreferences.sms && !data.guestPhone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Phone number is required for SMS notifications',
          path: ['guestPhone'],
        });
      }
      if (data.notificationPreferences.whatsapp && !data.guestWhatsapp) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'WhatsApp number is required for WhatsApp notifications',
          path: ['guestWhatsapp'],
        });
      }
    }
  });

// Type for the form values
export type BookingFormValues = z.infer<typeof BookingFormSchema>;

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
    bookingType: BookingType.GUEST,
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
