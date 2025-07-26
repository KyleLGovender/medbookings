/**
 * Test data fixtures for E2E tests
 */

export const TEST_PROVIDER_DATA = {
  firstName: 'Dr. Jane',
  lastName: 'Smith',
  phoneNumber: '+1-555-0123',
  bio: 'Experienced general practitioner with 10 years of practice. Specializes in family medicine and preventive care.',
  yearsOfExperience: 10,
  serviceProviderType: 'General Practitioner',
};

export const TEST_ORGANIZATION_DATA = {
  name: 'Sunny Medical Clinic',
  description: 'A modern medical clinic providing comprehensive healthcare services to the community.',
  phoneNumber: '+1-555-0199',
  email: 'info@sunnymedical.com',
  website: 'https://sunnymedical.com',
  address: '123 Health Street, Medical City, MC 12345',
};

export const TEST_AVAILABILITY_DATA = {
  date: '2024-12-01',
  startTime: '09:00',
  endTime: '17:00',
  service: 'General Consultation',
  type: 'ONLINE' as const,
};

export const TEST_REQUIREMENT_DOCUMENTS = {
  medicalLicense: {
    name: 'Medical License',
    path: 'e2e/fixtures/files/medical-license.pdf',
  },
  insurance: {
    name: 'Professional Insurance',
    path: 'e2e/fixtures/files/insurance-certificate.pdf',
  },
};

export const TEST_USERS = {
  admin: {
    email: 'admin@test.com',
    name: 'Test Admin',
    role: 'ADMIN' as const,
  },
  regular: {
    email: 'user@test.com',
    name: 'Test User',
    role: 'USER' as const,
  },
  provider: {
    email: 'provider@test.com',
    name: 'Test Provider',
    role: 'USER' as const,
  },
  orgOwner: {
    email: 'orgowner@test.com',
    name: 'Test Org Owner',
    role: 'USER' as const,
  },
};

export const REJECTION_REASONS = {
  provider: 'Provider credentials do not meet our standards. Please submit updated documentation.',
  organization: 'Organization registration is incomplete. Missing required licensing information.',
  requirement: 'Submitted document is not clear or does not show required information.',
};

export const APPROVAL_NOTES = {
  provider: 'Provider meets all requirements and has been approved for the platform.',
  organization: 'Organization has been verified and approved for operation.',
  requirement: 'Document has been verified and approved.',
};