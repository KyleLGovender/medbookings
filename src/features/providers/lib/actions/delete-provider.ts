'use server';

import { revalidatePath } from 'next/cache';

import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function deleteProvider(providerId: string) {
  try {
    // Get the current user's session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: 'You must be logged in to delete a provider' };
    }

    // Get the provider to check ownership
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        user: true,
        requirementSubmissions: true,
        availabilityConfigs: true,
        services: true,
      },
    });

    if (!provider) {
      return { success: false, error: 'Provider not found' };
    }

    // Check if user is authorized (either the owner or an admin)
    const isAuthorized =
      provider.userId === userId ||
      session.user.role === 'ADMIN' ||
      session.user.role === 'SUPER_ADMIN';

    if (!isAuthorized) {
      return { success: false, error: 'You are not authorized to delete this provider' };
    }

    // Delete all related records in the correct order
    // 1. Delete requirement submissions
    if (provider.requirementSubmissions.length > 0) {
      await prisma.requirementSubmission.deleteMany({
        where: { providerId },
      });
    }

    // 2. Delete calculated availability slots for each config
    for (const config of provider.availabilityConfigs) {
      await prisma.calculatedAvailabilitySlot.deleteMany({
        where: { serviceConfigId: config.id },
      });
    }

    // 3. Delete availability configs
    if (provider.availabilityConfigs.length > 0) {
      await prisma.serviceAvailabilityConfig.deleteMany({
        where: { providerId },
      });
    }

    // 4. Delete availability records
    await prisma.availability.deleteMany({
      where: { providerId },
    });

    // 5. Find all slots associated with this provider's availability configs
    const slotIds = [];

    for (const config of provider.availabilityConfigs) {
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
    if (provider.services.length > 0) {
      await prisma.provider.update({
        where: { id: providerId },
        data: {
          services: {
            set: [],
          },
        },
      });
    }

    // 7. Finally delete the provider
    await prisma.provider.delete({
      where: { id: providerId },
    });

    // Revalidate paths to update UI
    revalidatePath('/profile');

    return { success: true };
  } catch (error) {
    console.error('Error deleting provider:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete provider',
    };
  }
}

// Backward compatibility exports
export const deleteServiceProvider = deleteProvider;
