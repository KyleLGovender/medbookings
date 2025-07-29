'use server';

import { revalidatePath } from 'next/cache';

import { Languages, RequirementsValidationStatus } from '@prisma/client';

import { serializeProvider } from '@/features/providers/lib/helper';
import { sendProviderWhatsappConfirmation } from '@/features/providers/lib/server-helper';
import { providerDebug } from '@/lib/debug';
import { prisma } from '@/lib/prisma';

export async function updateProviderBasicInfo(prevState: any, formData: FormData) {
  try {
    const id = formData.get('id') as string;

    if (!id) {
      return { success: false, error: 'Provider ID is required' };
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
    const providerTypeId = formData.get('providerTypeId') as string;
    const providerTypeIds = formData.getAll('providerTypeIds') as string[];
    const showPrice = formData.get('showPrice') === 'true';

    providerDebug.log('action', 'Form data extracted:', {
      name,
      image,
      bio: bio?.substring(0, 20) + (bio?.length > 20 ? '...' : ''),
      email,
      whatsapp,
      website,
      languages,
      userId,
      providerTypeId,
      providerTypeIds,
      showPrice,
    });

    // Get current provider data to compare changes
    const currentProvider = await prisma.provider.findUnique({
      where: { id },
      include: {
        services: true,
        user: {
          select: {
            email: true,
          },
        },
        typeAssignments: {
          include: {
            providerType: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
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
      return { success: false, error: 'Provider not found' };
    }

    // Build update data object only with changed fields
    const updateData: any = {};

    // Only include fields that were actually changed and provided
    if (name && name !== currentProvider.name) updateData.name = name;
    if (image && image !== currentProvider.image) updateData.image = image;
    if (bio !== undefined && bio !== currentProvider.bio) updateData.bio = bio;
    if (email && email !== currentProvider.email) updateData.email = email;
    if (whatsapp !== undefined && whatsapp !== currentProvider.whatsapp) updateData.whatsapp = whatsapp;
    if (website !== currentProvider.website) updateData.website = website;
    if (JSON.stringify(languages) !== JSON.stringify(currentProvider.languages)) {
      updateData.languages = languages;
    }
    // Get current provider type ID from type assignments (for legacy compatibility)
    const currentProviderTypeId = currentProvider.typeAssignments?.[0]?.providerTypeId;
    if (providerTypeId && providerTypeId !== currentProviderTypeId) {
      updateData.providerTypeId = providerTypeId;
    }
    if (showPrice !== currentProvider.showPrice) {
      updateData.showPrice = showPrice;
    }

    // Handle provider type assignments
    const currentTypeIds = currentProvider.typeAssignments.map(
      (assignment) => assignment.providerTypeId
    );
    const newTypeIds =
      providerTypeIds.length > 0 ? providerTypeIds : providerTypeId ? [providerTypeId] : [];

    // Check if type assignments changed
    const typeAssignmentsChanged =
      JSON.stringify(currentTypeIds.sort()) !== JSON.stringify(newTypeIds.sort());

    if (typeAssignmentsChanged && newTypeIds.length > 0) {
      updateData.typeAssignments = {
        deleteMany: {}, // Remove all existing assignments
        create: newTypeIds.map((typeId) => ({
          providerTypeId: typeId,
        })),
      };
    }

    if (whatsapp !== currentProvider.whatsapp) {
      // Send WhatsApp confirmation
      try {
        await sendProviderWhatsappConfirmation(updateData.name, updateData.whatsapp);
      } catch (error) {
        // Note: We don't want to fail the registration if WhatsApp fails
        // So we just log the error and continue
      }
    }

    const updatedProvider = await prisma.provider.update({
      where: { id },
      data: updateData,
      include: {
        services: true,
        user: {
          select: {
            email: true,
          },
        },
        typeAssignments: {
          include: {
            providerType: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
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
      data: serializeProvider(updatedProvider),
      redirect: `/providers/${id}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update profile',
    };
  }
}

export async function updateProviderServices(prevState: any, formData: FormData) {
  try {
    const id = formData.get('id') as string;

    if (!id) {
      return { success: false, error: 'Provider ID is required' };
    }

    // Extract service IDs
    const serviceIds = formData.getAll('services') as string[];

    // Extract service configurations
    const serviceConfigs: Record<string, { duration: number; price: number }> = {};

    // Process all form entries to find service configurations
    Array.from(formData.entries()).forEach(([key, value]) => {
      // Match keys like serviceConfigs[serviceId][duration] and serviceConfigs[serviceId][price]
      const match = key.match(/serviceConfigs\[(.*?)\]\[(.*?)\]/);
      if (match) {
        const [, serviceId, field] = match;

        if (!serviceConfigs[serviceId]) {
          serviceConfigs[serviceId] = { duration: 0, price: 0 };
        }

        if (field === 'duration') {
          serviceConfigs[serviceId].duration = parseInt(value as string, 10) || 0;
        } else if (field === 'price') {
          serviceConfigs[serviceId].price = parseInt(value as string, 10) || 0;
        }
      }
    });

    // Get current provider data
    const currentProvider = await prisma.provider.findUnique({
      where: { id },
      include: {
        services: true,
      },
    });

    if (!currentProvider) {
      return { success: false, error: 'Provider not found' };
    }

    // Update the provider's services
    // First, disconnect all existing services
    await prisma.provider.update({
      where: { id },
      data: {
        services: {
          set: [], // Remove all existing connections
        },
      },
    });

    // Then connect the new services
    await prisma.provider.update({
      where: { id },
      data: {
        services: {
          connect: serviceIds.map((serviceId) => ({ id: serviceId })),
        },
      },
    });

    // Delete existing ServiceAvailabilityConfig records for services no longer selected
    await prisma.serviceAvailabilityConfig.deleteMany({
      where: {
        providerId: id,
        serviceId: {
          notIn: serviceIds,
        },
      },
    });

    // Update or create ServiceAvailabilityConfig records for selected services
    for (const serviceId of serviceIds) {
      const config = serviceConfigs[serviceId];

      if (config) {
        // Try to update existing config first
        const existingConfig = await prisma.serviceAvailabilityConfig.findFirst({
          where: {
            providerId: id,
            serviceId: serviceId,
          },
        });

        if (existingConfig) {
          // Update existing config
          await prisma.serviceAvailabilityConfig.update({
            where: { id: existingConfig.id },
            data: {
              duration: config.duration,
              price: config.price,
            },
          });
        } else {
          // Create new config
          await prisma.serviceAvailabilityConfig.create({
            data: {
              providerId: id,
              serviceId: serviceId,
              duration: config.duration,
              price: config.price,
              isOnlineAvailable: true, // Default to online available
              isInPerson: false, // Default to not in-person
            },
          });
        }
      } else {
        // No config provided, but service is selected - ensure we have a config with defaults
        const existingConfig = await prisma.serviceAvailabilityConfig.findFirst({
          where: {
            providerId: id,
            serviceId: serviceId,
          },
        });

        if (!existingConfig) {
          // Get service defaults
          const service = await prisma.service.findUnique({
            where: { id: serviceId },
            select: { defaultPrice: true, defaultDuration: true },
          });

          // Create config with service defaults
          await prisma.serviceAvailabilityConfig.create({
            data: {
              providerId: id,
              serviceId: serviceId,
              duration: service?.defaultDuration || 30,
              price: service?.defaultPrice || 0,
              isOnlineAvailable: true,
              isInPerson: false,
            },
          });
        }
      }
    }

    // Revalidate paths to update UI
    revalidatePath(`/providers/${id}`);
    revalidatePath(`/providers/${id}/edit`);

    return {
      success: true,
      message: 'Services updated successfully',
      redirect: `/providers/${id}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update services',
    };
  }
}

/**
 * Updates a provider's regulatory requirements
 * @param prevState Previous state (for server actions)
 * @param formData Form data containing requirement submissions
 * @returns Result object with success status and data
 */
export async function updateProviderRequirements(prevState: any, formData: FormData) {
  try {
    const id = formData.get('id') as string;
    const userId = formData.get('userId') as string;

    if (!id) {
      return { success: false, error: 'Provider ID is required' };
    }

    // Get current provider data
    const currentProvider = await prisma.provider.findUnique({
      where: { id },
      include: {
        requirementSubmissions: true,
      },
    });

    providerDebug.log('action', 'Current provider:', currentProvider);
    providerDebug.log('action', 'formData:', formData);

    if (!currentProvider) {
      return { success: false, error: 'Provider not found' };
    }

    // Check authorization
    if (currentProvider.userId !== userId) {
      return { success: false, error: 'Unauthorized to update this provider' };
    }

    // Extract requirements data from form
    const requirementsData: Array<{
      requirementTypeId: string;
      value?: string | boolean | number;
      documentMetadata?: Record<string, any>;
      otherValue?: string;
    }> = [];

    // Process all form entries to find requirements data
    Array.from(formData.entries()).forEach(([key, value]) => {
      // Match keys like requirements[0][requirementTypeId]
      const reqIdMatch = key.match(/requirements\[(\d+)\]\[requirementTypeId\]/);
      if (reqIdMatch) {
        const index = parseInt(reqIdMatch[1], 10);
        const requirementTypeId = value as string;

        if (!requirementsData[index]) {
          requirementsData[index] = { requirementTypeId };
        } else {
          requirementsData[index].requirementTypeId = requirementTypeId;
        }
      }

      // Match keys like requirements[0][value]
      const valueMatch = key.match(/requirements\[(\d+)\]\[value\]/);
      if (valueMatch) {
        const index = parseInt(valueMatch[1], 10);
        if (!requirementsData[index]) {
          requirementsData[index] = { requirementTypeId: '' };
        }
        requirementsData[index].value = value as string;
      }

      // Match keys like requirements[0][documentMetadata]
      const metadataMatch = key.match(/requirements\[(\d+)\]\[documentMetadata\]/);
      if (metadataMatch) {
        const index = parseInt(metadataMatch[1], 10);
        if (!requirementsData[index]) {
          requirementsData[index] = { requirementTypeId: '' };
        }
        try {
          requirementsData[index].documentMetadata = JSON.parse(value as string);
        } catch (e) {
          // If parsing fails, store as string
          requirementsData[index].documentMetadata = { value: value as string };
        }
      }

      // Match keys like requirements[0][otherValue]
      const otherValueMatch = key.match(/requirements\[(\d+)\]\[otherValue\]/);
      if (otherValueMatch) {
        const index = parseInt(otherValueMatch[1], 10);
        if (!requirementsData[index]) {
          requirementsData[index] = { requirementTypeId: '' };
        }
        requirementsData[index].otherValue = value as string;
      }
    });

    // Filter out any empty entries
    const validRequirements = requirementsData.filter(
      (req) => req && req.requirementTypeId && (req.value !== undefined || req.documentMetadata)
    );

    // Process each requirement submission
    for (const req of validRequirements) {
      // Check if a submission already exists for this requirement type
      const existingSubmission = currentProvider.requirementSubmissions.find(
        (sub) => sub.requirementTypeId === req.requirementTypeId
      );

      // Prepare the document metadata
      let documentMetadata = req.documentMetadata || {};
      if (req.value !== undefined && !documentMetadata.value) {
        documentMetadata.value = req.value;
      }

      if (existingSubmission) {
        // Update existing submission
        await prisma.requirementSubmission.update({
          where: { id: existingSubmission.id },
          data: {
            documentMetadata,
            // Reset to pending if the document was updated
            status:
              documentMetadata !== existingSubmission.documentMetadata
                ? RequirementsValidationStatus.PENDING
                : undefined,
            notes: documentMetadata !== existingSubmission.documentMetadata ? null : undefined,
          },
        });
      } else {
        // Create new submission
        await prisma.requirementSubmission.create({
          data: {
            requirementTypeId: req.requirementTypeId,
            providerId: id,
            documentMetadata,
            status: RequirementsValidationStatus.PENDING,
          },
        });
      }
    }

    // Revalidate paths to update UI
    revalidatePath(`/providers/${id}`);
    revalidatePath(`/providers/${id}/edit`);

    // Get updated provider data
    const updatedProvider = await prisma.provider.findUnique({
      where: { id },
      include: {
        services: true,
        user: {
          select: {
            email: true,
          },
        },
        typeAssignments: {
          include: {
            providerType: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
        requirementSubmissions: {
          include: {
            requirementType: true,
          },
        },
      },
    });

    if (!updatedProvider) {
      return { success: false, error: 'Failed to retrieve updated provider data' };
    }

    return {
      success: true,
      data: serializeProvider(updatedProvider),
      redirect: `/providers/${id}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update requirements',
    };
  }
}
