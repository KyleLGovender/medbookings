// =============================================================================
// BILLING FEATURE TYPE GUARDS
// =============================================================================
//
// NOTE: This file uses type assertions for type guard implementations (128 instances).
// ✅ ACCEPTABLE USE: Type guards require assertions for property access on unknown values.
// This is documented as acceptable in CLAUDE.md TYPE-SAFETY.md Section 3.
// =============================================================================
// Runtime type validation for billing-specific types and API responses
import { BillingEntity, BillingInterval, PaymentStatus, SubscriptionStatus } from '@prisma/client';

import { nowUTC } from '@/lib/timezone';
import { isValidDateString, isValidUUID } from '@/types/guards';

// =============================================================================
// ENUM GUARDS
// =============================================================================

export function isSubscriptionStatus(value: unknown): value is SubscriptionStatus {
  return (
    typeof value === 'string' &&
    Object.values(SubscriptionStatus).includes(value as SubscriptionStatus)
  );
}

export function isPaymentStatus(value: unknown): value is PaymentStatus {
  return typeof value === 'string' && Object.values(PaymentStatus).includes(value as PaymentStatus);
}

export function isInvoiceStatus(
  value: unknown
): value is 'DRAFT' | 'OPEN' | 'PAID' | 'VOID' | 'UNCOLLECTIBLE' {
  return (
    typeof value === 'string' && ['DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE'].includes(value)
  );
}

export function isBillingInterval(
  value: unknown
): value is BillingInterval | 'YEARLY' | 'ONE_TIME' {
  // Check Prisma enum first, then domain-specific extensions
  return (
    typeof value === 'string' &&
    (Object.values(BillingInterval).includes(value as BillingInterval) ||
      ['YEARLY', 'ONE_TIME'].includes(value))
  );
}

export function isSubscriptionEntityType(
  value: unknown
): value is 'organization' | 'location' | 'provider' {
  return typeof value === 'string' && ['organization', 'location', 'provider'].includes(value);
}

export function isPaymentMethodType(value: unknown): value is 'card' | 'bank_transfer' | 'wallet' {
  return typeof value === 'string' && ['card', 'bank_transfer', 'wallet'].includes(value);
}

// =============================================================================
// SUBSCRIPTION GUARDS
// =============================================================================

export function isValidSubscriptionEntity(value: unknown): value is {
  type: string;
  id: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'id' in value &&
    isSubscriptionEntityType((value as any).type) &&
    isValidUUID((value as any).id)
  );
}

export function isValidCreateSubscriptionData(value: unknown): value is {
  planId: string;
  entity: { type: string; id: string };
  paymentMethodId?: string;
  trialDays?: number;
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
  metadata?: Record<string, string>;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'planId' in value &&
    'entity' in value &&
    isValidUUID((value as any).planId) &&
    isValidSubscriptionEntity((value as any).entity) &&
    (!(value as any).paymentMethodId || isValidUUID((value as any).paymentMethodId)) &&
    (!(value as any).trialDays ||
      (typeof (value as any).trialDays === 'number' && (value as any).trialDays >= 0)) &&
    (!(value as any).prorationBehavior ||
      ['create_prorations', 'none', 'always_invoice'].includes((value as any).prorationBehavior)) &&
    (!(value as any).metadata ||
      (typeof (value as any).metadata === 'object' &&
        Object.values((value as any).metadata).every((v) => typeof v === 'string')))
  );
}

export function isValidUpdateSubscriptionData(value: unknown): value is {
  id: string;
  planId?: string;
  status?: string;
  cancelAtPeriodEnd?: boolean;
  paymentMethodId?: string;
  metadata?: Record<string, string>;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    isValidUUID((value as any).id) &&
    (!(value as any).planId || isValidUUID((value as any).planId)) &&
    (!(value as any).status || isSubscriptionStatus((value as any).status)) &&
    (!(value as any).cancelAtPeriodEnd || typeof (value as any).cancelAtPeriodEnd === 'boolean') &&
    (!(value as any).paymentMethodId || isValidUUID((value as any).paymentMethodId)) &&
    (!(value as any).metadata ||
      (typeof (value as any).metadata === 'object' &&
        Object.values((value as any).metadata).every((v) => typeof v === 'string')))
  );
}

// =============================================================================
// PAYMENT GUARDS
// =============================================================================

