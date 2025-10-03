'use server';

import { put } from '@vercel/blob';

import { logger } from '@/lib/logger';
import { nowUTC } from '@/lib/timezone';

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
    const now = nowUTC();
    const datetime = now.toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');

    // Sanitize purpose string (only remove problematic characters for URLs)
    const sanitizedPurpose = purpose.toLowerCase().replace(/[<>:"/\\|?*]/g, '-');

    // Sanitize original filename (only remove problematic characters for URLs)
    const originalFilename = file.name.replace(/[<>:"/\\|?*]/g, '-');

    // Create the unique filename with the new convention using -|- as separators
    const uniqueFilename = `${uuid}-|-${sanitizedPurpose}-|-${datetime}-|-${originalFilename}`;

    const blob = await put(`${directory}/${uniqueFilename}`, file, {
      access: 'public',
      addRandomSuffix: false,
    });
    return { url: blob.url, success: true };
  } catch (error) {
    logger.error('Failed to upload file', {
      error: error instanceof Error ? error.message : String(error),
      purpose,
      directory,
    });
    return { success: false, error: 'Failed to upload file' };
  }
}
