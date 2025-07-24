// =============================================================================
// BILLING FEATURE SCHEMAS
// =============================================================================
// All Zod validation schemas for the billing feature in one place
// Organized by: Entity Schemas -> Request Schemas -> Response Schemas
import { z } from 'zod';

import {
  BillingEntity,
  BillingInterval,
  OrganizationBillingModel,
  PaymentStatus,
  SubscriptionStatus,
  SubscriptionType,
  TrialStatus,
} from './types';

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

// Create subscription request schema
export const createSubscriptionRequestSchema = z.object({
  entityType: z.enum(['organization', 'location', 'provider']),
  entityId: z.string().uuid(),
  planId: z.string().uuid(),
  type: subscriptionTypeSchema,
  trialStart: z.coerce.date().optional(),
  trialEnd: z.coerce.date().optional(),
});

// Update subscription request schema
export const updateSubscriptionRequestSchema = z.object({
  planId: z.string().uuid().optional(),
  status: subscriptionStatusSchema.optional(),
  isActive: z.boolean().optional(),
  endDate: z.coerce.date().optional(),
});

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

// =============================================================================
// QUERY SCHEMAS
// =============================================================================

// Subscription query options schema
export const subscriptionQueryOptionsSchema = z.object({
  includeRelations: z.boolean().optional(),
  status: subscriptionStatusSchema.optional(),
  type: subscriptionTypeSchema.optional(),
  isActive: z.boolean().optional(),
});

// Billing dashboard query schema
export const billingDashboardQuerySchema = z.object({
  entityType: z.enum(['organization', 'location', 'provider']),
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
  entityType: z.enum(['organization', 'location', 'provider']),
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
export type SubscriptionQueryOptionsInput = z.infer<typeof subscriptionQueryOptionsSchema>;
export type BillingDashboardQueryInput = z.infer<typeof billingDashboardQuerySchema>;
export type SubscriptionRouteParamsInput = z.infer<typeof subscriptionRouteParamsSchema>;
export type EntityRouteParamsInput = z.infer<typeof entityRouteParamsSchema>;
export type PaymentRouteParamsInput = z.infer<typeof paymentRouteParamsSchema>;
