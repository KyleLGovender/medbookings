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
 * Clean ONLY test data from database
 * Identifies test data by E2E_TEST prefixes and e2e-test email domains
 */
export async function cleanTestData() {
  console.log('🧹 Cleaning test data from dev database...');

  // Delete test data in correct order to respect foreign key constraints

  // 1. Delete test bookings
  await prisma.booking.deleteMany({
    where: {
      OR: [
        { client: { email: { contains: 'e2e-test' } } },
        // Add more booking test data identifiers as needed
      ],
    },
  });

  // 2. Delete test availability slots
  await prisma.calculatedAvailabilitySlot.deleteMany({
    where: {
      serviceConfig: {
        provider: {
          user: {
            OR: [{ email: { contains: 'e2e-test' } }, { name: { contains: 'E2E_TEST' } }],
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
          OR: [{ email: { contains: 'e2e-test' } }, { name: { contains: 'E2E_TEST' } }],
        },
      },
    },
  });

  // 4. Delete test service availability configs
  await prisma.serviceAvailabilityConfig.deleteMany({
    where: {
      provider: {
        user: {
          OR: [{ email: { contains: 'e2e-test' } }, { name: { contains: 'E2E_TEST' } }],
        },
      },
    },
  });

  // 5. Delete test requirement submissions
  await prisma.requirementSubmission.deleteMany({
    where: {
      provider: {
        user: {
          OR: [{ email: { contains: 'e2e-test' } }, { name: { contains: 'E2E_TEST' } }],
        },
      },
    },
  });

  // 6. Delete test organization connections
  await prisma.organizationProviderConnection.deleteMany({
    where: {
      OR: [
        { organization: { name: { contains: 'E2E_TEST' } } },
        {
          provider: {
            user: {
              OR: [{ email: { contains: 'e2e-test' } }, { name: { contains: 'E2E_TEST' } }],
            },
          },
        },
      ],
    },
  });

  // 7. Delete test organization memberships
  await prisma.organizationMembership.deleteMany({
    where: {
      OR: [
        { organization: { name: { contains: 'E2E_TEST' } } },
        {
          user: {
            OR: [{ email: { contains: 'e2e-test' } }, { name: { contains: 'E2E_TEST' } }],
          },
        },
      ],
    },
  });

  // 8. Delete test invitations
  await prisma.organizationInvitation.deleteMany({
    where: {
      OR: [
        { email: { contains: 'e2e-test' } },
        { organization: { name: { contains: 'E2E_TEST' } } },
      ],
    },
  });

  await prisma.providerInvitation.deleteMany({
    where: {
      email: { contains: 'e2e-test' },
    },
  });

  // 9. Delete test locations
  await prisma.location.deleteMany({
    where: {
      OR: [
        { formattedAddress: { contains: 'E2E_TEST' } },
        { organization: { name: { contains: 'E2E_TEST' } } },
      ],
    },
  });

  // 10. Delete test providers
  await prisma.provider.deleteMany({
    where: {
      user: {
        OR: [{ email: { contains: 'e2e-test' } }, { name: { contains: 'E2E_TEST' } }],
      },
    },
  });

  // 11. Delete test organizations
  await prisma.organization.deleteMany({
    where: {
      OR: [{ name: { contains: 'E2E_TEST' } }, { email: { contains: 'e2e-test' } }],
    },
  });

  // 12. Delete test accounts
  await prisma.account.deleteMany({
    where: {
      user: {
        OR: [{ email: { contains: 'e2e-test' } }, { name: { contains: 'E2E_TEST' } }],
      },
    },
  });

  // 13. Delete test users (should be last)
  await prisma.user.deleteMany({
    where: {
      OR: [{ email: { contains: 'e2e-test' } }, { name: { contains: 'E2E_TEST' } }],
    },
  });

  console.log('✅ Test data cleanup completed');
}

/**
 * Clean all data from database (use with extreme caution!)
 * This is the nuclear option - only use for development reset
 */
export async function cleanAllDatabase() {
  console.log('💥 WARNING: Cleaning ALL data from database!');

  // Delete in correct order to respect foreign key constraints
  await prisma.booking.deleteMany({});
  await prisma.calculatedAvailabilitySlot.deleteMany({});
  await prisma.availability.deleteMany({});
  await prisma.serviceAvailabilityConfig.deleteMany({});
  await prisma.requirementSubmission.deleteMany({});
  await prisma.organizationProviderConnection.deleteMany({});
  await prisma.organizationMembership.deleteMany({});
  await prisma.organizationInvitation.deleteMany({});
  await prisma.providerInvitation.deleteMany({});
  await prisma.providerTypeAssignment.deleteMany({});
  await prisma.location.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.provider.deleteMany({});

  // RequirementType references ProviderType, so delete it first
  await prisma.requirementType.deleteMany({});
  // Service also references ProviderType
  await prisma.service.deleteMany({});
  // Now we can delete ProviderType
  await prisma.providerType.deleteMany({});

  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});
}

