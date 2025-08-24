'use server';

import { AvailabilityStatus, BillingEntity, OrganizationRole, UserRole } from '@prisma/client';

import {
  createAvailabilityDataSchema,
  updateAvailabilityDataSchema,
} from '@/features/calendar/types/schemas';
import { CreateAvailabilityData, UpdateAvailabilityData } from '@/features/calendar/types/types';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import { validateAvailability, validateRecurringAvailability } from './availability-validation';
import { generateRecurringInstances } from './recurrence-utils';

/**
 * Validate availability creation and prepare data for database operations
 * OPTION C: Business logic only - no database operations
 */
export async function validateAvailabilityCreation(data: CreateAvailabilityData): Promise<{
  success: boolean;
  validatedData?: CreateAvailabilityData & {
    instances: Array<{ startTime: Date; endTime: Date }>;
    seriesId?: string;
    initialStatus: AvailabilityStatus;
    billingEntity: BillingEntity;
    createdByMembershipId?: string;
    isProviderCreated: boolean;
  };
  requiresApproval?: boolean;
  notificationNeeded?: boolean;
  error?: string;
}> {
  try {
    // Get current user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Authentication required' };
    }

    // Validate input data
    const validatedData = createAvailabilityDataSchema.parse(data);

    // Get current user's provider record for authorization checks
    const currentUserProvider = await prisma.provider.findUnique({
      where: { userId: currentUser.id },
    });

    // Check if user has permission to create availability for this provider
    const canCreateForProvider =
      currentUserProvider?.id === validatedData.providerId ||
      currentUser.role === UserRole.ADMIN ||
      currentUser.role === UserRole.SUPER_ADMIN;

    if (!canCreateForProvider && validatedData.organizationId) {
      // Check if user has organization membership with appropriate role
      const membership = await prisma.organizationMembership.findFirst({
        where: {
          userId: currentUser.id,
          organizationId: validatedData.organizationId,
          role: { in: [OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.MANAGER] },
        },
      });

      if (!membership) {
        return { success: false, error: 'Insufficient permissions' };
      }
    } else if (!canCreateForProvider) {
      return {
        success: false,
        error: 'Can only create availability for your own provider account',
      };
    }

    // Determine initial status based on context
    const isProviderCreated = currentUserProvider?.id === validatedData.providerId;
    const initialStatus = isProviderCreated
      ? AvailabilityStatus.ACCEPTED
      : AvailabilityStatus.PENDING;

    // Determine billing entity if not specified
    const billingEntity =
      validatedData.billingEntity ||
      (isProviderCreated ? BillingEntity.PROVIDER : BillingEntity.ORGANIZATION);

    // Generate series ID for recurring availability
    const seriesId = validatedData.isRecurring
      ? validatedData.seriesId || crypto.randomUUID()
      : undefined;

    // Get current organization membership for context
    const createdByMembership = validatedData.organizationId
      ? await prisma.organizationMembership.findFirst({
          where: {
            userId: currentUser.id,
            organizationId: validatedData.organizationId,
          },
        })
      : null;

    // Validate recurring series if applicable
    if (validatedData.isRecurring && validatedData.recurrencePattern) {
      // Validate end date is after start date
      if (validatedData.recurrencePattern.endDate) {
        const endDate = new Date(validatedData.recurrencePattern.endDate);
        if (endDate <= validatedData.startTime) {
          return { success: false, error: 'Recurrence end date must be after start date' };
        }
      }

      // Validate recurrence pattern is properly formed
      if (!validatedData.recurrencePattern.option) {
        return { success: false, error: 'Invalid recurrence pattern' };
      }

      // For custom recurrence, validate days are provided
      if (
        validatedData.recurrencePattern.option === 'custom' &&
        (!validatedData.recurrencePattern.customDays ||
          validatedData.recurrencePattern.customDays.length === 0)
      ) {
        return {
          success: false,
          error: 'Custom recurrence requires at least one day to be selected',
        };
      }
    }

    // Generate recurring instances if needed
    const instances =
      validatedData.isRecurring && validatedData.recurrencePattern
        ? generateRecurringInstances(
            validatedData.recurrencePattern,
            validatedData.startTime,
            validatedData.endTime,
            365 // Max 365 instances to prevent excessive generation
          )
        : [{ startTime: validatedData.startTime, endTime: validatedData.endTime }];

    // Validate we don't have too many instances
    if (instances.length > 365) {
      return {
        success: false,
        error: 'Too many recurring instances. Maximum 365 instances allowed.',
      };
    }

    // Comprehensive availability validation
    if (validatedData.isRecurring && instances.length > 1) {
      // Validate recurring availability
      const recurringValidation = await validateRecurringAvailability({
        providerId: validatedData.providerId,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        instances,
      });

      if (!recurringValidation.isValid) {
        return { success: false, error: recurringValidation.errors.join('. ') };
      }
    } else {
      // Validate single availability
      const singleValidation = await validateAvailability({
        providerId: validatedData.providerId,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
      });

      if (!singleValidation.isValid) {
        return { success: false, error: singleValidation.errors.join('. ') };
      }
    }

    // Return validated data for tRPC procedure to process
    return {
      success: true,
      validatedData: {
        ...validatedData,
        instances,
        seriesId,
        initialStatus,
        billingEntity,
        createdByMembershipId: createdByMembership?.id,
        isProviderCreated,
      },
      requiresApproval: initialStatus === AvailabilityStatus.PENDING,
      notificationNeeded: !isProviderCreated && initialStatus === AvailabilityStatus.PENDING,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate availability creation',
    };
  }
}

