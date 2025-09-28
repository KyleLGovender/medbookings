// Test data fixtures and constants for E2E tests

export const TEST_USERS = {
  admin: {
    id: 'admin-test-user',
    email: 'admin@test.com',
    name: 'Test Admin',
    role: 'ADMIN' as const,
  },
  provider: {
    id: 'provider-test-user',
    email: 'provider@test.com',
    name: 'Test Provider',
    role: 'USER' as const,
  },
  user: {
    id: 'regular-test-user',
    email: 'user@test.com',
    name: 'Test User',
    role: 'USER' as const,
  },
  guestBooking: {
    id: 'guest-booking-user',
    email: 'guest@test.com',
    name: 'Test Guest',
    role: 'USER' as const,
  },
};

export const TEST_PROVIDERS = {
  approved: {
    id: 'approved-provider-1',
    name: 'Dr. Sarah Smith',
    email: 'dr.smith@test.com',
    bio: 'Experienced general practitioner with 10+ years in family medicine.',
    languages: ['English', 'Afrikaans'],
    specialties: ['General Practitioner', 'Family Medicine'],
    website: 'https://drsmith.co.za',
    showPrice: true,
    status: 'APPROVED',
    location: 'Cape Town',
  },
  pending: {
    id: 'pending-provider-1',
    name: 'Dr. John Doe',
    email: 'dr.doe@test.com',
    bio: 'Qualified dentist specializing in general dentistry.',
    languages: ['English'],
    specialties: ['Dentist', 'Oral Health'],
    website: 'https://drdoe.co.za',
    showPrice: false,
    status: 'PENDING_APPROVAL',
    location: 'Johannesburg',
  },
};

export const TEST_PROVIDER_DATA = {
  name: 'Dr. Sarah Johnson',
  bio: 'Experienced general practitioner with 10+ years of medical practice.',
  languages: ['English', 'Afrikaans'],
  specialties: ['General Practice', 'Preventive Medicine'],
  website: 'https://drsarahjohnson.co.za',
  practiceNumber: 'MP123456',
  services: [
    {
      name: 'General Consultation',
      duration: 30,
      price: 500,
    },
    {
      name: 'Follow-up Consultation',
      duration: 15,
      price: 250,
    },
    {
      name: 'Health Screening',
      duration: 45,
      price: 750,
    },
  ],
};

export const TEST_AVAILABILITY_SLOTS = {
  morning: {
    date: '2024-12-31',
    startTime: '09:00',
    endTime: '12:00',
    interval: 30,
    isOnline: false,
    location: 'Cape Town Medical Centre',
  },
  afternoon: {
    date: '2024-12-31',
    startTime: '14:00',
    endTime: '17:00',
    interval: 30,
    isOnline: true,
  },
  evening: {
    date: '2024-12-31',
    startTime: '18:00',
    endTime: '20:00',
    interval: 60,
    isOnline: true,
  },
};

export const TEST_AVAILABILITY_DATA = {
  date: '2024-12-31',
  startTime: '09:00',
  endTime: '17:00',
  interval: 30,
  isOnline: true,
  location: 'Cape Town Medical Centre',
};

export const TEST_BOOKINGS = {
  standard: {
    guestName: 'Alice Johnson',
    guestEmail: 'alice.johnson@example.com',
    guestPhone: '+27823456789',
    notes: 'First time patient, general checkup needed.',
    date: '2024-12-31',
    time: '10:00',
  },
  urgent: {
    guestName: 'Bob Smith',
    guestEmail: 'bob.smith@example.com',
    guestPhone: '+27834567890',
    notes: 'Urgent consultation required.',
    date: '2024-12-31',
    time: '11:30',
  },
  followUp: {
    guestName: 'Carol Wilson',
    guestEmail: 'carol.wilson@example.com',
    guestPhone: '+27845678901',
    notes: 'Follow-up appointment for previous consultation.',
    date: '2024-12-31',
    time: '15:00',
  },
};

export const TEST_BOOKING_DATA = TEST_BOOKINGS.standard;

export const TEST_LOCATIONS = {
  capeTown: {
    name: 'Cape Town Medical Centre',
    address: '123 Adderley Street, Cape Town, 8001',
    city: 'Cape Town',
    province: 'Western Cape',
  },
  johannesburg: {
    name: 'Johannesburg Health Clinic',
    address: '456 Commissioner Street, Johannesburg, 2001',
    city: 'Johannesburg',
    province: 'Gauteng',
  },
};

export const TEST_SERVICES = {
  consultation: {
    name: 'General Consultation',
    description: 'Standard medical consultation',
    duration: 30,
    defaultPrice: 500,
  },
  followUp: {
    name: 'Follow-up Visit',
    description: 'Follow-up consultation',
    duration: 15,
    defaultPrice: 250,
  },
  screening: {
    name: 'Health Screening',
    description: 'Comprehensive health assessment',
    duration: 45,
    defaultPrice: 750,
  },
};

// Helper functions for generating test data
export const generateTestUser = (overrides: Partial<typeof TEST_USERS.user> = {}) => ({
  ...TEST_USERS.user,
  id: `test-user-${Date.now()}`,
  email: `user-${Date.now()}@test.com`,
  ...overrides,
});

export const generateTestProvider = (overrides: Partial<typeof TEST_PROVIDERS.approved> = {}) => ({
  ...TEST_PROVIDERS.approved,
  id: `test-provider-${Date.now()}`,
  email: `provider-${Date.now()}@test.com`,
  ...overrides,
});

export const generateTestBooking = (overrides: Partial<typeof TEST_BOOKINGS.standard> = {}) => ({
  ...TEST_BOOKINGS.standard,
  guestEmail: `booking-${Date.now()}@test.com`,
  ...overrides,
});

// Backwards compatibility with existing test data
export { TEST_USERS as LEGACY_TEST_USERS } from './test-data';
export {
  AVAILABILITY_DATA,
  BOOKING_DATA,
  TIME_SLOTS,
  TEST_SCENARIOS,
  VALIDATION_RULES,
} from './test-data';
