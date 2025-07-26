'use server';

import { Languages, RequirementsValidationStatus } from '@prisma/client';

import { sendProviderWhatsappConfirmation } from '@/features/providers/lib/server-helper';
import { prisma } from '@/lib/prisma';

/**
 * Registers a new service provider
 * @param prevState Previous state from server action
 * @param formData Form data containing provider information
 * @returns Object with success status and redirect path or error
 */
export async function registerProvider(prevState: any, formData: FormData) {
  try {
    const userId = formData.get('userId') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const services = formData.getAll('services') as string[];
    const languages = formData.getAll('languages') as Languages[];
    const email = formData.get('email') as string;
    const whatsapp = formData.get('whatsapp') as string;
    const website = (formData.get('website') as string) || null;

    // Extract service configurations from FormData
    const serviceConfigs: Record<string, { 
      duration?: number; 
      price?: number; 
      isOnlineAvailable?: boolean; 
      isInPerson?: boolean; 
    }> = {};
    for (const serviceId of services) {
      const duration = formData.get(`serviceConfigs[${serviceId}][duration]`);
      const price = formData.get(`serviceConfigs[${serviceId}][price]`);
      const isOnlineAvailable = formData.get(`serviceConfigs[${serviceId}][isOnlineAvailable]`);
      const isInPerson = formData.get(`serviceConfigs[${serviceId}][isInPerson]`);
      
      if (duration || price || isOnlineAvailable || isInPerson) {
        serviceConfigs[serviceId] = {
          ...(duration && { duration: parseInt(duration as string, 10) }),
          ...(price && { price: parseFloat(price as string) }),
          ...(isOnlineAvailable !== null && { isOnlineAvailable: isOnlineAvailable === 'true' }),
          ...(isInPerson !== null && { isInPerson: isInPerson === 'true' }),
        };
      }
    }

    // Handle provider types (multiple or single for backward compatibility)
    const multipleProviderTypeIds = formData.getAll('providerTypeIds') as string[];
    const singleProviderTypeId = formData.get('providerTypeId') as string;

    // Use multiple types if provided, otherwise fall back to single type
    const providerTypeIds =
      multipleProviderTypeIds.length > 0
        ? multipleProviderTypeIds
        : singleProviderTypeId
          ? [singleProviderTypeId]
          : [];

    if (providerTypeIds.length === 0) {
      return {
        success: false,
        error: 'At least one provider type must be selected',
      };
    }

    // Process requirements first if any were submitted
    const requirementSubmissions: {
      requirementTypeId: string;
      documentMetadata: Record<string, any>;
      status: RequirementsValidationStatus;
    }[] = [];
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

          // Prepare the metadata - either from direct metadata field or from value
          let newMetadata: Record<string, any> | undefined;

          if (formMetadata) {
            // If we have metadata directly, use it
            newMetadata = JSON.parse(formMetadata);
          } else if (formValue) {
            // If we have a regular value
            newMetadata = { value: formValue };
          }

          // Only add requirement if we have metadata
          if (newMetadata) {
            requirementSubmissions.push({
              requirementTypeId,
              documentMetadata: newMetadata,
              status: RequirementsValidationStatus.PENDING,
            });
          }
        }
      });
    }

    // Save provider data with requirements and type assignments
    const provider = await prisma.provider.create({
      data: {
        userId,
        image: imageUrl || '',
        name: formData.get('name') as string,
        bio: formData.get('bio') as string,
        email,
        whatsapp,
        website,
        services: {
          connect: services.map((id) => ({ id })),
        },
        languages: {
          set: languages,
        },
        typeAssignments: {
          create: providerTypeIds.map((typeId) => ({
            providerTypeId: typeId,
          })),
        },
        requirementSubmissions: {
          create: requirementSubmissions,
        },
      },
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

    // Create ServiceAvailabilityConfig records for services with custom configurations
    if (Object.keys(serviceConfigs).length > 0) {
      try {
        const serviceAvailabilityConfigs = Object.entries(serviceConfigs).map(([serviceId, config]) => ({
          serviceId,
          providerId: provider.id,
          duration: config.duration || 30, // Default to 30 minutes if not specified
          price: config.price || 0, // Default to 0 if not specified
          isOnlineAvailable: config.isOnlineAvailable ?? true, // Default to online available
          isInPerson: config.isInPerson ?? false, // Default to not in-person unless specified
        }));

        await prisma.serviceAvailabilityConfig.createMany({
          data: serviceAvailabilityConfigs,
        });

        console.log(`Created ${serviceAvailabilityConfigs.length} ServiceAvailabilityConfig records for provider ${provider.id}`);
      } catch (configError) {
        console.error('Failed to create ServiceAvailabilityConfig records:', {
          providerId: provider.id,
          serviceConfigs,
          error: configError instanceof Error ? configError.message : 'Unknown error',
          stack: configError instanceof Error ? configError.stack : undefined,
        });
        // Note: We don't want to fail the entire registration if ServiceAvailabilityConfig creation fails
        // The provider registration should succeed and configs can be created later
      }
    }

    // Send WhatsApp confirmation
    try {
      await sendProviderWhatsappConfirmation(provider.name, provider.whatsapp);
    } catch (error) {
      console.error('Failed to send WhatsApp confirmation:', error);
      // Note: We don't want to fail the registration if WhatsApp fails
      // So we just log the error and continue
    }

    // Return success with redirect path
    return { success: true, redirect: '/profile' };
  } catch (error) {
    // Log any errors
    console.error('Service Provider Registration Error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return { success: false, error: 'Failed to register service provider' };
  }
}
