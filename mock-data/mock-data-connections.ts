// Mock Provider Connections & Availability Data for Magic Patterns UI Development

// Define the ConnectionStatus enum values as they appear in the schema
export enum ConnectionStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

// Define the BillingEntity enum values as they appear in the schema
export enum BillingEntity {
  ORGANIZATION = 'ORGANIZATION', // Organization pays for bookings
  LOCATION = 'LOCATION', // Location pays for bookings
  PROVIDER = 'PROVIDER', // Provider pays for their own subscription
}

// Updated mock organization provider connections to match the schema
export const mockOrganizationProviderConnections = [
  {
    id: 'conn_1',
    organizationId: 'org_1', // HealthCare Plus Clinic
    serviceProviderId: 'provider_1', // Dr. Michael Smith
    status: ConnectionStatus.ACCEPTED,
    defaultBilledBy: BillingEntity.ORGANIZATION,
    requestedAt: '2024-01-15T09:30:00Z',
    acceptedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'conn_2',
    organizationId: 'org_2', // Downtown Therapy Center
    serviceProviderId: 'provider_2', // Dr. Emma Williams
    status: ConnectionStatus.ACCEPTED,
    defaultBilledBy: BillingEntity.ORGANIZATION,
    requestedAt: '2024-01-12T08:30:00Z',
    acceptedAt: '2024-01-12T09:00:00Z',
  },
  {
    id: 'conn_3',
    organizationId: 'org_1', // HealthCare Plus Clinic
    serviceProviderId: 'provider_2', // Dr. Emma Williams
    status: ConnectionStatus.PENDING,
    defaultBilledBy: BillingEntity.PROVIDER,
    requestedAt: '2024-01-22T16:00:00Z',
    acceptedAt: null, // Not yet accepted
  },
  {
    id: 'conn_4',
    organizationId: 'org_3', // Metro Dental Associates
    serviceProviderId: 'provider_3', // Dr. James Chen
    status: ConnectionStatus.ACCEPTED,
    defaultBilledBy: BillingEntity.ORGANIZATION,
    requestedAt: '2024-01-14T10:00:00Z',
    acceptedAt: '2024-01-14T10:30:00Z',
  },
];

// Define the AvailabilityStatus enum values
export enum AvailabilityStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

