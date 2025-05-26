// Mock Organization Memberships Data for Magic Patterns UI Development

// Define the OrganizationRole enum values as they appear in the schema
export enum OrganizationRole {
  OWNER = 'OWNER', // Full control, billing responsibility
  ADMIN = 'ADMIN', // Operational control, can manage providers and bookings
  MANAGER = 'MANAGER', // Limited admin rights, can manage specific locations/providers
  STAFF = 'STAFF', // Basic operational access
}

// Define the OrganizationPermission enum values
export enum OrganizationPermission {
  MANAGE_PROVIDERS = 'MANAGE_PROVIDERS', // Add/remove/edit service providers
  MANAGE_BOOKINGS = 'MANAGE_BOOKINGS', // Create/modify/cancel bookings on behalf of providers
  MANAGE_LOCATIONS = 'MANAGE_LOCATIONS', // Add/edit locations
  MANAGE_STAFF = 'MANAGE_STAFF', // Invite/remove staff members
  VIEW_ANALYTICS = 'VIEW_ANALYTICS', // Access to reports and analytics
  MANAGE_BILLING = 'MANAGE_BILLING', // Access to billing and subscription
  RESPOND_TO_MESSAGES = 'RESPOND_TO_MESSAGES', // Respond to patient messages
  MANAGE_AVAILABILITY = 'MANAGE_AVAILABILITY', // Set availability for providers
}

// Define the MembershipStatus enum values
export enum MembershipStatus {
  PENDING = 'PENDING', // Invitation sent but not accepted
  ACTIVE = 'ACTIVE', // Active member
  SUSPENDED = 'SUSPENDED', // Temporarily suspended
  INACTIVE = 'INACTIVE', // Left or removed
}

// Mock organization memberships to connect users with organizations
export const mockOrganizationMemberships = [
  {
    id: 'membership_1',
    organizationId: 'org_1', // HealthCare Plus Clinic
    userId: 'user_1', // Sarah Johnson
    role: OrganizationRole.OWNER,
    permissions: [
      OrganizationPermission.MANAGE_PROVIDERS,
      OrganizationPermission.MANAGE_BOOKINGS,
      OrganizationPermission.MANAGE_LOCATIONS,
      OrganizationPermission.MANAGE_STAFF,
      OrganizationPermission.VIEW_ANALYTICS,
      OrganizationPermission.MANAGE_BILLING,
      OrganizationPermission.RESPOND_TO_MESSAGES,
      OrganizationPermission.MANAGE_AVAILABILITY,
    ],
    invitedBy: null, // Original owner, not invited
    invitedAt: null,
    acceptedAt: null,
    status: MembershipStatus.ACTIVE,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'membership_2',
    organizationId: 'org_1', // HealthCare Plus Clinic
    userId: 'user_5', // Maria Garcia (receptionist)
    role: OrganizationRole.STAFF,
    permissions: [
      OrganizationPermission.MANAGE_BOOKINGS,
      OrganizationPermission.RESPOND_TO_MESSAGES,
    ],
    invitedBy: 'user_1', // Invited by Sarah Johnson
    invitedAt: '2024-01-16T09:00:00Z',
    acceptedAt: '2024-01-16T09:20:00Z',
    status: MembershipStatus.ACTIVE,
    createdAt: '2024-01-16T09:20:00Z',
    updatedAt: '2024-01-16T09:20:00Z',
  },
  {
    id: 'membership_3',
    organizationId: 'org_1', // HealthCare Plus Clinic
    userId: 'user_2', // Dr. Michael Smith
    role: OrganizationRole.MANAGER,
    permissions: [
      OrganizationPermission.MANAGE_BOOKINGS,
      OrganizationPermission.RESPOND_TO_MESSAGES,
      OrganizationPermission.MANAGE_AVAILABILITY,
      OrganizationPermission.VIEW_ANALYTICS,
    ],
    invitedBy: 'user_1', // Invited by Sarah Johnson
    invitedAt: '2024-01-10T09:30:00Z',
    acceptedAt: '2024-01-10T10:15:00Z',
    status: MembershipStatus.ACTIVE,
    createdAt: '2024-01-10T10:15:00Z',
    updatedAt: '2024-01-10T10:15:00Z',
  },
  {
    id: 'membership_4',
    organizationId: 'org_2', // Downtown Therapy Center
    userId: 'user_4', // Dr. Emma Williams
    role: OrganizationRole.OWNER,
    permissions: [
      OrganizationPermission.MANAGE_PROVIDERS,
      OrganizationPermission.MANAGE_BOOKINGS,
      OrganizationPermission.MANAGE_LOCATIONS,
      OrganizationPermission.MANAGE_STAFF,
      OrganizationPermission.VIEW_ANALYTICS,
      OrganizationPermission.MANAGE_BILLING,
      OrganizationPermission.RESPOND_TO_MESSAGES,
      OrganizationPermission.MANAGE_AVAILABILITY,
    ],
    invitedBy: null, // Original owner, not invited
    invitedAt: null,
    acceptedAt: null,
    status: MembershipStatus.ACTIVE,
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
  },
  {
    id: 'membership_5',
    organizationId: 'org_3', // Metro Dental Associates
    userId: 'user_6', // Dr. James Chen
    role: OrganizationRole.OWNER,
    permissions: [
      OrganizationPermission.MANAGE_PROVIDERS,
      OrganizationPermission.MANAGE_BOOKINGS,
      OrganizationPermission.MANAGE_LOCATIONS,
      OrganizationPermission.MANAGE_STAFF,
      OrganizationPermission.VIEW_ANALYTICS,
      OrganizationPermission.MANAGE_BILLING,
      OrganizationPermission.RESPOND_TO_MESSAGES,
      OrganizationPermission.MANAGE_AVAILABILITY,
    ],
    invitedBy: null, // Original owner, not invited
    invitedAt: null,
    acceptedAt: null,
    status: MembershipStatus.ACTIVE,
    createdAt: '2024-01-08T00:00:00Z',
    updatedAt: '2024-01-08T00:00:00Z',
  },
  {
    id: 'membership_6',
    organizationId: 'org_1', // HealthCare Plus Clinic
    userId: 'user_3', // Jane Doe (patient/client)
    role: OrganizationRole.STAFF,
    permissions: [OrganizationPermission.RESPOND_TO_MESSAGES],
    invitedBy: 'user_1', // Invited by Sarah Johnson
    invitedAt: '2024-01-25T14:00:00Z',
    acceptedAt: null, // Hasn't accepted yet
    status: MembershipStatus.PENDING,
    createdAt: '2024-01-25T14:00:00Z',
    updatedAt: '2024-01-25T14:00:00Z',
  },
];

// Export a helper function to get a user's memberships
export function getUserMemberships(userId: string) {
  return mockOrganizationMemberships.filter(
    (membership) => membership.userId === userId && membership.status === MembershipStatus.ACTIVE
  );
}

// Export a helper function to get an organization's members
export function getOrganizationMembers(organizationId: string) {
  return mockOrganizationMemberships.filter(
    (membership) => membership.organizationId === organizationId
  );
}
