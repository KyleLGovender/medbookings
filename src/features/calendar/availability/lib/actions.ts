'use server';

import { prisma } from '@/lib/prisma';
import { convertLocalToUTC, convertUTCToLocal } from '@/lib/timezone-helper';

import {
  calculateInitialAvailabilitySlots,
  calculateNonOverlappingSlots,
  validateAvailabilityFormData,
} from './server-helper';
import { AvailabilityFormResponse } from './types';

export async function createAvailability(formData: FormData): Promise<AvailabilityFormResponse> {
  try {
    const validationResult = await validateAvailabilityFormData(formData);
    console.log('Validation result:', validationResult);

    if ('error' in validationResult || !validationResult.data) {
      return validationResult;
    }

    const { data } = validationResult;
    console.log('Validated data:', data);

    // Convert local times to UTC for storage
    const startTime = convertLocalToUTC(data.startTime);
    const endTime = convertLocalToUTC(data.endTime);

    // Check which configurations already exist
    const existingConfigs = await prisma.serviceAvailabilityConfig.findMany({
      where: {
        serviceProviderId: formData.get('serviceProviderId') as string,
        serviceId: {
          in: data.availableServices.map((s) => s.serviceId),
        },
      },
    });
    console.log('Existing configs:', existingConfigs);

    const existingServiceIds = new Set(existingConfigs.map((c) => c.serviceId));
    console.log('Existing service IDs:', Array.from(existingServiceIds));

    const availability = await prisma.availability.create({
      data: {
        startTime,
        endTime,
        serviceProvider: {
          connect: {
            id: formData.get('serviceProviderId') as string,
          },
        },
        availableServices: {
          connect: existingConfigs.map((config) => ({
            serviceId_serviceProviderId: {
              serviceId: config.serviceId,
              serviceProviderId: config.serviceProviderId,
            },
          })),
          create: data.availableServices
            .filter((service) => !existingServiceIds.has(service.serviceId))
            .map((service) => ({
              service: { connect: { id: service.serviceId } },
              serviceProvider: { connect: { id: formData.get('serviceProviderId') as string } },
              duration: service.duration,
              price: service.price,
              isOnlineAvailable: service.isOnlineAvailable,
              isInPerson: service.isInPerson,
              location: service.location,
            })),
        },
      },
      include: {
        serviceProvider: true,
        availableServices: true,
        calculatedSlots: {
          include: {
            booking: {
              include: {
                client: true,
                bookedBy: true,
                serviceProvider: true,
                service: true,
                notifications: true,
                review: true,
              },
            },
            service: true,
          },
        },
      },
    });
    console.log('Created availability:', availability);

    // Calculate initial slots
    const slotsToCreate = await calculateInitialAvailabilitySlots(
      data,
      availability.id,
      availability.availableServices
    );
    console.log('Slots to create:', slotsToCreate);

    // Create calculated slots
    const createdSlots = await prisma.calculatedAvailabilitySlot.createMany({
      data: slotsToCreate,
    });
    console.log('Created slots:', createdSlots);

    return {
      data: {
        startTime: convertUTCToLocal(availability.startTime),
        endTime: convertUTCToLocal(availability.endTime),
        availableServices: availability.availableServices.map((service) => ({
          serviceId: service.serviceId,
          duration: service.duration,
          price: Number(service.price),
          isOnlineAvailable: service.isOnlineAvailable,
          isInPerson: service.isInPerson,
          location: service.location || undefined,
        })),
      },
    };
  } catch (error) {
    console.error('Create availability error:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to create availability',
    };
  }
}

export async function deleteAvailability(
  availabilityId: string,
  serviceProviderId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    // First, check if the availability exists and belongs to the service provider
    const availability = await prisma.availability.findFirst({
      where: {
        id: availabilityId,
        serviceProviderId,
      },
      include: {
        calculatedSlots: {
          include: {
            booking: {
              select: { id: true, status: true },
            },
          },
        },
      },
    });

    if (!availability) {
      return { error: 'Availability not found' };
    }

    // Check if any slots have associated bookings (of any status)
    const slotsWithBookings = availability.calculatedSlots.filter((slot) => slot.booking);

    if (slotsWithBookings.length > 0) {
      // Get the statuses of the bookings for a more informative error message
      const bookingStatuses = slotsWithBookings.map((slot) => slot.booking?.status);
      const uniqueStatuses = Array.from(new Set(bookingStatuses)).join(', ');

      return {
        error: `Cannot delete availability with existing bookings (${uniqueStatuses}). Cancel the bookings first.`,
      };
    }

    // If no bookings, proceed with deletion
    await prisma.$transaction([
      // First delete all calculated slots
      prisma.calculatedAvailabilitySlot.deleteMany({
        where: { availabilityId },
      }),
      // Then delete the availability itself
      prisma.availability.delete({
        where: { id: availabilityId },
      }),
    ]);

    return { success: true };
  } catch (error) {
    console.error('Delete availability error:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to delete availability',
    };
  }
}

