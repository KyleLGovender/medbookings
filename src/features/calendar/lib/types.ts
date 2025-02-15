import {
  AvailabilitySchema,
  BookingSchema,
  CalculatedAvailabilitySlotSchema,
  NotificationChannelSchema,
  NotificationLogSchema,
  ServiceAvailabilityConfigSchema,
} from '@prisma/zod';
import { z } from 'zod';

import { User } from '@/features/profile/lib/types';
import { Service, ServiceProvider } from '@/features/service-provider/lib/types';

export type ViewType = 'day' | 'week' | 'schedule';

export type ServiceAvailabilityConfig = z.infer<typeof ServiceAvailabilityConfigSchema>;
export type Availability = z.infer<typeof AvailabilitySchema> & {
  serviceProvider: ServiceProvider;
  availableServices: ServiceAvailabilityConfig[];
  calculatedSlots: CalculatedAvailabilitySlot[];
};
export type CalculatedAvailabilitySlot = z.infer<typeof CalculatedAvailabilitySlotSchema> & {
  booking: Booking | null;
  service: Service;
  serviceConfig: ServiceAvailabilityConfig;
};
export type Booking = z.infer<typeof BookingSchema> & {
  slot: CalculatedAvailabilitySlot;
  client?: User;
  bookedBy?: User;
  serviceProvider: ServiceProvider;
  service: Service;
  notifications: z.infer<typeof NotificationLogSchema>[];
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
  .refine((data) => data.price.gte(100), {
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
      .min(new Date(new Date().setHours(0, 0, 0, 0)), 'Date cannot be in the past'),
    startTime: z.date(),
    endTime: z.date(),
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
