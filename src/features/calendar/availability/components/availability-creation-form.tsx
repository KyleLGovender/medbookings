'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Clock, MapPin, Repeat } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { TimePicker } from '@/components/ui/time-picker';
import { useCreateAvailability } from '@/features/calendar/availability/hooks/use-availability';
import { createSimpleRecurrencePattern, getRecurrenceOptions } from '@/features/calendar/availability/lib/recurrence-utils';
import { createAvailabilityDataSchema } from '@/features/calendar/availability/types/schemas';
import {
  CreateAvailabilityData,
  CustomRecurrenceData,
  RecurrenceOption,
  SchedulingRule,
} from '@/features/calendar/availability/types/types';
import { useCurrentUserOrganizations } from '@/features/organizations/hooks/use-current-user-organizations';
import { useOrganizationLocations } from '@/features/organizations/hooks/use-organization-locations';
import { useProviderAssociatedServices } from '@/features/providers/hooks/use-provider-associated-services';
import { useToast } from '@/hooks/use-toast';

import { CustomRecurrenceModal } from './custom-recurrence-modal';
import { ServiceSelectionSection } from './service-selection-section';

interface AvailabilityCreationFormProps {
  serviceProviderId: string;
  organizationId?: string;
  locationId?: string;
  onSuccess?: (data: any) => void;
  onCancel?: () => void;
}

type FormValues = CreateAvailabilityData;

