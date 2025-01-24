"use client";

import { useState } from "react";

import { formatTime } from "@/lib/helper";
import { cn } from "@/lib/utils";

interface CalendarViewEventItemProps {
  schedule: {
    id: string;
    type: "BOOKING";
    startTime: string;
    endTime: string;
    client: {
      name: string | null;
    };
    bookings?: Array<{
      id: string;
      client: {
        name: string | null;
      };
      isOnline: boolean;
    }>;
    maxBookings?: number;
    duration?: number;
    price?: number;
    isOnlineAvailable?: boolean;
    isInPersonAvailable?: boolean;
    isRecurring?: boolean;
  };
  gridPosition: string;
  gridColumn: number;
  onEventClick?: (schedule: CalendarViewEventItemProps["schedule"]) => void;
}

export function CalendarViewEventItem({
  schedule,
  gridPosition,
  gridColumn,
  onEventClick,
}: CalendarViewEventItemProps) {
  console.log("CalendarViewEventItem - Rendering:", {
    id: schedule.id,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    gridPosition,
    gridColumn,
    hasBookings: (schedule.bookings ?? []).length > 0,
  });

  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const hasBookings = (schedule.bookings ?? []).length > 0;

  function getStatusIndicator() {
    if ((schedule.bookings ?? []).length >= (schedule.maxBookings ?? 0)) {
      return "bg-red-500"; // Fully booked
    }
    if ((schedule.bookings ?? []).length > 0) {
      return "bg-yellow-500"; // Partially booked
    }
    return "bg-green-500"; // Available
  }

  return (
    <li
      className={cn("relative mt-px flex", `sm:col-start-${gridColumn}`)}
      style={{ gridRow: gridPosition }}
    >
      <button
        onClick={() => onEventClick?.(schedule)}
        onMouseEnter={() => setIsTooltipVisible(true)}
        onMouseLeave={() => setIsTooltipVisible(false)}
        className={cn(
          "group absolute inset-1 flex w-full flex-col overflow-y-auto rounded-lg p-2 text-xs/5",
          "transition-colors duration-200",
          hasBookings
            ? "bg-green-50 hover:bg-green-100"
            : "bg-blue-50 hover:bg-blue-100",
        )}
      >
        {/* Status Indicator */}
        <span
          className={cn(
            "absolute right-1 top-1 size-2 rounded-full",
            getStatusIndicator(),
          )}
        />

        {/* Main Content */}
        <div className="flex flex-col gap-0.5">
          <p
            className={cn(
              "order-1 font-semibold",
              hasBookings ? "text-green-700" : "text-blue-700",
            )}
          >
            {hasBookings
              ? `Booked (${schedule.bookings?.length}/${schedule.maxBookings})`
              : "Available"}
          </p>

          <p
            className={cn(
              "text-xs",
              hasBookings ? "text-green-500" : "text-blue-500",
            )}
          >
            {formatTime(new Date(schedule.startTime))}
            {" - "}
            {formatTime(new Date(schedule.endTime))}
          </p>

          {/* Additional Info (shown if space allows) */}
          <div className="mt-1 hidden flex-col gap-0.5 text-xs text-gray-500 group-hover:flex">
            <p>Duration: {schedule.duration}min</p>
            <p>Price: R{schedule.price}</p>
            <p>
              {[
                schedule.isOnlineAvailable && "Online",
                schedule.isInPersonAvailable && "In-Person",
              ]
                .filter(Boolean)
                .join(" | ")}
            </p>
            {schedule.isRecurring && <p>Recurring</p>}
          </div>
        </div>

        {/* Tooltip */}
        {isTooltipVisible && (
          <div className="absolute left-full top-0 z-50 ml-2 w-48 rounded-lg bg-white p-2 text-xs shadow-lg ring-1 ring-gray-200">
            <div className="flex flex-col gap-1">
              <p className="font-semibold">
                {hasBookings
                  ? `Booked (${schedule.bookings?.length}/${schedule.maxBookings})`
                  : "Available"}
              </p>
              <p>Duration: {schedule.duration}min</p>
              <p>Price: R{schedule.price}</p>
              <p>
                {[
                  schedule.isOnlineAvailable && "Online",
                  schedule.isInPersonAvailable && "In-Person",
                ]
                  .filter(Boolean)
                  .join(" | ")}
              </p>
              {schedule.isRecurring && <p>Recurring</p>}
              {hasBookings && (
                <div className="mt-1 border-t pt-1">
                  <p className="font-semibold">Bookings:</p>
                  {schedule.bookings?.map((booking) => (
                    <p key={booking.id} className="text-gray-600">
                      {booking.client.name} (
                      {booking.isOnline ? "Online" : "In-Person"})
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </button>
    </li>
  );
}
