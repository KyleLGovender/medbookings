import {
  AvailabilityStatus,
  BookingCompatibilityCheck,
  BookingValidationResult,
  SchedulingRule,
  SlotBookingRequest,
  SlotStatus,
} from '@/features/calendar/types/types';
import { prisma } from '@/lib/prisma';

import { isSlotValidForSchedulingRule } from './scheduling-rules';

/**
 * Service for integrating booking functionality with new scheduling rules
 */
export class BookingIntegrationService {
  /**
   * Validate a booking request against scheduling rules and availability
   */
  async validateBookingRequest(request: SlotBookingRequest): Promise<BookingValidationResult> {
    try {
      // Get slot with all related data
      const slot = await prisma.calculatedAvailabilitySlot.findUnique({
        where: { id: request.slotId },
        include: {
          availability: {
            include: {
              provider: true,
              organization: true,
              location: true,
            },
          },
          service: true,
          serviceConfig: true,
          booking: true,
          blockedByCalendarEvent: true,
        },
      });

      if (!slot) {
        return {
          isValid: false,
          conflicts: ['Slot not found'],
          warnings: [],
          schedulingRuleCompliant: false,
          requiresConfirmation: false,
          estimatedDuration: 0,
          price: 0,
        };
      }

      const conflicts: string[] = [];
      const warnings: string[] = [];

      // Check slot availability
      if (slot.status !== SlotStatus.AVAILABLE) {
        conflicts.push(`Slot is ${slot.status.toLowerCase()}`);
      }

      // Check if already booked
      if (slot.booking) {
        conflicts.push('Slot is already booked');
      }

      // Check if blocked by calendar event
      if (slot.blockedByCalendarEvent) {
        conflicts.push('Slot is blocked by a calendar event');
      }

      // Check availability status
      if (slot.availability.status !== AvailabilityStatus.ACCEPTED) {
        conflicts.push('Availability is not accepted');
      }

      // Check if slot is in the past
      if (slot.startTime < new Date()) {
        conflicts.push('Cannot book slots in the past');
      }

      // Validate against scheduling rules
      const schedulingRuleCompliant = this.validateSchedulingRuleCompliance(
        slot,
        request.preferredStartTime
      );

      if (!schedulingRuleCompliant.isCompliant) {
        conflicts.push(schedulingRuleCompliant.reason || 'Scheduling rule violation');
      }

      // Check for conflicts with other bookings
      const conflictCheck = await this.checkBookingConflicts(slot, request);
      conflicts.push(...conflictCheck.conflicts);
      warnings.push(...conflictCheck.warnings);

      // Determine if confirmation is required
      const requiresConfirmation = slot.availability.requiresConfirmation;

      return {
        isValid: conflicts.length === 0,
        slot,
        availability: slot.availability,
        conflicts,
        warnings,
        schedulingRuleCompliant: schedulingRuleCompliant.isCompliant,
        requiresConfirmation,
        estimatedDuration: Math.round(
          (slot.endTime.getTime() - slot.startTime.getTime()) / (1000 * 60)
        ),
        price: slot.serviceConfig?.price?.toNumber() || 0,
      };
    } catch (error) {
      return {
        isValid: false,
        conflicts: ['Internal error during validation'],
        warnings: [],
        schedulingRuleCompliant: false,
        requiresConfirmation: false,
        estimatedDuration: 0,
        price: 0,
      };
    }
  }

  /**
   * Check booking compatibility with scheduling rules
   */
  async checkBookingCompatibility(
    slotId: string,
    requestedStartTime?: Date,
    requestedDuration?: number
  ): Promise<BookingCompatibilityCheck> {
    try {
      const slot = await prisma.calculatedAvailabilitySlot.findUnique({
        where: { id: slotId },
        include: {
          availability: true,
        },
      });

      if (!slot) {
        return {
          slotId,
          requestedStartTime,
          requestedDuration,
          schedulingRule: SchedulingRule.CONTINUOUS,
          isCompatible: false,
          reason: 'Slot not found',
        };
      }

      const schedulingRule = slot.availability.schedulingRule as SchedulingRule;
      const schedulingInterval = slot.availability.schedulingInterval;

      // If no custom time requested, use slot default
      const startTime = requestedStartTime || slot.startTime;
      const duration =
        requestedDuration ||
        Math.round((slot.endTime.getTime() - slot.startTime.getTime()) / (1000 * 60));

      // Check if requested time is valid for the scheduling rule
      const isValidTime = isSlotValidForSchedulingRule(startTime, duration, schedulingRule, {
        interval: schedulingInterval || undefined,
        alignToHour: schedulingRule === SchedulingRule.ON_THE_HOUR,
        alignToHalfHour: false,
        alignToQuarterHour: false,
      });

      if (isValidTime) {
        return {
          slotId,
          requestedStartTime,
          requestedDuration,
          schedulingRule,
          schedulingInterval: schedulingInterval || undefined,
          isCompatible: true,
          adjustedStartTime: startTime,
          adjustedEndTime: new Date(startTime.getTime() + duration * 60 * 1000),
        };
      }

      // Try to find the nearest compatible time
      const adjustedTime = this.findNearestCompatibleTime(
        startTime,
        duration,
        schedulingRule,
        schedulingInterval,
        slot.availability.startTime,
        slot.availability.endTime
      );

      if (adjustedTime) {
        return {
          slotId,
          requestedStartTime,
          requestedDuration,
          schedulingRule,
          schedulingInterval: schedulingInterval || undefined,
          isCompatible: true,
          adjustedStartTime: adjustedTime.startTime,
          adjustedEndTime: adjustedTime.endTime,
          reason: 'Adjusted to comply with scheduling rule',
        };
      }

      return {
        slotId,
        requestedStartTime,
        requestedDuration,
        schedulingRule,
        schedulingInterval: schedulingInterval || undefined,
        isCompatible: false,
        reason: 'No compatible time found within availability window',
      };
    } catch (error) {
      return {
        slotId,
        requestedStartTime,
        requestedDuration,
        schedulingRule: SchedulingRule.CONTINUOUS,
        isCompatible: false,
        reason: 'Internal error during compatibility check',
      };
    }
  }

