'use server';

import { revalidatePath } from 'next/cache';

import { Languages } from '@prisma/client';

import { serializeServiceProvider } from '@/features/providers/lib/helper';
import { sendServiceProviderWhatsappConfirmation } from '@/features/providers/lib/server-helper';
import { providerDebug } from '@/lib/debug';
import { prisma } from '@/lib/prisma';

export async function updateProviderBasicInfo(prevState: any, formData: FormData) {
  try {
    const id = formData.get('id') as string;

    if (!id) {
      return { success: false, error: 'Service provider ID is required' };
    }

    // Extract basic data fields
    const name = formData.get('name') as string;
    const image = formData.get('image') as string;
    const bio = formData.get('bio') as string;
    const email = formData.get('email') as string;
    const whatsapp = formData.get('whatsapp') as string;
    const website = (formData.get('website') as string) || null;
    const languages = formData.getAll('languages') as Languages[];
    const userId = formData.get('userId') as string;
    const serviceProviderTypeId = formData.get('serviceProviderTypeId') as string;

    providerDebug.log('action', 'Form data extracted:', {
      name,
      image,
      bio: bio?.substring(0, 20) + (bio?.length > 20 ? '...' : ''),
      email,
      whatsapp,
      website,
      languages,
      userId,
      serviceProviderTypeId,
    });

    // Get current provider data to compare changes
    const currentProvider = await prisma.serviceProvider.findUnique({
      where: { id },
      include: {
        services: true,
        user: {
          select: {
            email: true,
          },
        },
        serviceProviderType: {
          select: {
            name: true,
            description: true,
          },
        },
        requirementSubmissions: {
          include: {
            requirementType: true,
          },
        },
      },
    });

    if (!currentProvider) {
      return { success: false, error: 'Service provider not found' };
    }

    // Build update data object only with changed fields
    const updateData: any = {};

    // Only include fields that were actually changed
    if (name !== currentProvider.name) updateData.name = name;
    if (image !== currentProvider.image) updateData.image = image;
    if (bio !== currentProvider.bio) updateData.bio = bio;
    if (email !== currentProvider.email) updateData.email = email;
    if (whatsapp !== currentProvider.whatsapp) updateData.whatsapp = whatsapp;
    if (website !== currentProvider.website) updateData.website = website;
    if (JSON.stringify(languages) !== JSON.stringify(currentProvider.languages)) {
      updateData.languages = languages;
    }
    if (serviceProviderTypeId && serviceProviderTypeId !== currentProvider.serviceProviderTypeId) {
      updateData.serviceProviderTypeId = serviceProviderTypeId;
    }

    if (whatsapp !== currentProvider.whatsapp) {
      // Send WhatsApp confirmation
      try {
        await sendServiceProviderWhatsappConfirmation(updateData.name, updateData.whatsapp);
      } catch (error) {
        // Note: We don't want to fail the registration if WhatsApp fails
        // So we just log the error and continue
      }
    }

    const updatedProvider = await prisma.serviceProvider.update({
      where: { id },
      data: updateData,
      include: {
        services: true,
        user: {
          select: {
            email: true,
          },
        },
        serviceProviderType: {
          select: {
            name: true,
            description: true,
          },
        },
        requirementSubmissions: {
          include: {
            requirementType: true,
          },
        },
      },
    });
    // Revalidate paths to update UI
    revalidatePath(`/providers/${id}`);

    return {
      success: true,
      data: serializeServiceProvider(updatedProvider),
      redirect: `/providers/${id}/edit`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update profile',
    };
  }
}
