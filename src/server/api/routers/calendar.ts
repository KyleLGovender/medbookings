import { z } from 'zod';

import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/trpc';

export const calendarRouter = createTRPCRouter({
  /**
   * Get service types for calendar availability
   * Migrated from: /api/calendar/availability/service-types
   */
  getServiceTypes: publicProcedure.query(async ({ ctx }) => {
    // Get all services with their provider types for availability filtering
    return ctx.prisma.service.findMany({
      include: {
        providerTypes: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }),
});