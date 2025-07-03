// Re-export Prisma enums for availability management
export { 
  SchedulingRule, 
  AvailabilityStatus,
  SlotStatus,
  BillingEntity 
} from '@prisma/client';

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