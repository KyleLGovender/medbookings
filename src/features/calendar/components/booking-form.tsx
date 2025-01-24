"use client";

import { Suspense, useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { debounce } from "lodash";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TimePicker } from "@/components/ui/time-picker";
import { useToast } from "@/hooks/use-toast";

import { createBooking, updateBooking } from "../lib/actions";
import {
  Availability,
  Booking,
  BookingFormSchema,
  BookingFormValues,
} from "../lib/types";

const defaultValues: Partial<BookingFormValues> = {
  bookingType: BookingType.GUEST,
  notificationPreferences: {
    email: false,
    sms: false,
    whatsapp: true,
  },
  isOnline: true,
  isInPerson: false,
  duration: 15,
  notifyViaEmail: false,
  notifyViaSMS: false,
  notifyViaWhatsapp: true,
  status: "PENDING",
  clientWhatsapp: "",
  clientPhone: "",
  clientName: "",
  price: 0,
};

interface BookingFormProps {
  serviceProviderId: string;
  booking?: Booking;
  mode: "create" | "edit";
  onClose: () => void;
  onRefresh?: () => Promise<void>;
  selectedDate: Date;
  availability?: Availability;
  userId?: string;
}

export function BookingForm({
  serviceProviderId,
  booking,
  mode,
  onClose,
  onRefresh,
  selectedDate,
  availability,
  userId,
}: BookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<BookingFormValues>({
    resolver: async (data, context, options) => {
      return zodResolver(BookingFormSchema)(data, context, options);
    },
    defaultValues: {
      ...defaultValues,
      serviceProviderId,
      clientId: userId,
      isOnline: availability?.isOnlineAvailable ?? false,
      isInPerson: availability?.isInPersonAvailable ?? false,
      location: availability?.isInPersonAvailable
        ? availability.location
        : undefined,
    },
  });

  const bookingType = form.watch("bookingType");

  useEffect(() => {
    form.setValue(
      "clientId",
      bookingType === BookingType.SELF ? userId : undefined,
    );
  }, [bookingType, userId, form]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "startTime") {
        const startTime = value.startTime;
        if (startTime) {
          const endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + 15);
          form.setValue("endTime", endTime);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (values: BookingFormValues) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();

      // Core booking details
      formData.append("bookingType", values.bookingType);
      formData.append("serviceProviderId", serviceProviderId);
      formData.append("startTime", values.startTime.toISOString());
      formData.append("endTime", values.endTime.toISOString());
      formData.append("duration", String(values.duration));
      formData.append("status", "PENDING");

      // Update appointment type handling
      formData.append("isOnline", String(values.isOnline));
      formData.append("isInPerson", String(values.isInPerson));

      // Add location if it's an in-person appointment
      if (values.isInPerson && values.location) {
        formData.append("location", values.location.trim());
      } else {
        formData.append("location", ""); // Empty string for online appointments
      }

      // Client/Guest details based on booking type
      if (values.bookingType === BookingType.SELF) {
        formData.append("clientId", userId || "");
      } else {
        // Always include bookedById for guest bookings if userId exists
        if (userId) formData.append("bookedById", userId);
        formData.append("guestName", values.clientName?.trim() ?? "");
        formData.append("guestEmail", values.clientEmail?.trim() ?? "");
        formData.append("guestPhone", values.clientPhone?.trim() ?? "");
        formData.append("guestWhatsapp", values.clientWhatsapp?.trim() ?? "");
      }

      // Notification preferences as JSON string
      formData.append(
        "notificationPreferences",
        JSON.stringify({
          email: values.notifyViaEmail || false,
          sms: values.notifyViaSMS || false,
          whatsapp: values.notifyViaWhatsapp || false,
        }),
      );

      // Optional fields
      if (values.notes) formData.append("notes", values.notes.trim());
      formData.append("price", String(values.price || 0));

      const response =
        mode === "create"
          ? await createBooking(formData)
          : await updateBooking(booking?.id || "", formData);

      if (!response) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No response from server",
        });
        return;
      }

      if (response.error || response.fieldErrors || response.formErrors) {
        if (response.fieldErrors) {
          Object.entries(response.fieldErrors).forEach(([field, errors]) => {
            toast({
              variant: "destructive",
              title: `Error in ${field}`,
              description: errors.join(", "),
            });
          });
        } else if (response.error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: response.error,
          });
        }
        return;
      }

      toast({
        title: "Success",
        description: `Booking ${mode === "create" ? "created" : "updated"} successfully`,
      });

      await onRefresh?.();
      onClose();
    } catch (error) {
      console.error("Booking submission error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-xl space-y-6"
      >
        {!serviceProviderId ? (
          <FormField
            control={form.control}
            name="bookingType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Booking Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select booking type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={BookingType.SELF}>
                      Book for myself
                    </SelectItem>
                    <SelectItem value={BookingType.GUEST}>
                      Book for someone else
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        {bookingType === BookingType.GUEST && (
          <>
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-yellow-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-yellow-800">
                  {userId
                    ? "You are booking this appointment for someone else"
                    : "Guest Booking"}
                </p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guest Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter guest name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Appointment Time</FormLabel>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <FormControl>
                      <Suspense
                        fallback={
                          <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
                        }
                      >
                        <DatePicker
                          date={field.value}
                          onChange={(date) => {
                            if (date) {
                              const currentTime = field.value || new Date();
                              date.setHours(currentTime.getHours());
                              date.setMinutes(currentTime.getMinutes());
                              field.onChange(date);
                            }
                          }}
                        />
                      </Suspense>
                    </FormControl>
                  </div>
                  <div className="w-[140px]">
                    <FormControl>
                      <TimePicker
                        date={field.value}
                        onChange={debounce((date) => {
                          if (date) {
                            field.onChange(date);
                          }
                        }, 150)}
                      />
                    </FormControl>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-2">
          {availability?.isOnlineAvailable && (
            <FormField
              control={form.control}
              name="isOnline"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Online Appointment
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
          )}

          {availability?.isInPersonAvailable && (
            <FormField
              control={form.control}
              name="isInPerson"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        In-Person Appointment
                      </FormLabel>
                      {availability.location && (
                        <p className="text-sm text-muted-foreground">
                          Location: {availability.location}
                        </p>
                      )}
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
          )}

          {!availability?.isOnlineAvailable &&
            !availability?.isInPersonAvailable && (
              <div className="rounded-lg border border-destructive p-4">
                <p className="text-sm text-destructive">
                  No appointment types are available for this time slot
                </p>
              </div>
            )}
        </div>

        <div className="space-y-4">
          <FormLabel>Notifications</FormLabel>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="notifyViaWhatsapp"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <FormLabel className="text-base">
                      WhatsApp Notifications
                    </FormLabel>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                  {field.value && (
                    <FormField
                      control={form.control}
                      name="clientWhatsapp"
                      render={({ field }) => (
                        <PhoneInput
                          defaultCountry="ZA"
                          value={field.value ?? ""}
                          onChange={(value) => {
                            field.onChange(value);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                            }
                          }}
                        />
                      )}
                    />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notifyViaSMS"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <FormLabel className="text-base">
                      SMS Notifications
                    </FormLabel>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                  {field.value && (
                    <FormField
                      control={form.control}
                      name="clientPhone"
                      render={({ field }) => (
                        <PhoneInput
                          defaultCountry="ZA"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                            }
                          }}
                        />
                      )}
                    />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notifyViaEmail"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <FormLabel className="text-base">
                      Email Notifications
                    </FormLabel>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                  {field.value && (
                    <FormField
                      control={form.control}
                      name="clientEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="Enter your email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {form.formState.errors.root && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">
              {form.formState.errors.root.message}
            </div>
          </div>
        )}

        <div className="text-sm text-red-500">
          <pre>{JSON.stringify(form.formState.errors, null, 2)}</pre>
        </div>

        <div className="space-y-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Booking"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
