'use client';

import { useEffect, useMemo, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';

import { dayOfWeekOptions } from '../../availability/lib/recurrence-utils';
import { customRecurrenceDataSchema } from '../../availability/types/schemas';
import { CustomRecurrenceData, DayOfWeek } from '../../availability/types/types';

interface CustomRecurrenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CustomRecurrenceData) => void;
  initialData?: CustomRecurrenceData;
}

type FormData = z.infer<typeof customRecurrenceDataSchema>;

export function CustomRecurrenceModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: CustomRecurrenceModalProps) {
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(initialData?.selectedDays || []);

  // Calculate 4 weeks from today as default end date - memoized to prevent infinite loops
  const fourWeeksFromNow = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 28);
    return date;
  }, []);

  const form = useForm<FormData>({
    resolver: zodResolver(customRecurrenceDataSchema),
    defaultValues: {
      selectedDays: initialData?.selectedDays || [],
      endDate: initialData?.endDate || fourWeeksFromNow,
    },
  });

  // Update form when initial data changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        selectedDays: initialData.selectedDays,
        endDate: initialData.endDate,
      });
      setSelectedDays(initialData.selectedDays);
    } else {
      // Set default values for new modal
      form.reset({
        selectedDays: [],
        endDate: fourWeeksFromNow,
      });
      setSelectedDays([]);
    }
  }, [initialData, form, fourWeeksFromNow]);

  const handleDayToggle = (day: DayOfWeek) => {
    const newSelectedDays = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];

    setSelectedDays(newSelectedDays);
    form.setValue('selectedDays', newSelectedDays);
  };

  const handleSave = (data: FormData) => {
    onSave(data);
    onClose();
  };

  const handleCancel = () => {
    // Reset form to initial state or defaults
    if (initialData) {
      form.reset({
        selectedDays: initialData.selectedDays,
        endDate: initialData.endDate,
      });
      setSelectedDays(initialData.selectedDays);
    } else {
      form.reset({
        selectedDays: [],
        endDate: fourWeeksFromNow,
      });
      setSelectedDays([]);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Custom recurrence</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
            <div className="space-y-4">
              {/* Repeat every section */}
              <div className="flex items-center gap-2">
                <Label>Repeat every</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">1</span>
                  <span className="text-sm text-muted-foreground">week</span>
                </div>
              </div>

              {/* Days of week selection */}
              <div className="space-y-2">
                <Label>Repeat on</Label>
                <div className="flex gap-2">
                  {dayOfWeekOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleDayToggle(option.value)}
                      className={`h-8 w-8 rounded-full text-sm font-medium transition-colors ${
                        selectedDays.includes(option.value)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.shortLabel}
                    </button>
                  ))}
                </div>
                <FormField
                  control={form.control}
                  name="selectedDays"
                  render={() => <FormMessage />}
                />
              </div>

              {/* End date section */}
              <div className="space-y-2">
                <Label>Ends on</Label>
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <DatePicker date={field.value} onChange={(date) => field.onChange(date)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit">Done</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
