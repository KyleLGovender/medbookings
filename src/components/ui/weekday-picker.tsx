"use client";

import { forwardRef } from "react";

import { Button } from "@/components/ui/button";

const WEEKDAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

interface WeekdayPickerProps {
  value: number[];
  onChange: (days: number[]) => void;
}

export const WeekdayPicker = forwardRef<HTMLDivElement, WeekdayPickerProps>(
  ({ value = [], onChange }, ref) => {
    const toggleDay = (dayValue: number) => {
      const isSelected = value.includes(dayValue);
      const newValue = isSelected
        ? value.filter((d) => d !== dayValue)
        : [...value, dayValue].sort((a, b) => a - b);

      onChange(newValue);
    };

    return (
      <div ref={ref} className="flex flex-wrap gap-1">
        {WEEKDAYS.map(({ value: dayValue, label }) => (
          <Button
            key={label}
            type="button"
            variant={value.includes(dayValue) ? "default" : "outline"}
            size="sm"
            className="h-9 w-12"
            onClick={() => toggleDay(dayValue)}
          >
            {label}
          </Button>
        ))}
      </div>
    );
  },
);

WeekdayPicker.displayName = "WeekdayPicker";
