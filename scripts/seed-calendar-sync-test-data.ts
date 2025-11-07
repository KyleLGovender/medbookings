/**
 * Calendar Sync Test Data Seed Script
 *
 * Creates comprehensive test data for calendar sync feature including:
 * - Test users (providers, organization owners/staff)
 * - Providers with and without calendar integrations
 * - Organization with multiple locations
 * - Calendar integrations with realistic (but fake) OAuth tokens
 * - Calendar events (past and future)
 * - Calendar sync operations (various statuses)
 * - Availability slots (some blocked by calendar events)
 *
 * Usage:
 *   npx tsx scripts/seed-calendar-sync-test-data.ts
 *
 * Features:
 * - Idempotent (can run multiple times safely)
 * - Progress logging
 * - Error handling
 * - Execution time: ~5-10 seconds
 */
import { PrismaClient } from '@prisma/client';
import { addDays, addHours, subDays } from 'date-fns';

const prisma = new PrismaClient();

// ============================================================================
// Helper Functions
// ============================================================================

function log(message: string) {
  console.log(`[SEED] ${message}`);
}

function generateTestToken(prefix: string): string {
  const timestamp = Date.now();
  return `test_${prefix}_${timestamp}_${Math.random().toString(36).substring(7)}`;
}

function randomFromArray<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]!;
}

// ============================================================================
// Main Seed Function
// ============================================================================

async function main() {
  log('Starting calendar sync test data seed...');

  // Clear existing test data
  log('Cleaning up existing test data...');
  await cleanupTestData();

  // Create test users
  log('Creating test users...');
  const users = await createTestUsers();

  // Create test providers
  log('Creating test providers...');
  const providers = await createTestProviders(users);

  // Create test organization with locations
  log('Creating test organization...');
  const { organization, locations } = await createTestOrganization(users);

  // Create calendar integrations
  log('Creating calendar integrations...');
  const integrations = await createCalendarIntegrations(providers, organization, locations);

  // Create calendar events
  log('Creating calendar events...');
  await createCalendarEvents(integrations);

  // Create calendar sync operations
  log('Creating calendar sync operations...');
  await createCalendarSyncOperations(integrations);

  // Create availability slots (for testing slot blocking)
  // Note: Commented out due to complexity - requires services and service configs
  // Uncomment if needed for specific slot blocking tests
  // log('Creating availability slots...');
  // await createAvailabilitySlots(providers, integrations);

  log('✅ Calendar sync test data seed completed successfully!');
  log('');
  log('📋 Summary:');
  log(`  - Users: ${Object.keys(users).length}`);
  log(`  - Providers: ${providers.length}`);
  log(`  - Organization: 1 (with ${locations.length} locations)`);
  log(
    `  - Calendar Integrations: ${integrations.provider.length + integrations.organization.length}`
  );
  log('  - Total seed time: ~5-10 seconds');
  log('');
  log('🧪 Test Accounts:');
  log('  Provider A (Connected): test-provider-connected@medbookings.test');
  log('  Provider B (No Calendar): test-provider-no-calendar@medbookings.test');
  log('  Organization Owner: test-org-owner@medbookings.test');
  log('  Organization Staff: test-org-staff@medbookings.test');
}

// ============================================================================
// Cleanup Functions
// ============================================================================

