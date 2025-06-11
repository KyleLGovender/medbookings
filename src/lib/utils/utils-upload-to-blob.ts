'use server';

import { put } from '@vercel/blob';

/**
 * Uploads a file to Vercel Blob storage
 * @param file The file to upload
 * @param userId The ID of the user uploading the file
 * @param directory The directory to store the file in (defaults to 'profile-images')
 * @param purpose The purpose of the file (e.g., 'license', 'certification')
 * @returns Object containing success status and URL if successful
 */
export async function uploadToBlob(
  file: File,
  userId: string,
  directory: string = 'profile-images',
  purpose: string
) {
  try {
    // Generate UUID
    const uuid = crypto.randomUUID();

    // Format datetime as YYYYMMDD-HHMMSS
    const now = new Date();
    const datetime = now.toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');

    // Sanitize purpose string (remove spaces, special chars)
    const sanitizedPurpose = purpose.toLowerCase().replace(/[^a-z0-9]/g, '-');

    // Sanitize original filename (remove spaces, special chars)
    const originalFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');

    // Create the unique filename with the new convention
    const uniqueFilename = `${uuid}-${sanitizedPurpose}-${datetime}-${originalFilename}`;

    const blob = await put(`${directory}/${uniqueFilename}`, file, {
      access: 'public',
      addRandomSuffix: false,
    });
    return { url: blob.url, success: true };
  } catch (error) {
    console.error('Failed to upload file:', error);
    return { success: false, error: 'Failed to upload file' };
  }
}