// Updated mock availabilities to match the schema
export const mockAvailabilities = [
  {
    id: 'avail_1',
    serviceProviderId: 'provider_1', // Dr. Michael Smith
    organizationId: 'org_1', // HealthCare Plus
    locationId: 'loc_1', // Main Clinic
    connectionId: 'conn_1',
    startTime: '2024-01-27T09:00:00Z', // Monday 9 AM
    endTime: '2024-01-27T17:00:00Z', // Monday 5 PM
    status: AvailabilityStatus.ACCEPTED,
    createdById: 'user_1', // Sarah Johnson (org admin)
    acceptedAt: '2024-01-15T10:15:00Z',
    billingEntity: BillingEntity.ORGANIZATION,
    defaultSubscriptionId: null, // Would reference a subscription ID
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:15:00Z',
  },
  {
    id: 'avail_2',
    serviceProviderId: 'provider_1', // Dr. Michael Smith
    organizationId: 'org_1', // HealthCare Plus
    locationId: 'loc_1', // Main Clinic
    connectionId: 'conn_1',
    startTime: '2024-01-28T09:00:00Z', // Tuesday 9 AM
    endTime: '2024-01-28T17:00:00Z', // Tuesday 5 PM
    status: AvailabilityStatus.ACCEPTED,
    createdById: 'user_1', // Sarah Johnson (org admin)
    acceptedAt: '2024-01-15T10:15:00Z',
    billingEntity: BillingEntity.ORGANIZATION,
    defaultSubscriptionId: null,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:15:00Z',
  },
  {
    id: 'avail_3',
    serviceProviderId: 'provider_1', // Dr. Michael Smith
    organizationId: 'org_1', // HealthCare Plus
    locationId: 'loc_2', // Downtown Branch
    connectionId: 'conn_1',
    startTime: '2024-01-30T17:00:00Z', // Thursday 5 PM
    endTime: '2024-01-30T20:00:00Z', // Thursday 8 PM
    status: AvailabilityStatus.ACCEPTED,
    createdById: 'user_1', // Sarah Johnson (org admin)
    acceptedAt: '2024-01-15T10:15:00Z',
    billingEntity: BillingEntity.ORGANIZATION,
    defaultSubscriptionId: null,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:15:00Z',
  },
  {
    id: 'avail_4',
    serviceProviderId: 'provider_2', // Dr. Emma Williams
    organizationId: 'org_2', // Downtown Therapy Center
    locationId: 'loc_3', // Main Office
    connectionId: 'conn_2',
    startTime: '2024-01-27T10:00:00Z', // Monday 10 AM
    endTime: '2024-01-27T18:00:00Z', // Monday 6 PM
    status: AvailabilityStatus.ACCEPTED,
    createdById: 'user_4', // Dr. Emma Williams (created her own availability)
    acceptedAt: '2024-01-12T09:15:00Z',
    billingEntity: BillingEntity.ORGANIZATION,
    defaultSubscriptionId: null,
    createdAt: '2024-01-12T09:00:00Z',
    updatedAt: '2024-01-12T09:15:00Z',
  },
  {
    id: 'avail_5',
    serviceProviderId: 'provider_2', // Dr. Emma Williams
    organizationId: 'org_2', // Downtown Therapy Center
    locationId: 'loc_3', // Main Office
    connectionId: 'conn_2',
    startTime: '2024-01-29T10:00:00Z', // Wednesday 10 AM
    endTime: '2024-01-29T18:00:00Z', // Wednesday 6 PM
    status: AvailabilityStatus.ACCEPTED,
    createdById: 'user_4', // Dr. Emma Williams (created her own availability)
    acceptedAt: '2024-01-12T09:15:00Z',
    billingEntity: BillingEntity.ORGANIZATION,
    defaultSubscriptionId: null,
    createdAt: '2024-01-12T09:00:00Z',
    updatedAt: '2024-01-12T09:15:00Z',
  },
  {
    id: 'avail_6',
    serviceProviderId: 'provider_2', // Dr. Emma Williams
    organizationId: 'org_1', // HealthCare Plus (pending connection)
    locationId: 'loc_1', // Main Clinic
    connectionId: 'conn_3', // Pending connection
    startTime: '2024-02-01T14:00:00Z', // Thursday 2 PM
    endTime: '2024-02-01T18:00:00Z', // Thursday 6 PM
    status: AvailabilityStatus.PENDING, // Pending approval
    createdById: 'user_1', // Sarah Johnson (org admin)
    acceptedAt: null, // Not yet accepted
    billingEntity: BillingEntity.PROVIDER,
    defaultSubscriptionId: null,
    createdAt: '2024-01-22T16:15:00Z',
    updatedAt: '2024-01-22T16:15:00Z',
  },
  {
    id: 'avail_7',
    serviceProviderId: 'provider_3', // Dr. James Chen
    organizationId: 'org_3', // Metro Dental Associates
    locationId: 'loc_4', // Main Office
    connectionId: 'conn_4',
    startTime: '2024-01-27T09:00:00Z', // Monday 9 AM
    endTime: '2024-01-27T17:00:00Z', // Monday 5 PM
    status: AvailabilityStatus.ACCEPTED,
    createdById: 'user_6', // Dr. James Chen (created his own availability)
    acceptedAt: '2024-01-14T10:45:00Z',
    billingEntity: BillingEntity.ORGANIZATION,
    defaultSubscriptionId: null,
    createdAt: '2024-01-14T10:30:00Z',
    updatedAt: '2024-01-14T10:45:00Z',
  },
  {
    id: 'avail_8',
    serviceProviderId: 'provider_3', // Dr. James Chen
    organizationId: 'org_3', // Metro Dental Associates
    locationId: 'loc_4', // Main Office
    connectionId: 'conn_4',
    startTime: '2024-01-29T09:00:00Z', // Wednesday 9 AM
    endTime: '2024-01-29T17:00:00Z', // Wednesday 5 PM
    status: AvailabilityStatus.ACCEPTED,
    createdById: 'user_6', // Dr. James Chen (created his own availability)
    acceptedAt: '2024-01-14T10:45:00Z',
    billingEntity: BillingEntity.ORGANIZATION,
    defaultSubscriptionId: null,
    createdAt: '2024-01-14T10:30:00Z',
    updatedAt: '2024-01-14T10:45:00Z',
  },
];

export const mockConnectionStatuses = ['PENDING', 'ACTIVE', 'SUSPENDED', 'TERMINATED'] as const;

export const mockConnectionTypes = ['CONTRACTED', 'CONSULTANT', 'PARTNER', 'AFFILIATE'] as const;

export const mockAvailabilityStatuses = [
  'DRAFT',
  'PENDING_APPROVAL',
  'CONFIRMED',
  'CANCELLED',
] as const;
