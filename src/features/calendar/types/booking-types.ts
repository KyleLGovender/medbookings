import type { ProviderStatus, SchedulingRule } from '@prisma/client';

export type CalendarViewMode = 'day' | '3-day' | 'week';

export interface BookingSlot {
  id: string;
  availabilityId: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  isAvailable: boolean;
  price?: number;
  service?: {
    id: string;
    name: string;
    description?: string;
  };
  provider: {
    id: string;
    name: string;
    image?: string;
  };
  location?: {
    id: string;
    name: string;
    isOnline: boolean;
  };
}

export interface BookingFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  timeRange?: {
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
  };
  location?: 'online' | 'in-person' | 'all';
  providerTypes?: string[];
  services?: string[];
  duration?: {
    min?: number;
    max?: number;
  };
  priceRange?: {
    min?: number;
    max?: number;
  };
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ProviderPublicData {
  id: string;
  user?: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  };
  status: ProviderStatus;
  specialties?: string[];
  bio?: string;
  languages?: string[];
  yearsOfExperience?: number;
}

export interface SlotClickEvent {
  slot: BookingSlot;
  clickEvent: React.MouseEvent;
}

export interface CalendarGridProps {
  providerId: string;
  currentDate: Date;
  viewMode: CalendarViewMode;
  slots: BookingSlot[];
  isLoading: boolean;
  error?: Error | null;
  onSlotClick: (slot: BookingSlot) => void;
  selectedSlot?: BookingSlot | null;
}

export interface FilterBarProps {
  filters: {
    activeFilters: BookingFilters;
    updateFilter: (key: keyof BookingFilters, value: any) => void;
    clearAllFilters: () => void;
    hasActiveFilters: boolean;
  };
  provider: ProviderPublicData;
}

export interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: CalendarViewMode;
  onDateChange: (date: Date) => void;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}
