import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixLocationCoordinates() {
  console.log('Starting location coordinates migration...');
  
  try {
    // Get all locations
    const locations = await prisma.location.findMany();
    console.log(`Found ${locations.length} locations to check`);
    
    let fixedCount = 0;
    
    for (const location of locations) {
      // Check if coordinates have the nested 'create' structure
      if (
        location.coordinates &&
        typeof location.coordinates === 'object' &&
        'create' in (location.coordinates as any) &&
        'latitude' in (location.coordinates as any).create &&
        'longitude' in (location.coordinates as any).create
      ) {
        const nestedCoords = (location.coordinates as any).create;
        
        // Update to proper format
        await prisma.location.update({
          where: { id: location.id },
          data: {
            coordinates: {
              lat: nestedCoords.latitude,
              lng: nestedCoords.longitude,
            },
          },
        });
        
        console.log(`Fixed coordinates for location: ${location.name} (${location.id})`);
        fixedCount++;
      }
    }
    
    console.log(`\nMigration complete!`);
    console.log(`Total locations checked: ${locations.length}`);
    console.log(`Locations fixed: ${fixedCount}`);
    
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
fixLocationCoordinates().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});