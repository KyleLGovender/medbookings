import { CalendarEvent } from '@/features/calendar/types/types';

/**
 * Standardized interface for all calendar view components
 * Ensures consistent prop signatures across different view types
 */
export interface BaseCalendarViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  workingHours: { start: string; end: string };
  onEventClick?: (event: CalendarEvent, clickEvent?: React.MouseEvent) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
  onDateClick?: (date: Date) => void;
  getEventStyle: (event: CalendarEvent) => string;
}

/**
 * Props for DayView component
 */
export interface DayViewProps extends BaseCalendarViewProps {
  // DayView uses all base props
}

/**
 * Props for WeekView component  
 */
export interface WeekViewProps extends BaseCalendarViewProps {
  // WeekView uses all base props
}

/**
 * Props for ThreeDayView component
 */
export interface ThreeDayViewProps extends BaseCalendarViewProps {
  // ThreeDayView uses all base props
}

/**
 * Props for MonthView component
 * MonthView has some different requirements due to space constraints
 */
export interface MonthViewProps extends Omit<BaseCalendarViewProps, 'workingHours' | 'onTimeSlotClick'> {
  // MonthView doesn't need workingHours (shows full day) or timeSlotClick (uses dateClick)
  onEditEvent?: (event: CalendarEvent) => void;
}