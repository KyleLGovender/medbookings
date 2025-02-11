import { Review } from '@prisma/client';
import {
  AvailabilitySchema,
  BookingSchema,
  CalculatedAvailabilitySlotSchema,
  NotificationChannelSchema,
  NotificationLogSchema,
  ServiceAvailabilityConfigSchema,
  ServiceProviderSchema,
  ServiceSchema,
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

// Add this new schema for form validation
export const ServiceConfigFormSchema = z
  .object({
    serviceId: z.string(),
    duration: z.number().min(5, 'Duration must be at least 5 minutes'),
    price: z.number().min(100, 'Minimum Price is R100'),
    isOnlineAvailable: z.boolean(),
    isInPerson: z.boolean(),
    location: z.string().optional(),
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
  );

// Add this type for form values
export type ServiceConfig = z.infer<typeof ServiceConfigFormSchema>;

export type Service = Omit<z.infer<typeof ServiceSchema>, 'defaultPrice'> & {
  defaultPrice: number | null;
};

// Update base availability type to match schema
export type Availability = z.infer<typeof AvailabilitySchema> & {
  serviceProvider: z.infer<typeof ServiceProviderSchema>;
  availableServices: z.infer<typeof ServiceAvailabilityConfigSchema>[];
  calculatedSlots: (z.infer<typeof CalculatedAvailabilitySlotSchema> & {
    booking:
      | (z.infer<typeof BookingSchema> & {
          client?: z.infer<typeof UserSchema>;
          bookedBy?: z.infer<typeof UserSchema>;
          serviceProvider: z.infer<typeof ServiceProviderSchema>;
          service: z.infer<typeof ServiceSchema>;
          notifications: z.infer<typeof NotificationLogSchema>[];
          review?: Review;
        })
      | null;
    service: z.infer<typeof ServiceSchema>;
  })[];
};

// Update availability form schema - exclude database fields and add form-specific validation
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

    // Validate start time is before end time
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

export type CalculatedAvailabilitySlot = z.infer<typeof CalculatedAvailabilitySlotSchema> & {
  id: string;
  startTime: Date;
  endTime: Date;
  status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED' | 'INVALID';
  availabilityId: string;
  serviceId: string;
  serviceConfigId: string;
  lastCalculated: Date;
  availability: Availability;
  service: z.infer<typeof ServiceSchema>;
  serviceConfig: z.infer<typeof ServiceAvailabilityConfigSchema>;
  booking?: Booking;
};

export type AvailabilityActionResponse = {
  data?: {
    startTime: Date;
    endTime: Date;
    availableServices: {
      serviceId: string;
      duration: number;
      price: number;
      isOnlineAvailable: boolean;
      isInPerson: boolean;
      location?: string;
    }[];
  };
  error?: string;
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
};

export type QueriedAvailability = Omit<Availability, 'availableServices' | 'calculatedSlots'> & {
  availableServices: {
    id: string;
    serviceProviderId: string;
    serviceId: string;
    duration: number;
    price: number;
    isOnlineAvailable: boolean;
    isInPerson: boolean;
    location: string | null;
    createdAt: Date;
    updatedAt: Date;
    service: Service;
  }[];
  calculatedSlots: {
    id: string;
    startTime: Date;
    endTime: Date;
    status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED' | 'INVALID';
    serviceId: string;
    availabilityId: string;
    serviceConfigId: string;
    lastCalculated: Date;
    booking: null | {
      id: string;
      price: number;
      clientId: string | null;
      bookedById: string | null;
      client?: z.infer<typeof UserSchema>;
      bookedBy?: z.infer<typeof UserSchema>;
      serviceProvider: z.infer<typeof ServiceProviderSchema>;
      service: Service;
    };
    service: Service;
  }[];
};

// Update booking type to match schema
export type Booking = z.infer<typeof BookingSchema> & {
  slot: z.infer<typeof CalculatedAvailabilitySlotSchema>;
  client?: z.infer<typeof UserSchema>;
  bookedBy?: z.infer<typeof UserSchema>;
  serviceProvider: z.infer<typeof ServiceProviderSchema>;
  service: z.infer<typeof ServiceSchema>;
  notifications: z.infer<typeof NotificationLogSchema>[];
  bookingType: z.infer<typeof BookingTypeSchema>;
};

// Update booking form schema
export const BookingFormSchema = BookingSchema.extend({
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

// Update Schedule type to use calculated slots
export interface Schedule {
  type: 'AVAILABILITY';
  availability: Availability;
  calculatedSlots: CalculatedAvailabilitySlot[];
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
    slotId: BookingSchema.shape.slotId,
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
  bookingType: z.infer<typeof BookingTypeSchema>;
}
