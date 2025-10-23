/**
 * =============================================================================
 * BILLING FEATURE TYPES
 * =============================================================================
 * All type definitions for the billing feature in one place
 * Organized by: Prisma Imports -> Domain Enums -> Business Logic -> Request Types -> Component Props
 */
// =============================================================================
// PRISMA TYPE IMPORTS
// =============================================================================
// Import database enums directly from Prisma to prevent type drift
import { BillingEntity, BillingInterval, PaymentStatus, SubscriptionStatus } from '@prisma/client';

// =============================================================================
// DOMAIN ENUMS AND BUSINESS LOGIC
// =============================================================================
// Note: Database enums are now imported from Prisma above.
// Components will use tRPC RouterOutputs for server data types.

// =============================================================================
// BASE INTERFACES
// =============================================================================

// Subscription entity types for polymorphic relations
export type SubscriptionEntity =
  | { type: 'organization'; id: string }
  | { type: 'location'; id: string }
  | { type: 'provider'; id: string };

/**
 * Basic subscription information for billing entities
 * Contains subscription status, type, and date ranges for billing cycles
 *
 * @property {string} id - Unique identifier for the subscription
 * @property {SubscriptionStatus} status - Current status from Prisma enum (ACTIVE, PAST_DUE, CANCELLED, EXPIRED, TRIALING)
 * @property {'BASE' | 'TRIAL' | 'PROMOTIONAL'} type - Subscription type (domain-specific, not in Prisma)
 * @property {Date} startDate - Date when the subscription started
 * @property {Date} [endDate] - Optional date when the subscription ends or ended
 * @property {boolean} isActive - Whether the subscription is currently active
 */
export interface SubscriptionInfo {
  id: string;
  status: SubscriptionStatus; // Use Prisma enum
  type: 'BASE' | 'TRIAL' | 'PROMOTIONAL'; // Domain enum (not in Prisma)
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}

/**
 * Payment transaction information
 * Tracks payment amounts, status, and billing period coverage
 *
 * @property {string} id - Unique identifier for the payment transaction
 * @property {number} amount - Total payment amount (converted from Decimal for client-side use)
 * @property {number} [baseAmount] - Optional base subscription fee component
 * @property {number} [usageAmount] - Optional usage-based charges component
 * @property {string} currency - Currency code (e.g., 'ZAR', 'USD')
 * @property {PaymentStatus} status - Payment status from Prisma enum (PENDING, SUCCEEDED, FAILED, REFUNDED)
 * @property {Date} [paidAt] - Timestamp when payment was successfully processed
 * @property {Date} [billingPeriodStart] - Start date of the billing period covered by this payment
 * @property {Date} [billingPeriodEnd] - End date of the billing period covered by this payment
 * @property {number} [slotsCovered] - Number of availability slots covered by this payment
 */
export interface PaymentInfo {
  id: string;
  amount: number; // Changed from Decimal to number for client-side calculations
  baseAmount?: number;
  usageAmount?: number;
  currency: string;
  status: PaymentStatus; // Use Prisma enum
  paidAt?: Date;
  billingPeriodStart?: Date;
  billingPeriodEnd?: Date;
  slotsCovered?: number;
}

/**
 * Trial period management information
 * Tracks trial subscription lifecycle and conversion status
 *
 * @property {Date} [trialStarted] - Timestamp when the trial period began
 * @property {Date} [trialEnded] - Timestamp when the trial period ended or will end
 * @property {'ACTIVE' | 'EXPIRED' | 'CONVERTED' | 'CANCELLED'} [trialStatus] - Current trial status (domain-specific enum)
 * @property {boolean} paymentMethodAdded - Whether a payment method has been added to the account
 * @property {boolean} trialReminderSent - Whether a trial expiration reminder has been sent
 * @property {Date} [trialConversionDate] - Timestamp when trial was converted to paid subscription
 */
export interface TrialInfo {
  trialStarted?: Date;
  trialEnded?: Date;
  trialStatus?: 'ACTIVE' | 'EXPIRED' | 'CONVERTED' | 'CANCELLED'; // Domain enum
  paymentMethodAdded: boolean;
  trialReminderSent: boolean;
  trialConversionDate?: Date;
}

// =============================================================================
// COMPLEX INTERFACES
// =============================================================================

// =============================================================================
// MIGRATION NOTES - SERVER DATA INTERFACES REMOVED
// =============================================================================
//
// Server data interfaces have been removed from this manual type file:
// - SubscriptionWithRelations (server data + relations)
//
// Components will extract server data types from tRPC RouterOutputs in Task 4.0
// using patterns like: RouterOutputs['billing']['getSubscriptionWithRelations']

// Billing configuration data (domain logic)
export interface BillingConfigurationData {
  billingModel: BillingEntity; // Use Prisma enum
  defaultBillingEntity?: BillingEntity; // Use Prisma enum
  paymentMethodAdded?: boolean;
}

/**
 * Usage-based billing tracking data
 * Calculates slot usage, overage charges, and billing cycle information
 *
 * @property {number} currentMonthSlots - Number of slots used in the current billing cycle
 * @property {Date} billingCycleStart - Start date of the current billing cycle
 * @property {Date} billingCycleEnd - End date of the current billing cycle
 * @property {number} includedSlots - Number of slots included in the base subscription
 * @property {number} overageSlots - Number of slots used beyond the included amount
 * @property {number} overageRate - Per-slot charge rate for overage (converted from Decimal)
 */
export interface UsageData {
  currentMonthSlots: number;
  billingCycleStart: Date;
  billingCycleEnd: Date;
  includedSlots: number;
  overageSlots: number;
  overageRate: number; // Changed from Decimal to number for client-side calculations
}