/**
 * Validate availability update and prepare data for database operations
 * OPTION C: Business logic only - no database operations
 */
export async function validateAvailabilityUpdate(data: UpdateAvailabilityData): Promise<{
  success: boolean;
  validatedData?: UpdateAvailabilityData & {
    updateStrategy: 'single' | 'future' | 'all';
    needsSlotRegeneration: boolean;
    affectedAvailabilityIds?: string[];
    existingAvailability?: any;
  };
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Authentication required' };
    }

    // Validate input data
    const validatedData = updateAvailabilityDataSchema.parse(data);

    // Validate scope parameter
    if (validatedData.scope) {
      if (!['single', 'future', 'all'].includes(validatedData.scope)) {
        return {
          success: false,
          error: 'Invalid scope parameter. Must be "single", "future", or "all"',
        };
      }

      // Check if this is a recurring availability for non-single scopes
      if (validatedData.scope !== 'single') {
        const targetAvailability = await prisma.availability.findUnique({
          where: { id: validatedData.id },
          select: { isRecurring: true, seriesId: true },
        });

        if (!targetAvailability?.isRecurring) {
          return {
            success: false,
            error: 'Scope "future" and "all" can only be used with recurring availability',
          };
        }
      }
    }

    // Get existing availability for validation
    const existingAvailability = await prisma.availability.findUnique({
      where: { id: validatedData.id },
      include: {
        calculatedSlots: {
          include: {
            booking: true,
          },
        },
      },
    });

    if (!existingAvailability) {
      return { success: false, error: 'Availability not found' };
    }

    // Get current user's provider record for authorization checks
    const currentUserProvider = await prisma.provider.findUnique({
      where: { userId: currentUser.id },
    });

    // Check permissions
    const canUpdate =
      currentUserProvider?.id === existingAvailability.providerId ||
      currentUser.id === existingAvailability.createdById ||
      currentUser.role === UserRole.ADMIN ||
      currentUser.role === UserRole.SUPER_ADMIN;

    if (!canUpdate && existingAvailability.organizationId) {
      const membership = await prisma.organizationMembership.findFirst({
        where: {
          userId: currentUser.id,
          organizationId: existingAvailability.organizationId,
          role: { in: [OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.MANAGER] },
        },
      });

      if (!membership) {
        return { success: false, error: 'Insufficient permissions' };
      }
    } else if (!canUpdate) {
      return { success: false, error: 'Access denied' };
    }

    // Check if there are existing bookings that would be affected
    const hasBookings = existingAvailability.calculatedSlots.some((slot) => slot.booking);

    if (hasBookings && (validatedData.startTime || validatedData.endTime)) {
      return {
        success: false,
        error: 'Cannot modify time for availability with existing bookings',
      };
    }

    // Validate time changes if startTime or endTime is being updated
    if (validatedData.startTime || validatedData.endTime) {
      const newStartTime = validatedData.startTime || existingAvailability.startTime;
      const newEndTime = validatedData.endTime || existingAvailability.endTime;

      const updateValidation = await validateAvailability({
        providerId: existingAvailability.providerId,
        startTime: newStartTime,
        endTime: newEndTime,
        excludeAvailabilityId: existingAvailability.id,
      });

      if (!updateValidation.isValid) {
        return { success: false, error: updateValidation.errors.join('. ') };
      }
    }

    // Determine update strategy
    const updateStrategy = validatedData.scope || 'single';

    // Determine if slot regeneration is needed
    const needsSlotRegeneration = !!(
      validatedData.startTime ||
      validatedData.endTime ||
      validatedData.services ||
      validatedData.schedulingRule ||
      validatedData.schedulingInterval !== undefined
    );

    // Calculate affected availability IDs for scope operations
    let affectedAvailabilityIds: string[] = [validatedData.id];

    if (validatedData.scope && existingAvailability.isRecurring && existingAvailability.seriesId) {
      const currentDate = new Date(existingAvailability.startTime);

      if (validatedData.scope === 'future') {
        const futureAvailabilities = await prisma.availability.findMany({
          where: {
            seriesId: existingAvailability.seriesId,
            startTime: { gte: currentDate },
          },
          select: { id: true },
        });
        affectedAvailabilityIds = futureAvailabilities.map((a) => a.id);
      } else if (validatedData.scope === 'all') {
        const allAvailabilities = await prisma.availability.findMany({
          where: { seriesId: existingAvailability.seriesId },
          select: { id: true },
        });
        affectedAvailabilityIds = allAvailabilities.map((a) => a.id);
      }
    }

    // Return validated data for tRPC procedure to process
    return {
      success: true,
      validatedData: {
        ...validatedData,
        updateStrategy,
        needsSlotRegeneration,
        affectedAvailabilityIds,
        existingAvailability,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate availability update',
    };
  }
}

