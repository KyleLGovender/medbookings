// Client-safe types for calendar components (no server imports)

export type AvailabilityStatus = 'PENDING' | 'ACTIVE' | 'CANCELLED' | 'ACCEPTED' | 'REJECTED';
export type SlotStatus = 'AVAILABLE' | 'BOOKED' | 'BLOCKED' | 'INVALID';
export type SchedulingRule = 'FIXED_DURATION' | 'FIXED_INTERVAL' | 'CUSTOM_INTERVAL' | 'FLEXIBLE';

export interface CalendarEvent {
  id: string;
  type: 'availability' | 'booking' | 'blocked';
  title: string;
  startTime: Date;
  endTime: Date;
  status: AvailabilityStatus | SlotStatus | 'blocked';
  schedulingRule?: SchedulingRule;
  isRecurring?: boolean;
  seriesId?: string;
  location?: {
    id: string;
    name: string;
    isOnline: boolean;
  };
  service?: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
  customer?: {
    id?: string;
    name: string;
    email?: string;
    phone?: string;
  };
  requiresConfirmation?: boolean;
  notes?: string;
}

export interface ProviderCalendarData {
  providerId: string;
  providerName: string;
  providerType: string;
  workingHours: {
    start: string; // "09:00"
    end: string; // "17:00"
  };
  events: CalendarEvent[];
  stats: {
    totalAvailabilityHours: number;
    bookedHours: number;
    utilizationRate: number;
    pendingBookings: number;
    completedBookings: number;
  };
}

export interface AvailabilitySearchParams {
  serviceProviderId?: string;
  organizationId?: string;
  locationId?: string;
  serviceId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: AvailabilityStatus;
  seriesId?: string;
}
