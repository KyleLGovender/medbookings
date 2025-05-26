// Mock Bookings & Slots Data for Magic Patterns UI Development

// Define the SlotStatus enum values
export enum SlotStatus {
  AVAILABLE = 'AVAILABLE',
  BOOKED = 'BOOKED',
  BLOCKED = 'BLOCKED',
}

// Define the BookingStatus enum values as they appear in the schema
export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}

export const mockCalculatedAvailabilitySlots = [
  {
    id: 'slot_1',
    availabilityId: 'avail_1', // Dr. Smith Monday 9-5
    serviceProviderId: 'provider_1',
    locationId: 'loc_1',
    startTime: '2024-02-05T14:00:00Z', // Monday 2:00 PM
    endTime: '2024-02-05T14:30:00Z', // Monday 2:30 PM
    duration: 30,
    status: SlotStatus.AVAILABLE,
    isBookable: true,
    maxCapacity: 1,
    currentBookings: 0,
    bufferAfter: 5,
    blockedByEventId: null,
    version: 1,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'slot_2',
    availabilityId: 'avail_1',
    serviceProviderId: 'provider_1',
    locationId: 'loc_1',
    startTime: '2024-02-05T14:35:00Z', // Monday 2:35 PM
    endTime: '2024-02-05T15:05:00Z', // Monday 3:05 PM
    duration: 30,
    status: SlotStatus.BOOKED,
    isBookable: false,
    maxCapacity: 1,
    currentBookings: 1,
    bufferAfter: 5,
    blockedByEventId: null,
    version: 2,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-03T10:15:00Z',
  },
  {
    id: 'slot_3',
    availabilityId: 'avail_1',
    serviceProviderId: 'provider_1',
    locationId: 'loc_1',
    startTime: '2024-02-05T15:10:00Z', // Monday 3:10 PM
    endTime: '2024-02-05T15:40:00Z', // Monday 3:40 PM
    duration: 30,
    status: SlotStatus.BLOCKED,
    isBookable: false,
    maxCapacity: 1,
    currentBookings: 0,
    bufferAfter: 5,
    blockedByEventId: 'cal_event_1', // Blocked by calendar event
    version: 1,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-02T09:30:00Z',
  },
  {
    id: 'slot_4',
    availabilityId: 'avail_4', // Dr. Williams therapy session
    serviceProviderId: 'provider_2',
    locationId: 'loc_3',
    startTime: '2024-02-05T15:00:00Z', // Monday 3:00 PM
    endTime: '2024-02-05T15:50:00Z', // Monday 3:50 PM
    duration: 50, // Therapy session duration
    status: SlotStatus.AVAILABLE,
    isBookable: true,
    maxCapacity: 1,
    currentBookings: 0,
    bufferAfter: 10,
    blockedByEventId: null,
    version: 1,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'slot_5',
    availabilityId: 'avail_4',
    serviceProviderId: 'provider_2',
    locationId: 'loc_3',
    startTime: '2024-02-05T16:00:00Z', // Monday 4:00 PM
    endTime: '2024-02-05T16:50:00Z', // Monday 4:50 PM
    duration: 50,
    status: SlotStatus.BOOKED,
    isBookable: false,
    maxCapacity: 1,
    currentBookings: 1,
    bufferAfter: 10,
    blockedByEventId: null,
    version: 3,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-04T11:45:00Z',
  },
] as const;

// This represents how CalculatedAvailabilitySlots are derived from Availabilities
// In a real application, this would be a function that processes availabilities
// and generates slots based on service durations, buffer times, etc.

/**
 * In a real implementation, this would be a function:
 *
 * function calculateAvailabilitySlots(availabilities, services) {
 *   return availabilities.flatMap(availability => {
 *     // Break down availability into slots based on service durations
 *     // Apply business rules for slot generation
 *     // Return array of slots
 *   });
 * }
 */

