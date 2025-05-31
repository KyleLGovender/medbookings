// src/features/bookings/types/types.ts
import { SlotStatus } from '@prisma/client';
import { BookingSchema, NotificationChannelSchema } from '@prisma/zod';
import { z } from 'zod';

import { ApiResponse } from '@/lib/types';

export type BookingView = Pick<z.infer<typeof BookingSchema>, 'id' | 'status'> & {
  bookingType?: string;
  agreeToTerms?: boolean;
  notificationPreferences: {
    whatsapp: boolean;
  };
  guestInfo: {
    name: string;
    whatsapp?: string;
  };
  slot: {
    id: string;
    startTime: Date | string;
    endTime: Date | string;
    status: SlotStatus;
    service: {
      id: string;
      name: string;
      description?: string;
      displayPriority?: number;
    };
    serviceConfig: {
      id: string;
      price: number;
      duration: number;
      isOnlineAvailable: boolean;
      isInPerson: boolean;
      location?: string;
    };
    serviceProvider: {
      id: string;
      name: string;
      email?: string;
      whatsapp?: string;
      image?: string | null;
    };
  };
};

export type BookingFormValues = {
  // Your BookingFormValues definition here
};

export const NotificationPreferencesSchema = z.object({
  channels: z.array(NotificationChannelSchema),
  email: z.boolean(),
  sms: z.boolean(),
  // Other fields
});

export type BookingResponse = ApiResponse<{
  bookingId?: string;
}>;
