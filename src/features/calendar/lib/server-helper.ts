'use server';

import { Prisma } from '@prisma/client';
import sgMail from '@sendgrid/mail';
import twilio from 'twilio';
import { z } from 'zod';

import env from '@/config/env/server';
import { NotificationChannel, NotificationType } from '@/features/notifications/lib/types';
import { prisma } from '@/lib/prisma';
import { formatLocalDate, formatLocalTime } from '@/lib/timezone-helper';

import { AvailabilityFormSchema, AvailabilityView, BookingFormSchema, BookingView } from './types';

function hasTimeOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
  return start1 < end2 && start2 < end1;
}

// Load environment variables
const accountSid = env.TWILIO_ACCOUNT_SID;
const authToken = env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  throw new Error('Twilio credentials are not set in environment variables');
}

const twilioClient = twilio(accountSid, authToken);

// Initialize SendGrid
sgMail.setApiKey(env.SENDGRID_API_KEY!);

function hasTimeOfDayOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
  // Convert to minutes since midnight for comparison
  const getMinutesSinceMidnight = (date: Date) => date.getHours() * 60 + date.getMinutes();

  const start1Minutes = getMinutesSinceMidnight(start1);
  const end1Minutes = getMinutesSinceMidnight(end1);
  const start2Minutes = getMinutesSinceMidnight(start2);
  const end2Minutes = getMinutesSinceMidnight(end2);

  return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
}

export async function checkForOverlappingAvailability(
  serviceProviderId: string,
  startTime: Date,
  endTime: Date
) {
  const availabilities = await prisma.availability.findMany({
    where: {
      serviceProviderId,
      startTime: {
        lte: endTime,
      },
      endTime: {
        gte: startTime,
      },
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
    },
  });

  if (availabilities.length > 0) {
    return {
      hasOverlap: true,
      overlappingPeriod: {
        startTime: availabilities[0].startTime,
        endTime: availabilities[0].endTime,
      },
    };
  }

  return { hasOverlap: false };
}

export async function checkAvailabilityModificationAllowed(
  availabilityId: string,
  serviceProviderId: string
): Promise<{
  availability?: AvailabilityView;
  error?: string;
}> {
  const availability = await prisma.availability.findFirst({
    where: {
      id: availabilityId,
      serviceProviderId,
    },
    include: {
      serviceProvider: true,
      availableServices: true,
      calculatedSlots: {
        include: {
          booking: {
            include: {
              client: true,
              bookedBy: true,
              serviceProvider: true,
              service: true,
              notifications: true,
              review: true,
            },
          },
          service: true,
          serviceConfig: true,
        },
      },
    },
  });

  if (!availability) {
    return { error: 'Availability not found' };
  }

  if (availability.calculatedSlots.some((slot) => slot.booking?.status === 'CONFIRMED')) {
    return { error: 'Cannot modify availability with confirmed bookings' };
  }

  // Transform the data to match AvailabilityView structure
  return {
    availability: {
      id: availability.id,
      startTime: availability.startTime,
      endTime: availability.endTime,
      serviceProvider: {
        id: availability.serviceProvider.id,
        name: availability.serviceProvider.name,
        image: availability.serviceProvider.image,
      },
      slots: availability.calculatedSlots.map((slot) => ({
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: slot.status,
        service: {
          id: slot.service.id,
          name: slot.service.name,
          description: slot.service.description || null,
          displayPriority: slot.service.displayPriority,
        },
        serviceConfig: {
          id: slot.serviceConfig.id,
          price: Number(slot.serviceConfig.price),
          duration: slot.serviceConfig.duration,
          isOnlineAvailable: slot.serviceConfig.isOnlineAvailable,
          isInPerson: slot.serviceConfig.isInPerson,
          location: slot.serviceConfig.location || null,
        },
        booking: slot.booking
          ? {
              id: slot.booking.id,
              status: slot.booking.status,
              notificationPreferences: {
                email: Boolean(slot.booking.notifications?.some((n) => n.channel === 'EMAIL')),
                sms: Boolean(slot.booking.notifications?.some((n) => n.channel === 'SMS')),
                whatsapp: Boolean(
                  slot.booking.notifications?.some((n) => n.channel === 'WHATSAPP')
                ),
              },
              guestInfo: {
                name: slot.booking.guestName || slot.booking.client?.name || '',
                email: slot.booking.guestEmail || slot.booking.client?.email || undefined,
                phone: slot.booking.guestPhone || slot.booking.client?.phone || undefined,
                whatsapp: slot.booking.guestWhatsapp || undefined,
              },
              slot: {
                id: slot.id,
                startTime: slot.startTime,
                endTime: slot.endTime,
                status: slot.status,
                service: {
                  id: slot.service.id,
                  name: slot.service.name,
                  description: slot.service.description,
                  displayPriority: slot.service.displayPriority,
                },
                serviceConfig: {
                  id: slot.serviceConfig.id,
                  price: Number(slot.serviceConfig.price),
                  duration: slot.serviceConfig.duration,
                  isOnlineAvailable: slot.serviceConfig.isOnlineAvailable,
                  isInPerson: slot.serviceConfig.isInPerson,
                  location: slot.serviceConfig.location,
                },
                serviceProvider: {
                  id: availability.serviceProvider.id,
                  name: availability.serviceProvider.name,
                  image: availability.serviceProvider.image,
                },
              },
            }
          : null,
      })),
      availableServices: availability.availableServices.map((service) => ({
        serviceId: service.serviceId,
        duration: service.duration,
        price: Number(service.price),
        isOnlineAvailable: service.isOnlineAvailable,
        isInPerson: service.isInPerson,
        location: service.location,
      })),
    },
  };
}

