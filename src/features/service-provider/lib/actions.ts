'use server';

import { revalidatePath } from 'next/cache';

import { BillingType, Languages, Prisma, RequirementsValidationStatus } from '@prisma/client';
import { put } from '@vercel/blob';
import { getServerSession } from 'next-auth/next';

import { serializeServiceProvider } from '@/features/service-provider/lib/helper';
import { sendServiceProviderWhatsappConfirmation } from '@/features/service-provider/lib/server-helper';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function uploadToBlob(file: File, userId: string) {
  try {
    const uniqueFilename = `${Date.now()}-${userId}`;
    const blob = await put(`profile-images/${uniqueFilename}`, file, {
      access: 'public',
      addRandomSuffix: false,
    });
    return { url: blob.url, success: true };
  } catch (error) {
    console.error('Failed to upload image:', error);
    return { success: false, error: 'Failed to upload image' };
  }
}

export async function registerServiceProvider(prevState: any, formData: FormData) {
  try {
    const userId = formData.get('userId') as string;
    const imageFile = formData.get('image') as File;
    const services = formData.getAll('services') as string[];
    const languages = formData.getAll('languages') as Languages[];
    const billingType = formData.get('billingType') as BillingType;
    const email = formData.get('email') as string;
    const whatsapp = formData.get('whatsapp') as string;
    const website = (formData.get('website') as string) || null;

    // Handle image upload
    const imageUrl = imageFile ? (await uploadToBlob(imageFile, userId)).url : undefined;

    if (imageFile && !imageUrl) {
      return { success: false, error: 'Failed to upload image' };
    }

    // Process requirements first if any were submitted
    const requirementSubmissions = [];
    const hasRequirements = Array.from(formData.entries()).some(([key]) =>
      key.match(/requirements\[\d+\]\[requirementTypeId\]/)
    );

    if (hasRequirements) {
      const requirements: {
        requirementTypeId: string;
        value?: string;
        documentFile?: File;
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
          const formFile = formData.get(fileKey) as File;
          const formOtherValue = formData.get(otherValueKey) as string;

          if (formFile?.size > 0 || formValue || (formValue === 'other' && formOtherValue)) {
            requirements.push({
              requirementTypeId,
              value: formValue,
              documentFile: formFile,
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

            if (req.documentFile && req.documentFile.size > 0) {
              const uploadResult = await uploadToBlob(req.documentFile, userId);
              if (uploadResult.success) {
                documentUrl = uploadResult.url || null;
              }
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
        billingType,
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
      const message = await sendServiceProviderWhatsappConfirmation(
        provider.name,
        provider.whatsapp
      );
      console.log('WhatsApp confirmation sent:', message);
    } catch (error) {
      console.error('Failed to send WhatsApp confirmation:', error);
      // Note: We don't want to fail the registration if WhatsApp fails
      // So we just log the error and continue
    }

    // Return success with redirect path
    return { success: true, redirect: '/profile/service-provider' };
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

export async function updateServiceProvider(prevState: any, formData: FormData) {
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
    const billingType = formData.get('billingType') as BillingType;
    const languages = formData.getAll('languages') as Languages[];
    const services = formData.getAll('services') as string[];
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

    // Only include fields that were actually changed
    if (name !== currentProvider.name) updateData.name = name;
    if (bio !== currentProvider.bio) updateData.bio = bio;
    if (email !== currentProvider.email) updateData.email = email;
    if (whatsapp !== currentProvider.whatsapp) updateData.whatsapp = whatsapp;
    if (website !== currentProvider.website) updateData.website = website;
    if (billingType !== currentProvider.billingType) updateData.billingType = billingType;
    if (JSON.stringify(languages) !== JSON.stringify(currentProvider.languages)) {
      updateData.languages = languages;
    }

    if (whatsapp !== currentProvider.whatsapp) {
      // Send WhatsApp confirmation
      try {
        const message = await sendServiceProviderWhatsappConfirmation(
          updateData.name,
          updateData.whatsapp
        );
        console.log('WhatsApp confirmation sent:', message);
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
      const uploadResult = await uploadToBlob(imageFile, userId);
      if (!uploadResult.success) {
        return { success: false, error: 'Failed to upload image' };
      }
      imageUrl = uploadResult.url;
      updateData.image = imageUrl;
    }

    // Process requirements from form data
    type RequirementUpdate = {
      requirementTypeId: string;
      value?: string;
      documentFile?: File;
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
          const fileKey = `requirements[${index}][documentFile]`;
          const otherValueKey = `requirements[${index}][otherValue]`;

          const formValue = formData.get(valueKey) as string;
          const formFile = formData.get(fileKey) as File;
          const formOtherValue = formData.get(otherValueKey) as string;

          // Find existing submission for this requirement type
          const existingSubmission = currentProvider.requirementSubmissions.find(
            (sub) => sub.requirementTypeId === requirementTypeId
          );

          const existingValue = existingSubmission?.documentMetadata
            ? (existingSubmission.documentMetadata as { value?: string })?.value
            : null;

          // Only include if there's a new file, new value, or it's different from existing
          if (
            formFile?.size > 0 ||
            (formValue && formValue !== existingValue) ||
            (formValue === 'other' && formOtherValue !== existingSubmission?.documentUrl)
          ) {
            requirements.push({
              requirementTypeId,
              value: formValue,
              documentFile: formFile,
              otherValue: formOtherValue,
            });
          }
        }
      });

      // Only process requirements that have changes
      if (requirements.length > 0) {
        // Process and create/update submissions
        const requirementUpdates = await Promise.all(
          requirements.map(async (req) => {
            let documentUrl: string | null = null;
            let documentMetadata: { value: string } | undefined;

            // If there's a file, upload it
            if (req.documentFile && req.documentFile.size > 0) {
              const uploadResult = await uploadToBlob(req.documentFile, userId);
              if (uploadResult.success) {
                documentUrl = uploadResult.url || null;
              }
            } else if (req.value === 'other' && req.otherValue) {
              // Handle "other" option
              documentUrl = req.otherValue;
              documentMetadata = { value: 'other' };
            } else if (req.value) {
              // Store regular value in metadata
              documentMetadata = { value: req.value };
            }

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
                documentUrl,
                documentMetadata: documentMetadata || Prisma.JsonNull,
                status: RequirementsValidationStatus.PENDING,
              },
              update: {
                documentUrl,
                documentMetadata: documentMetadata || Prisma.JsonNull,
                status: RequirementsValidationStatus.PENDING,
              },
            });
          })
        );

        await Promise.all(requirementUpdates);
      }
    }

    // Only update services if they've changed
    const currentServiceIds = currentProvider.services.map((s) => s.id);
    if (JSON.stringify(services.sort()) !== JSON.stringify(currentServiceIds.sort())) {
      updateData.services = {
        set: [],
        connect: services.map((serviceId) => ({ id: serviceId })),
      };
    }

    // If no fields were changed and no requirements were updated, return early
    if (Object.keys(updateData).length === 0 && requirements.length === 0) {
      return {
        success: true,
        message: 'No changes detected',
        data: serializeServiceProvider(currentProvider),
        redirect: '/profile/service-provider/view',
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
    revalidatePath(`/service-provider/${id}`);

    return {
      success: true,
      data: serializeServiceProvider(updatedProvider),
      redirect: '/profile/service-provider/view',
    };
  } catch (error) {
    console.error('Error updating service provider:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update profile',
    };
  }
}

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

    // 5. Delete bookings
    await prisma.booking.deleteMany({
      where: { serviceProviderId },
    });

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
    revalidatePath('/profile/service-provider');
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

export async function approveServiceProvider(serviceProviderId: string) {
  try {
    // Get the current user's session
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    // Update service provider status
    const updatedProvider = await prisma.serviceProvider.update({
      where: { id: serviceProviderId },
      data: {
        status: 'APPROVED',
        verifiedAt: new Date(),
      },
    });

    // Optional: Send notification to service provider
    await prisma.notificationLog.create({
      data: {
        type: 'BOOKING_CONFIRMATION',
        channel: 'EMAIL',
        content: 'Your service provider account has been approved!',
        status: 'SENT',
        serviceProviderName: updatedProvider.name,
      },
    });

    return { success: true, data: updatedProvider };
  } catch (error) {
    console.error('Error approving service provider:', error);
    return { success: false, error: 'Failed to approve service provider' };
  }
}

export async function suspendServiceProvider(serviceProviderId: string) {
  try {
    // Get the current user's session
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    // Update service provider status
    const updatedProvider = await prisma.serviceProvider.update({
      where: { id: serviceProviderId },
      data: {
        status: 'SUSPENDED',
      },
    });

    // Create notification log
    await prisma.notificationLog.create({
      data: {
        type: 'BOOKING_CONFIRMATION',
        channel: 'EMAIL',
        content:
          'Your service provider account has been suspended. Please contact support for more information.',
        status: 'SENT',
        serviceProviderName: updatedProvider.name,
      },
    });

    return { success: true, data: updatedProvider };
  } catch (error) {
    console.error('Error suspending service provider:', error);
    return { success: false, error: 'Failed to suspend service provider' };
  }
}
