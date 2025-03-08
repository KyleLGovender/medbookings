'use client';

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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { generateDaysForWeekCalendar } from '@/features/calendar/lib/helper';
import { AvailabilitySlot, AvailabilityView } from '@/features/calendar/lib/types';

interface CalendarViewSlotsGridProps {
  rangeStartDate: Date;
  onDateChange: (date: Date) => void;
  onViewChange?: (view: 'day') => void;
  availabilityData: AvailabilityView[];
  serviceProviderId: string;
  onRefresh: () => Promise<void>;
  onView: (slot: AvailabilitySlot) => void;
  onEdit: (availability: AvailabilityView) => void;
  selectedServiceId?: string;
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

function formatDateRange(weekDays: { date: Date }[]): string {
  if (!weekDays.length) return '';

  const startDate = weekDays[0].date;
  const endDate = weekDays[weekDays.length - 1].date;

  return `${startDate.toLocaleDateString('en-US', { weekday: 'short' })} ${startDate.getDate()} ${startDate.toLocaleDateString('en-US', { month: 'short' })} - ${endDate.toLocaleDateString('en-US', { weekday: 'short' })} ${endDate.getDate()} ${endDate.toLocaleDateString('en-US', { month: 'short' })}`;
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
}: CalendarViewSlotsGridProps) {
  const container = useRef<HTMLDivElement>(null);
  const containerNav = useRef<HTMLDivElement>(null);
  const containerOffset = useRef<HTMLDivElement>(null);

  const weekDays = useMemo(() => {
    return generateDaysForWeekCalendar(rangeStartDate);
  }, [rangeStartDate]);

  // Generate time slots (9:00 to 17:00)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      slots.push(new Date(new Date().setHours(hour, 0, 0, 0)));
    }
    return slots;
  }, []);

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

          const rowIndex = hour - 9; // Adjust for our 9-17 range
          if (rowIndex >= 0 && rowIndex < rows.length) {
            rows[rowIndex][dayKey].push(slot);
          }
        }
      });
    }

    return rows;
  }, [timeSlots, availabilityData, selectedServiceId]);

  useEffect(() => {
    if (!container.current || !containerNav.current || !containerOffset.current) return;

    const updateScrollPosition = () => {
      const currentMinute = new Date().getHours() * 60 + new Date().getMinutes();
      container.current!.scrollTop =
        ((container.current!.scrollHeight -
          containerNav.current!.offsetHeight -
          containerOffset.current!.offsetHeight) *
          currentMinute) /
        1440;
    };

    updateScrollPosition();

    const intervalId = setInterval(updateScrollPosition, 60000);

    return () => clearInterval(intervalId);
  }, []);

  console.log('Selected Service ID:', selectedServiceId);
  console.log('organizedSlots:', tableData);

  const getSlotColor = useCallback((slot: AvailabilitySlot) => {
    const now = new Date();
    const startTime = new Date(slot.startTime);

    if (startTime < now) {
      return 'bg-gray-200 text-gray-600 hover:bg-gray-300 cursor-not-allowed';
    }
    if (slot.booking) {
      return 'bg-blue-500 text-white hover:bg-blue-600';
    }
    return 'bg-green-500 text-white hover:bg-green-600';
  }, []);

  return (
    <div className="w-full">
      <Table className="table-fixed border-x border-gray-100">
        <TableHeader>
          <TableRow className="divide-x divide-gray-100">
            <TableHead className="w-24 text-center">Time</TableHead>
            {weekDays.map((day, index) => (
              <TableHead key={index} className="w-[14.28%] text-center">
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
                <TableCell className="w-24 text-center font-medium">
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
                          <TooltipProvider key={slot.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => onView(slot)}
                                  variant="default"
                                  className={`w-full ${getSlotColor(slot)}`}
                                >
                                  {new Date(slot.startTime).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false,
                                  })}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {slot.booking
                                    ? `Booked: ${slot.booking.client.name}`
                                    : 'Available'}
                                </p>
                                <p>
                                  {new Date(slot.startTime).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false,
                                  })}{' '}
                                  -{' '}
                                  {new Date(slot.endTime).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false,
                                  })}
                                </p>
                                <p>{slot.service.name}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
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