export async function validateAvailabilityFormData(formData: FormData): Promise<{
  data?: z.infer<typeof AvailabilityFormSchema>;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
}> {
  console.log('1. Starting validation with FormData:', Object.fromEntries(formData.entries()));

  try {
    // Parse the basic date/time fields
    const date = new Date(formData.get('date') as string);
    const startTime = new Date(formData.get('startTime') as string);
    const endTime = new Date(formData.get('endTime') as string);

    // Parse available services from form data
    const availableServices = [];
    const formEntries = Array.from(formData.entries());
    const serviceIndices = Array.from(
      new Set(
        formEntries
          .filter(([key]) => key.startsWith('availableServices'))
          .map(([key]) => key.match(/availableServices\[(\d+)\]/)?.[1])
          .filter(Boolean)
      )
    );

    console.log('2. Found service indices:', Array.from(serviceIndices));

    for (const index of serviceIndices) {
      const service = {
        serviceId: formData.get(`availableServices[${index}][serviceId]`) as string,
        duration: Number(formData.get(`availableServices[${index}][duration]`)),
        price: Number(formData.get(`availableServices[${index}][price]`)),
        isOnlineAvailable:
          formData.get(`availableServices[${index}][isOnlineAvailable]`) === 'true',
        isInPerson: formData.get(`availableServices[${index}][isInPerson]`) === 'true',
        location: (formData.get(`availableServices[${index}][location]`) as string) || null,
      };
      availableServices.push(service);
    }

    console.log('3. Parsed available services:', availableServices);

    // Construct the data object that matches AvailabilityFormSchema
    const validationData = {
      date,
      startTime,
      endTime,
      availableServices,
    };

    console.log('4. Validation data:', validationData);

    // Validate against the schema
    const result = await AvailabilityFormSchema.safeParseAsync(validationData);

    console.log('5. Validation result:', {
      success: result.success,
      ...(result.success ? {} : { error: result.error.format() }),
    });

    if (!result.success) {
      return {
        fieldErrors: result.error.flatten().fieldErrors,
        formErrors: result.error.flatten().formErrors,
      };
    }

    return { data: result.data };
  } catch (error) {
    console.error('6. Validation error:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to validate form data',
    };
  }
}

