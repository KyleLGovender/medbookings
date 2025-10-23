'use client';

import { useEffect, useState } from 'react';

import { format, isValid, parse } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { nowUTC } from '@/lib/timezone';
import { cn } from '@/lib/utils';

interface DatePickerWithInputProps {
  date?: Date;
  defaultMonth?: Date;
  onChange?: (date?: Date) => void;
  placeholder?: string;
}

export function DatePickerWithInput({
  date,
  defaultMonth,
  onChange,
  placeholder = 'Pick a date',
}: DatePickerWithInputProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(
    date && isValid(date) ? format(date, 'yyyy-MM-dd') : ''
  );

  // Update input when date changes externally
  useEffect(() => {
    if (date && isValid(date)) {
      setInputValue(format(date, 'yyyy-MM-dd'));
    } else {
      setInputValue('');
    }
  }, [date]);

  const handleSelect = (selectedDate?: Date) => {
    onChange?.(selectedDate);
    if (selectedDate && isValid(selectedDate)) {
      setInputValue(format(selectedDate, 'yyyy-MM-dd'));
    }
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Parse the input value to a date
    if (value) {
      const parsedDate = parse(value, 'yyyy-MM-dd', nowUTC());
      if (isValid(parsedDate)) {
        onChange?.(parsedDate);
      }
    } else {
      onChange?.(undefined);
    }
  };

  return (
    <div className="flex">
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder="YYYY-MM-DD"
        pattern="\d{4}-\d{2}-\d{2}"
        className="rounded-r-none"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn('rounded-l-none border-l-0', !date && 'text-muted-foreground')}
            onClick={() => setOpen(true)}
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-fit p-0" align="end">
          <Calendar
            mode="single"
            selected={date}
            defaultMonth={defaultMonth}
            onSelect={handleSelect}
            initialFocus
            captionLayout="dropdown-buttons"
            fromYear={1900}
            toYear={nowUTC().getFullYear() + 10}
            classNames={{
              caption_label: 'hidden',
              nav: 'hidden',
              nav_button: 'hidden',
              nav_button_previous: 'hidden',
              nav_button_next: 'hidden',
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
