'use server';

import { revalidatePath } from 'next/cache';

import { Prisma } from '@prisma/client';

import {
  createAvailabilityDataSchema,
  updateAvailabilityDataSchema,
} from '@/features/calendar/types/schemas';
import {
  AvailabilityStatus,
  BillingEntity,
  CreateAvailabilityData,
  SchedulingRule,
  UpdateAvailabilityData
} from '@/features/calendar/types/types';
import { UserRole } from '@/features/profile/types/types';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import {
  validateAvailability,
  validateRecurringAvailability
} from './availability-validation';
import { generateRecurringInstances } from './recurrence-utils';
import { generateSlotsForAvailability } from './slot-generation';

/**
 * Create new availability period
 */
export async function createAvailability(
  data: CreateAvailabilityData
): Promise<{ 
  success: boolean; 
  availabilityId?: string;
  seriesId?: string;
  allAvailabilityIds?: string[];
  requiresApproval?: boolean;
  notificationsSent?: boolean;
  slotsGenerated?: number;
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
          role: { in: ['OWNER', 'ADMIN', 'MANAGER'] },
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
    // Check if current user is the service provider by comparing Provider IDs
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
      : null;

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

    // Create availability instances
    const availabilities = await Promise.all(
      instances.map(async (instance) => {
        return prisma.availability.create({
          data: {
            providerId: validatedData.providerId,
            organizationId: validatedData.organizationId,
            locationId: validatedData.locationId,
            connectionId: validatedData.connectionId,
            startTime: instance.startTime,
            endTime: instance.endTime,
            isRecurring: validatedData.isRecurring,
            recurrencePattern: validatedData.recurrencePattern || Prisma.JsonNull,
            seriesId,
            schedulingRule: validatedData.schedulingRule,
            schedulingInterval: validatedData.schedulingInterval,
            isOnlineAvailable: validatedData.isOnlineAvailable,
            requiresConfirmation: validatedData.requiresConfirmation,
            billingEntity: billingEntity || null,
            status: initialStatus,
            createdById: currentUser.id,
            createdByMembershipId: createdByMembership?.id,
            defaultSubscriptionId: validatedData.defaultSubscriptionId,
            availableServices: {
              create: validatedData.services.map((service) => ({
                service: { connect: { id: service.serviceId } },
                provider: { connect: { id: validatedData.providerId } },
                duration: service.duration,
                price: service.price,
                isOnlineAvailable: validatedData.isOnlineAvailable, // Use availability-level setting
                isInPerson: !validatedData.isOnlineAvailable || !!validatedData.locationId, // True if not online-only or has location
                locationId: validatedData.locationId, // Use availability-level location
              })),
            },
          },
        });
      })
    );

    // Return the first availability instance (master instance)
    const availability = availabilities[0];

    // Generate slots for accepted availability (provider-created is auto-accepted)
    let totalSlotsGenerated = 0;
    if (availability.status === AvailabilityStatus.ACCEPTED) {
      // Generate slots for each created availability
      for (const av of availabilities) {
        try {
          const slotResult = await generateSlotsForAvailability({
            availabilityId: av.id,
            startTime: av.startTime,
            endTime: av.endTime,
            providerId: av.providerId,
            organizationId: av.organizationId || '',
            locationId: av.locationId || undefined,
            schedulingRule: av.schedulingRule as SchedulingRule,
            schedulingInterval: av.schedulingInterval || undefined,
            services: validatedData.services,
          });

          if (slotResult.success) {
            totalSlotsGenerated += slotResult.slotsGenerated;
          } else {
            // Log slot generation failure but don't block creation
            console.warn(`Slot generation failed for availability ${av.id}:`, slotResult.errors?.join(', '));
          }
        } catch (slotError) {
          // Log slot generation error but don't block creation
          console.error('Slot generation error during availability creation:', slotError);
        }
      }
    }

    // Send proposal notification if this is organization-created
    if (!isProviderCreated && availability.status === AvailabilityStatus.PENDING) {
      // TODO: Implement proper notification service
      console.log(`📧 Availability proposal notification would be sent for availability ${availability.id}`);
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard/availability');
    revalidatePath('/dashboard/calendar');
    if (validatedData.organizationId) {
      revalidatePath(`/dashboard/organizations/${validatedData.organizationId}/availability`);
    }

    return { 
      success: true, 
      availabilityId: availability.id,
      seriesId: availability.seriesId || undefined,
      allAvailabilityIds: availabilities.map(a => a.id),
      requiresApproval: availability.status === AvailabilityStatus.PENDING,
      notificationsSent: !isProviderCreated && availability.status === AvailabilityStatus.PENDING,
      slotsGenerated: totalSlotsGenerated
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create availability',
    };
  }
}

