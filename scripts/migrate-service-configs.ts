/**
 * Migration Script: Create ServiceAvailabilityConfig records for existing providers
 * 
 * This script creates default ServiceAvailabilityConfig records for providers
 * who have services but are missing configurations. This fixes the issue where
 * provider service default values were not persisted during registration.
 * 
 * Usage:
 *   npm run ts-node scripts/migrate-service-configs.ts
 *   or
 *   npx ts-node scripts/migrate-service-configs.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MigrationStats {
  totalProviders: number;
  providersWithMissingConfigs: number;
  configsCreated: number;
  errors: string[];
}

async function main() {
  console.log('🔍 Starting ServiceAvailabilityConfig migration...\n');

  const stats: MigrationStats = {
    totalProviders: 0,
    providersWithMissingConfigs: 0,
    configsCreated: 0,
    errors: [],
  };

  try {
    // Step 1: Identify providers with missing configurations
    console.log('Step 1: Identifying providers with missing configurations...');
    
    const providersWithServices = await prisma.provider.findMany({
      where: {
        status: {
          in: ['APPROVED', 'PENDING_APPROVAL'], // Only active/pending providers
        },
      },
      include: {
        services: true,
        availabilityConfigs: true,
      },
    });

    stats.totalProviders = providersWithServices.length;
    console.log(`Found ${stats.totalProviders} active providers\n`);

    // Step 2: Process each provider
    for (const provider of providersWithServices) {
      const servicesWithoutConfig = provider.services.filter(service => 
        !provider.availabilityConfigs.some(config => config.serviceId === service.id)
      );

      if (servicesWithoutConfig.length > 0) {
        stats.providersWithMissingConfigs++;
        
        console.log(`📋 Provider: ${provider.name} (${provider.id})`);
        console.log(`   Missing configs for ${servicesWithoutConfig.length} services:`);
        
        // Step 3: Create missing configurations
        for (const service of servicesWithoutConfig) {
          try {
            const newConfig = await prisma.serviceAvailabilityConfig.create({
              data: {
                serviceId: service.id,
                providerId: provider.id,
                duration: service.defaultDuration || 30,
                price: service.defaultPrice || 0,
                isOnlineAvailable: true, // Default to online available
                isInPerson: false, // Default to not in-person
              },
            });

            stats.configsCreated++;
            console.log(`   ✅ Created config for "${service.name}" (${service.id})`);
            console.log(`      Price: R${newConfig.price}, Duration: ${newConfig.duration}min`);
          } catch (error) {
            const errorMsg = `Failed to create config for service ${service.id}: ${error}`;
            stats.errors.push(errorMsg);
            console.log(`   ❌ ${errorMsg}`);
          }
        }
        console.log(''); // Empty line for readability
      }
    }

    // Step 4: Verification
    console.log('Step 4: Verifying migration results...');
    
    const verificationResults = await prisma.provider.findMany({
      where: {
        status: {
          in: ['APPROVED', 'PENDING_APPROVAL'],
        },
      },
      include: {
        services: true,
        availabilityConfigs: true,
      },
    });

    let allComplete = true;
    for (const provider of verificationResults) {
      const missingCount = provider.services.length - provider.availabilityConfigs.length;
      if (missingCount > 0) {
        allComplete = false;
        console.log(`⚠️  ${provider.name}: ${missingCount} configs still missing`);
      }
    }

    // Step 5: Summary
    console.log('\n📊 Migration Summary:');
    console.log('==========================================');
    console.log(`Total providers processed: ${stats.totalProviders}`);
    console.log(`Providers with missing configs: ${stats.providersWithMissingConfigs}`);
    console.log(`ServiceAvailabilityConfig records created: ${stats.configsCreated}`);
    console.log(`Errors encountered: ${stats.errors.length}`);
    console.log(`Migration status: ${allComplete ? '✅ COMPLETE' : '❌ INCOMPLETE'}`);

    if (stats.errors.length > 0) {
      console.log('\n❌ Errors:');
      stats.errors.forEach(error => console.log(`   - ${error}`));
    }

    if (allComplete && stats.configsCreated > 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('All providers now have ServiceAvailabilityConfig records for their services.');
    } else if (stats.configsCreated === 0) {
      console.log('\n✨ No migration needed - all providers already have complete configurations.');
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle script execution
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n🏁 Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export { main as migrateServiceConfigs };