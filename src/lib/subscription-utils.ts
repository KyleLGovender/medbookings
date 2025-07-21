import { prisma } from '@/lib/prisma';
import { Subscription, SubscriptionStatus, SubscriptionType } from '@prisma/client';

/**
 * Subscription utility functions that handle the polymorphic constraint properly
 * These utilities ensure that subscription queries and operations respect the
 * database constraint: exactly one of organizationId, locationId, or providerId is set
 */

export type SubscriptionEntity = 
  | { type: 'organization'; id: string }
  | { type: 'location'; id: string }
  | { type: 'provider'; id: string };

export interface SubscriptionWithRelations extends Subscription {
  plan?: any;
  organization?: any;
  location?: any;
  provider?: any;
  payments?: any[];
  usageRecords?: any[];
}

/**
 * Get subscriptions for a specific entity (organization, location, or provider)
 */
export async function getSubscriptionsForEntity(
  entity: SubscriptionEntity,
  options?: {
    includeRelations?: boolean;
    status?: SubscriptionStatus;
    type?: SubscriptionType;
  }
): Promise<SubscriptionWithRelations[]> {
  const includeRelations = options?.includeRelations ?? false;
  
  // Build where clause based on entity type
  const whereClause: any = {};
  
  switch (entity.type) {
    case 'organization':
      whereClause.organizationId = entity.id;
      whereClause.locationId = null;
      whereClause.providerId = null;
      break;
    case 'location':
      whereClause.organizationId = null;
      whereClause.locationId = entity.id;
      whereClause.providerId = null;
      break;
    case 'provider':
      whereClause.organizationId = null;
      whereClause.locationId = null;
      whereClause.providerId = entity.id;
      break;
  }

  // Add optional filters
  if (options?.status) {
    whereClause.status = options.status;
  }
  if (options?.type) {
    whereClause.type = options.type;
  }

  // Build include clause
  const include = includeRelations ? {
    plan: true,
    organization: true,
    location: true,
    provider: true,
    payments: {
      orderBy: { createdAt: 'desc' as const },
      take: 10
    },
    usageRecords: {
      orderBy: { createdAt: 'desc' as const },
      take: 10
    }
  } : undefined;

  return await prisma.subscription.findMany({
    where: whereClause,
    include,
    orderBy: {
      createdAt: 'desc'
    }
  });
}

/**
 * Get active subscription for a specific entity
 */
export async function getActiveSubscriptionForEntity(
  entity: SubscriptionEntity
): Promise<SubscriptionWithRelations | null> {
  const subscriptions = await getSubscriptionsForEntity(entity, {
    includeRelations: true,
    status: 'ACTIVE'
  });

  return subscriptions[0] || null;
}

/**
 * Create a subscription with proper polymorphic constraint handling
 */
