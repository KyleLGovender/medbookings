'use server';

import { put } from '@vercel/blob';
import { createSafeAction } from 'next-safe-action';

import { prisma } from '@/lib/prisma';

import { serviceProviderSchema } from './service-provider-schema';

async function uploadToBlob(file: File) {
  try {
    const blob = await put(`profile-images/${Date.now()}-${file.name}`, file, {
      access: 'public',
      addRandomSuffix: true,
    });
    return { url: blob.url, success: true };
  } catch (error) {
    console.error('Failed to upload image:', error);
    return { success: false, error: 'Failed to upload image' };
  }
}

export const registerServiceProvider = createSafeAction(
  serviceProviderSchema,
  async ({ image, ...data }) => {
    try {
      let imageUrl: string | undefined;

      if (image) {
        const uploadResult = await uploadToBlob(image);
        if (!uploadResult.success) {
          return { success: false, error: uploadResult.error };
        }
        imageUrl = uploadResult.url;
      }

      // Save provider data with image URL
      const provider = await prisma.serviceProvider.create({
        data: {
          ...data,
          imageUrl,
        },
      });

      return {
        success: true,
        data: provider,
      };
    } catch (error) {
      console.error('Failed to register provider:', error);
      return {
        success: false,
        error: 'Failed to register provider. Please try again.',
      };
    }
  }
);
