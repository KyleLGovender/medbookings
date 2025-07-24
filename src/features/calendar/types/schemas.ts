import { z } from 'zod';

import {
  AvailabilityContext,
  AvailabilityStatus,
  BillingEntity,
  DayOfWeek,
  RecurrenceOption,
  SchedulingRule,
  SlotStatus,
} from '@/features/calendar/types/types';

// Base Zod schemas for enums
export const availabilityStatusSchema = z.nativeEnum(AvailabilityStatus);
export const billingEntitySchema = z.nativeEnum(BillingEntity);
export const schedulingRuleSchema = z.nativeEnum(SchedulingRule);
export const slotStatusSchema = z.nativeEnum(SlotStatus);
export const dayOfWeekSchema = z.nativeEnum(DayOfWeek);
export const recurrenceOptionSchema = z.nativeEnum(RecurrenceOption);
export const availabilityContextSchema = z.nativeEnum(AvailabilityContext);

// Recurrence pattern schema (Google Calendar style)
export const recurrencePatternSchema = z
  .object({
    option: recurrenceOptionSchema,
    weeklyDay: dayOfWeekSchema.optional(),
    customDays: z.array(dayOfWeekSchema).optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  })
  .refine(
    (data) => {
      // If recurrence is not NONE, endDate is required
      if (data.option !== 'none') {
        return !!data.endDate;
      }
      return true;
    },
    {
      message: 'End date is required for recurring availability',
      path: ['endDate'],
    }
  );

// Custom recurrence data schema (for modal) - endDate is now required
export const customRecurrenceDataSchema = z.object({
  selectedDays: z.array(dayOfWeekSchema).min(1, 'At least one day must be selected'),
  endDate: z.union([z.date(), z.string()]).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }), // Required - no longer optional
});

// Time slot schema
export const timeSlotSchema = z.object({
  startTime: z.union([z.date(), z.string()]).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  endTime: z.union([z.date(), z.string()]).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  duration: z.number().int().positive(),
  isAvailable: z.boolean(),
  price: z.number().positive().optional(),
  serviceId: z.string().cuid(),
  serviceName: z.string(),
  slotId: z.string().cuid().optional(),
});

// Service configuration for availability creation
export const serviceConfigSchema = z.object({
  serviceId: z.string().cuid(),
  duration: z.number().int().positive(),
  price: z.number().positive(),
});

// Base availability object schema (without refinements)
const baseAvailabilitySchema = z.object({
  providerId: z.string().cuid(),
  organizationId: z.string().cuid().optional(),
  locationId: z.string().cuid().optional(),
  connectionId: z.string().cuid().optional(),
  startTime: z.union([z.date(), z.string()]).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  endTime: z.union([z.date(), z.string()]).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  isRecurring: z.boolean(),
  recurrencePattern: z.any().optional(), // JSON field to match Prisma schema
  seriesId: z.string().cuid().optional(),
  schedulingRule: schedulingRuleSchema,
  schedulingInterval: z.number().int().positive().optional(),
  isOnlineAvailable: z.boolean(),
  requiresConfirmation: z.boolean(),
  billingEntity: billingEntitySchema.optional(),
  defaultSubscriptionId: z.string().cuid().optional(),
  services: z.array(serviceConfigSchema).min(1),
});

type BaseAvailabilityData = z.infer<typeof baseAvailabilitySchema>;

// Create availability data schema
export const createAvailabilityDataSchema = baseAvailabilitySchema
  .refine((data: BaseAvailabilityData) => data.endTime > data.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  })
  .refine(
    (data: BaseAvailabilityData) => {
      // Ensure start and end times are on the same day
      const startDate = new Date(data.startTime);
      const endDate = new Date(data.endTime);
      return startDate.toDateString() === endDate.toDateString();
    },
    {
      message: 'Start and end times must be on the same day',
      path: ['endTime'],
    }
  )
  .refine((data: BaseAvailabilityData) => !data.isRecurring || data.recurrencePattern, {
    message: 'Recurrence pattern required for recurring availability',
    path: ['recurrencePattern'],
  })
  .refine((data: BaseAvailabilityData) => data.isOnlineAvailable || data.locationId, {
    message: 'Physical location is required when online availability is disabled',
    path: ['locationId'],
  });

// Update availability data schema
export const updateAvailabilityDataSchema = baseAvailabilitySchema.partial().extend({
  id: z.string().cuid(),
  scope: z.enum(['single', 'future', 'all']).optional(), // SeriesActionScope for recurring availability edits
});