export async function validateBookingWithAvailability(
  data: z.infer<typeof BookingFormSchema>,
  availability: any
): Promise<{
  isValid: boolean;
  error?: string;
  path?: string[];
}> {
  // Get the slot from the availability
  const slot = await prisma.calculatedAvailabilitySlot.findUnique({
    where: { id: data.slotId },
    include: {
      service: true,
      serviceConfig: true,
      availability: true,
    },
  });

  if (!slot) {
    return {
      isValid: false,
      error: 'Slot not found',
      path: ['slotId'],
    };
  }

  // Check if the slot is available
  if (slot.status !== 'AVAILABLE') {
    return {
      isValid: false,
      error: 'This slot is not available',
      path: ['slotId'],
    };
  }

  // Check if the slot is within the availability time range
  if (slot.availability.id !== availability.id) {
    return {
      isValid: false,
      error: 'Slot does not belong to the specified availability',
      path: ['slotId'],
    };
  }

  // Validate notification preferences
  if (
    !data.notificationPreferences.email &&
    !data.notificationPreferences.sms &&
    !data.notificationPreferences.whatsapp
  ) {
    return {
      isValid: false,
      error: 'At least one notification method must be selected',
      path: ['notificationPreferences'],
    };
  }

  // Validate guest info if booking type requires it
  if (
    (data.bookingType === 'USER_GUEST' || data.bookingType === 'PROVIDER_GUEST') &&
    !data.guestInfo
  ) {
    return {
      isValid: false,
      error: 'Guest information is required',
      path: ['guestInfo'],
    };
  }

  return { isValid: true };
}

export async function validateBookingFormData(formData: FormData): Promise<{
  data?: z.infer<typeof BookingFormSchema>;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
}> {
  try {
    // Extract form data
    const data = {
      slotId: formData.get('slotId') as string,
      bookingType: formData.get('bookingType') as any,
      notificationPreferences: {
        email: formData.get('notifyViaEmail') === 'true',
        sms: formData.get('notifyViaSMS') === 'true',
        whatsapp: formData.get('notifyViaWhatsapp') === 'true',
      },
      guestInfo: {
        name: formData.get('guestName') as string,
        email: (formData.get('guestEmail') as string) || undefined,
        phone: (formData.get('guestPhone') as string) || undefined,
        whatsapp: (formData.get('guestWhatsapp') as string) || undefined,
      },
      agreeToTerms: formData.get('agreeToTerms') === 'true',
    };

    // Validate using the schema
    const result = BookingFormSchema.safeParse(data);

    if (!result.success) {
      return {
        fieldErrors: result.error.flatten().fieldErrors,
        formErrors: result.error.flatten().formErrors,
      };
    }

    return { data: result.data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to validate form data',
    };
  }
}

export async function checkBookingAccess(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      serviceProvider: {
        include: {
          user: true,
        },
      },
      client: true,
    },
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  // Check if user is the service provider or the client
  const isServiceProvider = booking.serviceProvider.userId === userId;
  const isClient = booking.clientId === userId;

  if (!isServiceProvider && !isClient) {
    throw new Error('Unauthorized access to booking');
  }

  return booking;
}