async function cleanupTestData() {
  // Delete in correct order (respecting foreign key constraints)
  await prisma.calculatedAvailabilitySlot.deleteMany({
    where: {
      availability: {
        provider: {
          user: {
            email: {
              contains: '@medbookings.test',
            },
          },
        },
      },
    },
  });

  await prisma.availability.deleteMany({
    where: {
      provider: {
        user: {
          email: {
            contains: '@medbookings.test',
          },
        },
      },
    },
  });

  await prisma.calendarSyncOperation.deleteMany({
    where: {
      calendarIntegration: {
        provider: {
          user: {
            email: {
              contains: '@medbookings.test',
            },
          },
        },
      },
    },
  });

  await prisma.organizationCalendarSyncOperation.deleteMany({
    where: {
      organizationCalendarIntegration: {
        organization: {
          name: 'Acme Medical Group (Test)',
        },
      },
    },
  });

  await prisma.calendarEvent.deleteMany({
    where: {
      calendarIntegration: {
        provider: {
          user: {
            email: {
              contains: '@medbookings.test',
            },
          },
        },
      },
    },
  });

  await prisma.organizationCalendarEvent.deleteMany({
    where: {
      organizationCalendarIntegration: {
        organization: {
          name: 'Acme Medical Group (Test)',
        },
      },
    },
  });

  await prisma.calendarIntegration.deleteMany({
    where: {
      provider: {
        user: {
          email: {
            contains: '@medbookings.test',
          },
        },
      },
    },
  });

  await prisma.organizationCalendarIntegration.deleteMany({
    where: {
      organization: {
        name: 'Acme Medical Group (Test)',
      },
    },
  });

  await prisma.organizationMembership.deleteMany({
    where: {
      organization: {
        name: 'Acme Medical Group (Test)',
      },
    },
  });

  await prisma.location.deleteMany({
    where: {
      organization: {
        name: 'Acme Medical Group (Test)',
      },
    },
  });

  await prisma.organization.deleteMany({
    where: {
      name: 'Acme Medical Group (Test)',
    },
  });

  await prisma.provider.deleteMany({
    where: {
      user: {
        email: {
          contains: '@medbookings.test',
        },
      },
    },
  });

  await prisma.user.deleteMany({
    where: {
      email: {
        contains: '@medbookings.test',
      },
    },
  });

  log('  Cleanup completed');
}

// ============================================================================
// User Creation
// ============================================================================

async function createTestUsers() {
  const providerUserA = await prisma.user.create({
    data: {
      name: 'Dr. Sarah Chen',
      email: 'test-provider-connected@medbookings.test',
      phone: '+27821234567',
      image: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=0D8ABC&color=fff',
      role: 'USER', // Provider role determined by Provider record
    },
  });

  const providerUserB = await prisma.user.create({
    data: {
      name: 'Dr. Michael Roberts',
      email: 'test-provider-no-calendar@medbookings.test',
      phone: '+27821234568',
      image: 'https://ui-avatars.com/api/?name=Michael+Roberts&background=7C3AED&color=fff',
      role: 'USER', // Provider role determined by Provider record
    },
  });

  const orgOwner = await prisma.user.create({
    data: {
      name: 'Jane Anderson',
      email: 'test-org-owner@medbookings.test',
      phone: '+27821234569',
      image: 'https://ui-avatars.com/api/?name=Jane+Anderson&background=059669&color=fff',
      role: 'USER', // Organization role determined by OrganizationMembership
    },
  });

  const orgStaff = await prisma.user.create({
    data: {
      name: 'Tom Wilson',
      email: 'test-org-staff@medbookings.test',
      phone: '+27821234570',
      image: 'https://ui-avatars.com/api/?name=Tom+Wilson&background=DC2626&color=fff',
      role: 'USER', // Organization role determined by OrganizationMembership
    },
  });

  log(`  Created ${4} test users`);

  return {
    providerUserA,
    providerUserB,
    orgOwner,
    orgStaff,
  };
}

// ============================================================================
// Provider Creation
// ============================================================================

