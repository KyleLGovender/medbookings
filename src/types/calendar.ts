// src/types/calendar.ts
export const CalendarViewType = {
  slots: 'slots',
} as const;

export const ServiceProviderCalendarViewType = {
  day: 'day',
  week: 'week',
  schedule: 'schedule',
} as const;

export type CalendarViewType = (typeof CalendarViewType)[keyof typeof CalendarViewType];
export type ServiceProviderCalendarViewType =
  (typeof ServiceProviderCalendarViewType)[keyof typeof ServiceProviderCalendarViewType];

export interface TimeRange {
  earliestTime: number; // 24-hour format (e.g., 9 for 9:00, 13 for 13:00)
  latestTime: number; // 24-hour format (e.g., 17 for 17:00)
}
