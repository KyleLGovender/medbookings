'use server';

import { revalidatePath } from 'next/cache';

import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function deleteServiceProvider(serviceProviderId: string) {
  try {
    // Get the current user's session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: 'You must be logged in to delete a service provider' };
    }

    // Get the service provider to check ownership
    const serviceProvider = await prisma.serviceProvider.findUnique({
      where: { id: serviceProviderId },
      include: {
        user: true,
        requirementSubmissions: true,
        availabilityConfigs: true,
        services: true,
      },
    });

    if (!serviceProvider) {
      return { success: false, error: 'Service provider not found' };
    }

    // Check if user is authorized (either the owner or an admin)
    const isAuthorized =
      serviceProvider.userId === userId ||
      session.user.role === 'ADMIN' ||
      session.user.role === 'SUPER_ADMIN';

    if (!isAuthorized) {
      return { success: false, error: 'You are not authorized to delete this service provider' };
    }

    // Delete all related records in the correct order
    // 1. Delete requirement submissions
    if (serviceProvider.requirementSubmissions.length > 0) {
      await prisma.requirementSubmission.deleteMany({
        where: { serviceProviderId },
      });
    }

    // 2. Delete calculated availability slots for each config
    for (const config of serviceProvider.availabilityConfigs) {
      await prisma.calculatedAvailabilitySlot.deleteMany({
        where: { serviceConfigId: config.id },
      });
    }

    // 3. Delete availability configs
    if (serviceProvider.availabilityConfigs.length > 0) {
      await prisma.serviceAvailabilityConfig.deleteMany({
        where: { serviceProviderId },
      });
    }

    // 4. Delete availability records
    await prisma.availability.deleteMany({
      where: { serviceProviderId },
    });

    // 5. Find all slots associated with this provider's availability configs
    const slotIds = [];

    for (const config of serviceProvider.availabilityConfigs) {
      const slots = await prisma.calculatedAvailabilitySlot.findMany({
        where: { serviceConfigId: config.id },
        select: { id: true },
      });

      slotIds.push(...slots.map((slot) => slot.id));
    }

    // 6. Delete bookings associated with those slots
    if (slotIds.length > 0) {
      await prisma.booking.deleteMany({
        where: {
          slotId: { in: slotIds },
        },
      });
    }

    // 6. Disconnect services
    if (serviceProvider.services.length > 0) {
      await prisma.serviceProvider.update({
        where: { id: serviceProviderId },
        data: {
          services: {
            set: [],
          },
        },
      });
    }

    // 7. Finally delete the service provider
    await prisma.serviceProvider.delete({
      where: { id: serviceProviderId },
    });

    // Revalidate paths to update UI
    revalidatePath('/profile');

    return { success: true };
  } catch (error) {
    console.error('Error deleting service provider:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete service provider',
    };
  }
}
