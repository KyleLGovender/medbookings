// Client-safe enum definitions (matching Prisma enums)
export enum AvailabilityStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum BillingEntity {
  ORGANIZATION = 'ORGANIZATION',
  PROVIDER = 'PROVIDER',
  CUSTOMER = 'CUSTOMER',
}

export enum SchedulingRule {
  FIRST_COME_FIRST_SERVED = 'FIRST_COME_FIRST_SERVED',
  APPOINTMENT_REQUIRED = 'APPOINTMENT_REQUIRED',
  WALK_IN_ONLY = 'WALK_IN_ONLY',
  EMERGENCY_ONLY = 'EMERGENCY_ONLY',
}

export enum SlotStatus {
  AVAILABLE = 'AVAILABLE',
  BOOKED = 'BOOKED',
  BLOCKED = 'BLOCKED',
  INVALID = 'INVALID',
}

// Additional enums for availability management
export enum RecurrenceType {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

export enum AvailabilityContext {
  PROVIDER_CREATED = 'provider_created',
  ORGANIZATION_PROPOSED = 'organization_proposed',
}

export enum SlotGenerationStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
