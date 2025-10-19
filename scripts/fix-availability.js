const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking availability records that need to be fixed...\n');

  // First, let's see how many records will be affected
  const affectedRecords = await prisma.$queryRaw`
    SELECT COUNT(*) as count
    FROM "Availability" a
    JOIN "Provider" p ON a."providerId" = p.id
    WHERE a."createdById" = p."userId"
      AND a."organizationId" IS NULL
      AND a."createdByMembershipId" IS NULL
      AND a."isProviderCreated" = false
  `;

  const count = Number(affectedRecords[0].count);
  console.log(`📊 Found ${count} availability records that need to be updated`);

  if (count === 0) {
    console.log('✅ No records need updating. All availability records are already correct!');
    return;
  }

  // Show a sample of records that will be updated
  console.log('\n📋 Sample of records to be updated:');
  const sampleRecords = await prisma.$queryRaw`
    SELECT a.id, a."startTime", a."endTime", a."isProviderCreated", p."userId", a."createdById"
    FROM "Availability" a
    JOIN "Provider" p ON a."providerId" = p.id
    WHERE a."createdById" = p."userId"
      AND a."organizationId" IS NULL
      AND a."createdByMembershipId" IS NULL
      AND a."isProviderCreated" = false
    LIMIT 3
  `;

  sampleRecords.forEach((record, index) => {
    console.log(`  ${index + 1}. ID: ${record.id}`);
    console.log(`     Time: ${record.startTime} → ${record.endTime}`);
    console.log(`     isProviderCreated: ${record.isProviderCreated} (will change to true)`);
    console.log(
      `     createdById matches provider userId: ${record.createdById === record.userId ? '✅' : '❌'}`
    );
    console.log('');
  });

  console.log(`🚀 Proceeding to update ${count} records...\n`);

  // Run the update
  const result = await prisma.$executeRaw`
    UPDATE "Availability" 
    SET "isProviderCreated" = true
    FROM "Provider" p
    WHERE "Availability"."providerId" = p.id
      AND "Availability"."createdById" = p."userId"
      AND "Availability"."organizationId" IS NULL
      AND "Availability"."createdByMembershipId" IS NULL
      AND "Availability"."isProviderCreated" = false
  `;

  console.log(`✅ Successfully updated ${result} availability records!`);

  // Verify the changes
  console.log('\n🔍 Verifying the changes...');
  const remainingIncorrectRecords = await prisma.$queryRaw`
    SELECT COUNT(*) as count
    FROM "Availability" a
    JOIN "Provider" p ON a."providerId" = p.id
    WHERE a."createdById" = p."userId"
      AND a."organizationId" IS NULL
      AND a."createdByMembershipId" IS NULL
      AND a."isProviderCreated" = false
  `;

  const remainingCount = Number(remainingIncorrectRecords[0].count);

  if (remainingCount === 0) {
    console.log('✅ All records have been successfully updated!');
    console.log(
      '🎉 You should now be able to edit your provider-created availabilities in the calendar.'
    );
  } else {
    console.log(`⚠️  Warning: ${remainingCount} records still need to be updated.`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error occurred:', e);
    throw e;
  })
  .finally(async () => {
    console.log('\n🔌 Disconnecting from database...');
    await prisma.$disconnect();
  });
