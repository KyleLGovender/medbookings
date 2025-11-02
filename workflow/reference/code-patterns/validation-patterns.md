# Validation Patterns - Zod Schemas

## Form Input Schema Pattern

```typescript
// Standard form validation pattern
export const bookingFormSchema = z.object({
  providerId: z.string().uuid(),
  serviceId: z.string().uuid(),
  patientName: z.string().min(2).max(100),
  patientEmail: z.string().email(),
  patientPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  appointmentDate: z.date(),
  notes: z.string().max(500).optional(),
});
```

## API Input Validation Pattern

```typescript
// Reusable validation components
const dateRangeSchema = z
  .object({
    startDate: z.date(),
    endDate: z.date(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
  });
```
