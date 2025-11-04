#!/usr/bin/env ts-node

/**
 * Data Migration: Fix Provider Contact Defaults
 *
 * This script fixes providers that have insecure default values for email/whatsapp.
 * Run this AFTER the schema migration removes the defaults.
 *
 * Usage: npx ts-node scripts/migrate-provider-contacts.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Searching for providers with default contact values...\n');

  // Find providers with default values
  const providersWithDefaults = await prisma.provider.findMany({
    where: {
      OR: [{ email: 'default@example.com' }, { whatsapp: '+1234567890' }],
    },
    include: {
      user: {
        select: { email: true, id: true },
      },
    },
  });

  console.log(`📊 Found ${providersWithDefaults.length} providers with default values\n`);

  if (providersWithDefaults.length === 0) {
    console.log('✅ No providers need updating. Migration complete!\n');
    return;
  }

  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (const provider of providersWithDefaults) {
    const updates: { email?: string; whatsapp?: string | null } = {};
    let hasValidEmail = false;

    // Fix email
    if (provider.email === 'default@example.com') {
      if (provider.user.email) {
        updates.email = provider.user.email;
        hasValidEmail = true;
        console.log(`✅ Provider ${provider.id}: Using user email ${provider.user.email}`);
      } else {
        errors.push(
          `❌ Provider ${provider.id} (user: ${provider.userId}): No valid email source found`
        );
        errorCount++;
        console.log(`❌ Provider ${provider.id}: No valid email source (admin must fix manually)`);
        // Skip this provider - email is required
        continue;
      }
    }

    // Fix WhatsApp (nullable, so we can set to null)
    if (provider.whatsapp === '+1234567890') {
      updates.whatsapp = null;
      console.log(`✅ Provider ${provider.id}: Removed default WhatsApp number`);
    }

    // Apply updates
    if (Object.keys(updates).length > 0) {
      try {
        await prisma.provider.update({
          where: { id: provider.id },
          data: updates,
        });
        successCount++;
        console.log(`✅ Provider ${provider.id}: Successfully updated\n`);
      } catch (error) {
        errorCount++;
        const errorMsg = `❌ Provider ${provider.id}: Update failed - ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
        console.log(`${errorMsg}\n`);
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully updated: ${successCount} providers`);
  console.log(`❌ Errors encountered: ${errorCount} providers`);
  console.log(`📝 Total processed: ${providersWithDefaults.length} providers\n`);

  if (errors.length > 0) {
    console.log('⚠️  ERRORS REQUIRING MANUAL INTERVENTION:');
    console.log('='.repeat(60));
    errors.forEach((error) => console.log(error));
    console.log('\n📝 Action Required:');
    console.log('   - Review providers listed above in admin dashboard');
    console.log('   - Add valid email addresses manually');
    console.log('   - Or delete invalid provider records\n');
  } else {
    console.log('🎉 All providers successfully migrated!\n');
  }

  // Verify no default values remain
  const remainingDefaults = await prisma.provider.count({
    where: {
      OR: [{ email: 'default@example.com' }, { whatsapp: '+1234567890' }],
    },
  });

  if (remainingDefaults > 0) {
    console.log(
      `⚠️  WARNING: ${remainingDefaults} providers still have default values (likely due to errors above)\n`
    );
  } else {
    console.log('✅ VERIFICATION: No providers with default values remain\n');
  }
}

main()
  .catch((error) => {
    console.error('\n❌ FATAL ERROR during migration:');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
