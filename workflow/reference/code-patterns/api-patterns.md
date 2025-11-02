# API Patterns - tRPC Procedures

## Standard Query Pattern

```typescript
// Pattern from: /src/server/api/routers/calendar.ts
getProviderSlots: publicProcedure
  .input(
    z.object({
      providerId: z.string(),
      startDate: z.date(),
      endDate: z.date(),
    })
  )
  .query(async ({ ctx, input }) => {
    // Always include error handling
    try {
      const result = await ctx.db.calculatedAvailabilitySlot.findMany({
        where: {
          providerId: input.providerId,
          startTime: { gte: input.startDate },
          endTime: { lte: input.endDate },
        },
        orderBy: { startTime: "asc" },
      });
      return result;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch provider slots",
      });
    }
  }),
```

## Standard Mutation Pattern

```typescript
// Pattern from: booking creation
createPublicBooking: publicProcedure
  .input(bookingSchema)
  .mutation(async ({ ctx, input }) => {
    // Transaction pattern for data consistency
    return ctx.db.$transaction(async (tx) => {
      // 1. Validate slot availability
      // 2. Create booking
      // 3. Update slot status
      // 4. Send notifications
    });
  }),
```
