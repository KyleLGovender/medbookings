"use client";

import { Suspense, useState } from "react";

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

import {
  Availability,
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
  serviceProviderId?: string;
  userId?: string;
  availability?: Availability;
  mode: "create" | "edit";
  onClose: () => void;
  onRefresh?: () => Promise<void>;
}

export function BookingForm({
  serviceProviderId,
  userId,
  availability,
  mode,
  onClose,
  onRefresh,
}: BookingFormProps) {
  const [selectedAvailability, setSelectedAvailability] = useState<
    Availability | undefined
  >(availability);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step tracking for multi-step form
  const [currentStep, setCurrentStep] = useState<"availability" | "details">(
    availability ? "details" : "availability",
  );

  // Form initialization moved to after availability selection
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(BookingFormSchema),
    defaultValues: {
      ...defaultValues,
      serviceProviderId,
      clientId: userId,
      isOnline: selectedAvailability?.isOnlineAvailable ?? false,
      isInPerson: selectedAvailability?.isInPersonAvailable ?? false,
      location: selectedAvailability?.isInPersonAvailable
        ? selectedAvailability.location
        : undefined,
    },
  });

  // Handle availability selection
  const handleAvailabilitySelect = (selected: Availability) => {
    setSelectedAvailability(selected);
    setCurrentStep("details");

    // Update form with new availability data
    form.reset({
      ...form.getValues(),
      isOnline: selected.isOnlineAvailable,
      isInPerson: selected.isInPersonAvailable,
      location: selected.isInPersonAvailable ? selected.location : undefined,
    });
  };

  if (currentStep === "availability") {
    return (
      <div className="space-y-4">
        <div className="mb-4">
          <h3 className="text-lg font-medium">Select Available Time</h3>
          <p className="text-sm text-muted-foreground">
            Choose from available time slots
          </p>
        </div>

        <AvailabilitySelector
          serviceProviderId={serviceProviderId}
          onSelect={handleAvailabilitySelect}
          selectedDate={new Date()} // Or pass this as a prop
        />

        <Button variant="outline" onClick={onClose} className="mt-4">
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Show selected availability details */}
        {selectedAvailability && (
          <div className="rounded-lg border p-4 bg-muted/50">
            <h4 className="font-medium mb-2">Selected Time Slot</h4>
            <div className="text-sm text-muted-foreground">
              <p>
                Date: {format(new Date(selectedAvailability.startTime), "PPP")}
              </p>
              <p>
                Time: {format(new Date(selectedAvailability.startTime), "p")} -{" "}
                {format(new Date(selectedAvailability.endTime), "p")}
              </p>
              {selectedAvailability.location && (
                <p>Location: {selectedAvailability.location}</p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep("availability")}
              className="mt-2"
            >
              Change Time
            </Button>
          </div>
        )}

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

        {form.watch("bookingType") === BookingType.GUEST && (
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
          {selectedAvailability?.isOnlineAvailable && (
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

          {selectedAvailability?.isInPersonAvailable && (
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
                      {selectedAvailability.location && (
                        <p className="text-sm text-muted-foreground">
                          Location: {selectedAvailability.location}
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

          {!selectedAvailability?.isOnlineAvailable &&
            !selectedAvailability?.isInPersonAvailable && (
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