export function isValidPaymentMethodData(value: unknown): value is {
  type: string;
  customerId: string;
  isDefault?: boolean;
  metadata?: Record<string, any>;
  cardDetails?: {
    last4: string;
    brand: string;
    expMonth: number;
    expYear: number;
  };
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'customerId' in value &&
    isPaymentMethodType((value as any).type) &&
    isValidUUID((value as any).customerId) &&
    (!(value as any).isDefault || typeof (value as any).isDefault === 'boolean') &&
    (!(value as any).metadata || typeof (value as any).metadata === 'object') &&
    (!(value as any).cardDetails ||
      (typeof (value as any).cardDetails === 'object' &&
        (value as any).cardDetails !== null &&
        'last4' in (value as any).cardDetails &&
        'brand' in (value as any).cardDetails &&
        'expMonth' in (value as any).cardDetails &&
        'expYear' in (value as any).cardDetails &&
        typeof (value as any).cardDetails.last4 === 'string' &&
        typeof (value as any).cardDetails.brand === 'string' &&
        typeof (value as any).cardDetails.expMonth === 'number' &&
        typeof (value as any).cardDetails.expYear === 'number' &&
        (value as any).cardDetails.expMonth >= 1 &&
        (value as any).cardDetails.expMonth <= 12 &&
        (value as any).cardDetails.expYear >= nowUTC().getFullYear()))
  );
}

export function isValidPaymentIntentData(value: unknown): value is {
  amount: number;
  currency: string;
  customerId: string;
  paymentMethodId?: string;
  subscriptionId?: string;
  description?: string;
  metadata?: Record<string, string>;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'amount' in value &&
    'currency' in value &&
    'customerId' in value &&
    typeof (value as any).amount === 'number' &&
    (value as any).amount > 0 &&
    typeof (value as any).currency === 'string' &&
    (value as any).currency.length === 3 &&
    isValidUUID((value as any).customerId) &&
    (!(value as any).paymentMethodId || isValidUUID((value as any).paymentMethodId)) &&
    (!(value as any).subscriptionId || isValidUUID((value as any).subscriptionId)) &&
    (!(value as any).description || typeof (value as any).description === 'string') &&
    (!(value as any).metadata ||
      (typeof (value as any).metadata === 'object' &&
        Object.values((value as any).metadata).every((v) => typeof v === 'string')))
  );
}

// =============================================================================
// INVOICE GUARDS
// =============================================================================

export function isValidInvoiceData(value: unknown): value is {
  id: string;
  customerId: string;
  subscriptionId?: string;
  status: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  dueDate?: string;
  invoiceDate: string;
  description?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'customerId' in value &&
    'status' in value &&
    'amountDue' in value &&
    'amountPaid' in value &&
    'currency' in value &&
    'invoiceDate' in value &&
    isValidUUID((value as any).id) &&
    isValidUUID((value as any).customerId) &&
    isInvoiceStatus((value as any).status) &&
    typeof (value as any).amountDue === 'number' &&
    (value as any).amountDue >= 0 &&
    typeof (value as any).amountPaid === 'number' &&
    (value as any).amountPaid >= 0 &&
    typeof (value as any).currency === 'string' &&
    (value as any).currency.length === 3 &&
    isValidDateString((value as any).invoiceDate) &&
    (!(value as any).subscriptionId || isValidUUID((value as any).subscriptionId)) &&
    (!(value as any).dueDate || isValidDateString((value as any).dueDate)) &&
    (!(value as any).description || typeof (value as any).description === 'string')
  );
}

export function isValidInvoiceLineItem(value: unknown): value is {
  id: string;
  description: string;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
  currency: string;
  metadata?: Record<string, string>;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'description' in value &&
    'quantity' in value &&
    'unitAmount' in value &&
    'totalAmount' in value &&
    'currency' in value &&
    isValidUUID((value as any).id) &&
    typeof (value as any).description === 'string' &&
    (value as any).description.length > 0 &&
    typeof (value as any).quantity === 'number' &&
    (value as any).quantity > 0 &&
    typeof (value as any).unitAmount === 'number' &&
    (value as any).unitAmount >= 0 &&
    typeof (value as any).totalAmount === 'number' &&
    (value as any).totalAmount >= 0 &&
    typeof (value as any).currency === 'string' &&
    (value as any).currency.length === 3 &&
    (!(value as any).metadata ||
      (typeof (value as any).metadata === 'object' &&
        Object.values((value as any).metadata).every((v) => typeof v === 'string')))
  );
}

// =============================================================================
// BILLING CONFIGURATION GUARDS
// =============================================================================

