"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { TimePicker } from "@/components/ui/time-picker";
import { WeekdayPicker } from "@/components/ui/weekday-picker";
import { useToast } from "@/hooks/use-toast";

import { createAvailability, updateAvailability } from "../lib/actions";
import {
  Availability,
  AvailabilityFormValues,
  availabilityFormSchema,
} from "../lib/types";

interface AvailabilityFormProps {
  serviceProviderId: string;
  availability?: Availability;
  mode: "create" | "edit";
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

export function AvailabilityForm({
  serviceProviderId,
  availability,
  mode,
  onClose,
  onRefresh,
}: AvailabilityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilityFormSchema),
    defaultValues: availability
      ? {
          date: new Date(availability.startTime),
          startTime: new Date(availability.startTime),
          endTime: new Date(availability.endTime),
          duration: availability.duration,
          price: availability.price,
          isOnlineAvailable: availability.isOnlineAvailable,
          isInPersonAvailable: availability.isInPersonAvailable,
          location: availability.location || "",
          isRecurring: availability.isRecurring,
          recurringDays: availability.recurringDays,
          recurrenceEndDate: availability.recurrenceEndDate
            ? new Date(availability.recurrenceEndDate)
            : null,
        }
      : {
          date: new Date(),
          startTime: (() => {
            const now = new Date();
            now.setMinutes(0); // Round to nearest hour
            now.setSeconds(0);
            now.setMilliseconds(0);
            return now;
          })(),
          endTime: (() => {
            const now = new Date();
            now.setMinutes(0);
            now.setSeconds(0);
            now.setMilliseconds(0);
            now.setHours(now.getHours() + 1); // Set to next hour
            return now;
          })(),
          duration: 15,
          price: 600,
          isOnlineAvailable: false,
          isInPersonAvailable: false,
          location: "",
          isRecurring: false,
          recurringDays: [],
          recurrenceEndDate: (() => {
            const date = new Date();
            date.setMonth(date.getMonth() + 3);
            return date;
          })(),
        },
  });

  const {
    formState: { errors },
  } = form;

  async function onSubmit(values: AvailabilityFormValues) {
    setIsSubmitting(true);

    try {
      if (!values.date || !values.startTime || !values.endTime) {
        toast({
          variant: "destructive",
          title: "Missing Fields",
          description: "Please select date and time values",
        });
        setIsSubmitting(false);
        return;
      }

      const startDateTime = new Date(values.date);
      startDateTime.setHours(
        values.startTime.getHours(),
        values.startTime.getMinutes(),
      );

      const endDateTime = new Date(values.date);
      endDateTime.setHours(
        values.endTime.getHours(),
        values.endTime.getMinutes(),
      );

      if (endDateTime <= startDateTime) {
        toast({
          variant: "destructive",
          title: "Invalid Time Range",
          description: "End time must be after start time",
        });
        return;
      }

      // Validate price and duration
      if (values.duration <= 0 || values.price < 0) {
        toast({
          variant: "destructive",
          title: "Invalid Values",
          description:
            "Duration must be positive and price must be non-negative",
        });
        return;
      }

      const formData = new FormData();
      formData.append("serviceProviderId", serviceProviderId);
      formData.append("date", values.date.toISOString());
      formData.append("startTime", startDateTime.toISOString());
      formData.append("endTime", endDateTime.toISOString());
      formData.append(
        "duration",
        String(Math.max(1, Math.round(values.duration))),
      );
      formData.append("price", String(Math.max(0, values.price)));
      formData.append("isOnlineAvailable", String(values.isOnlineAvailable));
      formData.append(
        "isInPersonAvailable",
        String(values.isInPersonAvailable),
      );
      formData.append("location", values.location?.trim() || "");
      formData.append("isRecurring", String(values.isRecurring));

      if (values.isRecurring) {
        if (!values.recurringDays?.length) {
          toast({
            variant: "destructive",
            title: "Invalid Recurring Days",
            description: "Please select at least one recurring day",
          });
          return;
        }
        if (!values.recurrenceEndDate) {
          toast({
            variant: "destructive",
            title: "Invalid End Date",
            description: "Please select a recurrence end date",
          });
          return;
        }
        formData.append("recurringDays", JSON.stringify(values.recurringDays));
        formData.append(
          "recurrenceEndDate",
          values.recurrenceEndDate.toISOString(),
        );
      }

      const response =
        mode === "create"
          ? await createAvailability(formData)
          : await updateAvailability(
              availability?.id.split("-")[0] || "",
              formData,
            );

      if (response.error) {
        // Set field errors if they exist
        if (response.fieldErrors) {
          Object.entries(response.fieldErrors).forEach(([field, errors]) => {
            form.setError(field as any, {
              type: "server",
              message: errors[0],
            });
          });
        }

        // Show toast for form-level errors
        if (response.formErrors?.length) {
          toast({
            variant: "destructive",
            title: "Validation Error",
            description: response.formErrors[0],
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: response.error,
          });
        }

        setIsSubmitting(false);
        return;
      }

      toast({
        title: "Success",
        description:
          mode === "create"
            ? "Availability created successfully"
            : "Availability updated successfully",
      });

      router.refresh();
      await onRefresh();
      onClose();
    } catch (error) {
      console.error("Availability form error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-xl space-y-6"
      >
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="mb-2">Date</FormLabel>
              <DatePicker
                date={field.value}
                onChange={(date) => {
                  if (!date) return;
                  field.onChange(date);
                  const endDate = new Date(date);
                  endDate.setMonth(endDate.getMonth() + 3);
                  form.setValue("recurrenceEndDate", endDate);
                }}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-6">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="mb-2">Start Time</FormLabel>
                <TimePicker
                  date={field.value}
                  onChange={(time) => {
                    const date = form.getValues("date");
                    if (!date) return;

                    const datetime = new Date(date);
                    datetime.setHours(time.getHours());
                    datetime.setMinutes(time.getMinutes());
                    field.onChange(datetime);
                  }}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="mb-2">End Time</FormLabel>
                <TimePicker
                  date={field.value}
                  onChange={(time) => {
                    const date = form.getValues("date");
                    if (!date) return;

                    const datetime = new Date(date);
                    datetime.setHours(time.getHours());
                    datetime.setMinutes(time.getMinutes());
                    field.onChange(datetime);
                  }}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="mb-2">Duration (minutes)</FormLabel>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="mb-2">Price</FormLabel>
                <Input
                  type="number"
                  step="10"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <FormField
              control={form.control}
              name="isOnlineAvailable"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Online Available
                      </FormLabel>
                    </div>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                  {form.formState.errors.root?.message && (
                    <div className="text-sm text-destructive">
                      {form.formState.errors.root.message}
                    </div>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isInPersonAvailable"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        In-Person Available
                      </FormLabel>
                    </div>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                  {form.formState.errors.root?.message && (
                    <div className="text-sm text-destructive">
                      {form.formState.errors.root.message}
                    </div>
                  )}
                </FormItem>
              )}
            />

            {!form.getValues("isOnlineAvailable") &&
              !form.getValues("isInPersonAvailable") && (
                <div className="mt-2 text-sm text-destructive">
                  At least one availability type (Online or In-Person) must be
                  selected
                </div>
              )}

            {form.watch("isInPersonAvailable") && (
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-2">Location</FormLabel>
                    <Input {...field} value={field.value || ""} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <FormField
            control={form.control}
            name="isRecurring"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Recurring Weekly
                    </FormLabel>
                  </div>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.watch("isRecurring") && (
            <>
              <FormField
                control={form.control}
                name="recurringDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recurring Days</FormLabel>
                    <WeekdayPicker {...field} value={field.value || []} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recurrenceEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-2">Recurrence End Date</FormLabel>
                    <DatePicker
                      date={field.value || undefined}
                      defaultMonth={field.value || undefined}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>

        {Object.keys(form.formState.errors).length > 0 && (
          <div className="rounded-lg border border-destructive p-4 text-sm text-destructive">
            <p className="mb-1 font-semibold">
              Please fix the following errors:
            </p>
            <ul className="list-disc pl-4">
              {Object.entries(form.formState.errors).map(([key, error]) => (
                <li key={key}>
                  {error?.message ||
                    `Invalid ${key.replace(/([A-Z])/g, " $1").toLowerCase()}`}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner className="mr-2" />
              {`${mode === "create" ? "Creating" : "Updating"}...`}
            </>
          ) : (
            `${mode === "create" ? "Create" : "Update"} Availability`
          )}
        </Button>
      </form>
    </Form>
  );
}
