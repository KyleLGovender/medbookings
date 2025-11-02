# Custom Hook Patterns

## Data Fetching Hook Pattern

```typescript
// Pattern from: /src/features/calendar/hooks/use-provider-slots.ts
export function useProviderSlots(providerId: string, dateRange: DateRange) {
  return api.calendar.getProviderSlots.useQuery(
    { providerId, ...dateRange },
    {
      enabled: !!providerId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: false,
    }
  );
}
```

## Mutation Hook Pattern

```typescript
export function useCreateBooking() {
  const utils = api.useUtils();

  return api.booking.create.useMutation({
    onSuccess: () => {
      void utils.calendar.getProviderSlots.invalidate();
      toast.success('Booking created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create booking');
    },
  });
}
```
