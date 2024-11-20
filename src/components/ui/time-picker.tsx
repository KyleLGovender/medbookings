'use client';

import { format } from 'date-fns';

import { Input } from '@/components/ui/input';

interface TimePickerProps {
  date?: Date;
  onChange?: (date: Date) => void;
}

export function TimePicker({ date = new Date(), onChange }: TimePickerProps) {
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(':');
    const newDate = new Date(date);
    newDate.setHours(parseInt(hours, 10));
    newDate.setMinutes(parseInt(minutes, 10));
    onChange?.(newDate);
  };

  return <Input type="time" value={format(date, 'HH:mm')} onChange={handleTimeChange} />;
}
