import { z } from 'zod';

import {
  AvailabilityContext,
  AvailabilityStatus,
  BillingEntity,
  DayOfWeek,
  RecurrenceType,
  SchedulingRule,
  SlotStatus,
} from '@/features/calendar/availability/types/types';

// Base Zod schemas for enums
export const schedulingRuleSchema = z.nativeEnum(SchedulingRule);
export const availabilityStatusSchema = z.nativeEnum(AvailabilityStatus);
export const slotStatusSchema = z.nativeEnum(SlotStatus);
export const billingEntitySchema = z.nativeEnum(BillingEntity);
export const recurrenceTypeSchema = z.nativeEnum(RecurrenceType);
export const dayOfWeekSchema = z.nativeEnum(DayOfWeek);
export const availabilityContextSchema = z.nativeEnum(AvailabilityContext);

// Recurrence pattern schema
export const recurrencePatternSchema = z.object({
  type: recurrenceTypeSchema,
  interval: z.number().int().positive().optional(),
  daysOfWeek: z.array(dayOfWeekSchema).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  weekOfMonth: z.number().int().min(-1).max(4).optional(),
  startTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  endTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  count: z.number().int().positive().optional(),
  exceptions: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
});

// Time slot schema
export const timeSlotSchema = z.object({
  startTime: z.date(),
  endTime: z.date(),
  duration: z.number().int().positive(),
  isAvailable: z.boolean(),
  price: z.number().positive().optional(),
  serviceId: z.string().uuid(),
  serviceName: z.string(),
  slotId: z.string().uuid().optional(),
});

// Service configuration for availability creation
export const serviceConfigSchema = z.object({
  serviceId: z.string().uuid(),
  duration: z.number().int().positive(),
  price: z.number().positive(),
  showPrice: z.boolean(),
  isOnlineAvailable: z.boolean(),
  isInPerson: z.boolean(),
  locationId: z.string().uuid().optional(),
});

// Base availability object schema (without refinements)
const baseAvailabilitySchema = z.object({
  serviceProviderId: z.string().uuid(),
  organizationId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  connectionId: z.string().uuid().optional(),
  startTime: z.date(),
  endTime: z.date(),
  isRecurring: z.boolean(),
  recurrencePattern: recurrencePatternSchema.optional(),
  seriesId: z.string().uuid().optional(),
  schedulingRule: schedulingRuleSchema,
  schedulingInterval: z.number().int().positive().optional(),
  isOnlineAvailable: z.boolean(),
  requiresConfirmation: z.boolean(),
  billingEntity: billingEntitySchema.optional(),
  defaultSubscriptionId: z.string().uuid().optional(),
  services: z.array(serviceConfigSchema).min(1),
});

type BaseAvailabilityData = z.infer<typeof baseAvailabilitySchema>;

// Create availability data schema
export const createAvailabilityDataSchema = baseAvailabilitySchema
  .refine((data: BaseAvailabilityData) => data.endTime > data.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  })
  .refine((data: BaseAvailabilityData) => !data.isRecurring || data.recurrencePattern, {
    message: 'Recurrence pattern required for recurring availability',
    path: ['recurrencePattern'],
  })
  .refine(
    (data: BaseAvailabilityData) =>
      data.schedulingRule !== SchedulingRule.CUSTOM_INTERVAL || data.schedulingInterval,
    {
      message: 'Scheduling interval required for custom interval rule',
      path: ['schedulingInterval'],
    }
  );

// Update availability data schema
export const updateAvailabilityDataSchema = baseAvailabilitySchema.partial().extend({
  id: z.string().uuid(),
});

// Availability search parameters schema
export const availabilitySearchParamsSchema = z
  .object({
    serviceProviderId: z.string().min(1).optional(),
    organizationId: z.string().min(1).optional(),
    locationId: z.string().min(1).optional(),
    serviceId: z.string().min(1).optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
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
    serviceProviderId: z.string().uuid().optional(),
    organizationId: z.string().uuid().optional(),
    locationId: z.string().uuid().optional(),
    serviceId: z.string().uuid().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
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
export const schedulingRuleConfigSchema = z
  .object({
    rule: schedulingRuleSchema,
    interval: z.number().int().positive().optional(),
    alignToHour: z.boolean().optional(),
    alignToHalfHour: z.boolean().optional(),
    alignToQuarterHour: z.boolean().optional(),
  })
  .refine((data) => data.rule !== SchedulingRule.CUSTOM_INTERVAL || data.interval, {
    message: 'Interval required for custom interval rule',
    path: ['interval'],
  })
  .refine(
    (data) =>
      data.rule !== SchedulingRule.FIXED_INTERVAL ||
      data.alignToHour ||
      data.alignToHalfHour ||
      data.alignToQuarterHour,
    {
      message: 'At least one alignment option required for fixed interval rule',
      path: ['alignToHour'],
    }
  );

// Slot generation request schema
export const slotGenerationRequestSchema = z.object({
  availabilityId: z.string().uuid(),
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
  conflictingAvailabilityId: z.string().uuid().optional(),
  conflictingEventId: z.string().uuid().optional(),
  message: z.string(),
  startTime: z.date(),
  endTime: z.date(),
});

// Availability billing context schema
export const availabilityBillingContextSchema = z.object({
  billingEntity: billingEntitySchema,
  subscriptionId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  serviceProviderId: z.string().uuid(),
  estimatedSlots: z.number().int().nonnegative(),
  estimatedCost: z.number().nonnegative(),
});

// Form schemas for UI components
export const availabilityFormSchema = createAvailabilityDataSchema;
export const availabilityUpdateFormSchema = baseAvailabilitySchema.partial().extend({
  id: z.string().uuid(),
});
export const availabilitySearchFormSchema = availabilitySearchParamsSchema;
export const slotSearchFormSchema = slotSearchParamsSchema;

// API response schemas
export const slotGenerationResultSchema = z.object({
  availabilityId: z.string().uuid(),
  slotsGenerated: z.number().int().nonnegative(),
  slotsConflicted: z.number().int().nonnegative(),
  errors: z.array(z.string()),
  duration: z.number().int().nonnegative(),
});

export const availabilitySeriesSchema = z.object({
  seriesId: z.string().uuid(),
  masterAvailabilityId: z.string().uuid(),
  recurrencePattern: recurrencePatternSchema,
  instances: z.array(z.any()), // Will be typed as Availability[] in TypeScript
  totalInstances: z.number().int().nonnegative(),
  activeInstances: z.number().int().nonnegative(),
  createdAt: z.date(),
  lastModified: z.date(),
});
