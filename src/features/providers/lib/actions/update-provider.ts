'use server';

import { revalidatePath } from 'next/cache';

import { Languages, Prisma } from '@prisma/client';

import { serializeServiceProvider } from '@/features/providers/lib/helper';
import { sendServiceProviderWhatsappConfirmation } from '@/features/providers/lib/server-helper';
import { RequirementsValidationStatus } from '@/features/providers/types/types';
import { prisma } from '@/lib/prisma';
import { uploadToBlob } from '@/lib/utils/utils-upload-to-blob';

export async function updateProviderBasicInfo(prevState: any, formData: FormData) {
  try {
    const id = formData.get('id') as string;
    if (!id) {
      return { success: false, error: 'Service provider ID is required' };
    }

    // Extract basic data fields
    const name = formData.get('name') as string;
    const bio = formData.get('bio') as string;
    const email = formData.get('email') as string;
    const whatsapp = formData.get('whatsapp') as string;
    const website = (formData.get('website') as string) || null;
    const languages = formData.getAll('languages') as Languages[];
    const userId = formData.get('userId') as string;
    const serviceProviderTypeId = formData.get('serviceProviderTypeId') as string;

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
        console.error('Failed to send WhatsApp confirmation:', error);
        // Note: We don't want to fail the registration if WhatsApp fails
        // So we just log the error and continue
      }
    }

    // Handle image upload if new image is provided
    const imageFile = formData.get('image') as File;
    let imageUrl: string | undefined;

    if (imageFile && imageFile.size > 0) {
      const uploadResult = await uploadToBlob(imageFile, userId, 'provider-images');
      if (!uploadResult.success) {
        return { success: false, error: 'Failed to upload image' };
      }
      imageUrl = uploadResult.url;
      updateData.image = imageUrl;
    }

    // Update the provider in the database
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
    console.error('Error updating service provider:', error);
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
      return { success: false, error: 'Service provider ID is required' };
    }

    const services = formData.getAll('services') as string[];

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

    // Only update services if they've changed
    const currentServiceIds = currentProvider.services.map((s) => s.id);

    // Compare service configs (duration and price)
    const serviceConfigChanges = [];
    const serviceUpdates = [];

    for (const serviceId of services) {
      const currentService = currentProvider.services.find((s) => s.id === serviceId);
      const newDuration = formData.get(`serviceConfigs[${serviceId}][duration]`);
      const newPrice = formData.get(`serviceConfigs[${serviceId}][price]`);

      if (currentService) {
        // Compare with existing service values
        const durationChanged =
          newDuration && parseInt(newDuration as string) !== currentService.defaultDuration;
        const priceChanged =
          newPrice && parseFloat(newPrice as string) !== Number(currentService.defaultPrice);

        if (durationChanged) {
          serviceConfigChanges.push(
            `Service ${currentService.name}: Duration changed from ${currentService.defaultDuration} to ${newDuration}`
          );

          // Add to service updates
          serviceUpdates.push({
            serviceId,
            updateData: {
              defaultDuration: parseInt(newDuration as string),
            },
          });
        }

        if (priceChanged) {
          serviceConfigChanges.push(
            `Service ${currentService.name}: Price changed from ${currentService.defaultPrice} to ${newPrice}`
          );

          // Add to service updates
          const existingUpdate = serviceUpdates.find((update) => update.serviceId === serviceId);
          if (existingUpdate) {
            existingUpdate.updateData.defaultPrice = parseFloat(newPrice as string);
          } else {
            serviceUpdates.push({
              serviceId,
              updateData: {
                defaultPrice: parseFloat(newPrice as string),
              },
            });
          }
        }
      }
    }

    // Update services in database if they've changed
    if (JSON.stringify(services.sort()) !== JSON.stringify(currentServiceIds.sort())) {
      updateData.services = {
        set: [],
        connect: services.map((serviceId) => ({ id: serviceId })),
      };
    }

    // Apply service updates directly to the database
    if (serviceUpdates.length > 0) {
      for (const update of serviceUpdates) {
        await prisma.service.update({
          where: { id: update.serviceId },
          data: update.updateData,
        });
      }
    }

    // If there are service config changes, we need to update the service configs
    if (serviceConfigChanges.length > 0) {
      // This will be handled in the ServiceAvailabilityConfig section below,
      // but we need to ensure the update happens even if no other fields changed
      if (Object.keys(updateData).length === 0) {
        updateData.name = currentProvider.name; // Add a dummy field that won't change anything
      }
    }

    // If no fields were changed and no requirements were updated, return early
    if (Object.keys(updateData).length === 0 && serviceConfigChanges.length === 0) {
      return {
        success: true,
        message: 'No changes detected',
        data: serializeServiceProvider(currentProvider),
        redirect: `/providers/${id}/edit`,
      };
    }

    // Update the provider in the database
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
    console.error('Error updating service provider:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update profile',
    };
  }
}

