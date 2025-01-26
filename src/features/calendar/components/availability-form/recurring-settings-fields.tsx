'use client';

import { Control, UseFormReturn } from 'react-hook-form';

import { DatePicker } from '@/components/ui/date-picker';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';

import { type AvailabilityFormValues } from '../../lib/types';

interface RecurringSettingsFieldsProps {
  control: Control<AvailabilityFormValues>;
  form: UseFormReturn<AvailabilityFormValues>;
}

export function RecurringSettingsFields({ control, form }: RecurringSettingsFieldsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Recurring Settings</h3>

      <FormField
        control={control}
        name="isRecurring"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between">
            <FormLabel>Make Recurring</FormLabel>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Only show these fields if isRecurring is true */}
      <FormField
        control={control}
        name="recurringDays"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Repeat on Days</FormLabel>
            <div className="flex gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    const newDays = field.value.includes(index)
                      ? field.value.filter((d) => d !== index)
                      : [...field.value, index];
                    field.onChange(newDays);
                  }}
                  className={`h-10 w-10 rounded-full p-2 ${
                    field.value.includes(index)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="recurrenceEndDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>End Date</FormLabel>
            <DatePicker
              date={field.value || undefined}
              onChange={field.onChange}
              defaultMonth={form.watch('date')}
            />
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