export function AvailabilityCreationForm({
  serviceProviderId,
  organizationId,
  locationId,
  onSuccess,
  onCancel,
}: AvailabilityCreationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customRecurrenceModalOpen, setCustomRecurrenceModalOpen] = useState(false);
  const [currentRecurrenceOption, setCurrentRecurrenceOption] = useState<RecurrenceOption>(RecurrenceOption.NONE);
  const [customRecurrenceData, setCustomRecurrenceData] = useState<CustomRecurrenceData | undefined>();
  const { toast } = useToast();

  // Fetch provider's services
  const {
    data: availableServices,
    isLoading: isServicesLoading,
    error: servicesError,
  } = useProviderAssociatedServices(serviceProviderId);

  // Fetch user's organizations and their locations
  const { data: userOrganizations = [] } = useCurrentUserOrganizations();
  const organizationIds = userOrganizations.map((org: any) => org.id);
  const { data: availableLocations = [], isLoading: isLocationsLoading } =
    useOrganizationLocations(organizationIds);

  const form = useForm<FormValues>({
    resolver: zodResolver(createAvailabilityDataSchema),
    defaultValues: {
      serviceProviderId,
      organizationId,
      locationId: locationId || undefined,
      startTime: new Date(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      isRecurring: false,
      schedulingRule: SchedulingRule.CONTINUOUS,
      isOnlineAvailable: true,
      requiresConfirmation: false,
      services: [],
    },
    mode: 'onChange',
  });

  const createMutation = useCreateAvailability({
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Availability created successfully',
      });
      onSuccess?.(data);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const watchIsRecurring = form.watch('isRecurring');
  const watchSchedulingRule = form.watch('schedulingRule');
  const watchIsOnlineAvailable = form.watch('isOnlineAvailable');

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync(data);
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomRecurrenceSave = (data: CustomRecurrenceData) => {
    const startTime = form.watch('startTime');
    const pattern = createSimpleRecurrencePattern(
      RecurrenceOption.CUSTOM,
      startTime,
      data.selectedDays,
      data.endDate ? data.endDate.toISOString().split('T')[0] : undefined
    );
    
    form.setValue('simpleRecurrence', pattern);
    form.setValue('isRecurring', true);
    setCustomRecurrenceData(data);
    setCustomRecurrenceModalOpen(false);
  };

  const handleCustomRecurrenceCancel = () => {
    setCustomRecurrenceModalOpen(false);
  };

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Create Availability
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Time Settings */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date & Time</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <DatePicker
                          date={field.value}
                          onChange={(date) => {
                            if (date) {
                              const newDateTime = new Date(field.value);
                              newDateTime.setFullYear(date.getFullYear());
                              newDateTime.setMonth(date.getMonth());
                              newDateTime.setDate(date.getDate());
                              field.onChange(newDateTime);
                            }
                          }}
                        />
                        <TimePicker date={field.value} onChange={field.onChange} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date & Time</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <DatePicker
                          date={field.value}
                          onChange={(date) => {
                            if (date) {
                              const newDateTime = new Date(field.value);
                              newDateTime.setFullYear(date.getFullYear());
                              newDateTime.setMonth(date.getMonth());
                              newDateTime.setDate(date.getDate());
                              field.onChange(newDateTime);
                            }
                          }}
                        />
                        <TimePicker date={field.value} onChange={field.onChange} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Recurrence Settings */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-medium">
                <Repeat className="h-4 w-4" />
                Recurrence Settings
              </h3>

              <FormField
                control={form.control}
                name="simpleRecurrence"
                render={({ field }) => {
                  const startTime = form.watch('startTime');
                  const recurrenceOptions = getRecurrenceOptions(startTime);
                  
                  return (
                    <FormItem>
                      <FormLabel>Recurrence</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          const option = value as RecurrenceOption;
                          setCurrentRecurrenceOption(option);
                          
                          if (option === RecurrenceOption.CUSTOM) {
                            setCustomRecurrenceModalOpen(true);
                          } else {
                            const pattern = createSimpleRecurrencePattern(option, startTime);
                            field.onChange(pattern);
                            form.setValue('isRecurring', option !== RecurrenceOption.NONE);
                          }
                        }}
                        defaultValue={field.value?.option || RecurrenceOption.NONE}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select recurrence" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {recurrenceOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose how often this availability should repeat.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <Separator />

            {/* Scheduling Rules */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-medium">
                <Clock className="h-4 w-4" />
                Scheduling Rules
              </h3>

              <FormField
                control={form.control}
                name="schedulingRule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Appointment Scheduling</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select scheduling rule" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={SchedulingRule.CONTINUOUS}>
                          Continuous - Appointments start immediately after previous ends
                        </SelectItem>
                        <SelectItem value={SchedulingRule.ON_THE_HOUR}>
                          On the Hour - Appointments start only on the hour (9:00, 10:00, 11:00)
                        </SelectItem>
                        <SelectItem value={SchedulingRule.ON_THE_HALF_HOUR}>
                          On the Half Hour - Appointments start on the hour or half-hour (9:00,
                          9:30, 10:00)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      This determines when appointments can be scheduled within your availability
                      period.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Location Section */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-medium">
                <MapPin className="h-4 w-4" />
                Location
              </h3>

              {/* Online Availability Toggle */}
              <FormField
                control={form.control}
                name="isOnlineAvailable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Available Online</FormLabel>
                      <FormDescription>Allow virtual appointments via video call</FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {/* Physical Location Selection */}
              {isLocationsLoading ? (
                <div className="py-4 text-center text-muted-foreground">Loading locations...</div>
              ) : (
                <FormField
                  control={form.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Physical Location{!watchIsOnlineAvailable && ' (Required)'}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || undefined}
                        required={!watchIsOnlineAvailable}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a physical location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableLocations.map((location: any) => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {watchIsOnlineAvailable
                          ? 'Select a physical location for in-person appointments (optional)'
                          : 'You must select a physical location when online availability is disabled'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Separator />

            {/* Service Selection */}
            {isServicesLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading services...</div>
            ) : servicesError ? (
              <div className="py-8 text-center text-destructive">Failed to load services.</div>
            ) : (
              <ServiceSelectionSection
                serviceProviderId={serviceProviderId}
                organizationId={organizationId}
                availableServices={(availableServices || []).map((s) => ({
                  ...s,
                  description: s.description ?? undefined,
                }))}
              />
            )}

            <Separator />

            {/* Additional Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Additional Settings</h3>

              <FormField
                control={form.control}
                name="requiresConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Requires Confirmation</FormLabel>
                      <FormDescription>
                        Manually approve bookings for this availability
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
                {isSubmitting ? 'Creating...' : 'Create Availability'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      
      {/* Custom Recurrence Modal */}
      <CustomRecurrenceModal
        isOpen={customRecurrenceModalOpen}
        onClose={handleCustomRecurrenceCancel}
        onSave={handleCustomRecurrenceSave}
        initialData={customRecurrenceData}
      />
    </Card>
  );
}
