import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test.local' });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://medbookings_test:test_password@localhost:5433/medbookings_test',
    },
  },
});

/**
 * Clean all test data from database
 * Use carefully - this deletes all data!
 */
export async function cleanDatabase() {
  // Delete in correct order to respect foreign key constraints
  // Delete leaf tables first (those that reference others)
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
  // Session table doesn't exist in this schema
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

  // Then create requirement types with provider type references
  const licenseRequirement = await prisma.requirementType.create({
    data: {
      name: 'Medical License',
      description: 'Valid medical license',
      isRequired: true,
      validationType: 'DOCUMENT',
      providerTypeId: generalPractitioner.id,
    },
  });

  const insuranceRequirement = await prisma.requirementType.create({
    data: {
      name: 'Professional Insurance',
      description: 'Professional liability insurance',
      isRequired: true,
      validationType: 'DOCUMENT',
      providerTypeId: generalPractitioner.id,
    },
  });

  // Create services
  await prisma.service.createMany({
    data: [
      {
        name: 'General Consultation',
        description: 'General medical consultation',
        defaultPrice: 150.0,
        defaultDuration: 30,
        providerTypeId: generalPractitioner.id,
      },
      {
        name: 'Physical Therapy Session',
        description: 'Physical therapy treatment session',
        defaultPrice: 120.0,
        defaultDuration: 45,
        providerTypeId: physiotherapist.id,
      },
    ],
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
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      name: 'Test Admin',
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  });

  const regularUser = await prisma.user.create({
    data: {
      email: 'user@test.com',
      name: 'Test User',
      role: 'USER',
      emailVerified: new Date(),
    },
  });

  const providerUser = await prisma.user.create({
    data: {
      email: 'provider@test.com',
      name: 'Test Provider',
      role: 'USER',
      emailVerified: new Date(),
    },
  });

  const orgOwnerUser = await prisma.user.create({
    data: {
      email: 'orgowner@test.com',
      name: 'Test Org Owner',
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
export async function createTestProvider(userId: string, status: 'PENDING_APPROVAL' | 'APPROVED' = 'PENDING_APPROVAL') {
  const providerType = await prisma.providerType.findFirst({
    where: { name: 'General Practitioner' },
  });

  if (!providerType) {
    throw new Error('Provider type not found. Run seedTestData first.');
  }

  const provider = await prisma.provider.create({
    data: {
      userId,
      name: 'Dr. John Doe',
      bio: 'Experienced general practitioner',
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
export async function createTestOrganization(ownerId: string, status: 'PENDING_APPROVAL' | 'APPROVED' = 'PENDING_APPROVAL') {
  const organization = await prisma.organization.create({
    data: {
      name: 'Test Medical Clinic',
      description: 'A test medical clinic',
      email: 'clinic@test.com',
      website: 'https://test-clinic.com',
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
  await cleanDatabase();
  const testData = await seedTestData();
  const testUsers = await createTestUsers();

  return {
    ...testData,
    users: testUsers,
  };
}

export { prisma };