export const mockBookings = [
  {
    id: 'booking_1',
    slotId: 'slot_2', // Dr. Smith Monday 2:35-3:05 PM

    // Who created the booking
    bookedByMembershipId: 'membership_1', // Sarah Johnson (org admin)
    bookedByUserId: null, // Not booked by individual user

    // Client information
    clientId: 'user_3', // Jane Doe
    guestName: null, // Not a guest booking
    guestEmail: null,
    guestPhone: null,
    guestWhatsapp: null,

    // Booking details
    price: 150.0, // Using decimal as per schema
    isOnline: false,
    isInPerson: true,
    status: BookingStatus.CONFIRMED,
    notes: 'Patient reports persistent cough and fatigue for 3 days. No fever.',

    // Integration details
    meetLink: null, // No online meeting
    calendarEventId: 'gcal_event_123', // Google Calendar sync

    // Version tracking
    version: 2,
    createdAt: '2024-02-03T10:15:00Z',
    updatedAt: '2024-02-04T14:35:00Z',

    // Additional metadata not in schema but useful for UI
    _metadata: {
      appointmentDate: '2024-02-05T14:35:00Z',
      duration: 30,
      serviceId: 'service_2', // Sick Visit
      reminderSent: true,
      reminderSentAt: '2024-02-04T14:35:00Z',
      cancelledAt: null,
      cancellationReason: null,
      noShowAt: null,
      checkedInAt: null,
      completedAt: null,
    },
  },
  {
    id: 'booking_2',
    slotId: 'slot_5', // Dr. Williams Monday 4:00-4:50 PM

    // Who created the booking
    bookedByMembershipId: null, // Not booked by organization staff
    bookedByUserId: 'user_3', // Jane Doe booked for herself

    // Client information
    clientId: 'user_3', // Jane Doe
    guestName: null, // Not a guest booking
    guestEmail: null,
    guestPhone: null,
    guestWhatsapp: null,

    // Booking details
    price: 180.0, // Using decimal as per schema
    isOnline: true,
    isInPerson: false,
    status: BookingStatus.CONFIRMED,
    notes:
      'Continuing work on anxiety management techniques. Homework: daily mindfulness practice.',

    // Integration details
    meetLink: 'https://meet.google.com/abc-defg-hij',
    calendarEventId: 'gcal_event_124',

    // Version tracking
    version: 3,
    createdAt: '2024-02-04T11:45:00Z',
    updatedAt: '2024-02-04T16:00:00Z',

    // Additional metadata not in schema but useful for UI
    _metadata: {
      appointmentDate: '2024-02-05T16:00:00Z',
      duration: 50,
      serviceId: 'service_3', // Individual Therapy
      reminderSent: true,
      reminderSentAt: '2024-02-04T16:00:00Z',
      cancelledAt: null,
      cancellationReason: null,
      noShowAt: null,
      checkedInAt: null,
      completedAt: null,
      internalNotes:
        'Patient showing good progress with CBT techniques. Consider EMDR assessment next session.',
    },
  },
  {
    id: 'booking_3',
    slotId: 'slot_6', // Future slot (not in mock slots above)

    // Who created the booking
    bookedByMembershipId: 'membership_3', // Maria Garcia (staff member)
    bookedByUserId: null, // Not booked as individual

    // Client information
    clientId: 'user_5', // Maria Garcia (staff booking for herself)
    guestName: null, // Not a guest booking
    guestEmail: null,
    guestPhone: null,
    guestWhatsapp: null,

    // Booking details
    price: 200.0, // Using decimal as per schema
    isOnline: false,
    isInPerson: true,
    status: BookingStatus.CONFIRMED,
    notes: 'Annual wellness check. Fasting bloodwork needed.',

    // Integration details
    meetLink: null, // No online meeting
    calendarEventId: null, // Not synced yet

    // Version tracking
    version: 1,
    createdAt: '2024-02-05T09:00:00Z',
    updatedAt: '2024-02-05T09:00:00Z',

    // Additional metadata not in schema but useful for UI
    _metadata: {
      appointmentDate: '2024-02-10T10:00:00Z', // Saturday 10 AM
      duration: 60,
      serviceId: 'service_1', // Annual Physical
      reminderSent: false,
      reminderSentAt: null,
      cancelledAt: null,
      cancellationReason: null,
      noShowAt: null,
      checkedInAt: null,
      completedAt: null,
      internalNotes: 'Staff member - priority scheduling.',
    },
  },
  {
    id: 'booking_4',
    slotId: 'slot_7', // Past appointment

    // Who created the booking
    bookedByMembershipId: null, // Not booked by organization staff
    bookedByUserId: 'user_6', // Robert Johnson booked for himself

    // Client information
    clientId: 'user_6', // Robert Johnson
    guestName: null, // Not a guest booking
    guestEmail: null,
    guestPhone: null,
    guestWhatsapp: null,

    // Booking details
    price: 160.0, // Using decimal as per schema
    isOnline: false,
    isInPerson: true,
    status: BookingStatus.COMPLETED,
    notes: 'Regular 6-month cleaning and check-up.',

    // Integration details
    meetLink: null, // No online meeting
    calendarEventId: 'gcal_event_125',

    // Version tracking
    version: 4,
    createdAt: '2024-01-20T16:20:00Z',
    updatedAt: '2024-01-25T15:10:00Z',

    // Additional metadata not in schema but useful for UI
    _metadata: {
      appointmentDate: '2024-01-25T14:00:00Z', // Last week
      duration: 60,
      serviceId: 'service_5', // Dental Cleaning
      reminderSent: true,
      reminderSentAt: '2024-01-24T14:00:00Z',
      cancelledAt: null,
      cancellationReason: null,
      noShowAt: null,
      checkedInAt: '2024-01-25T13:55:00Z',
      completedAt: '2024-01-25T15:10:00Z',
      internalNotes: 'Patient has sensitive gums, use gentle techniques.',
    },
  },
  {
    id: 'booking_5',
    slotId: 'slot_8', // Cancelled slot

    // Who created the booking
    bookedByMembershipId: null, // Not booked by organization staff
    bookedByUserId: 'user_3', // Jane Doe booked for herself

    // Client information
    clientId: 'user_3', // Jane Doe
    guestName: null, // Not a guest booking
    guestEmail: null,
    guestPhone: null,
    guestWhatsapp: null,

    // Booking details
    price: 220.0, // Using decimal as per schema
    isOnline: true,
    isInPerson: false,
    status: BookingStatus.CANCELLED,
    notes: 'Couples session - initial consultation.',

    // Integration details
    meetLink: 'https://meet.google.com/xyz-abcd-123',
    calendarEventId: null, // Cancelled before sync

    // Version tracking
    version: 2,
    createdAt: '2024-01-29T14:20:00Z',
    updatedAt: '2024-02-01T10:30:00Z',

    // Additional metadata not in schema but useful for UI
    _metadata: {
      appointmentDate: '2024-02-01T19:00:00Z', // Was scheduled for evening
      duration: 75,
      serviceId: 'service_4', // Couples Counseling
      reminderSent: true,
      reminderSentAt: '2024-01-31T19:00:00Z',
      cancelledAt: '2024-02-01T10:30:00Z',
      cancellationReason: 'Schedule conflict - partner unavailable',
      noShowAt: null,
      checkedInAt: null,
      completedAt: null,
      internalNotes: 'Patient cancelled due to partners schedule conflict. Offered to reschedule.',
    },
  },
  {
    id: 'booking_6',
    slotId: 'slot_9',

    // Who created the booking - guest booking
    bookedByMembershipId: 'membership_1', // Sarah Johnson (org admin)
    bookedByUserId: null, // Not booked by individual user

    // Client information - guest booking
    clientId: null, // No user account
    guestName: 'David Wilson',
    guestEmail: 'david.wilson@example.com',
    guestPhone: '+1234567890',
    guestWhatsapp: null,

    // Booking details
    price: 120.0,
    isOnline: false,
    isInPerson: true,
    status: BookingStatus.PENDING,
    notes: 'New patient consultation. First time visit.',

    // Integration details
    meetLink: null,
    calendarEventId: null,

    // Version tracking
    version: 1,
    createdAt: '2024-02-05T11:30:00Z',
    updatedAt: '2024-02-05T11:30:00Z',

    // Additional metadata not in schema but useful for UI
    _metadata: {
      appointmentDate: '2024-02-12T13:00:00Z',
      duration: 30,
      serviceId: 'service_2', // Sick Visit
      reminderSent: false,
      reminderSentAt: null,
      cancelledAt: null,
      cancellationReason: null,
      noShowAt: null,
      checkedInAt: null,
      completedAt: null,
    },
  },
  {
    id: 'booking_7',
    slotId: 'slot_10',

    // Who created the booking
    bookedByMembershipId: null,
    bookedByUserId: 'user_7', // Self-booked

    // Client information
    clientId: 'user_7',
    guestName: null,
    guestEmail: null,
    guestPhone: null,
    guestWhatsapp: null,

    // Booking details
    price: 95.0,
    isOnline: false,
    isInPerson: true,
    status: BookingStatus.NO_SHOW,
    notes: 'Follow-up appointment for medication review.',

    // Integration details
    meetLink: null,
    calendarEventId: 'gcal_event_126',

    // Version tracking
    version: 2,
    createdAt: '2024-01-15T09:45:00Z',
    updatedAt: '2024-01-22T15:30:00Z',

    // Additional metadata not in schema but useful for UI
    _metadata: {
      appointmentDate: '2024-01-22T15:00:00Z',
      duration: 20,
      serviceId: 'service_6', // Medication Review
      reminderSent: true,
      reminderSentAt: '2024-01-21T15:00:00Z',
      cancelledAt: null,
      cancellationReason: null,
      noShowAt: '2024-01-22T15:30:00Z',
      checkedInAt: null,
      completedAt: null,
      internalNotes: 'Patient did not show up or call to cancel. Follow up needed.',
    },
  },
] as const;

// Use the enum values instead of string literals
export const mockSlotStatuses = Object.values(SlotStatus);

// Use the enum values instead of string literals
export const mockBookingStatuses = Object.values(BookingStatus);

// Payment statuses - not in schema but useful for UI
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
}

export const mockPaymentStatuses = Object.values(PaymentStatus);
