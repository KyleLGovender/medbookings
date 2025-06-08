'use server';

import { put } from '@vercel/blob';

/**
 * Uploads a file to Vercel Blob storage
 * @param file The file to upload
 * @param userId The ID of the user uploading the file
 * @returns Object containing success status and URL if successful
 */
export async function uploadToBlob(file: File, userId: string) {
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
