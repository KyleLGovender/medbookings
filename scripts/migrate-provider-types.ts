#!/usr/bin/env tsx

/**
 * Data migration script for ServiceProvider type relationship changes
 * Migrates existing single-type assignments to the new n:n ServiceProviderTypeAssignment table
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateProviderTypes(): Promise<void> {
  console.log('🔄 Starting ServiceProvider type migration...\n');

  try {
    // Step 1: Find all service providers with existing type assignments
    const providersWithTypes = await prisma.$queryRaw<Array<{
      id: string;
      name: string;
      serviceProviderTypeId: string;
    }>>`
      SELECT id, name, "serviceProviderTypeId" 
      FROM "ServiceProvider" 
      WHERE "serviceProviderTypeId" IS NOT NULL
    `;

    console.log(`📊 Found ${providersWithTypes.length} providers with existing type assignments`);

    if (providersWithTypes.length === 0) {
      console.log('✅ No existing type assignments to migrate');
      return;
    }

    // Step 2: Check if ServiceProviderTypeAssignment table exists
    const tableExists = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_name = 'ServiceProviderTypeAssignment'
    `;

    if (tableExists[0].count === 0) {
      console.log('❌ ServiceProviderTypeAssignment table does not exist yet');
      console.log('   Please run schema migration first to create the table');
      return;
    }

    // Step 3: Create assignments in the new table
    console.log('\n🔄 Creating assignments in ServiceProviderTypeAssignment table...');
    
    let migratedCount = 0;
    for (const provider of providersWithTypes) {
      try {
        // Check if assignment already exists
        const existingAssignment = await prisma.$queryRaw<Array<{ count: number }>>`
          SELECT COUNT(*) as count
          FROM "ServiceProviderTypeAssignment" 
          WHERE "serviceProviderId" = ${provider.id} 
          AND "serviceProviderTypeId" = ${provider.serviceProviderTypeId}
        `;

        if (existingAssignment[0].count > 0) {
          console.log(`⚠️  Assignment for ${provider.name} already exists, skipping...`);
          continue;
        }

        // Create new assignment
        await prisma.$executeRaw`
          INSERT INTO "ServiceProviderTypeAssignment" 
          (id, "serviceProviderId", "serviceProviderTypeId", "createdAt", "updatedAt")
          VALUES (
            'assignment_' || substr(md5(random()::text), 1, 20),
            ${provider.id},
            ${provider.serviceProviderTypeId},
            NOW(),
            NOW()
          )
        `;

        console.log(`✅ Created assignment for ${provider.name}`);
        migratedCount++;
      } catch (error) {
        console.error(`❌ Failed to create assignment for ${provider.name}:`, error);
      }
    }

    // Step 4: Verify migration results
    console.log('\n📊 Verifying migration results...');
    
    const totalAssignments = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*) as count FROM "ServiceProviderTypeAssignment"
    `;
    
    console.log(`✅ Total assignments in new table: ${totalAssignments[0].count}`);
    console.log(`✅ Successfully migrated: ${migratedCount} providers`);

    // Step 5: Show detailed results
    console.log('\n📋 Migration Summary:');
    const assignments = await prisma.$queryRaw<Array<{
      providerName: string;
      typeName: string;
      assignmentId: string;
    }>>`
      SELECT 
        sp.name as "providerName",
        spt.name as "typeName",
        spa.id as "assignmentId"
      FROM "ServiceProviderTypeAssignment" spa
      JOIN "ServiceProvider" sp ON spa."serviceProviderId" = sp.id
      JOIN "ServiceProviderType" spt ON spa."serviceProviderTypeId" = spt.id
      ORDER BY sp.name, spt.name
    `;

    assignments.forEach(assignment => {
      console.log(`  • ${assignment.providerName} → ${assignment.typeName} (${assignment.assignmentId})`);
    });

    console.log('\n🎯 Migration completed successfully!');
    console.log('   You can now apply the schema migration to remove the old serviceProviderTypeId column.');

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration if executed directly
if (require.main === module) {
  migrateProviderTypes();
}

export { migrateProviderTypes };