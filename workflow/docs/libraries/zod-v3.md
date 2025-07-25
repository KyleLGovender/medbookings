# Zod v3 Documentation

## Basic Schema Definition

### Primitive Types

```typescript
import { z } from 'zod'

// String schemas
const nameSchema = z.string()
const emailSchema = z.string().email()
const urlSchema = z.string().url()
const uuidSchema = z.string().uuid()

// Number schemas
const ageSchema = z.number().int().positive()
const priceSchema = z.number().min(0).max(1000)
const scoreSchema = z.number().int().min(0).max(100)

// Boolean schema
const isActiveSchema = z.boolean()

// Date schema
const birthDateSchema = z.date()
const appointmentDateSchema = z.string().datetime() // ISO string

// Literals
const statusSchema = z.literal('active')
const roleSchema = z.enum(['USER', 'ADMIN', 'PROVIDER'])
```

### Object Schemas

```typescript
// Basic object
const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  age: z.number().int().min(18, 'Must be at least 18'),
  isActive: z.boolean().default(true),
})

// Nested objects
const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid zip code'),
  country: z.string().default('US'),
})

const userWithAddressSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  address: addressSchema,
})

// Optional and nullable fields
const optionalFieldsSchema = z.object({
  name: z.string(),
  nickname: z.string().optional(), // string | undefined
  middleName: z.string().nullable(), // string | null
  displayName: z.string().nullish(), // string | null | undefined
})
```

### Array Schemas

```typescript
// Array of primitives
const tagsSchema = z.array(z.string())
const scoresSchema = z.array(z.number())

// Array with constraints
const nonEmptyTagsSchema = z.array(z.string()).nonempty('At least one tag required')
const limitedTagsSchema = z.array(z.string()).min(1).max(5)

// Array of objects
const appointmentsSchema = z.array(z.object({
  id: z.string(),
  date: z.string().datetime(),
  duration: z.number().int().positive(),
}))
```

## Advanced Schemas

### Union and Discriminated Unions

```typescript
// Simple union
const stringOrNumberSchema = z.union([z.string(), z.number()])

// Discriminated union (recommended for objects)
const eventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('appointment'),
    patientId: z.string(),
    providerId: z.string(),
    date: z.string().datetime(),
  }),
  z.object({
    type: z.literal('consultation'),
    patientId: z.string(),
    notes: z.string(),
    duration: z.number(),
  }),
])

// Using discriminated union
type Event = z.infer<typeof eventSchema>
```

### Conditional Schemas

```typescript
// Using refine for cross-field validation
const appointmentSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  isRecurring: z.boolean(),
  recurringPattern: z.string().optional(),
}).refine((data) => {
  return new Date(data.endTime) > new Date(data.startTime)
}, {
  message: "End time must be after start time",
  path: ["endTime"],
}).refine((data) => {
  if (data.isRecurring) {
    return data.recurringPattern !== undefined
  }
  return true
}, {
  message: "Recurring pattern is required when appointment is recurring",
  path: ["recurringPattern"],
})

// Superrefine for complex validation
const passwordSchema = z.object({
  password: z.string(),
  confirmPassword: z.string(),
}).superRefine(({ password, confirmPassword }, ctx) => {
  if (password !== confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passwords don't match",
      path: ['confirmPassword']
    })
  }
  
  if (password.length < 8) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      minimum: 8,
      type: 'string',
      inclusive: true,
      message: 'Password must be at least 8 characters',
      path: ['password']
    })
  }
})
```

### Transform Schemas

```typescript
// Transform string to number
const stringToNumberSchema = z.string().transform((val) => parseInt(val, 10))

// Transform and validate
const priceSchema = z.string()
  .transform((val) => parseFloat(val))
  .refine((val) => !isNaN(val), 'Must be a valid number')
  .refine((val) => val >= 0, 'Must be positive')

// Date transformation
const dateStringSchema = z.string()
  .transform((str) => new Date(str))
  .refine((date) => !isNaN(date.getTime()), 'Invalid date')

// Complex transformation
const medicalRecordSchema = z.object({
  patientId: z.string().uuid(),
  symptoms: z.string().transform((str) => str.split(',').map(s => s.trim())),
  severity: z.string().transform((str) => parseInt(str, 10)).pipe(z.number().int().min(1).max(10)),
  date: z.string().transform((str) => new Date(str)),
})
```

## Validation and Error Handling

### Basic Validation

```typescript
const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().min(18),
})

// Safe parsing (returns result object)
const result = userSchema.safeParse({
  name: "John",
  email: "invalid-email",
  age: 16
})

if (result.success) {
  console.log(result.data) // Typed data
} else {
  console.log(result.error.issues) // Validation errors
}

// Throwing parse (throws ZodError)
try {
  const data = userSchema.parse(userData)
  console.log(data)
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log(error.issues)
  }
}
```

### Custom Error Messages

```typescript
const userSchema = z.object({
  name: z.string({
    required_error: "Name is required",
    invalid_type_error: "Name must be a string",
  }).min(1, "Name cannot be empty"),
  
  email: z.string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
    
  age: z.number({
    required_error: "Age is required",
    invalid_type_error: "Age must be a number",
  }).int("Age must be a whole number")
    .min(18, "Must be at least 18 years old")
    .max(120, "Age seems unrealistic"),
    
  phone: z.string()
    .regex(/^\+?[\d\s\-\(\)]+$/, "Please enter a valid phone number")
    .optional(),
})
```

### Error Formatting

