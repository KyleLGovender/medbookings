import {
  AvailabilitySchema,
  BookingSchema,
  CalculatedAvailabilitySlotSchema,
  NotificationChannelSchema,
  ServiceAvailabilityConfigSchema,
  ServiceSchema,
} from '@prisma/zod';
import { z } from 'zod';

import { ApiResponse } from '@/lib/types';

export const CalendarViewType = {
  slots: 'slots',
} as const;

export const ServiceProviderCalendarViewType = {
  day: 'day',
  week: 'week',
  schedule: 'schedule',
} as const;

export interface TimeRange {
  earliestTime: number; // 24-hour format (e.g., 9 for 9:00, 13 for 13:00)
  latestTime: number; // 24-hour format (e.g., 17 for 17:00)
}

export type CalendarViewType = (typeof CalendarViewType)[keyof typeof CalendarViewType];
export type ServiceProviderCalendarViewType =
  (typeof ServiceProviderCalendarViewType)[keyof typeof ServiceProviderCalendarViewType];

// Base types from Zod schemas
type BaseSlot = z.infer<typeof CalculatedAvailabilitySlotSchema>;
type BaseService = z.infer<typeof ServiceSchema>;
type BaseServiceConfig = z.infer<typeof ServiceAvailabilityConfigSchema>;
type BaseBooking = z.infer<typeof BookingSchema>;

// Simplified types that break circular references
export interface BookingView {
  id: string;
  client?: {
    name: string | null;
    email: string | null;
    whatsapp: string | null;
    notificationPreferences?: {
      email: boolean;
      whatsapp: boolean;
    };
  };
  serviceProvider?: {
    id: string;
    name: string;
    whatsapp: string | null;
  };
  guestName: string | null;
  guestEmail: string | null;
  guestWhatsapp: string | null;
  notifyViaEmail?: boolean;
  notifyViaWhatsapp?: boolean;
  price: number;
  startTime: Date | string;
  endTime: Date | string;
  service: {
    id: string;
    name: string;
  };
  guestPhone: string | null;
  notifyViaSMS?: boolean;
}

export type AvailabilitySlot = Pick<BaseSlot, 'id' | 'startTime' | 'endTime' | 'status'> & {
  service: Pick<BaseService, 'id' | 'name' | 'description' | 'displayPriority'>;
  serviceConfig: Pick<
    BaseServiceConfig,
    'id' | 'price' | 'duration' | 'isOnlineAvailable' | 'isInPerson' | 'location'
  >;
  booking: BookingView | null;
};

export type AvailabilityView = Pick<
  z.infer<typeof AvailabilitySchema>,
  'id' | 'startTime' | 'endTime'
> & {
  serviceProvider: {
    id: string;
    name: string;
    image?: string | null;
  };
  slots: AvailabilitySlot[];
  availableServices: Pick<
    BaseServiceConfig,
    'serviceId' | 'duration' | 'price' | 'isOnlineAvailable' | 'isInPerson' | 'location'
  >[];
};

export const ServiceConfigFormSchema = ServiceAvailabilityConfigSchema.omit({
  id: true,
  serviceProviderId: true,
  createdAt: true,
  updatedAt: true,
})
  .refine(
    (data) => {
      if (data.isInPerson) {
        return !!data.location;
      }
      return true;
    },
    {
      message: 'Location is required for in-person services',
      path: ['location'],
    }
  )
  .refine((data) => data.price >= 100, {
    message: 'Minimum Price is R100',
    path: ['price'],
  });

export const AvailabilityFormSchema = AvailabilitySchema.omit({
  id: true,
  serviceProviderId: true,
  createdAt: true,
  updatedAt: true,
})
  .extend({
    date: z
      .date({
        required_error: 'Date is required',
        invalid_type_error: 'Invalid date format',
      })
      .min(new Date(new Date().setHours(0, 0, 0, 0)), 'Date cannot be in the past')
      .transform((date) => new Date(Math.floor(date.getTime() / 60000) * 60000)),
    startTime: z.date().transform((date) => new Date(Math.floor(date.getTime() / 60000) * 60000)),
    endTime: z.date().transform((date) => new Date(Math.floor(date.getTime() / 60000) * 60000)),
    availableServices: z
      .array(ServiceConfigFormSchema)
      .min(1, 'At least one service configuration must be specified'),
  })
  .superRefine((data, ctx) => {
    if (data.availableServices.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one service configuration must be specified',
        path: ['availableServices'],
      });
    }

    data.availableServices.forEach((service, index) => {
      if (!service.isOnlineAvailable && !service.isInPerson) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'At least one availability type must be selected',
          path: [`availableServices.${index}`],
        });
      }
    });

    if (data.startTime >= data.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Start time must be before end time',
        path: ['startTime'],
      });
    }

    // Validate time is within same day
    const startHours = data.startTime.getHours();
    const endHours = data.endTime.getHours();
    if (endHours < startHours) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End time cannot be on the next day',
        path: ['endTime'],
      });
    }
  });

export type AvailabilityFormValues = z.infer<typeof AvailabilityFormSchema>;

export type AvailabilityFormResponse = ApiResponse<{
  startTime: Date;
  endTime: Date;
  availableServices: {
    serviceId: string;
    duration: number;
    price: number;
    isOnlineAvailable: boolean;
    isInPerson: boolean;
    location?: string | null;
  }[];
}>;

export type BookingResponse = ApiResponse<{
  bookingId?: string;
}>;

export const BookingTypeSchema = z.enum([
  'USER_SELF',
  'USER_GUEST',
  'GUEST_SELF',
  'PROVIDER_GUEST',
]);

export const BookingFormSchema = z
  .object({
    slotId: z.string(),
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
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the terms and conditions',
    }),
  })
  .superRefine((data, ctx) => {
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

export const NotificationPreferencesSchema = z.object({
  channels: z.array(NotificationChannelSchema),
  email: z.boolean(),
  sms: z.boolean(),
  whatsapp: z.boolean(),
  phoneNumber: z.string().nullable(),
  whatsappNumber: z.string().nullable(),
  reminderHours: z.number().int(),
});
