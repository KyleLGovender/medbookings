import { PrismaClient } from '@prisma/client';

import { nowUTC } from '../../src/lib/timezone';
import {
  TEST_LOCATIONS,
  TEST_PROVIDERS,
  TEST_SERVICES,
  TEST_USERS,
} from '../fixtures/test-data-new';

const prisma = new PrismaClient();

/**
 * Generate mock test data for different scenarios
 */

export async function createTestUser(userData = TEST_USERS.user) {
  return await prisma.user.create({
    data: {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      emailVerified: nowUTC(),
    },
  });
}

export async function createTestProvider(providerData = TEST_PROVIDERS.approved, userId?: string) {
  // Create user first if not provided
  let user;
  if (userId) {
    user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
  } else {
    user = await createTestUser({
      id: `${providerData.id}-user`,
      email: providerData.email,
      name: providerData.name,
      role: 'USER',
    });
  }

  // Create provider profile
  const provider = await prisma.provider.create({
    data: {
      userId: user.id,
      name: providerData.name,
      bio: providerData.bio,
      image: 'https://placeholder.com/150x150', // Default placeholder image
      languages: providerData.languages as any,
      website: providerData.website,
      showPrice: providerData.showPrice,
      status: providerData.status as any,
      approvedAt: providerData.status === 'APPROVED' ? nowUTC() : null,
    },
  });

  return { user, provider };
}

export async function createTestService(serviceData = TEST_SERVICES.consultation) {
  // Create a test provider type first if it doesn't exist
  let providerType = await prisma.providerType.findFirst({
    where: { name: 'General Practice' },
  });

  if (!providerType) {
    providerType = await prisma.providerType.create({
      data: {
        name: 'General Practice',
        description: 'General medical practitioners',
      },
    });
  }

  return await prisma.service.create({
    data: {
      name: serviceData.name,
      description: serviceData.description,
      defaultDuration: serviceData.duration,
      defaultPrice: serviceData.defaultPrice,
      providerTypeId: providerType.id,
    },
  });
}

export async function createTestLocation(locationData = TEST_LOCATIONS.capeTown) {
  // Create a test organization first if it doesn't exist
  let organization = await prisma.organization.findFirst({
    where: { name: 'Test Medical Organization' },
  });

  if (!organization) {
    organization = await prisma.organization.create({
      data: {
        name: 'Test Medical Organization',
        description: 'Test organization for E2E tests',
        status: 'ACTIVE',
        email: 'test@organization.com',
        phone: '+27123456789',
      },
    });
  }

  return await prisma.location.create({
    data: {
      name: locationData.name,
      organizationId: organization.id,
      googlePlaceId: `test-place-id-${Math.floor(Math.random() * 1000000)}`,
      formattedAddress: locationData.address,
      coordinates: { lat: -33.9249, lng: 18.4241 }, // Cape Town coordinates
      searchTerms: [locationData.city.toLowerCase(), locationData.province.toLowerCase()],
    },
  });
}

export async function createTestAvailability(
  providerId: string,
  serviceId: string,
  availabilityData: {
    date: string;
    startTime: string;
    endTime: string;
    isOnline?: boolean;
    locationId?: string;
  }
) {
  // Create availability
  const availability = await prisma.availability.create({
    data: {
      providerId,
      startTime: `${availabilityData.date}T${availabilityData.startTime}:00.000Z`,
      endTime: `${availabilityData.date}T${availabilityData.endTime}:00.000Z`,
      status: 'ACCEPTED',
      isOnlineAvailable: availabilityData.isOnline ?? true,
      locationId: availabilityData.locationId,
      isProviderCreated: true,
      createdById: providerId,
    },
  });

  // Create service config
  const serviceConfig = await prisma.serviceAvailabilityConfig.create({
    data: {
      providerId,
      serviceId,
      duration: 30,
      price: 500,
      isOnlineAvailable: availabilityData.isOnline ?? true,
      isInPerson: !(availabilityData.isOnline ?? true),
    },
  });

  // Service config already links service to availability

  return { availability, serviceConfig };
}

export async function createTestBooking(
  slotId: string,
  bookingData: {
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    notes?: string;
  }
) {
  return await prisma.booking.create({
    data: {
      slotId,
      guestName: bookingData.guestName,
      guestEmail: bookingData.guestEmail,
      guestPhone: bookingData.guestPhone,
      notes: bookingData.notes || '',
      status: 'PENDING',
      isGuestBooking: true,
      isGuestSelfBooking: true,
      price: 500,
      isOnline: true,
      isInPerson: false,
    },
  });
}

export async function createCalculatedSlot(
  availabilityId: string,
  serviceConfigId: string,
  serviceId: string,
  slotData: {
    startTime: string;
    endTime: string;
    date: string;
  }
) {
  return await prisma.calculatedAvailabilitySlot.create({
    data: {
      availabilityId,
      serviceId,
      serviceConfigId,
      startTime: `${slotData.date}T${slotData.startTime}:00.000Z`,
      endTime: `${slotData.date}T${slotData.endTime}:00.000Z`,
      status: 'AVAILABLE',
      lastCalculated: nowUTC(),
    },
  });
}

/**
 * Clean up test data by specific patterns
 */
export async function cleanupTestDataByEmail(emailPattern: string) {
  console.log(`🧹 Cleaning test data for pattern: ${emailPattern}`);

  // Delete in correct order to respect foreign key constraints
  await prisma.booking.deleteMany({
    where: {
      OR: [
        { guestEmail: { contains: emailPattern } },
        { client: { email: { contains: emailPattern } } },
      ],
    },
  });

  await prisma.calculatedAvailabilitySlot.deleteMany({
    where: {
      availability: {
        provider: {
          user: { email: { contains: emailPattern } },
        },
      },
    },
  });

  // availableService table doesn't exist - serviceConfig handles service-availability linking

  await prisma.availability.deleteMany({
    where: {
      provider: {
        user: { email: { contains: emailPattern } },
      },
    },
  });

  await prisma.serviceAvailabilityConfig.deleteMany({
    where: {
      provider: {
        user: { email: { contains: emailPattern } },
      },
    },
  });

  await prisma.provider.deleteMany({
    where: {
      user: { email: { contains: emailPattern } },
    },
  });

  await prisma.account.deleteMany({
    where: {
      user: { email: { contains: emailPattern } },
    },
  });

  await prisma.user.deleteMany({
    where: {
      email: { contains: emailPattern },
    },
  });

  console.log(`✅ Cleanup completed for pattern: ${emailPattern}`);
}

/**
 * Setup complete test scenario with provider, services, and availability
 */
export async function setupCompleteTestScenario() {
  console.log('🔧 Setting up complete test scenario...');

  // Create test provider
  const { user, provider } = await createTestProvider();

  // Create test service
  const service = await createTestService();

  // Create test location
  const location = await createTestLocation();

  // Create availability with slots
  const { availability, serviceConfig } = await createTestAvailability(provider.id, service.id, {
    date: '2024-12-31',
    startTime: '09:00',
    endTime: '17:00',
    isOnline: true,
  });

  // Create some calculated slots
  const slots = [];
  for (let hour = 9; hour < 17; hour++) {
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${hour.toString().padStart(2, '0')}:30`;

    const slot = await createCalculatedSlot(availability.id, serviceConfig.id, service.id, {
      date: '2024-12-31',
      startTime,
      endTime,
    });
    slots.push(slot);
  }

  console.log('✅ Complete test scenario setup completed');

  return {
    user,
    provider,
    service,
    location,
    availability,
    serviceConfig,
    slots,
  };
}

export { prisma };