  /**
   * Find available slots that match booking criteria with scheduling rule support
   */
  async findCompatibleSlots(
    providerId: string,
    serviceId: string,
    preferredDate: Date,
    duration: number,
    locationId?: string,
    isOnline?: boolean
  ): Promise<
    Array<{
      slotId: string;
      startTime: Date;
      endTime: Date;
      price: number;
      location?: string;
      isOnlineAvailable: boolean;
      schedulingRule: SchedulingRule;
      requiresConfirmation: boolean;
    }>
  > {
    try {
      // Get available slots for the criteria
      const startOfDay = new Date(preferredDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(preferredDate);
      endOfDay.setHours(23, 59, 59, 999);

      const slots = await prisma.calculatedAvailabilitySlot.findMany({
        where: {
          serviceId,
          availability: {
            providerId: providerId,
            status: AvailabilityStatus.ACCEPTED,
          },
          startTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: SlotStatus.AVAILABLE,
          ...(locationId ? { locationId } : {}),
          ...(isOnline !== undefined ? { isOnlineAvailable: isOnline } : {}),
        },
        include: {
          availability: {
            include: {
              location: true,
            },
          },
          service: true,
        },
        orderBy: {
          startTime: 'asc',
        },
      });

      // Filter and format slots based on scheduling rule compatibility
      const compatibleSlots = [];

      for (const slot of slots) {
        const schedulingRule = slot.availability.schedulingRule as SchedulingRule;

        // Check if the slot's timing is compatible with its scheduling rule
        const isCompatible = isSlotValidForSchedulingRule(
          slot.startTime,
          duration,
          schedulingRule,
          {
            interval: slot.availability.schedulingInterval || undefined,
            alignToHour: schedulingRule === SchedulingRule.ON_THE_HOUR,
            alignToHalfHour: false,
            alignToQuarterHour: false,
          }
        );

        if (isCompatible) {
          compatibleSlots.push({
            slotId: slot.id,
            startTime: slot.startTime,
            endTime: new Date(slot.startTime.getTime() + duration * 60 * 1000),
            price: slot.service?.defaultPrice?.toNumber() || 0,
            location: slot.availability.location?.name,
            isOnlineAvailable: slot.availability.isOnlineAvailable,
            schedulingRule,
            requiresConfirmation: slot.availability.requiresConfirmation,
          });
        }
      }

      return compatibleSlots;
    } catch (error) {
      return [];
    }
  }

  /**
   * Create a booking with scheduling rule validation
   */
  async createBookingWithValidation(request: SlotBookingRequest): Promise<{
    success: boolean;
    bookingId?: string;
    booking?: any;
    conflicts: string[];
    requiresConfirmation: boolean;
  }> {
    try {
      // Validate the booking request first
      const validation = await this.validateBookingRequest(request);

      if (!validation.isValid) {
        return {
          success: false,
          conflicts: validation.conflicts,
          requiresConfirmation: false,
        };
      }

      const slot = validation.slot!;
      const availability = validation.availability!;

      // Determine booking status based on confirmation requirements
      const bookingStatus = availability.requiresConfirmation ? 'PENDING' : 'CONFIRMED';

      // Create the booking
      const booking = await prisma.booking.create({
        data: {
          clientId: request.customerId,
          guestName: request.customerName,
          guestEmail: request.customerEmail,
          guestPhone: request.customerPhone,
          notes: request.notes,
          status: bookingStatus,
          price: slot.serviceConfig?.price?.toNumber() || 0,
          isOnline: slot.availability.isOnlineAvailable,
          isInPerson: slot.availability.isInPersonAvailable,
          slotId: slot.id,
          // Additional booking fields would be added here
        },
        include: {
          slot: {
            include: {
              service: true,
              availability: {
                include: {
                  provider: true,
                  organization: true,
                  location: true,
                },
              },
            },
          },
          client: true,
        },
      });

      // Update slot status
      await prisma.calculatedAvailabilitySlot.update({
        where: { id: request.slotId },
        data: {
          status: SlotStatus.BOOKED,
          booking: {
            connect: {
              id: booking.id,
            },
          },
        },
      });

      return {
        success: true,
        bookingId: booking.id,
        booking,
        conflicts: [],
        requiresConfirmation: availability.requiresConfirmation,
      };
    } catch (error) {
      return {
        success: false,
        conflicts: ['Internal error during booking creation'],
        requiresConfirmation: false,
      };
    }
  }

  /**
   * Validate scheduling rule compliance for a booking request
   */
  private validateSchedulingRuleCompliance(
    slot: any,
    preferredStartTime?: Date
  ): { isCompliant: boolean; reason?: string } {
    const schedulingRule = slot.availability.schedulingRule as SchedulingRule;
    const startTime = preferredStartTime || slot.startTime;

    const isValid = isSlotValidForSchedulingRule(startTime, slot.duration, schedulingRule, {
      interval: slot.availability.schedulingInterval || undefined,
      alignToHour: schedulingRule === SchedulingRule.ON_THE_HOUR,
      alignToHalfHour: false,
      alignToQuarterHour: false,
    });

    if (!isValid) {
      return {
        isCompliant: false,
        reason: `Requested time does not comply with ${schedulingRule} scheduling rule`,
      };
    }

    return { isCompliant: true };
  }

  /**
   * Check for booking conflicts
   */
  private async checkBookingConflicts(
    slot: any,
    request: SlotBookingRequest
  ): Promise<{ conflicts: string[]; warnings: string[] }> {
    const conflicts: string[] = [];
    const warnings: string[] = [];

    // Check for overlapping bookings with the same provider
    const startTime = request.preferredStartTime || slot.startTime;
    const endTime = new Date(startTime.getTime() + slot.duration * 60 * 1000);

    const overlappingBookings = await prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'PENDING'] },
        slot: {
          availability: {
            providerId: slot.availability.providerId,
          },
          startTime: {
            lt: endTime,
          },
          endTime: {
            gt: startTime,
          },
        },
      },
    });

    if (overlappingBookings.length > 0) {
      conflicts.push('Time conflict with existing booking');
    }

    // Check if customer has multiple bookings at the same time
    if (request.customerId) {
      const customerConflicts = await prisma.booking.findMany({
        where: {
          clientId: request.customerId,
          status: { in: ['CONFIRMED', 'PENDING'] },
          slot: {
            startTime: {
              lt: endTime,
            },
            endTime: {
              gt: startTime,
            },
          },
        },
      });

      if (customerConflicts.length > 0) {
        warnings.push('Customer has another booking at this time');
      }
    }

    return { conflicts, warnings };
  }

  /**
   * Find the nearest compatible time for a scheduling rule
   */
  private findNearestCompatibleTime(
    requestedTime: Date,
    duration: number,
    schedulingRule: SchedulingRule,
    schedulingInterval: number | null,
    availabilityStart: Date,
    availabilityEnd: Date
  ): { startTime: Date; endTime: Date } | null {
    // This is a simplified implementation
    // In production, you'd want more sophisticated time finding logic

    if (schedulingRule === SchedulingRule.ON_THE_HOUR) {
      // Adjust to nearest hour boundary
      const adjustedTime = new Date(requestedTime);
      const minutes = adjustedTime.getMinutes();
      const adjustedMinutes = Math.round(minutes / 15) * 15;
      adjustedTime.setMinutes(adjustedMinutes, 0, 0);

      const endTime = new Date(adjustedTime.getTime() + duration * 60 * 1000);

      // Check if within availability bounds
      if (adjustedTime >= availabilityStart && endTime <= availabilityEnd) {
        return {
          startTime: adjustedTime,
          endTime,
        };
      }
    }

    // For other rules or if adjustment failed, return null
    return null;
  }
}

