// =============================================================================
// BILLING FEATURE TYPES
// =============================================================================
// All type definitions for the billing feature in one place
// Organized by: Enums -> Base Interfaces -> Complex Interfaces -> Utility Types
import {
  BillingEntity,
  BillingInterval,
  OrganizationBillingModel,
  Payment,
  PaymentStatus,
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
  SubscriptionType,
  TrialStatus,
  UsageRecord,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// =============================================================================
// ENUMS
// =============================================================================

// Re-export Prisma billing-related enums for convenience
export {
  BillingEntity,
  BillingInterval,
  OrganizationBillingModel,
  PaymentStatus,
  SubscriptionStatus,
  SubscriptionType,
  TrialStatus,
};

// =============================================================================
// BASE INTERFACES
// =============================================================================

// Subscription entity types for polymorphic relations
export type SubscriptionEntity =
  | { type: 'organization'; id: string }
  | { type: 'location'; id: string }
  | { type: 'provider'; id: string };

// Basic subscription info
export interface SubscriptionInfo {
  id: string;
  status: SubscriptionStatus;
  type: SubscriptionType;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}

// Payment information
export interface PaymentInfo {
  id: string;
  amount: Decimal;
  baseAmount?: Decimal;
  usageAmount?: Decimal;
  currency: string;
  status: PaymentStatus;
  paidAt?: Date;
  billingPeriodStart?: Date;
  billingPeriodEnd?: Date;
  slotsCovered?: number;
}

// Trial management
export interface TrialInfo {
  trialStarted?: Date;
  trialEnded?: Date;
  trialStatus?: TrialStatus;
  paymentMethodAdded: boolean;
  trialReminderSent: boolean;
  trialConversionDate?: Date;
}

// =============================================================================
// COMPLEX INTERFACES
// =============================================================================

// Extended subscription with all relations
export interface SubscriptionWithRelations extends Subscription {
  plan?: SubscriptionPlan;
  organization?: {
    id: string;
    name: string;
    billingModel: OrganizationBillingModel;
  };
  location?: {
    id: string;
    name: string;
    formattedAddress: string;
  };
  provider?: {
    id: string;
    user: {
      name: string;
      email: string;
    };
  };
  payments?: Payment[];
  usageRecords?: UsageRecord[];
}

// Billing configuration data
export interface BillingConfigurationData {
  billingModel: OrganizationBillingModel;
  defaultBillingEntity?: BillingEntity;
  paymentMethodAdded?: boolean;
}

// Usage tracking data
export interface UsageData {
  currentMonthSlots: number;
  billingCycleStart: Date;
  billingCycleEnd: Date;
  includedSlots: number;
  overageSlots: number;
  overageRate: Decimal;
}

// Subscription plan with pricing tiers
export interface PlanWithPricing extends Omit<SubscriptionPlan, 'stripePriceId'> {
  basePrice: Decimal;
  currency: string;
  interval: BillingInterval;
  includedSlots: number;
  overagePrice: Decimal;
  stripePriceId?: string;
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

// Create subscription request
export interface CreateSubscriptionRequest {
  entityType: 'organization' | 'location' | 'provider';
  entityId: string;
  planId: string;
  type: SubscriptionType;
  trialStart?: Date;
  trialEnd?: Date;
}

// Update subscription request
export interface UpdateSubscriptionRequest {
  planId?: string;
  status?: SubscriptionStatus;
  isActive?: boolean;
  endDate?: Date;
}

// Update billing configuration request
export interface UpdateBillingConfigRequest {
  billingModel?: OrganizationBillingModel;
  defaultBillingEntity?: BillingEntity;
}

// Process payment request
export interface ProcessPaymentRequest {
  subscriptionId: string;
  amount: Decimal;
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
  status?: SubscriptionStatus;
  type?: SubscriptionType;
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

export interface SubscriptionListProps {
  subscriptions: SubscriptionWithRelations[];
  entityType: 'organization' | 'location' | 'provider';
  onSubscriptionUpdate?: (subscriptionId: string) => void;
}

export interface PaymentHistoryProps {
  payments: PaymentInfo[];
  subscriptionId?: string;
  showSubscriptionInfo?: boolean;
}
