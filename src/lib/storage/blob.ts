'use server';

import { del, list, put } from '@vercel/blob';

import { logger } from '@/lib/logger';
import { nowUTC } from '@/lib/timezone';

/**
 * Uploads a file to Vercel Blob Storage
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
): Promise<{ url?: string; success: boolean; error?: string }> {
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

    // Create the unique filename with structured separators for parsing
    const uniqueFilename = `${uuid}-|-${sanitizedPurpose}-|-${datetime}-|-${originalFilename}`;
    const pathname = `${directory}/${uniqueFilename}`;

    // Upload to Vercel Blob
    const blob = await put(pathname, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false, // We already have UUID in filename
    });

    return { url: blob.url, success: true };
  } catch (error) {
    logger.error('Failed to upload file to Vercel Blob', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file',
    };
  }
}

/**
 * Uploads text content to Vercel Blob (useful for vCards, JSON, etc.)
 * @param content The text content to upload
 * @param pathname The Blob pathname (path) for the file
 * @param contentType The MIME type of the content
 * @returns Object containing success status and URL if successful
 */
export async function uploadTextToBlob(
  content: string,
  pathname: string,
  contentType: string = 'text/plain'
): Promise<{ url?: string; success: boolean; error?: string }> {
  try {
    const blob = await put(pathname, content, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType,
      addRandomSuffix: false,
    });

    return { url: blob.url, success: true };
  } catch (error) {
    logger.error('Failed to upload text to Vercel Blob', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload text',
    };
  }
}

/**
 * Deletes a file from Vercel Blob by URL
 * @param url The Blob URL of the file to delete
 * @returns Object containing success status
 */
export async function deleteFromBlob(url: string): Promise<{ success: boolean; error?: string }> {
  try {
    await del(url, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return { success: true };
  } catch (error) {
    logger.error('Failed to delete file from Vercel Blob', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete file',
    };
  }
}

/**
 * Lists all blobs with optional prefix filtering
 * @param prefix Optional prefix to filter blobs (e.g., 'profile-images/')
 * @returns Object containing blobs array and success status
 */
export async function listBlobs(prefix?: string): Promise<{
  blobs?: Array<{ url: string; pathname: string; size: number; uploadedAt: Date }>;
  success: boolean;
  error?: string;
}> {
  try {
    const result = await list({
      token: process.env.BLOB_READ_WRITE_TOKEN,
      prefix,
    });

    return { blobs: result.blobs, success: true };
  } catch (error) {
    logger.error('Failed to list Vercel Blob files', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list files',
    };
  }
}

/**
 * Note: Vercel Blob URLs are already public and don't require presigned URLs
 * This function is provided for API compatibility with S3 implementation
 * @param url The Blob URL (already public)
 * @returns The same URL (no transformation needed)
 */
export async function getPresignedUrl(url: string): Promise<string> {
  // Vercel Blob URLs are already public, so just return the URL
  return url;
}
