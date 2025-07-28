/**
 * Calendar-focused test data fixtures for E2E tests
 * All test data uses E2E_CALENDAR prefix for easy identification and cleanup
 */

export const CALENDAR_TEST_USERS = {
  provider: {
    email: 'e2e-calendar-provider@example.com',
    name: 'E2E_CALENDAR_Provider',
    role: 'USER' as const,
  },
  client: {
    email: 'e2e-calendar-client@example.com',
    name: 'E2E_CALENDAR_Client',
    role: 'USER' as const,
  },
};

export const CALENDAR_AVAILABILITY_DATA = {
  // Regular working hours
  weeklySchedule: {
    date: '2024-12-02', // Monday
    startTime: '09:00',
    endTime: '17:00',
    service: 'General Consultation',
    type: 'ONLINE' as const,
    recurrence: {
      pattern: 'WEEKLY',
      endDate: '2024-12-31',
      daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    },
  },

  // Single appointment slot
  singleSlot: {
    date: '2024-12-15', // Specific Saturday
    startTime: '10:00',
    endTime: '11:00',
    service: 'General Consultation',
    type: 'ONLINE' as const,
  },

  // Evening availability
  eveningSlot: {
    date: '2024-12-10',
    startTime: '18:00',
    endTime: '20:00',
    service: 'General Consultation',
    type: 'ONLINE' as const,
  },
};

export const CALENDAR_BOOKING_DATA = {
  // Regular booking
  regularBooking: {
    date: '2024-12-03',
    startTime: '10:00',
    endTime: '10:45',
    service: 'General Consultation',
    clientNotes: '[E2E_CALENDAR] Test booking for calendar functionality',
    type: 'ONLINE' as const,
  },

  // Back-to-back bookings
  backToBackBooking1: {
    date: '2024-12-04',
    startTime: '14:00',
    endTime: '14:45',
    service: 'General Consultation',
    clientNotes: '[E2E_CALENDAR] First of back-to-back bookings',
    type: 'ONLINE' as const,
  },

  backToBackBooking2: {
    date: '2024-12-04',
    startTime: '14:45',
    endTime: '15:30',
    service: 'General Consultation',
    clientNotes: '[E2E_CALENDAR] Second of back-to-back bookings',
    type: 'ONLINE' as const,
  },

  // Future booking
  futureBooking: {
    date: '2024-12-20',
    startTime: '11:00',
    endTime: '11:45',
    service: 'General Consultation',
    clientNotes: '[E2E_CALENDAR] Future booking test',
    type: 'ONLINE' as const,
  },
};

export const CALENDAR_TIME_SLOTS = {
  // Common time slots for testing
  morning: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'],
  afternoon: ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30'],
  evening: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30'],
};

export const CALENDAR_TEST_SCENARIOS = {
  // Scenario 1: Provider creates weekly availability
  weeklyAvailabilityCreation: {
    description: 'Provider creates recurring weekly availability',
    steps: [
      'Login as provider',
      'Navigate to calendar',
      'Create weekly recurring availability',
      'Verify slots are generated correctly',
    ],
  },

  // Scenario 2: Client books an appointment
  clientBooking: {
    description: 'Client books an available slot',
    steps: [
      'Login as client',
      'Browse available providers',
      'Select time slot',
      'Complete booking',
      'Verify booking confirmation',
    ],
  },

  // Scenario 3: Provider manages calendar
  providerCalendarManagement: {
    description: 'Provider views and manages their calendar',
    steps: [
      'Login as provider',
      'View calendar with bookings',
      'Modify availability',
      'Cancel/reschedule appointments',
    ],
  },

  // Scenario 4: Calendar synchronization
  calendarSync: {
    description: 'Test calendar sync features',
    steps: [
      'Create availability',
      'Make booking',
      'Verify sync with external calendar',
      'Test conflict detection',
    ],
  },
};

export const CALENDAR_VALIDATION_RULES = {
  // Business rules for calendar testing
  minimumBookingAdvance: 24, // hours
  maximumBookingAdvance: 90, // days
  slotDuration: 45, // minutes
  bufferBetweenSlots: 0, // minutes
  workingHours: {
    start: '08:00',
    end: '18:00',
  },
  workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
};