// Availability search parameters schema
export const availabilitySearchParamsSchema = z
  .object({
    providerId: z.string().min(1).optional(),
    organizationId: z.string().min(1).optional(),
    locationId: z.string().min(1).optional(),
    serviceId: z.string().min(1).optional(),
    startDate: z
      .union([z.date(), z.string()])
      .transform((val) => {
        if (typeof val === 'string') {
          return new Date(val);
        }
        return val;
      })
      .optional(),
    endDate: z
      .union([z.date(), z.string()])
      .transform((val) => {
        if (typeof val === 'string') {
          return new Date(val);
        }
        return val;
      })
      .optional(),
    isOnlineAvailable: z.boolean().optional(),
    status: availabilityStatusSchema.optional(),
    schedulingRule: schedulingRuleSchema.optional(),
    seriesId: z.string().min(1).optional(),
  })
  .refine((data) => !data.startDate || !data.endDate || data.endDate >= data.startDate, {
    message: 'End date must be after or equal to start date',
    path: ['endDate'],
  });

// Slot search parameters schema
export const slotSearchParamsSchema = z
  .object({
    providerId: z.string().cuid().optional(),
    organizationId: z.string().cuid().optional(),
    locationId: z.string().cuid().optional(),
    serviceId: z.string().cuid().optional(),
    startDate: z
      .union([z.date(), z.string()])
      .transform((val) => {
        if (typeof val === 'string') {
          return new Date(val);
        }
        return val;
      })
      .optional(),
    endDate: z
      .union([z.date(), z.string()])
      .transform((val) => {
        if (typeof val === 'string') {
          return new Date(val);
        }
        return val;
      })
      .optional(),
    isOnlineAvailable: z.boolean().optional(),
    status: slotStatusSchema.optional(),
    minDuration: z.number().int().positive().optional(),
    maxDuration: z.number().int().positive().optional(),
    maxDistance: z.number().positive().optional(),
    coordinates: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
      .optional(),
  })
  .refine((data) => !data.startDate || !data.endDate || data.endDate >= data.startDate, {
    message: 'End date must be after or equal to start date',
    path: ['endDate'],
  })
  .refine(
    (data) => !data.minDuration || !data.maxDuration || data.maxDuration >= data.minDuration,
    { message: 'Max duration must be greater than or equal to min duration', path: ['maxDuration'] }
  );

// Scheduling rule configuration schema
export const schedulingRuleConfigSchema = z.object({
  rule: schedulingRuleSchema,
});

// Slot generation request schema
export const slotGenerationRequestSchema = z.object({
  availabilityId: z.string().cuid(),
  forceRegenerate: z.boolean().optional(),
});

// Availability conflict schema
export const availabilityConflictSchema = z.object({
  conflictType: z.enum([
    'OVERLAPPING_AVAILABILITY',
    'PROVIDER_UNAVAILABLE',
    'LOCATION_UNAVAILABLE',
    'CALENDAR_CONFLICT',
  ]),
  conflictingAvailabilityId: z.string().cuid().optional(),
  conflictingEventId: z.string().cuid().optional(),
  message: z.string(),
  startTime: z.union([z.date(), z.string()]).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  endTime: z.union([z.date(), z.string()]).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});

// Availability billing context schema
export const availabilityBillingContextSchema = z.object({
  billingEntity: billingEntitySchema,
  subscriptionId: z.string().cuid().optional(),
  organizationId: z.string().cuid().optional(),
  locationId: z.string().cuid().optional(),
  providerId: z.string().cuid(),
  estimatedSlots: z.number().int().nonnegative(),
  estimatedCost: z.number().nonnegative(),
});

// Form schemas for UI components
export const availabilityFormSchema = createAvailabilityDataSchema;
export const availabilityUpdateFormSchema = baseAvailabilitySchema.partial().extend({
  id: z.string().cuid(),
});
export const availabilitySearchFormSchema = availabilitySearchParamsSchema;
export const slotSearchFormSchema = slotSearchParamsSchema;

// API response schemas
export const slotGenerationResultSchema = z.object({
  availabilityId: z.string().cuid(),
  slotsGenerated: z.number().int().nonnegative(),
  slotsConflicted: z.number().int().nonnegative(),
  errors: z.array(z.string()),
  duration: z.number().int().nonnegative(),
});

export const availabilitySeriesSchema = z.object({
  seriesId: z.string().cuid(),
  masterAvailabilityId: z.string().cuid(),
  recurrencePattern: recurrencePatternSchema,
  instances: z.array(z.any()), // Will be typed as Availability[] in TypeScript
  totalInstances: z.number().int().nonnegative(),
  activeInstances: z.number().int().nonnegative(),
  createdAt: z.union([z.date(), z.string()]).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  lastModified: z.union([z.date(), z.string()]).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});