export async function createSubscriptionForEntity(
  entity: SubscriptionEntity,
  data: {
    planId: string;
    type?: SubscriptionType;
    status: SubscriptionStatus;
    startDate: Date;
    endDate?: Date;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  }
): Promise<SubscriptionWithRelations> {
  // Ensure only one entity field is set
  const subscriptionData: any = {
    planId: data.planId,
    type: data.type || 'BASE',
    status: data.status,
    startDate: data.startDate,
    endDate: data.endDate,
    stripeCustomerId: data.stripeCustomerId,
    stripeSubscriptionId: data.stripeSubscriptionId,
    billingCycleStart: data.startDate,
    billingCycleEnd: new Date(data.startDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
    currentMonthSlots: 0,
    // Initialize all polymorphic fields to null
    organizationId: null,
    locationId: null,
    providerId: null,
  };

  // Set the appropriate entity field
  switch (entity.type) {
    case 'organization':
      subscriptionData.organizationId = entity.id;
      break;
    case 'location':
      subscriptionData.locationId = entity.id;
      break;
    case 'provider':
      subscriptionData.providerId = entity.id;
      break;
  }

  return await prisma.subscription.create({
    data: subscriptionData,
    include: {
      plan: true,
      organization: true,
      location: true,
      provider: true,
    }
  });
}

/**
 * Update subscription entity (change which entity owns the subscription)
 */
export async function updateSubscriptionEntity(
  subscriptionId: string,
  newEntity: SubscriptionEntity
): Promise<SubscriptionWithRelations> {
  // Prepare update data with all polymorphic fields cleared first
  const updateData: any = {
    organizationId: null,
    locationId: null,
    providerId: null,
  };

  // Set the new entity field
  switch (newEntity.type) {
    case 'organization':
      updateData.organizationId = newEntity.id;
      break;
    case 'location':
      updateData.locationId = newEntity.id;
      break;
    case 'provider':
      updateData.providerId = newEntity.id;
      break;
  }

  return await prisma.subscription.update({
    where: { id: subscriptionId },
    data: updateData,
    include: {
      plan: true,
      organization: true,
      location: true,
      provider: true,
    }
  });
}

/**
 * Get subscription entity information
 */
export function getSubscriptionEntity(subscription: Subscription): SubscriptionEntity | null {
  if (subscription.organizationId) {
    return { type: 'organization', id: subscription.organizationId };
  }
  if (subscription.locationId) {
    return { type: 'location', id: subscription.locationId };
  }
  if (subscription.providerId) {
    return { type: 'provider', id: subscription.providerId };
  }
  return null;
}

/**
 * Validate that a subscription satisfies the polymorphic constraint
 */
export function validatePolymorphicConstraint(subscription: {
  organizationId: string | null;
  locationId: string | null;
  providerId: string | null;
}): boolean {
  const setFields = [
    subscription.organizationId,
    subscription.locationId,
    subscription.providerId
  ].filter(Boolean);

  return setFields.length === 1;
}

/**
 * Get all subscriptions across all entities with filtering
 */
export async function getAllSubscriptions(options?: {
  status?: SubscriptionStatus;
  type?: SubscriptionType;
  includeRelations?: boolean;
  limit?: number;
  offset?: number;
}): Promise<SubscriptionWithRelations[]> {
  const whereClause: any = {};
  
  if (options?.status) {
    whereClause.status = options.status;
  }
  if (options?.type) {
    whereClause.type = options.type;
  }

  const include = options?.includeRelations ? {
    plan: true,
    organization: true,
    location: true,
    provider: true,
  } : undefined;

  return await prisma.subscription.findMany({
    where: whereClause,
    include,
    orderBy: {
      createdAt: 'desc'
    },
    take: options?.limit,
    skip: options?.offset,
  });
}

/**
 * Cancel a subscription properly
 */
export async function cancelSubscription(
  subscriptionId: string,
  reason?: string
): Promise<SubscriptionWithRelations> {
  return await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelReason: reason || 'Cancelled via API',
    },
    include: {
      plan: true,
      organization: true,
      location: true,
      provider: true,
    }
  });
}

/**
 * Get subscription statistics for an entity
 */
export async function getSubscriptionStats(entity: SubscriptionEntity): Promise<{
  total: number;
  active: number;
  cancelled: number;
  expired: number;
  pastDue: number;
  trialing: number;
}> {
  const whereClause: any = {};
  
  switch (entity.type) {
    case 'organization':
      whereClause.organizationId = entity.id;
      break;
    case 'location':
      whereClause.locationId = entity.id;
      break;
    case 'provider':
      whereClause.providerId = entity.id;
      break;
  }

  const [total, active, cancelled, expired, pastDue, trialing] = await Promise.all([
    prisma.subscription.count({ where: whereClause }),
    prisma.subscription.count({ where: { ...whereClause, status: 'ACTIVE' } }),
    prisma.subscription.count({ where: { ...whereClause, status: 'CANCELLED' } }),
    prisma.subscription.count({ where: { ...whereClause, status: 'EXPIRED' } }),
    prisma.subscription.count({ where: { ...whereClause, status: 'PAST_DUE' } }),
    prisma.subscription.count({ where: { ...whereClause, status: 'TRIALING' } }),
  ]);

  return {
    total,
    active,
    cancelled,
    expired,
    pastDue,
    trialing,
  };
}