// Master Index - All Mock Data for Magic Patterns UI Development
// Import this single file to get access to all mock data

// Users & Authentication
export * from './mock-data-users';

// Organizations & Locations
export * from './mock-data-organizations';

// Service Providers & Services
export * from './mock-data-providers';

// Connections & Availability
export * from './mock-data-connections';

// Bookings & Slots
export * from './mock-data-bookings';

// Calendar Integration & Sync
export * from './mock-data-calendar';

// Complete Data Set for UI Development
export const mockDataComplete = {
  // Users
  users: [
    {
      id: 'user_1',
      email: 'admin@healthclinic.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'ORGANIZATION_ADMIN',
      profilePicture:
        'https://images.unsplash.com/photo-1494790108755-2616b332c?w=150&h=150&fit=crop&crop=face',
    },
    {
      id: 'user_2',
      email: 'dr.smith@medicalpro.com',
      firstName: 'Michael',
      lastName: 'Smith',
      role: 'SERVICE_PROVIDER',
      profilePicture:
        'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face',
    },
    {
      id: 'user_3',
      email: 'jane.doe@email.com',
      firstName: 'Jane',
      lastName: 'Doe',
      role: 'PATIENT',
      profilePicture:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    },
  ],

  // Organizations with location details
  organizations: [
    {
      id: 'org_1',
      name: 'HealthCare Plus Clinic',
      type: 'CLINIC',
      logoUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=200&h=200&fit=crop',
      subscriptionPlan: 'PROFESSIONAL',
      locations: [
        {
          id: 'loc_1',
          name: 'Main Campus',
          address: '123 Healthcare Blvd, Suite 100',
          city: 'New York',
          isPrimary: true,
        },
      ],
    },
  ],

  // Service providers with services
  providers: [
    {
      id: 'provider_1',
      displayName: 'Dr. Michael Smith',
      specialization: 'Family Medicine',
      rating: 4.8,
      totalReviews: 156,
      services: [
        {
          id: 'service_1',
          name: 'Annual Physical Exam',
          duration: 60,
          price: '$250.00',
        },
        {
          id: 'service_2',
          name: 'Sick Visit',
          duration: 30,
          price: '$150.00',
        },
      ],
    },
  ],

  // Current bookings for dashboard views
  todaysBookings: [
    {
      id: 'booking_1',
      patientName: 'Jane Doe',
      serviceName: 'Sick Visit',
      providerName: 'Dr. Michael Smith',
      time: '2:35 PM',
      duration: '30 min',
      status: 'CONFIRMED',
      type: 'In-Person',
    },
    {
      id: 'booking_2',
      patientName: 'Jane Doe',
      serviceName: 'Individual Therapy',
      providerName: 'Dr. Emma Williams',
      time: '4:00 PM',
      duration: '50 min',
      status: 'CONFIRMED',
      type: 'In-Person',
    },
  ],

  // Available time slots for booking UI
  availableSlots: [
    {
      id: 'slot_1',
      time: '2:00 PM',
      duration: '30 min',
      provider: 'Dr. Michael Smith',
      available: true,
    },
    {
      id: 'slot_4',
      time: '3:00 PM',
      duration: '50 min',
      provider: 'Dr. Emma Williams',
      available: true,
    },
  ],

  // Calendar sync status for admin dashboards
  syncStatus: [
    {
      providerId: 'provider_1',
      providerName: 'Dr. Michael Smith',
      lastSync: '8:00 AM',
      status: 'SYNCED',
      conflicts: 0,
      nextSync: '8:15 AM',
    },
    {
      providerId: 'provider_2',
      providerName: 'Dr. Emma Williams',
      lastSync: '9:15 AM',
      status: 'CONFLICT_DETECTED',
      conflicts: 1,
      nextSync: '9:30 AM',
    },
  ],

  // Analytics data for reporting
  analytics: {
    totalBookings: 1247,
    totalRevenue: '$184,350',
    activeProviders: 12,
    averageRating: 4.7,
    bookingsByStatus: {
      confirmed: 856,
      completed: 234,
      cancelled: 89,
      pending: 68,
    },
    revenueByMonth: [
      { month: 'Jan', revenue: 45200 },
      { month: 'Feb', revenue: 52800 },
      { month: 'Mar', revenue: 48900 },
      { month: 'Apr', revenue: 37450 },
    ],
  },
} as const;

// Quick access exports for common UI components
export const quickAccess = {
  samplePatient: mockDataComplete.users.find((u) => u.role === 'PATIENT'),
  sampleProvider: mockDataComplete.providers[0],
  sampleBooking: mockDataComplete.todaysBookings[0],
  sampleOrganization: mockDataComplete.organizations[0],
} as const;

// UI Component Data - Ready to use in Magic Patterns
export const componentData = {
  // For appointment booking flow
  bookingFlow: {
    services: mockDataComplete.providers[0].services,
    availableSlots: mockDataComplete.availableSlots,
    selectedProvider: mockDataComplete.providers[0],
  },

  // For provider dashboard
  providerDashboard: {
    todaysBookings: mockDataComplete.todaysBookings,
    upcomingSlots: mockDataComplete.availableSlots,
    syncStatus: mockDataComplete.syncStatus[0],
  },

  // For admin dashboard
  adminDashboard: {
    analytics: mockDataComplete.analytics,
    allProviders: mockDataComplete.providers,
    syncStatuses: mockDataComplete.syncStatus,
    recentBookings: mockDataComplete.todaysBookings,
  },
} as const;
