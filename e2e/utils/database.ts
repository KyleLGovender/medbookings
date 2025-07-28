import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables (prioritize dev environment)
dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback to .env

const prisma = new PrismaClient({
  datasources: {
    db: {
      // Use dev database - same as your running app
      url: process.env.DATABASE_URL,
    },
  },
});

/**
 * Clean test data from database
 */
export async function cleanTestData() {
  console.log('🧹 Cleaning test data from dev database...');

  // Delete calendar-related test data in correct order to respect foreign key constraints

  // 1. Delete test bookings
  await prisma.booking.deleteMany({
    where: {
      OR: [
        { client: { email: { contains: 'e2e-calendar' } } },
        { notes: { contains: '[E2E_CALENDAR]' } },
      ],
    },
  });

  // 2. Delete test availability slots
  await prisma.calculatedAvailabilitySlot.deleteMany({
    where: {
      serviceConfig: {
        provider: {
          user: {
            email: { contains: 'e2e-calendar' },
          },
        },
      },
    },
  });

  // 3. Delete test availability
  await prisma.availability.deleteMany({
    where: {
      provider: {
        user: {
          email: { contains: 'e2e-calendar' },
        },
      },
    },
  });

  // 4. Delete test service availability configs
  await prisma.serviceAvailabilityConfig.deleteMany({
    where: {
      provider: {
        user: {
          email: { contains: 'e2e-calendar' },
        },
      },
    },
  });

  // 5. Delete test providers
  await prisma.provider.deleteMany({
    where: {
      user: {
        email: { contains: 'e2e-calendar' },
      },
    },
  });

  // 6. Delete test accounts
  await prisma.account.deleteMany({
    where: {
      user: {
        email: { contains: 'e2e-calendar' },
      },
    },
  });

  // 7. Delete test users (should be last)
  await prisma.user.deleteMany({
    where: {
      email: { contains: 'e2e-calendar' },
    },
  });

  console.log('✅ Test data cleanup completed');
}

/**
 * Create minimal test data needed for testing
 */
export async function setupTestData() {
  console.log('🔧 Setting up test data...');

  // 1. Create calendar test user (provider)
  const calendarProvider = await prisma.user.upsert({
    where: { email: 'e2e-calendar-provider@example.com' },
    update: {},
    create: {
      email: 'e2e-calendar-provider@example.com',
      name: 'E2E_CALENDAR_Provider',
      role: 'USER',
      emailVerified: new Date(),
    },
  });

  // 2. Create calendar test client
  const calendarClient = await prisma.user.upsert({
    where: { email: 'e2e-calendar-client@example.com' },
    update: {},
    create: {
      email: 'e2e-calendar-client@example.com',
      name: 'E2E_CALENDAR_Client',
      role: 'USER',
      emailVerified: new Date(),
    },
  });

  // 3. Get existing provider type (don't create duplicates)
  const providerType = await prisma.providerType.findFirst({
    where: { name: 'General Practitioner' },
  });

  if (!providerType) {
    throw new Error(
      'Provider type "General Practitioner" not found. Please seed basic data first.'
    );
  }

  // 4. Create provider profile (approved and ready for calendar)
  const provider = await prisma.provider.upsert({
    where: { userId: calendarProvider.id },
    update: {},
    create: {
      userId: calendarProvider.id,
      name: 'E2E_CALENDAR_Dr_Smith',
      bio: '[E2E_CALENDAR] Provider for calendar testing',
      image: 'https://via.placeholder.com/150',
      languages: ['English'],
      status: 'APPROVED', // Skip approval process for calendar testing
      approvedAt: new Date(),
    },
  });

  // 5. Create provider type assignment
  await prisma.providerTypeAssignment.upsert({
    where: {
      providerId_providerTypeId: {
        providerId: provider.id,
        providerTypeId: providerType.id,
      },
    },
    update: {},
    create: {
      providerId: provider.id,
      providerTypeId: providerType.id,
    },
  });

  // 6. Get existing service
  const service = await prisma.service.findFirst({
    where: { name: 'General Consultation' },
  });

  if (!service) {
    throw new Error('Service "General Consultation" not found. Please seed basic data first.');
  }

  // 7. Create service availability config for the provider
  // First check if it exists
  const existingConfig = await prisma.serviceAvailabilityConfig.findFirst({
    where: {
      providerId: provider.id,
      serviceId: service.id,
    },
  });

  if (!existingConfig) {
    await prisma.serviceAvailabilityConfig.create({
      data: {
        providerId: provider.id,
        serviceId: service.id,
        duration: 45, // Duration in minutes for calendar testing
        price: 200.0, // Price for calendar testing
        isOnlineAvailable: true,
        isInPerson: false,
      },
    });
  }

  console.log('✅ Test data setup completed');

  return {
    provider: calendarProvider,
    client: calendarClient,
    providerProfile: provider,
    service,
  };
}

/**
 * Get count of test data records for verification
 */
export async function getTestDataCounts() {
  const calendarUsers = await prisma.user.count({
    where: {
      email: { contains: 'e2e-calendar' },
    },
  });

  const calendarProviders = await prisma.provider.count({
    where: {
      user: {
        email: { contains: 'e2e-calendar' },
      },
    },
  });

  const calendarAvailability = await prisma.availability.count({
    where: {
      provider: {
        user: {
          email: { contains: 'e2e-calendar' },
        },
      },
    },
  });

  const calendarBookings = await prisma.booking.count({
    where: {
      OR: [
        { client: { email: { contains: 'e2e-calendar' } } },
        { notes: { contains: '[E2E_CALENDAR]' } },
      ],
    },
  });

  return {
    users: calendarUsers,
    providers: calendarProviders,
    availability: calendarAvailability,
    bookings: calendarBookings,
  };
}

/**
 * Setup complete test environment
 */
export async function setupTestEnvironment() {
  // Clean any existing test data
  await cleanTestData();
  // Set up fresh test data
  const testData = await setupTestData();

  return testData;
}

export { prisma };
