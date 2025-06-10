'use server';

import { Languages, Prisma, RequirementsValidationStatus } from '@prisma/client';

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
    const requirementSubmissions = [];
    const hasRequirements = Array.from(formData.entries()).some(([key]) =>
      key.match(/requirements\[\d+\]\[requirementTypeId\]/)
    );

    if (hasRequirements) {
      const requirements: {
        requirementTypeId: string;
        value?: string;
        documentUrl?: string;
        otherValue?: string;
      }[] = [];

      // Collect all requirement entries from form data
      Array.from(formData.entries()).forEach(([key, value]) => {
        if (key.match(/requirements\[\d+\]\[requirementTypeId\]/)) {
          const index = key.match(/\[(\d+)\]/)?.[1];
          if (!index) return;

          const requirementTypeId = value as string;
          const valueKey = `requirements[${index}][value]`;
          const fileKey = `requirements[${index}][documentFile]`;
          const otherValueKey = `requirements[${index}][otherValue]`;

          const formValue = formData.get(valueKey) as string;
          const formDocumentUrl = formData.get(fileKey) as string;
          const formOtherValue = formData.get(otherValueKey) as string;

          if (formDocumentUrl || formValue || (formValue === 'other' && formOtherValue)) {
            requirements.push({
              requirementTypeId,
              value: formValue,
              documentUrl: formDocumentUrl,
              otherValue: formOtherValue,
            });
          }
        }
      });

      // Process and prepare submissions
      if (requirements.length > 0) {
        const processedRequirements = await Promise.all(
          requirements.map(async (req) => {
            let documentUrl: string | null = null;
            let documentMetadata: { value: string } | undefined;

            if (req.documentUrl) {
              // Document URL is already provided from client-side upload
              documentUrl = req.documentUrl;
            } else if (req.value === 'other' && req.otherValue) {
              documentUrl = req.otherValue;
              documentMetadata = { value: 'other' };
            } else if (req.value) {
              documentMetadata = { value: req.value };
            }

            return {
              requirementTypeId: req.requirementTypeId,
              documentUrl,
              documentMetadata: documentMetadata || Prisma.JsonNull,
              status: RequirementsValidationStatus.PENDING,
            };
          })
        );

        requirementSubmissions.push(...processedRequirements);
      }
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
