import type { RouterOutputs } from '@/utils/api';

// Type aliases for the different event data types from tRPC
export type SlotData = RouterOutputs['calendar']['getProviderSlots'][number];
export type AvailabilitySearchResult = RouterOutputs['calendar']['searchAvailability'];
export type AvailabilityData = AvailabilitySearchResult[number];

/**
 * Props for Availability-specific view components
 */
export interface BaseAvailabilityViewProps {
  currentDate: Date;
  events: AvailabilityData[];
  workingHours: { start: string; end: string };
  onEventClick?: (availability: AvailabilityData, clickEvent?: React.MouseEvent) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
  onDateClick?: (date: Date) => void;
  getAvailabilityStyle: (availability: AvailabilityData) => string;
}

/**
 * Props for Availability DayView component
 */
export interface AvailabilityDayViewProps extends BaseAvailabilityViewProps {
  // Uses all base props
}

/**
 * Props for Availability WeekView component
 */
export interface AvailabilityWeekViewProps extends BaseAvailabilityViewProps {
  // Uses all base props
}

/**
 * Props for Availability ThreeDayView component
 */
export interface AvailabilityThreeDayViewProps extends BaseAvailabilityViewProps {
  // Uses all base props
}

/**
 * Props for Availability MonthView component
 */
export interface AvailabilityMonthViewProps
  extends Omit<BaseAvailabilityViewProps, 'workingHours' | 'onTimeSlotClick'> {
  // MonthView doesn't need workingHours (shows full day) or timeSlotClick (uses dateClick)
  onEditEvent?: (availability: AvailabilityData) => void;
}

/**
 * Props for Slot-specific view components
 */
export interface BaseSlotViewProps {
  currentDate: Date;
  slots: SlotData[];
  workingHours: { start: string; end: string };
  onSlotClick?: (slot: SlotData, clickEvent?: React.MouseEvent) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
  onDateClick?: (date: Date) => void;
  getSlotStyle: (slot: SlotData) => string;
}

/**
 * Props for Slot DayView component
 */
export interface SlotDayViewProps extends BaseSlotViewProps {
  // Uses all base props
}

/**
 * Props for Slot WeekView component
 */
export interface SlotWeekViewProps extends BaseSlotViewProps {
  // Uses all base props
}

/**
 * Props for Slot ThreeDayView component
 */
export interface SlotThreeDayViewProps extends BaseSlotViewProps {
  // Uses all base props
}

/**
 * Props for Slot MonthView component
 */
export interface SlotMonthViewProps
  extends Omit<BaseSlotViewProps, 'workingHours' | 'onTimeSlotClick'> {
  // MonthView doesn't need workingHours (shows full day) or timeSlotClick (uses dateClick)
  onEditSlot?: (slot: SlotData) => void;
}

// Legacy types for backwards compatibility - will be removed after migration
export interface DayViewProps extends BaseAvailabilityViewProps {}
export interface WeekViewProps extends BaseAvailabilityViewProps {}
export interface ThreeDayViewProps extends BaseAvailabilityViewProps {}
export interface MonthViewProps extends AvailabilityMonthViewProps {}
