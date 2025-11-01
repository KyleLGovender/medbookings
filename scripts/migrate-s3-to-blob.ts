#!/usr/bin/env tsx
/**
 * S3 to Vercel Blob Migration Script
 *
 * This script migrates all files from AWS S3 to Vercel Blob and updates
 * database URLs to point to the new Blob storage.
 *
 * Prerequisites:
 * - AWS credentials configured (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
 * - S3_BUCKET_NAME and S3_REGION environment variables
 * - BLOB_READ_WRITE_TOKEN from Vercel
 * - DATABASE_URL pointing to your database (can be AWS RDS or Neon)
 *
 * Usage:
 *   npx tsx scripts/migrate-s3-to-blob.ts [--dry-run]
 *
 * Options:
 *   --dry-run    Show what would be migrated without actually migrating
 */

import { DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { put } from '@vercel/blob';
import { PrismaClient } from '@prisma/client';

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

// Initialize clients
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'eu-west-1',
});

const prisma = new PrismaClient();

const S3_BUCKET = process.env.S3_BUCKET_NAME;
const S3_REGION = process.env.S3_REGION || 'eu-west-1';
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

// Validation
if (!S3_BUCKET) {
  console.error('❌ S3_BUCKET_NAME environment variable is required');
  process.exit(1);
}

if (!BLOB_TOKEN) {
  console.error('❌ BLOB_READ_WRITE_TOKEN environment variable is required');
  process.exit(1);
}

// Statistics
const stats = {
  totalFiles: 0,
  migrated: 0,
  failed: 0,
  skipped: 0,
  databaseUpdates: 0,
};

console.log('🚀 MedBookings S3 → Vercel Blob Migration\n');

if (DRY_RUN) {
  console.log('🔍 DRY RUN MODE - No actual migration will occur\n');
}

console.log('Configuration:');
console.log(`  S3 Bucket: ${S3_BUCKET}`);
console.log(`  S3 Region: ${S3_REGION}`);
console.log(`  Blob Token: ${BLOB_TOKEN.substring(0, 20)}...`);
console.log('');

/**
 * Migrate a single file from S3 to Vercel Blob
 */
async function migrateFile(key: string): Promise<{ success: boolean; blobUrl?: string; error?: string }> {
  try {
    console.log(`  Downloading: ${key}`);

    // Download from S3
    const getCommand = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    const s3Response = await s3Client.send(getCommand);

    if (!s3Response.Body) {
      return { success: false, error: 'Empty S3 response body' };
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    // @ts-expect-error - S3 Body types are complex
    for await (const chunk of s3Response.Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    if (DRY_RUN) {
      console.log(`  ✓ Would upload to Blob: ${key} (${buffer.length} bytes)`);
      return { success: true, blobUrl: `https://blob.vercel-storage.com/${key}` };
    }

    // Upload to Vercel Blob
    console.log(`  Uploading to Blob: ${key} (${buffer.length} bytes)`);
    const blob = await put(key, buffer, {
      access: 'public',
      token: BLOB_TOKEN,
      contentType: s3Response.ContentType || 'application/octet-stream',
      addRandomSuffix: false,
    });

    console.log(`  ✓ Migrated: ${blob.url}`);
    return { success: true, blobUrl: blob.url };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`  ✗ Failed to migrate ${key}: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

/**
 * Update database URLs from S3 to Blob
 */
async function updateDatabaseUrls(s3Key: string, blobUrl: string): Promise<number> {
  if (DRY_RUN) {
    console.log(`  Would update database URLs containing: ${s3Key}`);
    return 0;
  }

  let updates = 0;

  try {
    // Update provider images
    const providerResult = await prisma.provider.updateMany({
      where: {
        image: {
          contains: s3Key,
        },
      },
      data: {
        image: blobUrl,
      },
    });
    updates += providerResult.count;

    // Update organization logos
    const orgResult = await prisma.organization.updateMany({
      where: {
        logo: {
          contains: s3Key,
        },
      },
      data: {
        logo: blobUrl,
      },
    });
    updates += orgResult.count;

    // Note: RequirementSubmission stores document URLs in the documentMetadata JSON field
    // This would require more complex JSON parsing and update logic
    // Can be added in a future iteration if needed

    if (updates > 0) {
      console.log(`  ✓ Updated ${updates} database record(s)`);
    }

    return updates;
  } catch (error) {
    console.error(`  ✗ Database update failed:`, error);
    return 0;
  }
}

/**
 * Main migration function
 */
async function migrate() {
  try {
    console.log('📋 Step 1: Listing S3 objects...\n');

    // List all objects in S3
    const listCommand = new ListObjectsV2Command({
      Bucket: S3_BUCKET,
    });

    const listResponse = await s3Client.send(listCommand);
    const objects = listResponse.Contents || [];

    stats.totalFiles = objects.length;

    console.log(`Found ${stats.totalFiles} files in S3\n`);

    if (stats.totalFiles === 0) {
      console.log('✓ No files to migrate');
      return;
    }

    console.log('📦 Step 2: Migrating files...\n');

    // Migrate each file
    for (const object of objects) {
      if (!object.Key) continue;

      console.log(`[${stats.migrated + stats.failed + stats.skipped + 1}/${stats.totalFiles}] ${object.Key}`);

      // Migrate file
      const result = await migrateFile(object.Key);

      if (result.success && result.blobUrl) {
        stats.migrated++;

        // Update database URLs
        const dbUpdates = await updateDatabaseUrls(object.Key, result.blobUrl);
        stats.databaseUpdates += dbUpdates;
      } else {
        stats.failed++;
      }

      console.log(''); // Empty line between files
    }

    console.log('\n✅ Migration Complete!\n');
    console.log('Statistics:');
    console.log(`  Total files: ${stats.totalFiles}`);
    console.log(`  Migrated: ${stats.migrated}`);
    console.log(`  Failed: ${stats.failed}`);
    console.log(`  Database updates: ${stats.databaseUpdates}`);

    if (DRY_RUN) {
      console.log('\n⚠️  This was a DRY RUN. No actual changes were made.');
      console.log('Run without --dry-run to perform the migration.');
    } else {
      console.log('\n📝 Next steps:');
      console.log('  1. Verify all files are accessible via Blob URLs');
      console.log('  2. Test file uploads/downloads in your application');
      console.log('  3. Once verified, you can delete the S3 bucket or archive it');
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrate();
