'use server';

import { Languages, RequirementsValidationStatus } from '@prisma/client';

import { sendServiceProviderWhatsappConfirmation } from '@/features/providers/lib/server-helper';
import { prisma } from '@/lib/prisma';

/**
 * Registers a new service provider
 * @param prevState Previous state from server action
 * @param formData Form data containing provider information
 * @returns Object with success status and redirect path or error
 */
export async function registerServiceProvider(prevState: any, formData: FormData) {
  try {
    const userId = formData.get('userId') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const services = formData.getAll('services') as string[];
    const languages = formData.getAll('languages') as Languages[];
    const email = formData.get('email') as string;
    const whatsapp = formData.get('whatsapp') as string;
    const website = (formData.get('website') as string) || null;

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

    // Save provider data with requirements
    const provider = await prisma.serviceProvider.create({
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
        serviceProviderTypeId: formData.get('serviceProviderTypeId') as string,
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

    // Send WhatsApp confirmation
    try {
      await sendServiceProviderWhatsappConfirmation(provider.name, provider.whatsapp);
    } catch (error) {
      console.error('Failed to send WhatsApp confirmation:', error);
      // Note: We don't want to fail the registration if WhatsApp fails
      // So we just log the error and continue
    }

    // Return success with redirect path
    return { success: true, redirect: '/profile/service-provider/view/' };
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
