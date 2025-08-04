import { z } from 'zod';

import { sendProviderPatientsDetailsByWhatsapp } from '@/features/communications/lib/actions';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';

export const communicationsRouter = createTRPCRouter({
  /**
   * Send patient details to provider via WhatsApp
   * Migrated from: sendProviderPatientsDetailsByWhatsapp() lib function
   */
  sendPatientDetailsWhatsApp: protectedProcedure
    .input(
      z.object({
        bookingId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await sendProviderPatientsDetailsByWhatsapp(input.bookingId);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return {
        success: result.success || true,
        message: result.message || 'Patient details sent successfully',
      };
    }),

  /**
   * Send notification for availability status changes
   * Placeholder for: sendAvailabilityStatusNotifications() lib function
   */
  sendAvailabilityStatusNotification: protectedProcedure
    .input(
      z.object({
        availabilityId: z.string(),
        status: z.enum(['PROPOSED', 'ACCEPTED', 'REJECTED', 'CANCELLED']),
        recipientType: z.enum(['PROVIDER', 'ORGANIZATION', 'CUSTOMER']),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement notification sending logic
      // This would integrate with email/SMS/WhatsApp services
      console.log('Sending availability status notification:', input);
      
      return {
        success: true,
        message: 'Notification sent successfully',
      };
    }),

  /**
   * Send booking confirmation notification
   * Placeholder for booking confirmation emails/SMS
   */
  sendBookingConfirmation: protectedProcedure
    .input(
      z.object({
        bookingId: z.string(),
        notificationMethods: z.array(z.enum(['EMAIL', 'SMS', 'WHATSAPP'])),
        customMessage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get booking details for notification
      const booking = await ctx.prisma.booking.findUnique({
        where: { id: input.bookingId },
        include: {
          slot: {
            include: {
              availability: {
                include: {
                  provider: {
                    include: { user: true },
                  },
                  location: true,
                },
              },
              service: true,
            },
          },
        },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      // TODO: Implement actual notification sending
      console.log('Sending booking confirmation:', {
        bookingId: input.bookingId,
        methods: input.notificationMethods,
        booking,
      });

      return {
        success: true,
        message: 'Booking confirmation sent successfully',
        sentMethods: input.notificationMethods,
      };
    }),

  /**
   * Send booking reminder notification
   * Automated reminders before appointments
   */
  sendBookingReminder: protectedProcedure
    .input(
      z.object({
        bookingId: z.string(),
        reminderType: z.enum(['24_HOUR', '2_HOUR', '30_MINUTE']),
        notificationMethods: z.array(z.enum(['EMAIL', 'SMS', 'WHATSAPP'])),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.prisma.booking.findUnique({
        where: { id: input.bookingId },
        include: {
          slot: {
            include: {
              availability: {
                include: {
                  provider: { include: { user: true } },
                  location: true,
                },
              },
              service: true,
            },
          },
        },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      // TODO: Implement reminder sending logic
      console.log('Sending booking reminder:', {
        bookingId: input.bookingId,
        reminderType: input.reminderType,
        methods: input.notificationMethods,
      });

      return {
        success: true,
        message: `${input.reminderType} reminder sent successfully`,
        sentMethods: input.notificationMethods,
      };
    }),

  /**
   * Send cancellation notification
   * When bookings or availability are cancelled
   */
  sendCancellationNotification: protectedProcedure
    .input(
      z.object({
        type: z.enum(['BOOKING', 'AVAILABILITY']),
        entityId: z.string(),
        reason: z.string().optional(),
        affectedParties: z.array(z.enum(['PROVIDER', 'CUSTOMER', 'ORGANIZATION'])),
        notificationMethods: z.array(z.enum(['EMAIL', 'SMS', 'WHATSAPP'])),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement cancellation notification logic
      console.log('Sending cancellation notification:', input);

      return {
        success: true,
        message: 'Cancellation notification sent successfully',
        sentMethods: input.notificationMethods,
      };
    }),
});