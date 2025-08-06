import { createTRPCRouter } from '@/server/trpc';

export const communicationsRouter = createTRPCRouter({
  /**
   * Communications router is currently empty.
   * 
   * The communications feature is designed as a service layer that provides
   * server actions for other features to call, rather than exposing tRPC endpoints.
   * 
   * Server actions available in /features/communications/lib/actions.ts:
   * - sendProviderPatientsDetailsByWhatsapp
   * - sendBookingNotifications (coming soon)
   * - sendBookingConfirmation (coming soon)
   * - sendAvailabilityStatusNotifications (coming soon)
   * 
   * Future tRPC endpoints may be added here for:
   * - Communication logs/history queries
   * - Communication preferences management
   * - Bulk notification status checks
   * - etc.
   */
});
