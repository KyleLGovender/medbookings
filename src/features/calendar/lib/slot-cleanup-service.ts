import {
  AvailabilityStatus,
  CleanupOptions,
  CleanupResult,
  SeriesCleanupResult,
  SlotStatus,
} from '@/features/calendar/types/types';
import { prisma } from '@/lib/prisma';

/**
 * Service for cleaning up slots when availability is deleted or modified
 */
export class SlotCleanupService {
  private options: CleanupOptions;

  constructor(options: CleanupOptions = {}) {
    this.options = {
      preserveBookedSlots: true,
      notifyAffectedCustomers: true,
      createCancellationRecords: true,
      cleanupOrphanedSlots: true,
      ...options,
    };
  }

  /**
   * Clean up slots for a single deleted availability
   */
  async cleanupAvailabilitySlots(availabilityId: string): Promise<CleanupResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    let slotsDeleted = 0;
    let slotsMarkedUnavailable = 0;
    let bookingsAffected = 0;
    let customersNotified = 0;

    try {
      // Get all slots for this availability
      const slots = await prisma.calculatedAvailabilitySlot.findMany({
        where: { availabilityId },
        include: {
          booking: {
            include: {
              client: true,
            },
          },
        },
      });

      const totalSlotsProcessed = slots.length;

      // Separate booked and unbooked slots
      const bookedSlots = slots.filter((slot) => slot.booking);
      const unbookedSlots = slots.filter((slot) => !slot.booking);

      // Handle unbooked slots - delete them
      if (unbookedSlots.length > 0) {
        const deleteResult = await prisma.calculatedAvailabilitySlot.deleteMany({
          where: {
            id: { in: unbookedSlots.map((slot) => slot.id) },
          },
        });
        slotsDeleted = deleteResult.count;
      }

      // Handle booked slots based on options
      if (bookedSlots.length > 0) {
        if (this.options.preserveBookedSlots) {
          // Mark booked slots as unavailable instead of deleting
          const updateResult = await prisma.calculatedAvailabilitySlot.updateMany({
            where: {
              id: { in: bookedSlots.map((slot) => slot.id) },
            },
            data: {
              status: SlotStatus.BLOCKED,
            },
          });
          slotsMarkedUnavailable = updateResult.count;
          bookingsAffected = bookedSlots.length;

          // Notify affected customers
          if (this.options.notifyAffectedCustomers) {
            customersNotified = await this.notifyAffectedCustomers(bookedSlots);
          }

          warnings.push(
            `${bookedSlots.length} booked slots marked as unavailable instead of deleted`
          );
        } else {
          // This would be a more aggressive cleanup - cancel bookings
          // For now, we'll just warn about it
          warnings.push(`${bookedSlots.length} booked slots cannot be deleted - bookings exist`);
        }
      }

      return {
        totalSlotsProcessed,
        slotsDeleted,
        slotsMarkedUnavailable,
        bookingsAffected,
        customersNotified,
        errors,
        warnings,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);

      return {
        totalSlotsProcessed: 0,
        slotsDeleted: 0,
        slotsMarkedUnavailable: 0,
        bookingsAffected: 0,
        customersNotified: 0,
        errors,
        warnings,
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Clean up slots for an entire recurring series
   */
  async cleanupRecurringSeriesSlots(
    seriesId: string,
    cleanupScope: 'all' | 'future_only' | 'cancelled_only' = 'all'
  ): Promise<SeriesCleanupResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    let totalSlotsProcessed = 0;
    let slotsDeleted = 0;
    let slotsMarkedUnavailable = 0;
    let bookingsAffected = 0;
    let customersNotified = 0;
    let availabilitiesProcessed = 0;
    let availabilitiesDeleted = 0;

    try {
      // Build where clause based on cleanup scope
      const whereClause: any = { seriesId };

      switch (cleanupScope) {
        case 'future_only':
          whereClause.startTime = { gte: new Date() };
          break;
        case 'cancelled_only':
          whereClause.status = AvailabilityStatus.CANCELLED;
          break;
        // 'all' includes everything
      }

      // Get all availabilities in the series that match the scope
      const availabilities = await prisma.availability.findMany({
        where: whereClause,
        include: {
          calculatedSlots: {
            include: {
              booking: {
                include: {
                  client: true,
                },
              },
            },
          },
        },
      });

      availabilitiesProcessed = availabilities.length;

      // Process each availability
      for (const availability of availabilities) {
        const slots = availability.calculatedSlots;
        totalSlotsProcessed += slots.length;

        const bookedSlots = slots.filter((slot) => slot.booking);
        const unbookedSlots = slots.filter((slot) => !slot.booking);

        // Delete unbooked slots
        if (unbookedSlots.length > 0) {
          const deleteResult = await prisma.calculatedAvailabilitySlot.deleteMany({
            where: {
              id: { in: unbookedSlots.map((slot) => slot.id) },
            },
          });
          slotsDeleted += deleteResult.count;
        }

        // Handle booked slots
        if (bookedSlots.length > 0) {
          if (this.options.preserveBookedSlots) {
            const updateResult = await prisma.calculatedAvailabilitySlot.updateMany({
              where: {
                id: { in: bookedSlots.map((slot) => slot.id) },
              },
              data: {
                status: SlotStatus.BLOCKED,
              },
            });
            slotsMarkedUnavailable += updateResult.count;
            bookingsAffected += bookedSlots.length;

            // Notify affected customers for this availability
            if (this.options.notifyAffectedCustomers) {
              customersNotified += await this.notifyAffectedCustomers(bookedSlots);
            }
          }
        }

        // Delete availability if no booked slots remain and scope allows
        if (bookedSlots.length === 0 || !this.options.preserveBookedSlots) {
          try {
            await prisma.availability.delete({
              where: { id: availability.id },
            });
            availabilitiesDeleted++;
          } catch (deleteError) {
            warnings.push(
              `Could not delete availability ${availability.id}: foreign key constraints`
            );
          }
        }
      }

      return {
        totalSlotsProcessed,
        slotsDeleted,
        slotsMarkedUnavailable,
        bookingsAffected,
        customersNotified,
        availabilitiesProcessed,
        availabilitiesDeleted,
        seriesId,
        errors,
        warnings,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);

      return {
        totalSlotsProcessed: 0,
        slotsDeleted: 0,
        slotsMarkedUnavailable: 0,
        bookingsAffected: 0,
        customersNotified: 0,
        availabilitiesProcessed: 0,
        availabilitiesDeleted: 0,
        seriesId,
        errors,
        warnings,
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Clean up orphaned slots (slots without valid availability)
   */
  async cleanupOrphanedSlots(): Promise<CleanupResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Find slots where availability is inactive
      const orphanedSlots = await prisma.calculatedAvailabilitySlot.findMany({
        where: {
          availability: {
            status: { in: [AvailabilityStatus.CANCELLED, AvailabilityStatus.REJECTED] },
          },
        },
        include: {
          booking: true,
        },
      });

      const totalSlotsProcessed = orphanedSlots.length;
      const bookedOrphanedSlots = orphanedSlots.filter((slot) => slot.booking);
      const unbookedOrphanedSlots = orphanedSlots.filter((slot) => !slot.booking);

      let slotsDeleted = 0;
      let slotsMarkedUnavailable = 0;

      // Delete unbooked orphaned slots
      if (unbookedOrphanedSlots.length > 0) {
        const deleteResult = await prisma.calculatedAvailabilitySlot.deleteMany({
          where: {
            id: { in: unbookedOrphanedSlots.map((slot) => slot.id) },
          },
        });
        slotsDeleted = deleteResult.count;
      }

      // Mark booked orphaned slots as unavailable
      if (bookedOrphanedSlots.length > 0) {
        const updateResult = await prisma.calculatedAvailabilitySlot.updateMany({
          where: {
            id: { in: bookedOrphanedSlots.map((slot) => slot.id) },
          },
          data: {
            status: SlotStatus.BLOCKED,
          },
        });
        slotsMarkedUnavailable = updateResult.count;
        warnings.push(
          `${bookedOrphanedSlots.length} orphaned slots with bookings marked as unavailable`
        );
      }

      return {
        totalSlotsProcessed,
        slotsDeleted,
        slotsMarkedUnavailable,
        bookingsAffected: bookedOrphanedSlots.length,
        customersNotified: 0, // Could implement notification for orphaned slots
        errors,
        warnings,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);

      return {
        totalSlotsProcessed: 0,
        slotsDeleted: 0,
        slotsMarkedUnavailable: 0,
        bookingsAffected: 0,
        customersNotified: 0,
        errors,
        warnings,
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Clean up slots for modified availability (preserve valid slots, remove invalid ones)
   */
  async cleanupModifiedAvailabilitySlots(
    availabilityId: string,
    modifiedFields: string[]
  ): Promise<CleanupResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Determine if the modification affects slot validity
      const destructiveFields = [
        'startTime',
        'endTime',
        'schedulingRule',
        'schedulingInterval',
        'status',
      ];

      const isDestructiveChange = modifiedFields.some((field) => destructiveFields.includes(field));

      if (!isDestructiveChange) {
        // No cleanup needed for non-destructive changes
        return {
          totalSlotsProcessed: 0,
          slotsDeleted: 0,
          slotsMarkedUnavailable: 0,
          bookingsAffected: 0,
          customersNotified: 0,
          errors,
          warnings: ['No cleanup needed for non-destructive changes'],
          processingTimeMs: Date.now() - startTime,
        };
      }

      // Get updated availability
      const availability = await prisma.availability.findUnique({
        where: { id: availabilityId },
      });

      if (!availability) {
        throw new Error('Availability not found');
      }

      // Get all existing slots
      const slots = await prisma.calculatedAvailabilitySlot.findMany({
        where: { availabilityId },
        include: {
          booking: true,
        },
      });

      const totalSlotsProcessed = slots.length;
      let slotsDeleted = 0;
      let slotsMarkedUnavailable = 0;
      let bookingsAffected = 0;

      // Check each slot for validity against the modified availability
      for (const slot of slots) {
        const isSlotValid = this.isSlotValidForModifiedAvailability(slot, availability);

        if (!isSlotValid) {
          if (slot.booking) {
            // Mark booked invalid slots as unavailable
            await prisma.calculatedAvailabilitySlot.update({
              where: { id: slot.id },
              data: { status: SlotStatus.BLOCKED },
            });
            slotsMarkedUnavailable++;
            bookingsAffected++;
          } else {
            // Delete unbooked invalid slots
            await prisma.calculatedAvailabilitySlot.delete({
              where: { id: slot.id },
            });
            slotsDeleted++;
          }
        }
      }

      return {
        totalSlotsProcessed,
        slotsDeleted,
        slotsMarkedUnavailable,
        bookingsAffected,
        customersNotified: 0, // Could implement notification here
        errors,
        warnings,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);

      return {
        totalSlotsProcessed: 0,
        slotsDeleted: 0,
        slotsMarkedUnavailable: 0,
        bookingsAffected: 0,
        customersNotified: 0,
        errors,
        warnings,
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Check if a slot is still valid for a modified availability
   */
  private isSlotValidForModifiedAvailability(slot: any, availability: any): boolean {
    // Check if slot times are within availability bounds
    if (slot.startTime < availability.startTime || slot.endTime > availability.endTime) {
      return false;
    }

    // Check if availability is still active
    if (availability.status !== AvailabilityStatus.ACCEPTED) {
      return false;
    }

    return true;
  }

  /**
   * Notify affected customers about slot changes
   */
  private async notifyAffectedCustomers(slotsWithBookings: any[]): Promise<number> {
    let notifiedCount = 0;

    for (const slot of slotsWithBookings) {
      if (slot.booking) {
        try {
          // In production, this would send actual notifications to customers
          // For now, we track that a notification should be sent without console logging
          // Production implementation would include:
          // await sendCustomerNotification({
          //   email: slot.booking.guestEmail,
          //   subject: 'Appointment Availability Changed',
          //   message: 'Your appointment availability has been cancelled. Please reschedule.',
          //   metadata: { bookingId: slot.booking.id, slotId: slot.id }
          // });

          notifiedCount++;
        } catch (error) {
          throw new Error(`Failed to notify customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    return notifiedCount;
  }
}

/**
 * Clean up slots for a deleted availability
 */
export async function cleanupDeletedAvailability(
  availabilityId: string,
  options?: CleanupOptions
): Promise<CleanupResult> {
  const service = new SlotCleanupService(options);
  return await service.cleanupAvailabilitySlots(availabilityId);
}

/**
 * Clean up slots for a deleted recurring series
 */
export async function cleanupDeletedRecurringSeries(
  seriesId: string,
  scope: 'all' | 'future_only' | 'cancelled_only' = 'all',
  options?: CleanupOptions
): Promise<SeriesCleanupResult> {
  const service = new SlotCleanupService(options);
  return await service.cleanupRecurringSeriesSlots(seriesId, scope);
}

/**
 * Clean up orphaned slots across the system
 */
export async function cleanupOrphanedSlots(options?: CleanupOptions): Promise<CleanupResult> {
  const service = new SlotCleanupService(options);
  return await service.cleanupOrphanedSlots();
}

/**
 * Clean up slots after availability modification
 */
export async function cleanupModifiedAvailability(
  availabilityId: string,
  modifiedFields: string[],
  options?: CleanupOptions
): Promise<CleanupResult> {
  const service = new SlotCleanupService(options);
  return await service.cleanupModifiedAvailabilitySlots(availabilityId, modifiedFields);
}
