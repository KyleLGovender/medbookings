'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { generateDaysForWeekCalendar } from '@/features/calendar/lib/helper';
import {
  AvailabilitySlot,
  AvailabilityView,
  CalendarViewType,
  TimeRange,
} from '@/features/calendar/lib/types';

interface CalendarViewSlotsGridProps {
  rangeStartDate: Date;
  onDateChange: (date: Date, fromView: CalendarViewType) => void;
  onViewChange?: (view: 'day') => void;
  availabilityData: AvailabilityView[];
  serviceProviderId: string;
  onRefresh: () => Promise<void>;
  onView: (slot: AvailabilitySlot) => void;
  onEdit: (availability: AvailabilityView) => void;
  selectedServiceId?: string;
  timeRange: TimeRange;
}

interface TimeSlotRow {
  time: Date;
  monday: AvailabilitySlot[];
  tuesday: AvailabilitySlot[];
  wednesday: AvailabilitySlot[];
  thursday: AvailabilitySlot[];
  friday: AvailabilitySlot[];
  saturday: AvailabilitySlot[];
  sunday: AvailabilitySlot[];
}

export function CalendarViewSlotsGrid({
  rangeStartDate,
  onDateChange,
  onViewChange = () => {},
  availabilityData = [],
  serviceProviderId,
  onRefresh,
  onView,
  onEdit,
  selectedServiceId,
  timeRange,
}: CalendarViewSlotsGridProps) {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  const containerNav = useRef<HTMLDivElement>(null);
  const containerOffset = useRef<HTMLDivElement>(null);

  const weekDays = useMemo(() => {
    return generateDaysForWeekCalendar(rangeStartDate);
  }, [rangeStartDate]);

  // Generate time slots based on timeRange
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = timeRange.earliestTime; hour <= timeRange.latestTime; hour++) {
      slots.push(new Date(new Date().setHours(hour, 0, 0, 0)));
    }
    return slots;
  }, [timeRange]);

  // Create table data structure
  const tableData = useMemo(() => {
    const rows: TimeSlotRow[] = timeSlots.map((timeSlot) => ({
      time: timeSlot,
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    }));

    if (selectedServiceId) {
      const allSlots = availabilityData.flatMap((availability) => availability.slots);

      allSlots.forEach((slot) => {
        if (slot.service.id === selectedServiceId) {
          const slotDate = new Date(slot.startTime);
          const hour = slotDate.getHours();
          const dayIndex = slotDate.getDay();
          const dayKey = [
            'sunday',
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
          ][dayIndex] as keyof Omit<TimeSlotRow, 'time'>;

          // Adjust row index based on timeRange
          const rowIndex = hour - timeRange.earliestTime;
          if (rowIndex >= 0 && rowIndex < rows.length) {
            rows[rowIndex][dayKey].push(slot);
          }
        }
      });
    }

    return rows;
  }, [timeSlots, availabilityData, selectedServiceId, timeRange]);

  useEffect(() => {
    if (!container.current || !containerNav.current || !containerOffset.current) return;

    const updateScrollPosition = () => {
      const currentHour = new Date().getHours();
      const totalHours = timeRange.latestTime - timeRange.earliestTime;
      const hourProgress = (currentHour - timeRange.earliestTime) / totalHours;

      container.current!.scrollTop =
        (container.current!.scrollHeight -
          containerNav.current!.offsetHeight -
          containerOffset.current!.offsetHeight) *
        hourProgress;
    };

    updateScrollPosition();
    const intervalId = setInterval(updateScrollPosition, 60000);

    return () => clearInterval(intervalId);
  }, [timeRange]);

  const getSlotColor = useCallback((slot: AvailabilitySlot) => {
    const now = new Date();
    const startTime = new Date(slot.startTime);

    if (startTime < now) {
      return 'bg-gray-200 text-gray-600 hover:bg-gray-300 cursor-not-allowed';
    }
    if (slot.booking) {
      return 'bg-blue-500 text-white hover:bg-blue-800';
    }
    return 'bg-green-500 text-white hover:bg-green-800';
  }, []);

  // Handle slot click to navigate to booking page
  const handleSlotClick = (slot: AvailabilitySlot) => {
    const now = new Date();
    const startTime = new Date(slot.startTime);

    // Only navigate if the slot is in the future and not already booked
    if (startTime > now && !slot.booking) {
      router.push(`/calendar/booking/${slot.id}`);
    }
  };

  return (
    <div className="w-full">
      <Table className="table-fixed border-x border-gray-100">
        <TableHeader>
          <TableRow className="divide-x divide-gray-100">
            <TableHead className="w-12 text-center text-xs sm:w-24 sm:text-sm">Time</TableHead>
            {weekDays.map((day, index) => (
              <TableHead key={index} className="w-[14.28%] text-center text-xs sm:text-sm">
                {day.date.toLocaleDateString('en-US', { weekday: 'short' })} {day.date.getDate()}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {!selectedServiceId ? (
            <TableRow>
              <TableCell colSpan={8} className="py-8 text-center text-gray-500">
                <div className="mb-2 text-xl font-semibold">Please select a service</div>
                In order to see the available time slots you need to select a service.
              </TableCell>
            </TableRow>
          ) : !availabilityData?.length ? (
            <TableRow>
              <TableCell colSpan={8} className="py-8 text-center text-gray-500">
                <div className="mb-2 text-xl font-semibold">No availability found</div>
                There is no availability data for this week. Please select a different week.
              </TableCell>
            </TableRow>
          ) : (
            tableData.map((row, index) => (
              <TableRow key={index} className="divide-x divide-gray-100">
                <TableCell className="w-12 text-center text-xs font-medium sm:w-24 sm:text-sm">
                  {row.time.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </TableCell>
                {weekDays.map((day, dayIndex) => {
                  const dayKey = day.date
                    .toLocaleDateString('en-US', { weekday: 'long' })
                    .toLowerCase() as keyof Omit<TimeSlotRow, 'time'>;
                  return (
                    <TableCell key={dayIndex} className="w-[14.28%] p-2">
                      <div className="flex flex-col items-stretch gap-2">
                        {row[dayKey].map((slot) => (
                          <Button
                            key={slot.id}
                            variant="default"
                            className={`w-full text-xs sm:text-sm ${getSlotColor(slot)}`}
                            onClick={() => handleSlotClick(slot)}
                          >
                            {new Date(slot.startTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                            })}
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