/**
 * Validate availability deletion and prepare data for database operations
 * OPTION C: Business logic only - no database operations
 */
export async function validateAvailabilityDeletion(
  id: string,
  scope?: 'single' | 'future' | 'all'
): Promise<{
  success: boolean;
  validatedData?: {
    targetAvailabilityId: string;
    deleteStrategy: 'single' | 'future' | 'all';
    affectedAvailabilityIds: string[];
    existingAvailability: any;
    canDelete: boolean;
  };
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Authentication required' };
    }

    // Get existing availability with bookings for validation
    const existingAvailability = await prisma.availability.findUnique({
      where: { id },
      include: {
        calculatedSlots: {
          include: {
            booking: true,
          },
        },
      },
    });

    if (!existingAvailability) {
      return { success: false, error: 'Availability not found' };
    }

    // Get current user's provider record for authorization checks
    const currentUserProvider = await prisma.provider.findUnique({
      where: { userId: currentUser.id },
    });

    // Check permissions
    const canDelete =
      currentUserProvider?.id === existingAvailability.providerId ||
      currentUser.id === existingAvailability.createdById ||
      currentUser.role === UserRole.ADMIN ||
      currentUser.role === UserRole.SUPER_ADMIN;

    if (!canDelete && existingAvailability.organizationId) {
      const membership = await prisma.organizationMembership.findFirst({
        where: {
          userId: currentUser.id,
          organizationId: existingAvailability.organizationId,
          role: { in: [OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.MANAGER] },
        },
      });

      if (!membership) {
        return { success: false, error: 'Insufficient permissions' };
      }
    } else if (!canDelete) {
      return { success: false, error: 'Access denied' };
    }

    // Determine delete strategy
    const deleteStrategy = scope || 'single';

    // Calculate affected availability IDs for scope operations
    let affectedAvailabilityIds: string[] = [id];

    if (scope && existingAvailability.seriesId) {
      const currentDate = new Date(existingAvailability.startTime);

      if (scope === 'future') {
        const futureAvailabilities = await prisma.availability.findMany({
          where: {
            seriesId: existingAvailability.seriesId,
            startTime: { gte: currentDate },
          },
          select: { id: true },
        });
        affectedAvailabilityIds = futureAvailabilities.map((a) => a.id);
      } else if (scope === 'all') {
        const allAvailabilities = await prisma.availability.findMany({
          where: { seriesId: existingAvailability.seriesId },
          select: { id: true },
        });
        affectedAvailabilityIds = allAvailabilities.map((a) => a.id);
      }
    }

    // Check for existing bookings in all affected availabilities
    if (scope && existingAvailability.seriesId) {
      const affectedAvailabilities = await prisma.availability.findMany({
        where: { id: { in: affectedAvailabilityIds } },
        include: {
          calculatedSlots: {
            include: {
              booking: true,
            },
          },
        },
      });

      const hasBookings = affectedAvailabilities.some((av) =>
        av.calculatedSlots.some((slot) => slot.booking)
      );

      if (hasBookings) {
        return {
          success: false,
          error: 'Cannot delete availability with existing bookings. Cancel the bookings first.',
        };
      }
    } else {
      // Single availability booking check
      const hasBookings = existingAvailability.calculatedSlots.some((slot) => slot.booking);

      if (hasBookings) {
        return {
          success: false,
          error: 'Cannot delete availability with existing bookings. Cancel the bookings first.',
        };
      }
    }

    // Return validated data for tRPC procedure to process
    return {
      success: true,
      validatedData: {
        targetAvailabilityId: id,
        deleteStrategy,
        affectedAvailabilityIds,
        existingAvailability,
        canDelete: true,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate availability deletion',
    };
  }
}
