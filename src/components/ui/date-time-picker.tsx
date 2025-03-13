'use client';

import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DateTimePickerProps {
  date: Date;
  setDate: (date: Date) => void;
}

export function DateTimePicker({ date, setDate }: DateTimePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP HH:mm:ss') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => selectedDate && setDate(selectedDate)}
          initialFocus
        />
        <div className="border-t p-3">
          <Input
            type="time"
            value={date ? format(date, 'HH:mm') : ''}
            onChange={(e) => {
              const [hours, minutes] = e.target.value.split(':');
              const newDate = new Date(date);
              newDate.setHours(parseInt(hours));
              newDate.setMinutes(parseInt(minutes));
              setDate(newDate);
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