export async function calculateAvailabilitySlots(
  formData: z.infer<typeof AvailabilityFormSchema>,
  availabilityId: string,
  availableServices: { id: string; serviceId: string; duration: number }[],
  existingSlots: {
    id: string;
    startTime: Date;
    endTime: Date;
    serviceId: string;
    serviceConfigId: string;
    status: string;
    booking?: { id: string } | null;
  }[] = []
) {
  // Slots to create
  const slots: Prisma.CalculatedAvailabilitySlotCreateManyInput[] = [];

  // Keep track of existing slots with bookings that we'll preserve
  const preservedSlotIds = new Set<string>();

  // First, identify slots with bookings to preserve
  const slotsWithBookings = existingSlots.filter((slot) => slot.booking);

  // Process each service configuration
  formData.availableServices.forEach((serviceConfig) => {
    const availableService = availableServices.find(
      (as) => as.serviceId === serviceConfig.serviceId
    );
    if (!availableService) return;

    let currentTime = new Date(formData.startTime);
    while (currentTime < formData.endTime) {
      const slotEnd = new Date(currentTime.getTime() + serviceConfig.duration * 60000);
      if (slotEnd <= formData.endTime) {
        // Check if this time slot overlaps with any existing booked slot
        const overlappingBookedSlot = slotsWithBookings.find(
          (slot) =>
            slot.serviceId === serviceConfig.serviceId &&
            ((currentTime >= slot.startTime && currentTime < slot.endTime) ||
              (slotEnd > slot.startTime && slotEnd <= slot.endTime) ||
              (currentTime <= slot.startTime && slotEnd >= slot.endTime))
        );

        // If there's an overlapping booked slot, preserve it and don't create a new one
        if (overlappingBookedSlot) {
          preservedSlotIds.add(overlappingBookedSlot.id);
        } else {
          // Otherwise, create a new slot
          slots.push({
            availabilityId,
            serviceId: serviceConfig.serviceId,
            serviceConfigId: availableService.id,
            startTime: currentTime,
            endTime: slotEnd,
            lastCalculated: new Date(),
            status: 'AVAILABLE',
          });
        }
      }
      currentTime = new Date(slotEnd.getTime());
    }
  });

  return {
    slotsToCreate: slots,
    slotIdsToPreserve: Array.from(preservedSlotIds),
  };
}

export async function calculateInitialAvailabilitySlots(
  formData: z.infer<typeof AvailabilityFormSchema>,
  availabilityId: string,
  availableServices: { id: string; serviceId: string; duration: number }[]
) {
  const slots: Prisma.CalculatedAvailabilitySlotCreateManyInput[] = [];

  formData.availableServices.forEach((serviceConfig) => {
    const availableService = availableServices.find(
      (as) => as.serviceId === serviceConfig.serviceId
    );
    if (!availableService) return;

    let currentTime = new Date(formData.startTime);
    while (currentTime < formData.endTime) {
      const slotEnd = new Date(currentTime.getTime() + serviceConfig.duration * 60000);
      if (slotEnd <= formData.endTime) {
        slots.push({
          availabilityId,
          serviceId: serviceConfig.serviceId,
          serviceConfigId: availableService.id,
          startTime: currentTime,
          endTime: slotEnd,
          lastCalculated: new Date(),
          status: 'AVAILABLE',
        });
      }
      currentTime = new Date(slotEnd.getTime());
    }
  });

  return slots;
}

export async function calculateNonOverlappingSlots(
  formData: z.infer<typeof AvailabilityFormSchema>,
  availabilityId: string,
  availableServices: { id: string; serviceId: string; duration: number }[],
  bookedTimeRanges: { serviceId: string; startTime: Date; endTime: Date }[]
) {
  const slots: Prisma.CalculatedAvailabilitySlotCreateManyInput[] = [];

  formData.availableServices.forEach((serviceConfig) => {
    const availableService = availableServices.find(
      (as) => as.serviceId === serviceConfig.serviceId
    );
    if (!availableService) return;

    // Get booked ranges for this service
    const serviceBookedRanges = bookedTimeRanges.filter(
      (range) => range.serviceId === serviceConfig.serviceId
    );

    let currentTime = new Date(formData.startTime);
    while (currentTime < formData.endTime) {
      const slotEnd = new Date(currentTime.getTime() + serviceConfig.duration * 60000);
      if (slotEnd <= formData.endTime) {
        // Check if this slot overlaps with any booked slot
        const overlapsWithBooking = serviceBookedRanges.some(
          (range) => currentTime < range.endTime && slotEnd > range.startTime
        );

        // Only create the slot if it doesn't overlap with a booking
        if (!overlapsWithBooking) {
          slots.push({
            availabilityId,
            serviceId: serviceConfig.serviceId,
            serviceConfigId: availableService.id,
            startTime: currentTime,
            endTime: slotEnd,
            lastCalculated: new Date(),
            status: 'AVAILABLE',
          });
        }
      }
      currentTime = new Date(slotEnd.getTime());
    }
  });

  return slots;
}

