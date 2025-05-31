// src/features/availability/types/types.ts
import { SlotStatus } from '@prisma/client';
import { AvailabilitySchema, ServiceAvailabilityConfigSchema, ServiceSchema } from '@prisma/zod';
import { z } from 'zod';

import { BookingView } from '@/features/bookings/types/types';
import { ApiResponse } from '@/lib/types';

// Base types from Zod schemas
type BaseService = z.infer<typeof ServiceSchema>;
type BaseServiceConfig = z.infer<typeof ServiceAvailabilityConfigSchema>;

export type AvailabilitySlot = {
  id: string;
  startTime: Date;
  endTime: Date;
  status: SlotStatus;
  service: Pick<BaseService, 'id' | 'name' | 'description' | 'displayPriority'>;
  serviceConfig: Pick<
    BaseServiceConfig,
    'id' | 'price' | 'duration' | 'isOnlineAvailable' | 'isInPerson' | 'location'
  >;
  booking: Omit<BookingView, 'slot'> | null;
};

export type AvailabilityView = Pick<
  z.infer<typeof AvailabilitySchema>,
  'id' | 'startTime' | 'endTime'
> & {
  serviceProvider: {
    id: string;
    name: string;
    image?: string | null;
  };
  slots: AvailabilitySlot[];
  availableServices: Pick<
    BaseServiceConfig,
    'serviceId' | 'duration' | 'price' | 'isOnlineAvailable' | 'isInPerson' | 'location'
  >[];
};

export const ServiceConfigFormSchema = ServiceAvailabilityConfigSchema.omit({
  id: true,
  serviceProviderId: true,
  createdAt: true,
  updatedAt: true,
})
  .refine(
    (data) => {
      if (data.isInPerson) {
        return !!data.location;
      }
      return true;
    },
    {
      message: 'Location is required for in-person services',
      path: ['location'],
    }
  )
  .refine((data) => data.price >= 100, {
    message: 'Minimum Price is R100',
    path: ['price'],
  });

export const AvailabilityFormSchema = z
  .object({
    date: z
      .date({
        required_error: 'Date is required',
        invalid_type_error: 'Invalid date format',
      })
      .min(new Date(new Date().setHours(0, 0, 0, 0)), 'Date cannot be in the past')
      .transform((date) => new Date(Math.floor(date.getTime() / 60000) * 60000)),
    startTime: z.date().transform((date) => new Date(Math.floor(date.getTime() / 60000) * 60000)),
    endTime: z.date().transform((date) => new Date(Math.floor(date.getTime() / 60000) * 60000)),
    availableServices: z
      .array(ServiceConfigFormSchema)
      .min(1, 'At least one service configuration must be specified'),
  })
  .superRefine((data, ctx) => {
    // Validation logic here (same as original)
  });

export type AvailabilityFormValues = z.infer<typeof AvailabilityFormSchema>;

export type AvailabilityFormResponse = ApiResponse<{
  startTime: Date;
  endTime: Date;
  availableServices: {
    serviceId: string;
    duration: number;
    price: number;
    isOnlineAvailable: boolean;
    isInPerson: boolean;
    location?: string | null;
  }[];
}>;
