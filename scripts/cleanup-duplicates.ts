import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

const prisma = new PrismaClient();

async function cleanupDuplicates() {
  console.log('🧹 Cleaning up duplicate services and requirement types...');
  
  try {
    // Clean up duplicate Services
    console.log('📝 Cleaning duplicate Services...');
    
    // Get all Services with duplicates
    const duplicateServices = await prisma.$queryRaw`
      SELECT id, name, "defaultPrice", "defaultDuration", 
             ROW_NUMBER() OVER (PARTITION BY name, "defaultPrice", "defaultDuration" ORDER BY id) as rn
      FROM "Service"
    ` as any[];
    
    const servicesToDelete = duplicateServices.filter(s => s.rn > 1).map(s => s.id);
    
    if (servicesToDelete.length > 0) {
      const deletedServices = await prisma.service.deleteMany({
        where: {
          id: { in: servicesToDelete }
        }
      });
      console.log(`✅ Deleted ${deletedServices.count} duplicate services`);
    } else {
      console.log('✅ No duplicate services found');
    }
    
    // Clean up duplicate RequirementTypes
    console.log('📋 Cleaning duplicate RequirementTypes...');
    
    const duplicateRequirements = await prisma.$queryRaw`
      SELECT id, name, "validationType", "providerTypeId",
             ROW_NUMBER() OVER (PARTITION BY name, "validationType", "providerTypeId" ORDER BY id) as rn
      FROM "RequirementType"
    ` as any[];
    
    const requirementsToDelete = duplicateRequirements.filter(r => r.rn > 1).map(r => r.id);
    
    if (requirementsToDelete.length > 0) {
      const deletedRequirements = await prisma.requirementType.deleteMany({
        where: {
          id: { in: requirementsToDelete }
        }
      });
      console.log(`✅ Deleted ${deletedRequirements.count} duplicate requirement types`);
    } else {
      console.log('✅ No duplicate requirement types found');
    }
    
    // Show final counts
    const serviceCount = await prisma.service.count();
    const requirementCount = await prisma.requirementType.count();
    
    console.log(`📊 Final counts:`);
    console.log(`   Services: ${serviceCount}`);
    console.log(`   Requirement Types: ${requirementCount}`);
    
  } catch (error) {
    console.error('❌ Error cleaning duplicates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicates();