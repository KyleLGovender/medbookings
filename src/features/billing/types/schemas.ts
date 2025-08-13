// =============================================================================
// BILLING FEATURE SCHEMAS
// =============================================================================
// All Zod validation schemas for the billing feature in one place
// Organized by: Entity Schemas -> Request Schemas -> Response Schemas
import {
  BillingEntity,
  BillingInterval,
  OrganizationBillingModel,
  PaymentStatus,
  SubscriptionStatus,
  SubscriptionType,
  TrialStatus,
} from '@prisma/client';
import { z } from 'zod';

// =============================================================================
// ENUM SCHEMAS
// =============================================================================

export const billingEntitySchema = z.nativeEnum(BillingEntity);
export const billingIntervalSchema = z.nativeEnum(BillingInterval);
export const organizationBillingModelSchema = z.nativeEnum(OrganizationBillingModel);
export const paymentStatusSchema = z.nativeEnum(PaymentStatus);
export const subscriptionStatusSchema = z.nativeEnum(SubscriptionStatus);
export const subscriptionTypeSchema = z.nativeEnum(SubscriptionType);
export const trialStatusSchema = z.nativeEnum(TrialStatus);

// =============================================================================
// ENTITY SCHEMAS
// =============================================================================

// Subscription entity type schema
export const subscriptionEntitySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('organization'),
    id: z.string().uuid(),
  }),
  z.object({
    type: z.literal('location'),
    id: z.string().uuid(),
  }),
  z.object({
    type: z.literal('provider'),
    id: z.string().uuid(),
  }),
]);

// Billing configuration schema
export const billingConfigurationSchema = z.object({
  billingModel: organizationBillingModelSchema,
  defaultBillingEntity: billingEntitySchema.optional(),
  paymentMethodAdded: z.boolean().optional(),
});

// Usage data schema
export const usageDataSchema = z.object({
  currentMonthSlots: z.number().int().min(0),
  billingCycleStart: z.coerce.date(),
  billingCycleEnd: z.coerce.date(),
  includedSlots: z.number().int().min(0),
  overageSlots: z.number().int().min(0),
  overageRate: z.number().positive(),
});

// =============================================================================
// REQUEST SCHEMAS
// =============================================================================

// Create subscription request schema (polymorphic relationship)
export const createSubscriptionRequestSchema = z
  .object({
    planId: z.string().min(1, 'Plan ID is required'),
    // Polymorphic relationship - exactly one must be provided
    organizationId: z.string().optional(),
    locationId: z.string().optional(),
    providerId: z.string().optional(),
    // Subscription details
    type: subscriptionTypeSchema.default('BASE'),
    status: subscriptionStatusSchema,
    startDate: z.string().transform((val) => new Date(val)),
    endDate: z
      .string()
      .transform((val) => new Date(val))
      .optional(),
    // Stripe integration
    stripeCustomerId: z.string().optional(),
    stripeSubscriptionId: z.string().optional(),
  })
  .refine(
    (data) => {
      // Ensure exactly one of the polymorphic fields is set
      const setFields = [data.organizationId, data.locationId, data.providerId].filter(Boolean);
      return setFields.length === 1;
    },
    {
      message: 'Exactly one of organizationId, locationId, or providerId must be provided',
      path: ['polymorphicRelation'],
    }
  );

// Update subscription request schema (polymorphic relationship)
export const updateSubscriptionRequestSchema = z
  .object({
    id: z.string(),
    planId: z.string().min(1, 'Plan ID is required').optional(),
    // Polymorphic relationship - exactly one must be provided if updating
    organizationId: z.string().optional(),
    locationId: z.string().optional(),
    providerId: z.string().optional(),
    // Subscription details
    type: subscriptionTypeSchema.optional(),
    status: subscriptionStatusSchema.optional(),
    startDate: z
      .string()
      .transform((val) => new Date(val))
      .optional(),
    endDate: z
      .string()
      .transform((val) => new Date(val))
      .optional(),
    cancelledAt: z
      .string()
      .transform((val) => new Date(val))
      .optional(),
    cancelReason: z.string().optional(),
    // Stripe integration
    stripeCustomerId: z.string().optional(),
    stripeSubscriptionId: z.string().optional(),
  })
  .refine(
    (data) => {
      // If any polymorphic field is being updated, ensure exactly one is set
      const polymorphicFields = [data.organizationId, data.locationId, data.providerId];
      const definedFields = polymorphicFields.filter((field) => field !== undefined);

      // If no polymorphic fields are being updated, that's fine
      if (definedFields.length === 0) {
        return true;
      }

      // If polymorphic fields are being updated, exactly one must be set (not null)
      const setFields = polymorphicFields.filter((field) => field !== undefined && field !== null);
      return setFields.length === 1;
    },
    {
      message:
        'If updating entity relationship, exactly one of organizationId, locationId, or providerId must be provided',
      path: ['polymorphicRelation'],
    }
  );