/**
 * Validate a booking request against scheduling rules
 */
export async function validateBooking(
  request: SlotBookingRequest
): Promise<BookingValidationResult> {
  const service = new BookingIntegrationService();
  return await service.validateBookingRequest(request);
}

/**
 * Find available slots compatible with scheduling rules
 */
export async function findAvailableSlots(
  providerId: string,
  serviceId: string,
  preferredDate: Date,
  duration: number,
  options?: {
    locationId?: string;
    isOnline?: boolean;
  }
): Promise<
  Array<{
    slotId: string;
    startTime: Date;
    endTime: Date;
    price: number;
    location?: string;
    isOnlineAvailable: boolean;
    schedulingRule: SchedulingRule;
    requiresConfirmation: boolean;
  }>
> {
  const service = new BookingIntegrationService();
  return await service.findCompatibleSlots(
    providerId,
    serviceId,
    preferredDate,
    duration,
    options?.locationId,
    options?.isOnline
  );
}

/**
 * Create a booking with full validation
 */
export async function createValidatedBooking(request: SlotBookingRequest): Promise<{
  success: boolean;
  bookingId?: string;
  booking?: any;
  conflicts: string[];
  requiresConfirmation: boolean;
}> {
  const service = new BookingIntegrationService();
  return await service.createBookingWithValidation(request);
}