export async function updateProviderRequirements(prevState: any, formData: FormData) {
  try {
    const id = formData.get('id') as string;
    if (!id) {
      return { success: false, error: 'Service provider ID is required' };
    }

    const userId = formData.get('userId') as string;

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

    // Process requirements from form data
    type RequirementUpdate = {
      requirementTypeId: string;
      value?: string;
      documentMetadata?: Record<string, any>;
      otherValue?: string;
    };

    const requirements: RequirementUpdate[] = [];

    // Check if any requirements were submitted in the form
    const hasRequirements = Array.from(formData.entries()).some(([key]) =>
      key.match(/requirements\[\d+\]\[requirementTypeId\]/)
    );

    if (hasRequirements) {
      // Collect all requirement entries from form data
      Array.from(formData.entries()).forEach(([key, value]) => {
        if (key.match(/requirements\[\d+\]\[requirementTypeId\]/)) {
          const index = key.match(/\[(\d+)\]/)?.[1];
          if (!index) return;

          const requirementTypeId = value as string;
          const valueKey = `requirements[${index}][value]`;
          const metadataKey = `requirements[${index}][documentMetadata]`;
          const otherValueKey = `requirements[${index}][otherValue]`;

          const formValue = formData.get(valueKey) as string;
          const formMetadata = formData.get(metadataKey) as string;
          const formOtherValue = formData.get(otherValueKey) as string;

          // Find existing submission for this requirement type
          const existingSubmission = currentProvider.requirementSubmissions.find(
            (sub) => sub.requirementTypeId === requirementTypeId
          );

          // Prepare the metadata - either from direct metadata field or from value
          let newMetadata: Record<string, any> | undefined;

          if (formMetadata) {
            // If we have metadata directly, use it
            newMetadata = JSON.parse(formMetadata);
          } else if (formValue) {
            // If we have a value, create metadata with it
            newMetadata = { value: formValue };
          }

          // Compare with existing metadata to see if it changed
          const existingMetadataValue = existingSubmission?.documentMetadata
            ? (existingSubmission.documentMetadata as { value?: string })?.value
            : undefined;
          const newMetadataValue = newMetadata?.value;

          // Only include if there's new metadata or the value changed
          if (
            newMetadata &&
            (!existingMetadataValue || newMetadataValue !== existingMetadataValue)
          ) {
            requirements.push({
              requirementTypeId,
              documentMetadata: newMetadata,
            });
          }
        }
      });

      // Only process requirements that have changes
      if (requirements.length > 0) {
        // Process and create/update submissions
        const requirementUpdates = await Promise.all(
          requirements.map(async (req) => {
            // Just use the documentMetadata directly from the form
            // This is already properly structured by the render-requirement-input component
            const documentMetadata =
              req.documentMetadata || (req.value ? { value: req.value } : undefined);

            // Update or create the submission
            return prisma.requirementSubmission.upsert({
              where: {
                requirementTypeId_serviceProviderId: {
                  serviceProviderId: id,
                  requirementTypeId: req.requirementTypeId,
                },
              },
              create: {
                requirementTypeId: req.requirementTypeId,
                serviceProviderId: id,
                documentUrl: null,
                documentMetadata: documentMetadata || Prisma.JsonNull,
                status: RequirementsValidationStatus.PENDING,
              },
              update: {
                documentUrl: null,
                documentMetadata: documentMetadata || Prisma.JsonNull,
                status: RequirementsValidationStatus.PENDING,
              },
            });
          })
        );

        await Promise.all(requirementUpdates);
      }
    }

    // Update the provider in the database
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
    console.error('Error updating service provider:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update profile',
    };
  }
}