// Update billing configuration request schema
export const updateBillingConfigRequestSchema = z.object({
  billingModel: organizationBillingModelSchema.optional(),
  defaultBillingEntity: billingEntitySchema.optional(),
});

// Process payment request schema
export const processPaymentRequestSchema = z.object({
  subscriptionId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  paymentMethodId: z.string().optional(),
  billingPeriodStart: z.coerce.date(),
  billingPeriodEnd: z.coerce.date(),
});

// Create usage record request schema
export const createUsageRecordRequestSchema = z.object({
  subscriptionId: z.string().uuid(),
  slotId: z.string().uuid(),
  slotDate: z.coerce.date(),
  providerId: z.string().uuid(),
  serviceId: z.string().uuid(),
  slotDuration: z.number().int().positive(),
});

// Cancel subscription request schema
export const cancelSubscriptionRequestSchema = z.object({
  id: z.string(),
  cancelReason: z.string().optional().default('Cancelled via API'),
});

// =============================================================================
// QUERY SCHEMAS
// =============================================================================

// Get subscriptions query schema
export const getSubscriptionsQuerySchema = z.object({
  organizationId: z.string().optional(),
  locationId: z.string().optional(),
  providerId: z.string().optional(),
});

// Subscription query options schema
export const subscriptionQueryOptionsSchema = z.object({
  includeRelations: z.boolean().optional(),
  status: subscriptionStatusSchema.optional(),
  type: subscriptionTypeSchema.optional(),
  isActive: z.boolean().optional(),
});

// Billing dashboard query schema
export const billingDashboardQuerySchema = z.object({
  entityType: billingEntitySchema,
  entityId: z.string().uuid(),
  includeTrialInfo: z.boolean().optional(),
  paymentLimit: z.number().int().min(1).max(100).optional().default(10),
});

// =============================================================================
// ROUTE PARAMETER SCHEMAS
// =============================================================================

// Subscription route params schema
export const subscriptionRouteParamsSchema = z.object({
  subscriptionId: z.string().uuid(),
});

// Entity route params schema
export const entityRouteParamsSchema = z.object({
  entityType: billingEntitySchema,
  entityId: z.string().uuid(),
});

// Payment route params schema
export const paymentRouteParamsSchema = z.object({
  paymentId: z.string().uuid(),
});

// =============================================================================
// TYPE INFERENCE HELPERS
// =============================================================================

export type SubscriptionEntityInput = z.infer<typeof subscriptionEntitySchema>;
export type BillingConfigurationInput = z.infer<typeof billingConfigurationSchema>;
export type UsageDataInput = z.infer<typeof usageDataSchema>;
export type CreateSubscriptionRequestInput = z.infer<typeof createSubscriptionRequestSchema>;
export type UpdateSubscriptionRequestInput = z.infer<typeof updateSubscriptionRequestSchema>;
export type UpdateBillingConfigRequestInput = z.infer<typeof updateBillingConfigRequestSchema>;
export type ProcessPaymentRequestInput = z.infer<typeof processPaymentRequestSchema>;
export type CreateUsageRecordRequestInput = z.infer<typeof createUsageRecordRequestSchema>;
export type CancelSubscriptionRequestInput = z.infer<typeof cancelSubscriptionRequestSchema>;
export type GetSubscriptionsQueryInput = z.infer<typeof getSubscriptionsQuerySchema>;
export type SubscriptionQueryOptionsInput = z.infer<typeof subscriptionQueryOptionsSchema>;
export type BillingDashboardQueryInput = z.infer<typeof billingDashboardQuerySchema>;
export type SubscriptionRouteParamsInput = z.infer<typeof subscriptionRouteParamsSchema>;
export type EntityRouteParamsInput = z.infer<typeof entityRouteParamsSchema>;
export type PaymentRouteParamsInput = z.infer<typeof paymentRouteParamsSchema>;