export function isValidBillingConfiguration(value: unknown): value is {
  organizationId?: string;
  locationId?: string;
  providerId?: string;
  billingModel: string;
  paymentTerms: number;
  currency: string;
  taxRate?: number;
  autoInvoice: boolean;
  allowedPaymentMethods: string[];
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'billingModel' in value &&
    'paymentTerms' in value &&
    'currency' in value &&
    'autoInvoice' in value &&
    'allowedPaymentMethods' in value &&
    typeof (value as any).billingModel === 'string' &&
    typeof (value as any).paymentTerms === 'number' &&
    (value as any).paymentTerms > 0 &&
    typeof (value as any).currency === 'string' &&
    (value as any).currency.length === 3 &&
    typeof (value as any).autoInvoice === 'boolean' &&
    Array.isArray((value as any).allowedPaymentMethods) &&
    (value as any).allowedPaymentMethods.every((method: unknown) => isPaymentMethodType(method)) &&
    (!(value as any).organizationId || isValidUUID((value as any).organizationId)) &&
    (!(value as any).locationId || isValidUUID((value as any).locationId)) &&
    (!(value as any).providerId || isValidUUID((value as any).providerId)) &&
    (!(value as any).taxRate ||
      (typeof (value as any).taxRate === 'number' &&
        (value as any).taxRate >= 0 &&
        (value as any).taxRate <= 1))
  );
}

// =============================================================================
// USAGE TRACKING GUARDS
// =============================================================================

export function isValidUsageRecord(value: unknown): value is {
  subscriptionId: string;
  timestamp: string;
  quantity: number;
  action: string;
  metadata?: Record<string, any>;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'subscriptionId' in value &&
    'timestamp' in value &&
    'quantity' in value &&
    'action' in value &&
    isValidUUID((value as any).subscriptionId) &&
    isValidDateString((value as any).timestamp) &&
    typeof (value as any).quantity === 'number' &&
    (value as any).quantity >= 0 &&
    typeof (value as any).action === 'string' &&
    (value as any).action.length > 0 &&
    (!(value as any).metadata || typeof (value as any).metadata === 'object')
  );
}

export function isValidUsageAggregation(value: unknown): value is {
  subscriptionId: string;
  period: { start: string; end: string };
  totalUsage: number;
  billedAmount: number;
  currency: string;
  breakdown?: Array<{
    date: string;
    usage: number;
    amount: number;
  }>;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'subscriptionId' in value &&
    'period' in value &&
    'totalUsage' in value &&
    'billedAmount' in value &&
    'currency' in value &&
    isValidUUID((value as any).subscriptionId) &&
    typeof (value as any).period === 'object' &&
    (value as any).period !== null &&
    'start' in (value as any).period &&
    'end' in (value as any).period &&
    isValidDateString((value as any).period.start) &&
    isValidDateString((value as any).period.end) &&
    typeof (value as any).totalUsage === 'number' &&
    (value as any).totalUsage >= 0 &&
    typeof (value as any).billedAmount === 'number' &&
    (value as any).billedAmount >= 0 &&
    typeof (value as any).currency === 'string' &&
    (value as any).currency.length === 3 &&
    (!(value as any).breakdown ||
      (Array.isArray((value as any).breakdown) &&
        (value as any).breakdown.every(
          (item: unknown) =>
            typeof item === 'object' &&
            item !== null &&
            'date' in item &&
            'usage' in item &&
            'amount' in item &&
            isValidDateString((item as any).date) &&
            typeof (item as any).usage === 'number' &&
            typeof (item as any).amount === 'number'
        )))
  );
}

// =============================================================================
// MIGRATION NOTES - API RESPONSE GUARDS REMOVED
// =============================================================================
//
// Server data validation guards have been removed as part of the dual-source
// type safety architecture migration. These validated server response shapes
// that are now handled by tRPC's automatic type inference.
//
// Removed guards:
// - isSubscriptionListResponse (server subscription list validation)
// - isPaymentListResponse (server payment list validation)
// - isInvoiceListResponse (server invoice list validation)
//
// Domain logic guards (enum validation, user input validation, etc.) remain
// below as they represent client-side business logic validation.

// =============================================================================
// SEARCH AND FILTER GUARDS
// =============================================================================

export function isValidBillingSearchParams(value: unknown): value is {
  customerId?: string;
  subscriptionId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    (!(value as any).customerId || isValidUUID((value as any).customerId)) &&
    (!(value as any).subscriptionId || isValidUUID((value as any).subscriptionId)) &&
    (!(value as any).status || typeof (value as any).status === 'string') &&
    (!(value as any).startDate || isValidDateString((value as any).startDate)) &&
    (!(value as any).endDate || isValidDateString((value as any).endDate)) &&
    (!(value as any).minAmount ||
      (typeof (value as any).minAmount === 'number' && (value as any).minAmount >= 0)) &&
    (!(value as any).maxAmount ||
      (typeof (value as any).maxAmount === 'number' && (value as any).maxAmount >= 0)) &&
    (!(value as any).currency ||
      (typeof (value as any).currency === 'string' && (value as any).currency.length === 3))
  );
}
