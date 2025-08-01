// =============================================================================
// BILLING FEATURE TYPES
// =============================================================================
// All type definitions for the billing feature in one place
// Organized by: Domain Enums -> Business Logic -> Request Types -> Component Props

// =============================================================================
// DOMAIN ENUMS AND BUSINESS LOGIC
// =============================================================================
// Note: Domain enums will be imported from Prisma where needed, but we don't
// re-export them here to avoid coupling manual types to server schema.
// Components will use tRPC RouterOutputs for server data types.

// =============================================================================
// BASE INTERFACES
// =============================================================================

// Subscription entity types for polymorphic relations
export type SubscriptionEntity =
  | { type: 'organization'; id: string }
  | { type: 'location'; id: string }
  | { type: 'provider'; id: string };

// Basic subscription info (business logic)
export interface SubscriptionInfo {
  id: string;
  status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'UNPAID' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'TRIALING' | 'PAUSED'; // Domain enum
  type: 'BASE' | 'TRIAL' | 'PROMOTIONAL'; // Domain enum
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}

// Payment information (business logic)
export interface PaymentInfo {
  id: string;
  amount: number; // Changed from Decimal to number for client-side calculations
  baseAmount?: number;
  usageAmount?: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'REFUNDED'; // Domain enum
  paidAt?: Date;
  billingPeriodStart?: Date;
  billingPeriodEnd?: Date;
  slotsCovered?: number;
}

// Trial management (business logic)
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
  billingModel: 'ORGANIZATION' | 'LOCATION' | 'PROVIDER'; // Domain enum
  defaultBillingEntity?: 'ORGANIZATION' | 'LOCATION' | 'PROVIDER'; // Domain enum
  paymentMethodAdded?: boolean;
}

// Usage tracking data (business logic calculation)
export interface UsageData {
  currentMonthSlots: number;
  billingCycleStart: Date;
  billingCycleEnd: Date;
  includedSlots: number;
  overageSlots: number;
  overageRate: number; // Changed from Decimal to number for client-side calculations
}

// Subscription plan with pricing tiers (business logic calculation)
export interface PlanWithPricing {
  id: string;
  name: string;
  description?: string;
  basePrice: number; // Changed from Decimal to number for client-side calculations
  currency: string;
  interval: 'MONTHLY' | 'YEARLY' | 'ONE_TIME'; // Domain enum
  includedSlots: number;
  overagePrice: number; // Changed from Decimal to number for client-side calculations
  stripePriceId?: string;
  isActive: boolean;
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

// Create subscription request
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
  status?: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'UNPAID' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'TRIALING' | 'PAUSED'; // Domain enum
  isActive?: boolean;
  endDate?: Date;
}

// Update billing configuration request
export interface UpdateBillingConfigRequest {
  billingModel?: 'ORGANIZATION' | 'LOCATION' | 'PROVIDER'; // Domain enum
  defaultBillingEntity?: 'ORGANIZATION' | 'LOCATION' | 'PROVIDER'; // Domain enum
}

// Process payment request
export interface ProcessPaymentRequest {
  subscriptionId: string;
  amount: number; // Changed from Decimal to number for client-side usage
  currency: string;
  paymentMethodId?: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
}

// Usage record request
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
  status?: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'UNPAID' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'TRIALING' | 'PAUSED'; // Domain enum
  type?: 'BASE' | 'TRIAL' | 'PROMOTIONAL'; // Domain enum
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