/**
 * Subscription plan with pricing tier information
 * Contains plan details, base pricing, included slots, and overage rates
 *
 * @property {string} id - Unique identifier for the subscription plan
 * @property {string} name - Display name of the subscription plan
 * @property {string} [description] - Optional detailed description of the plan
 * @property {number} basePrice - Base subscription price per billing period (converted from Decimal)
 * @property {string} currency - Currency code for pricing (e.g., 'ZAR', 'USD')
 * @property {BillingInterval | 'YEARLY' | 'ONE_TIME'} interval - Billing frequency (Prisma enum plus domain extensions)
 * @property {number} includedSlots - Number of availability slots included in base price
 * @property {number} overagePrice - Per-slot charge for usage beyond included slots (converted from Decimal)
 * @property {string} [stripePriceId] - Optional Stripe price ID for payment processing
 * @property {boolean} isActive - Whether this plan is currently available for selection
 */
export interface PlanWithPricing {
  id: string;
  name: string;
  description?: string;
  basePrice: number; // Changed from Decimal to number for client-side calculations
  currency: string;
  interval: BillingInterval | 'YEARLY' | 'ONE_TIME'; // Use Prisma enum + domain-specific extensions
  includedSlots: number;
  overagePrice: number; // Changed from Decimal to number for client-side calculations
  stripePriceId?: string;
  isActive: boolean;
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

/**
 * Request payload for creating a new subscription
 * Used when organizations, locations, or providers start subscriptions
 *
 * @property {'organization' | 'location' | 'provider'} entityType - Type of billing entity creating the subscription
 * @property {string} entityId - Unique identifier of the entity (organization, location, or provider)
 * @property {string} planId - ID of the subscription plan to use
 * @property {'BASE' | 'TRIAL' | 'PROMOTIONAL'} type - Subscription type classification (domain-specific)
 * @property {Date} [trialStart] - Optional trial period start date (for trial subscriptions)
 * @property {Date} [trialEnd] - Optional trial period end date (for trial subscriptions)
 */
export interface CreateSubscriptionRequest {
  entityType: 'organization' | 'location' | 'provider';
  entityId: string;
  planId: string;
  type: 'BASE' | 'TRIAL' | 'PROMOTIONAL'; // Domain enum
  trialStart?: Date;
  trialEnd?: Date;
}

// Update subscription request
export interface UpdateSubscriptionRequest {
  planId?: string;
  status?: SubscriptionStatus; // Use Prisma enum
  isActive?: boolean;
  endDate?: Date;
}

// Update billing configuration request
export interface UpdateBillingConfigRequest {
  billingModel?: BillingEntity; // Use Prisma enum
  defaultBillingEntity?: BillingEntity; // Use Prisma enum
}

/**
 * Request payload for processing a payment
 * Contains payment amount, subscription details, and billing period information
 *
 * @property {string} subscriptionId - ID of the subscription this payment is for
 * @property {number} amount - Total payment amount to process (converted from Decimal)
 * @property {string} currency - Currency code for the payment (e.g., 'ZAR', 'USD')
 * @property {string} [paymentMethodId] - Optional Stripe payment method ID to use
 * @property {Date} billingPeriodStart - Start date of the billing period being paid for
 * @property {Date} billingPeriodEnd - End date of the billing period being paid for
 */
export interface ProcessPaymentRequest {
  subscriptionId: string;
  amount: number; // Changed from Decimal to number for client-side usage
  currency: string;
  paymentMethodId?: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
}

/**
 * Request payload for recording slot usage
 * Tracks individual slot bookings for usage-based billing calculations
 *
 * @property {string} subscriptionId - ID of the subscription to bill this usage to
 * @property {string} slotId - ID of the booked availability slot
 * @property {Date} slotDate - Date/time when the slot occurs
 * @property {string} providerId - ID of the provider offering the slot
 * @property {string} serviceId - ID of the service being provided in this slot
 * @property {number} slotDuration - Duration of the slot in minutes
 */
export interface CreateUsageRecordRequest {
  subscriptionId: string;
  slotId: string;
  slotDate: Date;
  providerId: string;
  serviceId: string;
  slotDuration: number;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

// Subscription query options
export interface SubscriptionQueryOptions {
  includeRelations?: boolean;
  status?: SubscriptionStatus; // Use Prisma enum
  type?: 'BASE' | 'TRIAL' | 'PROMOTIONAL'; // Domain enum (not in Prisma)
  isActive?: boolean;
}

// Billing dashboard data
export interface BillingDashboardData {
  activeSubscriptions: SubscriptionInfo[];
  recentPayments: PaymentInfo[];
  currentUsage: UsageData;
  upcomingPayments: PaymentInfo[];
  trialInfo?: TrialInfo;
}

// Component props types
export interface BillingConfigurationProps {
  entityType: 'organization' | 'location' | 'provider';
  entityId: string;
  currentConfig?: BillingConfigurationData;
  onUpdate?: (config: BillingConfigurationData) => void;
}

// Component props will use tRPC RouterOutputs for server data in Task 4.0
// Example: RouterOutputs['billing']['getSubscriptions'] instead of manual interfaces
export interface SubscriptionListProps {
  entityType: 'organization' | 'location' | 'provider';
  onSubscriptionUpdate?: (subscriptionId: string) => void;
  // subscriptions prop will be typed using tRPC RouterOutputs in component migration
}

export interface PaymentHistoryProps {
  payments: PaymentInfo[];
  subscriptionId?: string;
  showSubscriptionInfo?: boolean;
}