```typescript
// Format errors for display
function formatZodError(error: z.ZodError) {
  return error.issues.map(issue => ({
    field: issue.path.join('.'),
    message: issue.message,
  }))
}

// Format for form fields
function getFieldErrors(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {}
  
  error.issues.forEach(issue => {
    const field = issue.path.join('.')
    if (!fieldErrors[field]) {
      fieldErrors[field] = issue.message
    }
  })
  
  return fieldErrors
}
```

## Type Inference

### Extract Types

```typescript
// Infer TypeScript type from schema
const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.date(),
})

type User = z.infer<typeof userSchema>
// Type is: { id: string; name: string; email: string; createdAt: Date }

// Input type (before transformation)
type UserInput = z.input<typeof userSchema>

// Output type (after transformation)
type UserOutput = z.output<typeof userSchema>
```

### Partial and Pick Utilities

```typescript
const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  age: z.number(),
  isActive: z.boolean(),
})

// Make all fields optional
const partialUserSchema = userSchema.partial()
type PartialUser = z.infer<typeof partialUserSchema>

// Pick specific fields
const userNameEmailSchema = userSchema.pick({ name: true, email: true })
type UserNameEmail = z.infer<typeof userNameEmailSchema>

// Omit specific fields
const userWithoutIdSchema = userSchema.omit({ id: true })
type UserWithoutId = z.infer<typeof userWithoutIdSchema>

// Extend schema
const extendedUserSchema = userSchema.extend({
  phoneNumber: z.string().optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark']),
    notifications: z.boolean(),
  }),
})
```

## Medical Booking Specific Schemas

### Patient Schema

```typescript
export const patientSchema = z.object({
  id: z.string().uuid().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number'),
  dateOfBirth: z.string().datetime().transform(str => new Date(str)),
  gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say']),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(2, 'State is required'),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid zip code'),
  }),
  emergencyContact: z.object({
    name: z.string().min(1, 'Emergency contact name is required'),
    phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number'),
    relationship: z.string().min(1, 'Relationship is required'),
  }),
  medicalHistory: z.array(z.object({
    condition: z.string(),
    diagnosedDate: z.string().datetime().optional(),
    isOngoing: z.boolean().default(false),
    notes: z.string().optional(),
  })).default([]),
}).refine((data) => {
  const age = new Date().getFullYear() - data.dateOfBirth.getFullYear()
  return age >= 0 && age <= 150
}, {
  message: "Invalid date of birth",
  path: ["dateOfBirth"],
})

export type Patient = z.infer<typeof patientSchema>
```

### Appointment Schema

```typescript
export const appointmentSchema = z.object({
  id: z.string().uuid().optional(),
  patientId: z.string().uuid(),
  providerId: z.string().uuid(),
  serviceId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show']),
  type: z.enum(['in-person', 'telehealth']),
  notes: z.string().optional(),
  symptoms: z.array(z.string()).default([]),
  urgency: z.enum(['low', 'medium', 'high']).default('medium'),
  remindersSent: z.array(z.object({
    type: z.enum(['email', 'sms']),
    sentAt: z.string().datetime(),
  })).default([]),
}).refine((data) => {
  return new Date(data.endTime) > new Date(data.startTime)
}, {
  message: "End time must be after start time",
  path: ["endTime"],
}).refine((data) => {
  const start = new Date(data.startTime)
  const now = new Date()
  return start > now
}, {
  message: "Appointment must be scheduled for a future time",
  path: ["startTime"],
})

export type Appointment = z.infer<typeof appointmentSchema>
```

### Provider Schema

```typescript
export const providerSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  specialties: z.array(z.string()).min(1, 'At least one specialty is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  licenseState: z.string().min(2, 'License state is required'),
  yearsOfExperience: z.number().int().min(0).max(70),
  education: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
    graduationYear: z.number().int().min(1950).max(new Date().getFullYear()),
  })),
  certifications: z.array(z.object({
    name: z.string(),
    issuingBody: z.string(),
    issueDate: z.string().datetime(),
    expiryDate: z.string().datetime().optional(),
  })).default([]),
  availability: z.object({
    monday: z.array(z.object({
      start: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
      end: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
    })).default([]),
    tuesday: z.array(z.object({
      start: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
      end: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
    })).default([]),
    // ... other days
  }),
  isAcceptingNewPatients: z.boolean().default(true),
  languages: z.array(z.string()).default(['English']),
})

export type Provider = z.infer<typeof providerSchema>
```

## Form Integration

### With React Hook Form

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

function PatientForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Patient>({
    resolver: zodResolver(patientSchema),
  })

  const onSubmit = (data: Patient) => {
    // Data is fully typed and validated
    console.log(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('firstName')}
        placeholder="First Name"
      />
      {errors.firstName && <span>{errors.firstName.message}</span>}
      
      <input
        {...register('email')}
        type="email"
        placeholder="Email"
      />
      {errors.email && <span>{errors.email.message}</span>}
      
      <button type="submit">Submit</button>
    </form>
  )
}
```

## Best Practices for MedBookings

1. **Custom Error Messages**: Always provide user-friendly error messages
2. **Type Safety**: Use `z.infer` to extract TypeScript types
3. **Validation at Boundaries**: Validate data at API boundaries and form inputs
4. **Transform Data**: Use transforms for data normalization (dates, numbers)
5. **Reusable Schemas**: Create composable schemas for common patterns
6. **Medical Data Validation**: Be extra careful with medical data validation rules

## Additional Resources

- [Zod Documentation](https://zod.dev)
- [API Reference](https://zod.dev/README)
- [React Hook Form Integration](https://react-hook-form.com/get-started#SchemaValidation)
- [Error Handling Guide](https://zod.dev/ERROR_HANDLING)

Version: 3.25.48