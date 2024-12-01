'use client';

import { memo } from 'react';

import { format, isValid, setHours, setMinutes } from 'date-fns';

import { Input } from '@/components/ui/input';

interface TimePickerProps {
  date?: Date;
  onChange?: (date: Date) => void;
}

export const TimePicker = memo(({ date, onChange }: TimePickerProps) => {
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(':');
    const newDate = setHours(setMinutes(date || new Date(), parseInt(minutes)), parseInt(hours));
    onChange?.(newDate);
  };

  const formattedTime = date && isValid(date) ? format(date, 'HH:mm') : '00:00';

  return <Input type="time" value={formattedTime} onChange={handleTimeChange} />;
});

TimePicker.displayName = 'TimePicker';
