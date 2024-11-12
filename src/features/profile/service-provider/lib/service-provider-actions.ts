'use server';

import { actionClient } from '@/lib/safe-action';
import { put } from '@vercel/blob';

import { prisma } from '@/lib/prisma';

import { serviceProviderSchema } from './service-provider-schema';

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

export const registerServiceProvider = actionClient
  .schema(serviceProviderSchema)
  .action(async ({ image, userId, ...data }) => {
    try {
      console.log('Received image in action:', image);
      const imageUrl = image ? (await uploadToBlob(image, userId)).url : undefined;
      console.log('Image URL after upload:', imageUrl);
      
      if (image && !imageUrl) {
        return { success: false, error: 'Failed to upload image' };
      }

      // Save provider data with image URL
      const provider = await prisma.serviceProvider.create({
        data: {
          ...data,
          image: imageUrl,
          name: data.name,
          user: data.user,
          serviceProviderType: data.serviceProviderType,
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
  });