async function createTestProviders(users: Awaited<ReturnType<typeof createTestUsers>>) {
  const providerA = await prisma.provider.create({
    data: {
      name: 'Dr. Sarah Chen',
      userId: users.providerUserA.id,
      image: users.providerUserA.image!,
      email: users.providerUserA.email!,
      bio: 'Board-certified psychologist specializing in cognitive behavioral therapy and anxiety disorders. 10+ years experience.',
      languages: ['English'],
      website: 'https://sarahchen.example.com',
      showPrice: true,
      status: 'APPROVED',
      approvedAt: subDays(new Date(), 30),
      averageRating: 4.8,
      totalReviews: 45,
    },
  });

  const providerB = await prisma.provider.create({
    data: {
      name: 'Dr. Michael Roberts',
      userId: users.providerUserB.id,
      image: users.providerUserB.image!,
      email: users.providerUserB.email!,
      bio: 'Experienced general practitioner with focus on preventive medicine and wellness.',
      languages: ['English', 'Afrikaans'],
      website: 'https://michaelroberts.example.com',
      showPrice: true,
      status: 'APPROVED',
      approvedAt: subDays(new Date(), 45),
      averageRating: 4.6,
      totalReviews: 32,
    },
  });

  log(`  Created ${2} test providers`);

  return [providerA, providerB];
}

// ============================================================================
// Organization Creation
// ============================================================================

