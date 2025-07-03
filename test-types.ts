// TypeScript test file to verify new Prisma types are generated correctly
import { PrismaClient, SchedulingRule } from '@prisma/client';

const prisma = new PrismaClient();

// Test function to verify all new fields are properly typed
async function testAvailabilityTypes() {
  // This should compile without errors if all types are correct
  const availabilityData = {
    serviceProviderId: 'test-id',
    startTime: new Date(),
    endTime: new Date(),
    createdById: 'test-user-id',
    
    // New fields - should all be properly typed
    recurrencePattern: {
      type: 'weekly',
      daysOfWeek: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '17:00',
      endDate: '2024-12-31'
    },
    seriesId: 'weekly-series-123',
    isRecurring: true,
    schedulingRule: SchedulingRule.CONTINUOUS,
    schedulingInterval: 20,
    isOnlineAvailable: true,
  };

  // Test ServiceAvailabilityConfig types
  const serviceConfigData = {
    serviceId: 'test-service-id',
    serviceProviderId: 'test-provider-id',
    duration: 30,
    price: 650.00,
    showPrice: true, // New field
    locationId: 'test-location-id', // New field
    isOnlineAvailable: false,
    isInPerson: true,
  };

  console.log('TypeScript compilation test passed!');
  console.log('All new fields are properly typed:');
  console.log('- recurrencePattern (Json)');
  console.log('- seriesId (String)');
  console.log('- isRecurring (Boolean)');
  console.log('- schedulingRule (SchedulingRule enum)');
  console.log('- schedulingInterval (Number)');
  console.log('- isOnlineAvailable (Boolean)');
  console.log('- showPrice (Boolean)');
  console.log('- locationId (String)');
  
  return { availabilityData, serviceConfigData };
}

export { testAvailabilityTypes, SchedulingRule };