/**
 * Seed basic test data
 */
export async function seedTestData() {
  // First create provider types (use upsert to avoid duplicates)
  const generalPractitioner = await prisma.providerType.upsert({
    where: { name: 'General Practitioner' },
    update: {},
    create: {
      name: 'General Practitioner',
      description: 'General medical practitioner',
    },
  });

  const physiotherapist = await prisma.providerType.upsert({
    where: { name: 'Physiotherapist' },
    update: {},
    create: {
      name: 'Physiotherapist',
      description: 'Physical therapy specialist',
    },
  });

  // Then create requirement types with provider type references (use upsert to avoid duplicates)
  const licenseRequirement = await prisma.requirementType.upsert({
    where: {
      name_providerTypeId: {
        name: 'Medical License',
        providerTypeId: generalPractitioner.id,
      },
    },
    update: {},
    create: {
      name: 'Medical License',
      description: 'Valid medical license',
      isRequired: true,
      validationType: 'DOCUMENT',
      providerTypeId: generalPractitioner.id,
    },
  });

  const insuranceRequirement = await prisma.requirementType.upsert({
    where: {
      name_providerTypeId: {
        name: 'Professional Insurance',
        providerTypeId: generalPractitioner.id,
      },
    },
    update: {},
    create: {
      name: 'Professional Insurance',
      description: 'Professional liability insurance',
      isRequired: true,
      validationType: 'DOCUMENT',
      providerTypeId: generalPractitioner.id,
    },
  });

  // Create services (use upsert to avoid duplicates)
  await prisma.service.upsert({
    where: { name: 'General Consultation' },
    update: {},
    create: {
      name: 'General Consultation',
      description: 'General medical consultation',
      defaultPrice: 150.0,
      defaultDuration: 30,
      providerTypeId: generalPractitioner.id,
    },
  });

  await prisma.service.upsert({
    where: { name: 'Physical Therapy Session' },
    update: {},
    create: {
      name: 'Physical Therapy Session',
      description: 'Physical therapy treatment session',
      defaultPrice: 120.0,
      defaultDuration: 45,
      providerTypeId: physiotherapist.id,
    },
  });

  return {
    requirementTypes: {
      license: licenseRequirement,
      insurance: insuranceRequirement,
    },
    providerTypes: {
      generalPractitioner,
      physiotherapist,
    },
  };
}

/**
 * Create test users with different roles
 */