async function createTestOrganization(users: Awaited<ReturnType<typeof createTestUsers>>) {
  const organization = await prisma.organization.create({
    data: {
      name: 'Acme Medical Group (Test)',
      description:
        'Full-service medical group offering primary care, specialist consultations, and preventive health services.',
      email: 'contact@acme-medical-test.com',
      phone: '+27215551234',
      website: 'https://acme-medical-test.example.com',
      logo: 'https://ui-avatars.com/api/?name=Acme+Medical&background=3B82F6&color=fff',
      status: 'APPROVED',
      approvedAt: subDays(new Date(), 60),
    },
  });

  // Create locations
  const downtown = await prisma.location.create({
    data: {
      organizationId: organization.id,
      name: 'Downtown Clinic',
      googlePlaceId: `test_place_downtown_${Date.now()}`,
      formattedAddress: '123 Main Street, Cape Town City Centre, Cape Town, 8001',
      coordinates: { lat: -33.9249, lng: 18.4241 },
      phone: '+27215551235',
      email: 'downtown@acme-medical-test.com',
      searchTerms: ['downtown', 'city centre', 'main street'],
    },
  });

  const westside = await prisma.location.create({
    data: {
      organizationId: organization.id,
      name: 'Westside Clinic',
      googlePlaceId: `test_place_westside_${Date.now()}`,
      formattedAddress: '456 Beach Road, Sea Point, Cape Town, 8005',
      coordinates: { lat: -33.9258, lng: 18.3851 },
      phone: '+27215551236',
      email: 'westside@acme-medical-test.com',
      searchTerms: ['westside', 'sea point', 'beach road'],
    },
  });

  const eastside = await prisma.location.create({
    data: {
      organizationId: organization.id,
      name: 'Eastside Clinic',
      googlePlaceId: `test_place_eastside_${Date.now()}`,
      formattedAddress: '789 Garden Avenue, Claremont, Cape Town, 7708',
      coordinates: { lat: -33.9785, lng: 18.4646 },
      phone: '+27215551237',
      email: 'eastside@acme-medical-test.com',
      searchTerms: ['eastside', 'claremont', 'garden avenue'],
    },
  });

  // Create memberships
  await prisma.organizationMembership.create({
    data: {
      organizationId: organization.id,
      userId: users.orgOwner.id,
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });

  await prisma.organizationMembership.create({
    data: {
      organizationId: organization.id,
      userId: users.orgStaff.id,
      role: 'STAFF',
      status: 'ACTIVE',
    },
  });

  log('  Created 1 organization with 3 locations and 2 members');

  return {
    organization,
    locations: [downtown, westside, eastside],
  };
}

// ============================================================================
// Calendar Integration Creation
// ============================================================================

async function createCalendarIntegrations(
  providers: Awaited<ReturnType<typeof createTestProviders>>,
  organization: Awaited<ReturnType<typeof createTestOrganization>>['organization'],
  locations: Awaited<ReturnType<typeof createTestOrganization>>['locations']
) {
  const now = new Date();
  const [providerA] = providers;
  const [downtown, westside] = locations;

  // Provider A Integration (connected, working)
  const providerAIntegration = await prisma.calendarIntegration.create({
    data: {
      providerId: providerA!.id,
      accessToken: generateTestToken('access_provider_a'),
      refreshToken: generateTestToken('refresh_provider_a'),
      expiresAt: addHours(now, 1), // Valid for 1 hour
      calendarProvider: 'GOOGLE',
      calendarId: 'sarah.chen.calendar@gmail.com',
      googleEmail: 'sarah.chen.calendar@gmail.com',
      syncEnabled: true,
      lastSyncedAt: subDays(now, 0.5), // 12 hours ago
      lastFullSyncAt: subDays(now, 7),
      grantedScopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly',
      ],
      syncDirection: 'BIDIRECTIONAL',
      backgroundSyncEnabled: true,
      syncIntervalMinutes: 15,
      autoCreateMeetLinks: true,
      syncFailureCount: 0,
    },
  });

  // Organization Integration (org-wide, locationId = NULL)
  const orgIntegration = await prisma.organizationCalendarIntegration.create({
    data: {
      organizationId: organization.id,
      locationId: null, // Org-wide
      accessToken: generateTestToken('access_org'),
      refreshToken: generateTestToken('refresh_org'),
      expiresAt: addHours(now, 1),
      calendarProvider: 'GOOGLE',
      calendarId: 'acme.calendar@gmail.com',
      googleEmail: 'acme.calendar@gmail.com',
      syncEnabled: true,
      lastSyncedAt: subDays(now, 1),
      lastFullSyncAt: subDays(now, 14),
      grantedScopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
      ],
      syncDirection: 'BIDIRECTIONAL',
      backgroundSyncEnabled: true,
      syncIntervalMinutes: 30,
      autoCreateMeetLinks: true,
      syncFailureCount: 0,
    },
  });

  // Downtown Location Integration
  const downtownIntegration = await prisma.organizationCalendarIntegration.create({
    data: {
      organizationId: organization.id,
      locationId: downtown!.id,
      accessToken: generateTestToken('access_downtown'),
      refreshToken: generateTestToken('refresh_downtown'),
      expiresAt: addHours(now, 1),
      calendarProvider: 'GOOGLE',
      calendarId: 'downtown.calendar@gmail.com',
      googleEmail: 'downtown.calendar@gmail.com',
      syncEnabled: true,
      lastSyncedAt: subDays(now, 0.25), // 6 hours ago
      lastFullSyncAt: subDays(now, 7),
      grantedScopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
      ],
      syncDirection: 'BIDIRECTIONAL',
      backgroundSyncEnabled: true,
      syncIntervalMinutes: 15,
      autoCreateMeetLinks: true,
      syncFailureCount: 0,
    },
  });

  // Westside Location Integration
  const westsideIntegration = await prisma.organizationCalendarIntegration.create({
    data: {
      organizationId: organization.id,
      locationId: westside!.id,
      accessToken: generateTestToken('access_westside'),
      refreshToken: generateTestToken('refresh_westside'),
      expiresAt: addHours(now, 1),
      calendarProvider: 'GOOGLE',
      calendarId: 'westside.calendar@gmail.com',
      googleEmail: 'westside.calendar@gmail.com',
      syncEnabled: true,
      lastSyncedAt: subDays(now, 0.5),
      lastFullSyncAt: subDays(now, 10),
      grantedScopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
      ],
      syncDirection: 'BIDIRECTIONAL',
      backgroundSyncEnabled: true,
      syncIntervalMinutes: 15,
      autoCreateMeetLinks: false,
      syncFailureCount: 1, // Has 1 failure for testing
    },
  });

  log('  Created 4 calendar integrations');

  return {
    provider: [providerAIntegration],
    organization: [orgIntegration, downtownIntegration, westsideIntegration],
  };
}

// ============================================================================
// Calendar Events Creation
// ============================================================================

