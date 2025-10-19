'use server';

import { uploadToS3 } from '@/lib/storage/s3';

/**
 * Uploads a file to AWS S3 storage
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
  // Note: Function name kept as 'uploadToBlob' for backward compatibility
  // but now uses S3 storage instead of Vercel Blob
  return uploadToS3(file, userId, directory, purpose);
}
