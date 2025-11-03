/**
 * Setup Test Data for E2E and Load Testing
 * Creates a test provider with availability and slots for testing
 */

import { PrismaClient } from '@prisma/client';
import { addDays, addHours, setHours, setMinutes } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Setting up test data for E2E/Load testing...\n');

  // 1. Create test provider user
  console.log('1️⃣  Creating test provider user...');
  const providerUser = await prisma.user.upsert({
    where: { email: 'test-provider@medbookings.test' },
    update: {},
    create: {
      email: 'test-provider@medbookings.test',
      name: 'Test Provider',
      emailVerified: new Date(),
      role: 'USER',
    },
  });
  console.log(`   ✅ Provider user: ${providerUser.id}`);

  // 2. Create provider profile
  console.log('\n2️⃣  Creating provider profile...');
  const provider = await prisma.provider.upsert({
    where: { userId: providerUser.id },
    update: {},
    create: {
      userId: providerUser.id,
      name: 'Test Medical Provider',
      bio: 'Test provider for E2E and load testing',
      image: 'https://via.placeholder.com/150',
      status: 'APPROVED',
    },
  });
  console.log(`   ✅ Provider profile: ${provider.id}`);

  // 3. Create provider type
  console.log('\n3️⃣  Creating provider type...');
  const providerType = await prisma.providerType.upsert({
    where: { name: 'General Practitioner' },
    update: {},
    create: {
      name: 'General Practitioner',
      description: 'General medical practitioner for testing',
    },
  });
  console.log(`   ✅ Provider type: ${providerType.id}`);

  // 4. Create service
  console.log('\n4️⃣  Creating service...');
  const service = await prisma.service.upsert({
    where: {
      id: 'test-service-general-consultation',
    },
    update: {},
    create: {
      id: 'test-service-general-consultation',
      name: 'General Consultation',
      description: 'Standard consultation service for testing',
      defaultDuration: 30,
      defaultPrice: 500,
      displayPriority: 1,
      providerTypeId: providerType.id,
    },
  });
  console.log(`   ✅ Service: ${service.id}`);

  // 5. Create availability for today + next 7 days
  console.log('\n5️⃣  Creating availability slots...');
  const today = new Date();
  const availabilities = [];
  let firstServiceConfig = null;

  for (let i = 1; i <= 7; i++) {
    const date = addDays(today, i);
    const startTime = setMinutes(setHours(date, 9), 0); // 9:00 AM
    const endTime = setMinutes(setHours(date, 17), 0); // 5:00 PM

    const availability = await prisma.availability.create({
      data: {
        providerId: provider.id,
        createdById: providerUser.id,
        isProviderCreated: true,
        startTime,
        endTime,
        isOnlineAvailable: true,
        status: 'ACCEPTED',
        schedulingRule: 'ON_THE_HALF_HOUR',
      },
    });

    availabilities.push(availability);

    // Create service availability config
    const serviceConfig = await prisma.serviceAvailabilityConfig.create({
      data: {
        serviceId: service.id,
        providerId: provider.id,
        duration: 30,
        price: 500,
        isOnlineAvailable: true,
        isInPerson: false,
        availabilities: {
          connect: { id: availability.id },
        },
      },
    });

    // Store first service config for slots
    if (i === 1) {
      firstServiceConfig = serviceConfig;
    }
  }
  console.log(`   ✅ Created ${availabilities.length} availability slots`);

  // 6. Generate calculated slots for first availability
  console.log('\n6️⃣  Generating bookable slots...');
  const firstAvailability = availabilities[0];
  if (!firstAvailability || !firstServiceConfig) {
    throw new Error('No availability or service config created');
  }

  const slots = [];
  let slotStart = firstAvailability.startTime;
  const slotEnd = firstAvailability.endTime;

  while (slotStart < slotEnd) {
    const slotEndTime = addHours(slotStart, 0.5); // 30-minute slots

    if (slotEndTime <= slotEnd) {
      const slot = await prisma.calculatedAvailabilitySlot.create({
        data: {
          availability: { connect: { id: firstAvailability.id } },
          service: { connect: { id: service.id } },
          serviceConfig: { connect: { id: firstServiceConfig.id } },
          startTime: slotStart,
          endTime: slotEndTime,
          status: 'AVAILABLE',
          lastCalculated: new Date(),
        },
      });
      slots.push(slot);
    }

    slotStart = slotEndTime;
  }
  console.log(`   ✅ Generated ${slots.length} bookable time slots`);

  // 7. Output test data
  console.log('\n📋 Test Data Summary');
  console.log('==========================================');
  console.log(`Provider User ID: ${providerUser.id}`);
  console.log(`Provider ID: ${provider.id}`);
  console.log(`Service ID: ${service.id}`);
  console.log(`First Slot ID: ${slots[0]?.id || 'N/A'}`);
  console.log(`Total Slots: ${slots.length}`);
  console.log(`Availability Date: ${firstAvailability.startTime.toISOString().split('T')[0]}`);
  console.log('==========================================\n');

  // 8. Save to JSON for test config
  const testConfig = {
    providerId: provider.id,
    providerUserId: providerUser.id,
    serviceId: service.id,
    firstSlotId: slots[0]?.id,
    totalSlots: slots.length,
    availabilityDate: firstAvailability.startTime.toISOString().split('T')[0],
    availabilityStartTime: firstAvailability.startTime.toISOString(),
    generatedAt: new Date().toISOString(),
  };

  const fs = await import('fs');
  fs.writeFileSync(
    './e2e/test-config.json',
    JSON.stringify(testConfig, null, 2)
  );
  console.log('✅ Test configuration saved to: e2e/test-config.json\n');

  console.log('🎉 Test data setup complete!\n');
  console.log('📝 Next steps:');
  console.log('   1. Run E2E tests: npm run test:booking');
  console.log('   2. Run load tests: npm run test:load');
  console.log('');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error setting up test data:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
