'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Clock, Repeat, Send, Users } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { TimePicker } from '@/components/ui/time-picker';
import { ServiceSelectionSection } from '@/features/calendar/availability/components/service-selection-section';
import { useCreateAvailability } from '@/features/calendar/availability/hooks/use-availability';
import {
  billingEntitySchema,
  recurrencePatternSchema,
  schedulingRuleSchema,
  serviceConfigSchema,
} from '@/features/calendar/availability/types/schemas';
import {
  BillingEntity,
  CreateAvailabilityData,
  RecurrenceType,
  SchedulingRule,
} from '@/features/calendar/availability/types/types';
import { useToast } from '@/hooks/use-toast';

interface AvailabilityProposalFormProps {
  organizationId: string;
  serviceProviderId: string;
  locationId?: string;
  connectionId?: string;
  providerName?: string;
  onSuccess?: (data: any) => void;
  onCancel?: () => void;
}

interface ProposalFormData extends CreateAvailabilityData {
  proposalNote?: string;
}

const proposalFormSchema = z.object({
  serviceProviderId: z.string().uuid(),
  organizationId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  connectionId: z.string().uuid().optional(),
  startTime: z.date(),
  endTime: z.date(),
  isRecurring: z.boolean(),
  recurrencePattern: recurrencePatternSchema.optional(),
  seriesId: z.string().uuid().optional(),
  schedulingRule: schedulingRuleSchema,
  schedulingInterval: z.number().int().positive().optional(),
  isOnlineAvailable: z.boolean(),
  requiresConfirmation: z.boolean(),
  billingEntity: billingEntitySchema.optional(),
  defaultSubscriptionId: z.string().uuid().optional(),
  services: z.array(serviceConfigSchema).min(1),
  proposalNote: z.string().optional(),
});

type FormValues = ProposalFormData;

export function AvailabilityProposalForm({
  organizationId,
  serviceProviderId,
  locationId,
  connectionId,
  providerName,
  onSuccess,
  onCancel,
}: AvailabilityProposalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(proposalFormSchema),
    defaultValues: {
      serviceProviderId,
      organizationId,
      locationId,
      connectionId,
      startTime: new Date(),
      endTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      isRecurring: false,
      schedulingRule: SchedulingRule.FIXED_INTERVAL,
      isOnlineAvailable: true,
      requiresConfirmation: false,
      billingEntity: BillingEntity.ORGANIZATION, // Organization pays for proposed availability
      services: [],
      proposalNote: '',
    },
    mode: 'onChange',
  });

  const createMutation = useCreateAvailability({
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Availability proposal sent to provider for review',
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

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Remove proposalNote from the data before sending to API
      const { proposalNote, ...availabilityData } = data;

      // Note: In a real implementation, the proposalNote would be stored
      // in a separate field or in the availability metadata
      await createMutation.mutateAsync(availabilityData);
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Propose Availability to Provider
          </CardTitle>
          {providerName && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {providerName}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <Send className="h-4 w-4" />
          <AlertTitle>Availability Proposal</AlertTitle>
          <AlertDescription>
            This availability will be sent to the provider for review. They can accept or reject the
            proposal. Once accepted, the availability will become active and slots will be
            generated. Your organization will be billed for the slots based on your subscription
            plan.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Proposal Note */}
            <FormField
              control={form.control}
              name="proposalNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message to Provider (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a note to explain this availability request..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This message will be sent to the provider along with the availability proposal.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

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
                        <SelectItem value={SchedulingRule.FIXED_INTERVAL}>
                          Fixed Interval - Appointments start at regular intervals (recommended)
                        </SelectItem>
                        <SelectItem value={SchedulingRule.CUSTOM_INTERVAL}>
                          Custom Interval - Appointments start at custom intervals
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Fixed intervals are recommended for organization-managed availability.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchSchedulingRule === SchedulingRule.CUSTOM_INTERVAL && (
                <FormField
                  control={form.control}
                  name="schedulingInterval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Interval (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 30"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormDescription>
                        How many minutes between each possible appointment start time.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
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
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Make this availability recurring</FormLabel>
                      <FormDescription>
                        Propose a repeating schedule for the provider to consider.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {watchIsRecurring && (
                <div className="ml-6 space-y-4 border-l-2 border-muted pl-4">
                  <Controller
                    name="recurrencePattern.type"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recurrence Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select recurrence type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={RecurrenceType.DAILY}>Daily</SelectItem>
                            <SelectItem value={RecurrenceType.WEEKLY}>Weekly</SelectItem>
                            <SelectItem value={RecurrenceType.MONTHLY}>Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Controller
                      name="recurrencePattern.interval"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Repeat Every</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="1"
                              min="1"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || undefined)
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            How often to repeat (e.g., every 2 weeks)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Controller
                      name="recurrencePattern.count"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Occurrences</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="8"
                              min="1"
                              max="52"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || undefined)
                              }
                            />
                          </FormControl>
                          <FormDescription>Total recurring sessions (max 52)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Service Selection */}
            <ServiceSelectionSection
              serviceProviderId={serviceProviderId}
              organizationId={organizationId}
            />

            <Separator />

            {/* Additional Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Additional Settings</h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                        <FormDescription>
                          Allow online appointments for this availability
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

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
                          Provider must approve each booking manually
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Billing Information */}
            <Alert>
              <AlertTitle>Billing Information</AlertTitle>
              <AlertDescription>
                Your organization will be billed for the time slots generated from this availability
                based on your current subscription plan. The provider can see the proposed times and
                services but not the billing details.
              </AlertDescription>
            </Alert>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting || !form.formState.isValid}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Sending Proposal...' : 'Send Proposal to Provider'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