export async function createTestUsers() {
  const adminUser = await prisma.user.upsert({
    where: { email: 'e2e-test-admin@example.com' },
    update: {},
    create: {
      email: 'e2e-test-admin@example.com',
      name: 'E2E_TEST_Admin',
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  });

  const regularUser = await prisma.user.upsert({
    where: { email: 'e2e-test-user@example.com' },
    update: {},
    create: {
      email: 'e2e-test-user@example.com',
      name: 'E2E_TEST_User',
      role: 'USER',
      emailVerified: new Date(),
    },
  });

  const providerUser = await prisma.user.upsert({
    where: { email: 'e2e-test-provider@example.com' },
    update: {},
    create: {
      email: 'e2e-test-provider@example.com',
      name: 'E2E_TEST_Provider',
      role: 'USER',
      emailVerified: new Date(),
    },
  });

  const orgOwnerUser = await prisma.user.upsert({
    where: { email: 'e2e-test-orgowner@example.com' },
    update: {},
    create: {
      email: 'e2e-test-orgowner@example.com',
      name: 'E2E_TEST_Org_Owner',
      role: 'USER',
      emailVerified: new Date(),
    },
  });

  return {
    admin: adminUser,
    regular: regularUser,
    provider: providerUser,
    orgOwner: orgOwnerUser,
  };
}

/**
 * Create test service provider
 */
export async function createTestProvider(
  userId: string,
  status: 'PENDING_APPROVAL' | 'APPROVED' = 'PENDING_APPROVAL'
) {
  const providerType = await prisma.providerType.findFirst({
    where: { name: 'General Practitioner' },
  });

  if (!providerType) {
    throw new Error('Provider type not found. Run seedTestData first.');
  }

  const provider = await prisma.provider.create({
    data: {
      userId,
      name: 'E2E_TEST_Dr_John_Doe',
      bio: '[E2E_TEST] Experienced general practitioner for testing',
      image: 'https://via.placeholder.com/150',
      languages: ['English'],
      status,
      approvedAt: status === 'APPROVED' ? new Date() : null,
    },
  });

  // Create provider type assignment
  await prisma.providerTypeAssignment.create({
    data: {
      providerId: provider.id,
      providerTypeId: providerType.id,
    },
  });

  return provider;
}

/**
 * Create test organization
 */
export async function createTestOrganization(
  ownerId: string,
  status: 'PENDING_APPROVAL' | 'APPROVED' = 'PENDING_APPROVAL'
) {
  const organization = await prisma.organization.create({
    data: {
      name: 'E2E_TEST_Medical_Clinic',
      description: '[E2E_TEST] A test medical clinic for e2e testing',
      email: 'e2e-test-clinic@example.com',
      website: 'https://e2e-test-clinic.example.com',
      status,
      approvedAt: status === 'APPROVED' ? new Date() : null,
    },
  });

  // Create membership for owner
  await prisma.organizationMembership.create({
    data: {
      userId: ownerId,
      organizationId: organization.id,
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });

  return organization;
}

/**
 * Setup complete test environment
 */
export async function setupTestEnvironment() {
  // Only clean test data, not all database data
  await cleanTestData();
  const testData = await seedTestData();
  const testUsers = await createTestUsers();

  return {
    ...testData,
    users: testUsers,
  };
}

/**
 * Get count of test data records for verification
 */
export async function getTestDataCounts() {
  const testUsers = await prisma.user.count({
    where: {
      OR: [{ email: { contains: 'e2e-test' } }, { name: { contains: 'E2E_TEST' } }],
    },
  });

  const testProviders = await prisma.provider.count({
    where: {
      user: {
        OR: [{ email: { contains: 'e2e-test' } }, { name: { contains: 'E2E_TEST' } }],
      },
    },
  });

  const testOrganizations = await prisma.organization.count({
    where: {
      OR: [{ name: { contains: 'E2E_TEST' } }, { email: { contains: 'e2e-test' } }],
    },
  });

  return {
    users: testUsers,
    providers: testProviders,
    organizations: testOrganizations,
  };
}

/**
 * Cleanup specific test provider by email
 */
export async function cleanupTestProvider(email: string) {
  return await prisma.provider.deleteMany({
    where: {
      user: { email },
    },
  });
}

/**
 * Cleanup specific test organization by name
 */
export async function cleanupTestOrganization(name: string) {
  return await prisma.organization.deleteMany({
    where: { name },
  });
}

export { prisma };