export async function updateAvailability(
  availabilityId: string,
  formData: FormData
): Promise<AvailabilityFormResponse> {
  try {
    console.log('Starting update for availability:', availabilityId);
    const validationResult = await validateAvailabilityFormData(formData);
    console.log('Validation result:', validationResult);

    if ('error' in validationResult || !validationResult.data) {
      console.log('Validation failed:', validationResult);
      return validationResult;
    }

    const { data } = validationResult;

    // Convert local times to UTC for storage
    const startTime = convertLocalToUTC(data.startTime);
    const endTime = convertLocalToUTC(data.endTime);

    // 1. First, check if there are any bookings associated with this availability
    const existingSlots = await prisma.calculatedAvailabilitySlot.findMany({
      where: { availabilityId },
      include: {
        booking: {
          select: {
            id: true,
            status: true,
            serviceId: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    const bookedSlots = existingSlots.filter((slot) => slot.booking);

    // 2. If there are bookings, perform safety checks
    if (bookedSlots.length > 0) {
      // Get the original availability to compare
      const originalAvailability = await prisma.availability.findUnique({
        where: { id: availabilityId },
      });

      if (!originalAvailability) {
        return { error: 'Availability not found' };
      }
      // Check if the new time range would exclude any booked slots
      for (const slot of bookedSlots) {
        if (slot.startTime < startTime || slot.endTime > endTime) {
          return {
            error: 'Cannot modify availability: new time range would exclude existing bookings',
          };
        }
      }

      // Get all service IDs that have bookings
      const bookedServiceIds = new Set(
        bookedSlots
          .map((slot) => slot.booking?.serviceId)
          .filter((id): id is string => id !== undefined)
      );

      // Ensure all services with bookings are still included in the update
      const updatedServiceIds = new Set(data.availableServices.map((s) => s.serviceId));

      for (const serviceId of Array.from(bookedServiceIds)) {
        if (!updatedServiceIds.has(serviceId)) {
          return {
            error: `Cannot remove service with ID ${serviceId} as it has existing bookings`,
          };
        }
      }
    }

    // 3. Check which configurations already exist
    const existingConfigs = await prisma.serviceAvailabilityConfig.findMany({
      where: {
        serviceProviderId: formData.get('serviceProviderId') as string,
        serviceId: {
          in: data.availableServices.map((s) => s.serviceId),
        },
      },
    });

    const existingServiceIds = new Set(existingConfigs.map((c) => c.serviceId));

    // 4. Update the availability
    const availability = await prisma.availability.update({
      where: { id: availabilityId },
      data: {
        startTime,
        endTime,
        availableServices: {
          // Connect existing configs
          connect: existingConfigs.map((config) => ({
            serviceId_serviceProviderId: {
              serviceId: config.serviceId,
              serviceProviderId: config.serviceProviderId,
            },
          })),
          // Create new configs for services that don't exist yet
          create: data.availableServices
            .filter((service) => !existingServiceIds.has(service.serviceId))
            .map((service) => ({
              service: { connect: { id: service.serviceId } },
              serviceProvider: { connect: { id: formData.get('serviceProviderId') as string } },
              duration: service.duration,
              price: service.price,
              isOnlineAvailable: service.isOnlineAvailable,
              isInPerson: service.isInPerson,
              location: service.location,
            })),
        },
      },
      include: {
        availableServices: true,
      },
    });

    // 5. Handle slot updates carefully
    if (bookedSlots.length > 0) {
      // For availabilities with bookings, we need to be careful

      // Get all slots that don't have bookings
      const nonBookedSlotIds = existingSlots.filter((slot) => !slot.booking).map((slot) => slot.id);

      // Only delete slots that don't have bookings
      if (nonBookedSlotIds.length > 0) {
        await prisma.calculatedAvailabilitySlot.deleteMany({
          where: {
            id: { in: nonBookedSlotIds },
          },
        });
      }

      // Calculate new slots, but exclude time ranges that already have bookings
      const bookedTimeRanges = bookedSlots.map((slot) => ({
        serviceId: slot.serviceId,
        startTime: slot.startTime,
        endTime: slot.endTime,
      }));

      // Create new slots that don't overlap with existing bookings
      const newSlots = await calculateNonOverlappingSlots(
        data,
        availability.id,
        availability.availableServices,
        bookedTimeRanges
      );

      if (newSlots.length > 0) {
        await prisma.calculatedAvailabilitySlot.createMany({
          data: newSlots,
        });
      }
    } else {
      // If no bookings, we can safely delete all slots and recreate them
      await prisma.calculatedAvailabilitySlot.deleteMany({
        where: { availabilityId },
      });

      const calculatedSlots = await calculateInitialAvailabilitySlots(
        data,
        availability.id,
        availability.availableServices
      );

      await prisma.calculatedAvailabilitySlot.createMany({
        data: calculatedSlots,
      });
    }

    return {
      data: {
        startTime: convertUTCToLocal(availability.startTime),
        endTime: convertUTCToLocal(availability.endTime),
        availableServices: availability.availableServices.map((service) => ({
          serviceId: service.serviceId,
          duration: service.duration,
          price: Number(service.price),
          isOnlineAvailable: service.isOnlineAvailable,
          isInPerson: service.isInPerson,
          location: service.location || undefined,
        })),
      },
    };
  } catch (error) {
    console.error('Update availability error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');
    return {
      error: error instanceof Error ? error.message : 'Failed to update availability',
    };
  }
}