/**
 * Update existing availability
 */
export async function updateAvailability(
  data: UpdateAvailabilityData
): Promise<{ success: boolean; availabilityId?: string; slotsRegenerated?: number; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Authentication required' };
    }

    // Validate input data
    const validatedData = updateAvailabilityDataSchema.parse(data);

    // Validate scope for recurring availability
    if (validatedData.scope) {
      // Check if this is a recurring availability first
      const targetAvailability = await prisma.availability.findUnique({
        where: { id: validatedData.id },
        select: { isRecurring: true, seriesId: true },
      });

      if (!targetAvailability?.isRecurring) {
        return {
          success: false,
          error: 'Scope parameter can only be used with recurring availability',
        };
      }

      if (!['single', 'future', 'all'].includes(validatedData.scope)) {
        return {
          success: false,
          error: 'Invalid scope parameter. Must be "single", "future", or "all"',
        };
      }
    }

    // Get existing availability
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
      currentUser.role === 'ADMIN' ||
      currentUser.role === 'SUPER_ADMIN';

    if (!canUpdate && existingAvailability.organizationId) {
      const membership = await prisma.organizationMembership.findFirst({
        where: {
          userId: currentUser.id,
          organizationId: existingAvailability.organizationId,
          role: { in: ['OWNER', 'ADMIN', 'MANAGER'] },
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

    // Prepare update data
    const updateData: any = {};

    if (validatedData.startTime !== undefined) updateData.startTime = validatedData.startTime;
    if (validatedData.endTime !== undefined) updateData.endTime = validatedData.endTime;
    if (validatedData.isRecurring !== undefined) updateData.isRecurring = validatedData.isRecurring;
    if (validatedData.recurrencePattern !== undefined)
      updateData.recurrencePattern = validatedData.recurrencePattern;
    if (validatedData.schedulingRule !== undefined)
      updateData.schedulingRule = validatedData.schedulingRule;
    if (validatedData.schedulingInterval !== undefined)
      updateData.schedulingInterval = validatedData.schedulingInterval;
    if (validatedData.isOnlineAvailable !== undefined)
      updateData.isOnlineAvailable = validatedData.isOnlineAvailable;
    if (validatedData.requiresConfirmation !== undefined)
      updateData.requiresConfirmation = validatedData.requiresConfirmation;
    if (validatedData.billingEntity !== undefined)
      updateData.billingEntity = validatedData.billingEntity;

    // Handle scope-based updates for recurring availability
    let updatedAvailability;

    if (validatedData.scope && existingAvailability.isRecurring && existingAvailability.seriesId) {
      const currentDate = new Date(existingAvailability.startTime);

      switch (validatedData.scope) {
        case 'single':
          // Update only this single occurrence
          updatedAvailability = await prisma.availability.update({
            where: { id: validatedData.id },
            data: updateData,
            });
          break;

        case 'future':
          // Update this occurrence and all future occurrences in the series
          const futureWhere = {
            seriesId: existingAvailability.seriesId,
            startTime: { gte: currentDate },
          };

          await prisma.availability.updateMany({
            where: futureWhere,
            data: updateData,
          });

          // Get the updated availability with relations
          updatedAvailability = await prisma.availability.findUnique({
            where: { id: validatedData.id },
            });
          break;

        case 'all':
          // Update all occurrences in the series
          await prisma.availability.updateMany({
            where: { seriesId: existingAvailability.seriesId },
            data: updateData,
          });

          // Get the updated availability with relations
          updatedAvailability = await prisma.availability.findUnique({
            where: { id: validatedData.id },
            });
          break;

        default:
          return { success: false, error: 'Invalid scope parameter' };
      }
    } else {
      // Standard single availability update
      updatedAvailability = await prisma.availability.update({
        where: { id: validatedData.id },
        data: updateData,
        });
    }

    // Update services if provided (scope-aware)
    if (validatedData.services) {
      if (
        validatedData.scope &&
        existingAvailability.isRecurring &&
        existingAvailability.seriesId
      ) {
        // Handle scope-based service updates
        const currentDate = new Date(existingAvailability.startTime);
        let targetAvailabilityIds: string[] = [];

        switch (validatedData.scope) {
          case 'single':
            targetAvailabilityIds = [validatedData.id];
            break;
          case 'future':
            const futureAvailabilities = await prisma.availability.findMany({
              where: {
                seriesId: existingAvailability.seriesId,
                startTime: { gte: currentDate },
              },
              select: { id: true },
            });
            targetAvailabilityIds = futureAvailabilities.map((a) => a.id);
            break;
          case 'all':
            const allAvailabilities = await prisma.availability.findMany({
              where: { seriesId: existingAvailability.seriesId },
              select: { id: true },
            });
            targetAvailabilityIds = allAvailabilities.map((a) => a.id);
            break;
        }

        // Delete existing service configs for target availabilities
        await prisma.serviceAvailabilityConfig.deleteMany({
          where: { availabilities: { some: { id: { in: targetAvailabilityIds } } } },
        });
      } else {
        // Standard single availability service update
        await prisma.serviceAvailabilityConfig.deleteMany({
          where: { availabilities: { some: { id: validatedData.id } } },
        });
      }

      // Create new service configs
      await prisma.serviceAvailabilityConfig.createMany({
        data: validatedData.services.map((service) => ({
          serviceId: service.serviceId,
          providerId: existingAvailability.providerId,
          duration: service.duration,
          price: service.price,
          isOnlineAvailable: validatedData.isOnlineAvailable || false, // Use availability-level setting
          isInPerson: !validatedData.isOnlineAvailable || !!validatedData.locationId, // True if not online-only or has location
          locationId: validatedData.locationId, // Use availability-level location
        })),
      });
    }

    // Intelligently update slots based on what changed
    let slotsRegenerated = 0;
    if (updatedAvailability && updatedAvailability.status === AvailabilityStatus.ACCEPTED) {
      try {
        // Get the updated availability with its services and existing slots
        const availabilityWithSlots = await prisma.availability.findUnique({
          where: { id: validatedData.id },
          include: {
            availableServices: true,
            calculatedSlots: {
              include: {
                booking: true, // Check for existing bookings
              },
            },
          },
        });

        if (availabilityWithSlots) {
          // Determine what changed to decide slot update strategy
          const hasTimeChanges = validatedData.startTime || validatedData.endTime;
          const hasServiceChanges = validatedData.services && validatedData.services.length > 0;
          const hasSchedulingChanges = validatedData.schedulingRule || validatedData.schedulingInterval !== undefined;
          
          if (hasTimeChanges || hasServiceChanges || hasSchedulingChanges) {
            // Check for existing bookings before modifying slots
            const bookedSlots = availabilityWithSlots.calculatedSlots.filter(slot => slot.booking);
            
            if (bookedSlots.length > 0) {
              // If there are bookings, only regenerate unbooked slots
              console.warn(`Availability ${availabilityWithSlots.id} has ${bookedSlots.length} booked slots. Only regenerating unbooked slots.`);
              
              // Delete only unbooked slots
              const unbookedSlotIds = availabilityWithSlots.calculatedSlots
                .filter(slot => !slot.booking)
                .map(slot => slot.id);
                
              if (unbookedSlotIds.length > 0) {
                await prisma.calculatedAvailabilitySlot.deleteMany({
                  where: { id: { in: unbookedSlotIds } },
                });
              }
            } else {
              // No bookings, safe to regenerate all slots
              await prisma.calculatedAvailabilitySlot.deleteMany({
                where: { availabilityId: availabilityWithSlots.id },
              });
            }

            // Generate new slots with updated parameters
            const slotResult = await generateSlotsForAvailability({
              availabilityId: availabilityWithSlots.id,
              providerId: availabilityWithSlots.providerId,
              organizationId: availabilityWithSlots.organizationId || '',
              locationId: availabilityWithSlots.locationId || undefined,
              startTime: availabilityWithSlots.startTime,
              endTime: availabilityWithSlots.endTime,
              services: availabilityWithSlots.availableServices.map((as) => ({
                serviceId: as.serviceId,
                duration: as.duration,
                price: Number(as.price),
              })),
              schedulingRule: availabilityWithSlots.schedulingRule as SchedulingRule,
              schedulingInterval: availabilityWithSlots.schedulingInterval || undefined,
            });

            if (slotResult.success) {
              slotsRegenerated = slotResult.slotsGenerated;
            } else {
              // Log slot regeneration failure but don't block update
              console.warn(`Slot regeneration failed for updated availability ${availabilityWithSlots.id}:`, slotResult.errors?.join(', '));
            }
          }
          // If no relevant changes were made, keep existing slots as-is
        }
      } catch (slotGenError) {
        // Log slot regeneration error but don't block update
        console.error('Slot regeneration error during availability update:', slotGenError);
      }
    }

    // Revalidate paths
    revalidatePath('/dashboard/availability');
    revalidatePath('/dashboard/calendar');
    if (existingAvailability.organizationId) {
      revalidatePath(
        `/dashboard/organizations/${existingAvailability.organizationId}/availability`
      );
    }

    return { success: true, availabilityId: validatedData.id, slotsRegenerated };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update availability',
    };
  }
}

/**
 * Delete availability (soft delete by setting status to CANCELLED)
 */
export async function deleteAvailability(
  id: string,
  scope?: 'single' | 'future' | 'all'
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Authentication required' };
    }

    // Get existing availability with bookings
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
      currentUser.role === 'ADMIN' ||
      currentUser.role === 'SUPER_ADMIN';

    if (!canDelete && existingAvailability.organizationId) {
      const membership = await prisma.organizationMembership.findFirst({
        where: {
          userId: currentUser.id,
          organizationId: existingAvailability.organizationId,
          role: { in: ['OWNER', 'ADMIN', 'MANAGER'] },
        },
      });

      if (!membership) {
        return { success: false, error: 'Insufficient permissions' };
      }
    } else if (!canDelete) {
      return { success: false, error: 'Access denied' };
    }

    // Check for existing bookings
    const hasBookings = existingAvailability.calculatedSlots.some((slot) => slot.booking);

    if (hasBookings) {
      return {
        success: false,
        error: 'Cannot delete availability with existing bookings. Cancel the bookings first.',
      };
    }

    // Handle series operations
    if (scope && existingAvailability.seriesId) {
      return handleSeriesDelete(existingAvailability, scope);
    }

    // Hard delete - first delete calculated slots, then availability
    await prisma.calculatedAvailabilitySlot.deleteMany({
      where: { availabilityId: id },
    });

    // Delete the availability record
    await prisma.availability.delete({
      where: { id },
    });

    // Revalidate paths
    revalidatePath('/dashboard/availability');
    revalidatePath('/dashboard/calendar');
    if (existingAvailability.organizationId) {
      revalidatePath(
        `/dashboard/organizations/${existingAvailability.organizationId}/availability`
      );
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete availability',
    };
  }
}

/**
 * Handle series deletion operations
 */
async function handleSeriesDelete(
  availability: any,
  scope: 'single' | 'future' | 'all'
): Promise<{ success: boolean; error?: string }> {
  try {
    const seriesId = availability.seriesId;
    const currentDate = availability.startTime;

    let deleteConditions: any = { seriesId };

    switch (scope) {
      case 'single':
        // Delete only this occurrence
        deleteConditions = { id: availability.id };
        break;
      case 'future':
        // Delete this and all future occurrences
        deleteConditions = {
          seriesId,
          startTime: { gte: currentDate },
        };
        break;
      case 'all':
        // Delete all occurrences in the series
        deleteConditions = { seriesId };
        break;
    }

    // Check for bookings in the affected availabilities
    const affectedAvailabilities = await prisma.availability.findMany({
      where: deleteConditions,
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

    // Delete calculated slots first
    await prisma.calculatedAvailabilitySlot.deleteMany({
      where: {
        availability: deleteConditions,
      },
    });

    // Delete the availability records
    await prisma.availability.deleteMany({
      where: deleteConditions,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete availability series',
    };
  }
}
