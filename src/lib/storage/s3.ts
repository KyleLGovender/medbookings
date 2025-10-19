'use server';

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
// When running in AWS Amplify, credentials are automatically provided by the IAM role
// For local development, credentials come from environment variables
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-west-1',
  // Credentials are automatically picked up from:
  // 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) for local dev
  // 2. IAM role when running in AWS Amplify (no credentials needed)
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

if (!BUCKET_NAME) {
  throw new Error('AWS_S3_BUCKET_NAME environment variable is not set');
}

/**
 * Uploads a file to AWS S3
 * @param file The file to upload
 * @param userId The ID of the user uploading the file
 * @param directory The directory to store the file in (defaults to 'profile-images')
 * @param purpose The purpose of the file (e.g., 'license', 'certification')
 * @returns Object containing success status and URL if successful
 */
export async function uploadToS3(
  file: File,
  userId: string,
  directory: string = 'profile-images',
  purpose: string
): Promise<{ url?: string; success: boolean; error?: string }> {
  try {
    // Generate UUID
    const uuid = crypto.randomUUID();

    // Format datetime as YYYYMMDD-HHMMSS
    const now = new Date();
    const datetime = now.toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');

    // Sanitize purpose string (only remove problematic characters for URLs)
    const sanitizedPurpose = purpose.toLowerCase().replace(/[<>:"/\\|?*]/g, '-');

    // Sanitize original filename (only remove problematic characters for URLs)
    const originalFilename = file.name.replace(/[<>:"/\\|?*]/g, '-');

    // Create the unique filename with the same convention as Vercel Blob
    const uniqueFilename = `${uuid}-|-${sanitizedPurpose}-|-${datetime}-|-${originalFilename}`;
    const key = `${directory}/${uniqueFilename}`;

    // Convert File to Buffer for S3 upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        userId: userId,
        purpose: sanitizedPurpose,
        originalFilename: file.name,
      },
    });

    await s3Client.send(command);

    // Generate public URL (CloudFront or S3 direct URL)
    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'eu-west-1'}.amazonaws.com/${key}`;

    return { url, success: true };
  } catch (error) {
    console.error('Failed to upload file to S3:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file',
    };
  }
}

/**
 * Uploads text content to AWS S3 (useful for vCards, JSON, etc.)
 * @param content The text content to upload
 * @param key The S3 key (path) for the file
 * @param contentType The MIME type of the content
 * @returns Object containing success status and URL if successful
 */
export async function uploadTextToS3(
  content: string,
  key: string,
  contentType: string = 'text/plain'
): Promise<{ url?: string; success: boolean; error?: string }> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: content,
      ContentType: contentType,
    });

    await s3Client.send(command);

    // Generate public URL
    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'eu-west-1'}.amazonaws.com/${key}`;

    return { url, success: true };
  } catch (error) {
    console.error('Failed to upload text to S3:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload text',
    };
  }
}

/**
 * Generates a presigned URL for temporary public access to a private S3 object
 * @param key The S3 key (path) of the file
 * @param expiresIn Expiration time in seconds (default: 1 hour)
 * @returns Presigned URL string
 */
export async function getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Deletes a file from S3
 * @param key The S3 key (path) of the file to delete
 * @returns Object containing success status
 */
export async function deleteFromS3(key: string): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);

    return { success: true };
  } catch (error) {
    console.error('Failed to delete file from S3:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete file',
    };
  }
}
