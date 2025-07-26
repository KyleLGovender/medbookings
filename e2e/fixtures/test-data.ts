/**
 * Test data fixtures for E2E tests
 * All test data uses E2E_TEST_ prefix for easy identification and cleanup
 */

export const TEST_PROVIDER_DATA = {
  firstName: 'E2E_TEST_Dr_Jane',
  lastName: 'E2E_TEST_Smith',
  phoneNumber: '+1-555-9999',
  bio: '[E2E_TEST] Experienced general practitioner with 10 years of practice. Specializes in family medicine and preventive care.',
  yearsOfExperience: 10,
  serviceProviderType: 'General Practitioner',
};

export const TEST_ORGANIZATION_DATA = {
  name: 'E2E_TEST_Sunny_Medical_Clinic',
  description: '[E2E_TEST] A modern medical clinic providing comprehensive healthcare services to the community.',
  phoneNumber: '+1-555-9998',
  email: 'e2e-test-info@example.com',
  website: 'https://e2e-test-sunnymedical.example.com',
  address: '[E2E_TEST] 123 Health Street, Medical City, MC 12345',
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
    name: '[E2E_TEST] Medical License',
    path: 'e2e/fixtures/files/medical-license.pdf',
  },
  insurance: {
    name: '[E2E_TEST] Professional Insurance',
    path: 'e2e/fixtures/files/insurance-certificate.pdf',
  },
};

export const TEST_USERS = {
  admin: {
    email: 'e2e-test-admin@example.com',
    name: 'E2E_TEST_Admin',
    role: 'ADMIN' as const,
  },
  regular: {
    email: 'e2e-test-user@example.com',
    name: 'E2E_TEST_User',
    role: 'USER' as const,
  },
  provider: {
    email: 'e2e-test-provider@example.com',
    name: 'E2E_TEST_Provider',
    role: 'USER' as const,
  },
  orgOwner: {
    email: 'e2e-test-orgowner@example.com',
    name: 'E2E_TEST_Org_Owner',
    role: 'USER' as const,
  },
};

export const REJECTION_REASONS = {
  provider: '[E2E_TEST] Provider credentials do not meet our standards. Please submit updated documentation.',
  organization: '[E2E_TEST] Organization registration is incomplete. Missing required licensing information.',
  requirement: '[E2E_TEST] Submitted document is not clear or does not show required information.',
};

export const APPROVAL_NOTES = {
  provider: '[E2E_TEST] Provider meets all requirements and has been approved for the platform.',
  organization: '[E2E_TEST] Organization has been verified and approved for operation.',
  requirement: '[E2E_TEST] Document has been verified and approved.',
};