async function createCalendarEvents(
  integrations: Awaited<ReturnType<typeof createCalendarIntegrations>>
) {
  const eventTitles = [
    'Team Meeting',
    'Client Consultation',
    'Lunch Break',
    'Medical Conference',
    'Staff Training',
    'Patient Follow-up',
    'Admin Work',
    'Research Time',
    'Department Review',
    'Coffee Break',
  ];

  let totalEvents = 0;

  // Provider events
  for (const integration of integrations.provider) {
    for (let i = 0; i < 10; i++) {
      const isPast = i < 3; // 3 past events, 7 future events
      const daysOffset = isPast ? -(i + 1) : i - 2;
      const startTime = addDays(new Date(), daysOffset);
      startTime.setHours(9 + (i % 8), 0, 0, 0);

      const endTime = addHours(startTime, 1);

      await prisma.calendarEvent.create({
        data: {
          calendarIntegrationId: integration.id,
          externalEventId: `google_event_${integration.id}_${i}`,
          externalCalendarId: integration.calendarId!,
          etag: `etag_${i}`,
          title: eventTitles[i]!,
          startTime,
          endTime,
          isAllDay: false,
          blocksAvailability: i % 3 !== 0, // ~66% block availability
          syncStatus: 'SYNCED',
          lastSyncedAt: new Date(),
          version: 1,
        },
      });

      totalEvents++;
    }
  }

  // Organization events
  for (const integration of integrations.organization) {
    for (let i = 0; i < 10; i++) {
      const isPast = i < 3;
      const daysOffset = isPast ? -(i + 1) : i - 2;
      const startTime = addDays(new Date(), daysOffset);
      startTime.setHours(10 + (i % 7), 30, 0, 0);

      const endTime = addHours(startTime, 1.5);

      await prisma.organizationCalendarEvent.create({
        data: {
          organizationCalendarIntegrationId: integration.id,
          externalEventId: `google_org_event_${integration.id}_${i}`,
          externalCalendarId: integration.calendarId!,
          etag: `etag_org_${i}`,
          title: eventTitles[i]!,
          startTime,
          endTime,
          isAllDay: i === 9, // Last event is all-day
          blocksAvailability: i % 2 === 0, // 50% block availability
          syncStatus: 'SYNCED',
          lastSyncedAt: new Date(),
          version: 1,
        },
      });

      totalEvents++;
    }
  }

  log(`  Created ${totalEvents} calendar events`);
}

// ============================================================================
// Calendar Sync Operations Creation
// ============================================================================

