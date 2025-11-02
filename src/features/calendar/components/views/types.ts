import type { RouterOutputs } from '@/utils/api';

/**
 * ARCHITECTURAL EXCEPTION: RouterOutputs Type Re-exports
 *
 * These types are re-exported from RouterOutputs for use in component prop interfaces below.
 *
 * ⚠️ Normally, CLAUDE.md prohibits exporting RouterOutputs-derived types (see Section 3).
 * However, this file has a special exception because:
 *
 * 1. **Component Prop Interfaces**: The interfaces below (BaseAvailabilityViewProps, etc.)
 *    are legitimate shared prop definitions used by 10+ view components. They MUST reference
 *    these types to ensure type safety across the component tree.
 *
 * 2. **Single Source of Truth**: Having one definition prevents 30+ files from each extracting
 *    and maintaining duplicate type definitions, reducing maintenance burden and inconsistency.
 *
 * 3. **Compile-Time Safety**: TypeScript ensures if RouterOutputs change, all consuming
 *    components are type-checked automatically. Local extraction in each component would
 *    lose this safety.
 *
 * 4. **No Business Logic**: These are pure type definitions with no runtime code. The actual
 *    data fetching still happens via tRPC hooks in components.
 *
 * If refactoring in future: Consider making interfaces generic with type parameters, allowing
 * components to extract types locally while still using shared prop interfaces.
 *
 * Last reviewed: 2025-11-02
 */
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
  onEditEvent?: (availability: AvailabilityData) => void;
  onDeleteEvent?: (availability: AvailabilityData) => void;
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