export async function sendBookingNotifications(booking: BookingView) {
  try {
    const notificationPromises = [];

    // Use timezone-helper functions directly without specifying timezone
    const templateVariables = JSON.stringify({
      1: formatLocalDate(booking.slot.startTime), // Access startTime from slot
      2: formatLocalTime(booking.slot.startTime), // Access startTime from slot
    });

    if (booking.notificationPreferences.email) {
      const email = booking.guestInfo.email;
      if (email) {
        const emailContent = {
          to: email,
          from: env.SENDGRID_FROM_EMAIL!,
          subject: 'Booking Confirmation',
          text: `Your booking is confirmed for ${formatLocalDate(booking.slot.startTime)} at ${formatLocalTime(booking.slot.startTime)}.`,
          html: `<strong>Your booking is confirmed for ${formatLocalDate(booking.slot.startTime)} at ${formatLocalTime(booking.slot.startTime)}.</strong>`,
        };

        notificationPromises.push(
          sgMail
            .send(emailContent)
            .then((response) => {
              console.log('Email sent successfully:', response);
            })
            .catch((error) => {
              console.error('Error sending email:', error);
            })
        );
      }
    }

    // Send provider notification
    if (booking.slot.serviceProvider.whatsapp) {
      notificationPromises.push(
        twilioClient.messages.create({
          from: 'whatsapp:+14155238886',
          contentSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
          contentVariables: templateVariables,
          to: `whatsapp:${booking.slot.serviceProvider.whatsapp}`,
        })
      );
    }

    if (booking.notificationPreferences.whatsapp) {
      const whatsapp = booking.guestInfo.whatsapp;
      if (whatsapp) {
        notificationPromises.push(
          twilioClient.messages.create({
            from: 'whatsapp:+14155238886',
            contentSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
            contentVariables: templateVariables,
            to: `whatsapp:${whatsapp}`,
          })
        );
      }
    }

    // Send provider email notification
    if (booking.slot.serviceProvider.email) {
      const emailContent = {
        to: booking.slot.serviceProvider.email,
        from: env.SENDGRID_FROM_EMAIL!,
        subject: 'New Booking Notification',
        text: `A new booking has been confirmed for ${formatLocalDate(booking.slot.startTime)} at ${formatLocalTime(booking.slot.startTime)}.`,
        html: `<strong>A new booking has been confirmed for ${formatLocalDate(booking.slot.startTime)} at ${formatLocalTime(booking.slot.startTime)}.</strong>`,
      };

      notificationPromises.push(
        sgMail
          .send(emailContent)
          .then((response) => {
            console.log('Provider email sent successfully:', response);
          })
          .catch((error) => {
            console.error('Error sending provider email:', error);
          })
      );
    }

    // Send all notifications in parallel and log results
    const results = await Promise.allSettled(notificationPromises);

    // Create notification logs in the database
    const notificationLogs = results.map((result, index) => ({
      bookingId: booking.id,
      type: NotificationType.BOOKING_CONFIRMATION,
      channel: index === 0 ? NotificationChannel.EMAIL : NotificationChannel.WHATSAPP,
      content: JSON.stringify({ templateVariables }),
      status: result.status === 'fulfilled' ? 'SENT' : 'FAILED',
    }));

    // Log notifications to database
    await prisma.notificationLog.createMany({
      data: notificationLogs,
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    // Don't throw the error - we don't want to fail the booking if notifications fail
  }
}