async function createCalendarSyncOperations(
  integrations: Awaited<ReturnType<typeof createCalendarIntegrations>>
) {
  const statuses: Array<{
    status: 'SUCCESS' | 'FAILED' | 'CONFLICT_DETECTED' | 'IN_PROGRESS';
    weight: number;
  }> = [
    { status: 'SUCCESS', weight: 35 },
    { status: 'FAILED', weight: 10 },
    { status: 'CONFLICT_DETECTED', weight: 3 },
    { status: 'IN_PROGRESS', weight: 2 },
  ];

  const operationTypes: Array<{
    type: 'INCREMENTAL_SYNC' | 'FULL_SYNC' | 'MANUAL_SYNC';
    weight: number;
  }> = [
    { type: 'INCREMENTAL_SYNC', weight: 25 },
    { type: 'FULL_SYNC', weight: 15 },
    { type: 'MANUAL_SYNC', weight: 10 },
  ];

  function weightedRandom<T extends { weight: number }>(items: T[]): T {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of items) {
      random -= item.weight;
      if (random <= 0) return item;
    }

    return items[0]!;
  }

  let totalOperations = 0;

  // Provider operations
  for (const integration of integrations.provider) {
    for (let i = 0; i < 50; i++) {
      const daysAgo = Math.floor((i / 50) * 30); // Spread over last 30 days
      const startedAt = subDays(new Date(), daysAgo);
      const selectedStatus = weightedRandom(statuses);
      const selectedType = weightedRandom(operationTypes);

      const isCompleted = selectedStatus.status !== 'IN_PROGRESS';
      const completedAt = isCompleted ? addHours(startedAt, 0.1) : null;

      await prisma.calendarSyncOperation.create({
        data: {
          calendarIntegrationId: integration.id,
          operationType: selectedType.type,
          sourceSystem: 'GOOGLE_CALENDAR',
          entityType: 'CALENDAR_EVENT',
          status: selectedStatus.status,
          startedAt,
          completedAt,
          syncWindowStart: subDays(startedAt, 7),
          syncWindowEnd: addDays(startedAt, 83),
          eventsProcessed:
            selectedStatus.status === 'SUCCESS' ? 5 + Math.floor(Math.random() * 10) : 0,
          eventsSucceeded:
            selectedStatus.status === 'SUCCESS' ? 5 + Math.floor(Math.random() * 10) : 0,
          eventsFailed: selectedStatus.status === 'FAILED' ? 1 + Math.floor(Math.random() * 3) : 0,
          errorMessage:
            selectedStatus.status === 'FAILED' ? 'Network timeout during sync' : undefined,
        },
      });

      totalOperations++;
    }
  }

  // Organization operations
  for (const integration of integrations.organization) {
    for (let i = 0; i < 50; i++) {
      const daysAgo = Math.floor((i / 50) * 30);
      const startedAt = subDays(new Date(), daysAgo);
      const selectedStatus = weightedRandom(statuses);
      const selectedType = weightedRandom(operationTypes);

      const isCompleted = selectedStatus.status !== 'IN_PROGRESS';
      const completedAt = isCompleted ? addHours(startedAt, 0.15) : null;

      await prisma.organizationCalendarSyncOperation.create({
        data: {
          organizationCalendarIntegrationId: integration.id,
          operationType: selectedType.type,
          sourceSystem: 'GOOGLE_CALENDAR',
          entityType: 'CALENDAR_EVENT',
          status: selectedStatus.status,
          startedAt,
          completedAt,
          syncWindowStart: subDays(startedAt, 7),
          syncWindowEnd: addDays(startedAt, 83),
          eventsProcessed:
            selectedStatus.status === 'SUCCESS' ? 3 + Math.floor(Math.random() * 8) : 0,
          eventsSucceeded:
            selectedStatus.status === 'SUCCESS' ? 3 + Math.floor(Math.random() * 8) : 0,
          eventsFailed: selectedStatus.status === 'FAILED' ? 1 + Math.floor(Math.random() * 2) : 0,
          errorMessage:
            selectedStatus.status === 'FAILED' ? 'Token expired, refresh required' : undefined,
        },
      });

      totalOperations++;
    }
  }

  log(`  Created ${totalOperations} calendar sync operations`);
}

// ============================================================================
// Availability Slots Creation (for testing slot blocking)
// NOTE: Commented out due to model complexity - requires services, service configs, etc.
// Uncomment and fix if needed for specific slot blocking tests
// ============================================================================

async function createAvailabilitySlots(
  _providers: Awaited<ReturnType<typeof createTestProviders>>,
  _integrations: Awaited<ReturnType<typeof createCalendarIntegrations>>
) {
  // Commented out - requires fixing Availability model structure and adding Service dependencies
  log('  Skipping availability slots (requires service dependencies)');
  return;

  /* Original implementation - needs updating to match current Prisma schema
  const [providerA] = providers;
  const [providerAIntegration] = integrations.provider;

  if (!providerA || !providerAIntegration) {
    log('  Skipping availability slots (no provider/integration)');
    return;
  }

  // Create availability record for next 7 days
  const availability = await prisma.availability.create({
    data: {
      // TODO: Update to match current Availability model structure
      // Current model has startTime/endTime, not startDate/endDate
      // Requires: createdById, status, etc.
    },
  });

  // TODO: Create CalculatedAvailabilitySlots
  // Requires: serviceId, serviceConfigId, lastCalculated
  */
}

// ============================================================================
// Execute
// ============================================================================

main()
  .catch((e) => {
    console.error('[SEED ERROR]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
