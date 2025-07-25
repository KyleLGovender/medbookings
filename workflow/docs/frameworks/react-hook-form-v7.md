# React Hook Form v7 Documentation

## Basic Setup

### Simple Form

```typescript
import { useForm } from 'react-hook-form'

interface FormData {
  name: string
  email: string
  age: number
}

function BasicForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()

  const onSubmit = (data: FormData) => {
    console.log(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('name', { required: 'Name is required' })}
        placeholder="Name"
      />
      {errors.name && <span>{errors.name.message}</span>}

      <input
        {...register('email', {
          required: 'Email is required',
          pattern: {
            value: /^\S+@\S+$/i,
            message: 'Invalid email address'
          }
        })}
        placeholder="Email"
      />
      {errors.email && <span>{errors.email.message}</span>}

      <input
        {...register('age', {
          required: 'Age is required',
          min: { value: 18, message: 'Must be at least 18' }
        })}
        type="number"
        placeholder="Age"
      />
      {errors.age && <span>{errors.age.message}</span>}

      <button type="submit">Submit</button>
    </form>
  )
}
```

## Validation with Zod

### Zod Schema Integration

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type FormData = z.infer<typeof schema>

function ValidatedForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      age: 0,
    }
  })

  const onSubmit = async (data: FormData) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log(data)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} placeholder="Name" />
      {errors.name && <span>{errors.name.message}</span>}

      <input {...register('email')} placeholder="Email" />
      {errors.email && <span>{errors.email.message}</span>}

      <input {...register('age', { valueAsNumber: true })} type="number" />
      {errors.age && <span>{errors.age.message}</span>}

      <input {...register('password')} type="password" placeholder="Password" />
      {errors.password && <span>{errors.password.message}</span>}

      <input {...register('confirmPassword')} type="password" placeholder="Confirm Password" />
      {errors.confirmPassword && <span>{errors.confirmPassword.message}</span>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  )
}
```

## Advanced Patterns

### Controlled Components

```typescript
import { useForm, Controller } from 'react-hook-form'
import { Select } from '@/components/ui/select'

interface FormData {
  category: string
  priority: 'low' | 'medium' | 'high'
  description: string
}

function ControlledForm() {
  const { control, handleSubmit, watch } = useForm<FormData>({
    defaultValues: {
      category: '',
      priority: 'medium',
      description: '',
    }
  })

  const watchedCategory = watch('category')

  return (
    <form onSubmit={handleSubmit(console.log)}>
      <Controller
        name="category"
        control={control}
        rules={{ required: 'Category is required' }}
        render={({ field, fieldState: { error } }) => (
          <div>
            <Select
              value={field.value}
              onValueChange={field.onChange}
              placeholder="Select category"
            >
              <option value="general">General</option>
              <option value="urgent">Urgent</option>
              <option value="follow-up">Follow-up</option>
            </Select>
            {error && <span>{error.message}</span>}
          </div>
        )}
      />

      <Controller
        name="priority"
        control={control}
        render={({ field }) => (
          <div>
            <label>
              <input
                type="radio"
                value="low"
                checked={field.value === 'low'}
                onChange={field.onChange}
              />
              Low
            </label>
            <label>
              <input
                type="radio"
                value="medium"
                checked={field.value === 'medium'}
                onChange={field.onChange}
              />
              Medium
            </label>
            <label>
              <input
                type="radio"
                value="high"
                checked={field.value === 'high'}
                onChange={field.onChange}
              />
              High
            </label>
          </div>
        )}
      />

      {watchedCategory === 'urgent' && (
        <Controller
          name="description"
          control={control}
          rules={{ required: 'Description required for urgent items' }}
          render={({ field, fieldState: { error } }) => (
            <div>
              <textarea {...field} placeholder="Describe urgency" />
              {error && <span>{error.message}</span>}
            </div>
          )}
        />
      )}

      <button type="submit">Submit</button>
    </form>
  )
}
```

### Dynamic Forms

```typescript
import { useForm, useFieldArray } from 'react-hook-form'

interface MedicalHistory {
  condition: string
  year: number
  ongoing: boolean
}

interface PatientForm {
  patientName: string
  medicalHistory: MedicalHistory[]
}

function DynamicForm() {
  const { register, control, handleSubmit } = useForm<PatientForm>({
    defaultValues: {
      patientName: '',
      medicalHistory: [{ condition: '', year: new Date().getFullYear(), ongoing: false }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'medicalHistory'
  })

  return (
    <form onSubmit={handleSubmit(console.log)}>
      <input
        {...register('patientName', { required: true })}
        placeholder="Patient Name"
      />

      <h3>Medical History</h3>
      {fields.map((field, index) => (
        <div key={field.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
          <input
            {...register(`medicalHistory.${index}.condition`, { required: true })}
            placeholder="Condition"
          />
          
          <input
            {...register(`medicalHistory.${index}.year`, { 
              required: true,
              valueAsNumber: true,
              min: 1900,
              max: new Date().getFullYear()
            })}
            type="number"
            placeholder="Year"
          />
          
          <label>
            <input
              {...register(`medicalHistory.${index}.ongoing`)}
              type="checkbox"
            />
            Ongoing condition
          </label>
          
          <button
            type="button"
            onClick={() => remove(index)}
            disabled={fields.length === 1}
          >
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => append({ condition: '', year: new Date().getFullYear(), ongoing: false })}
      >
        Add Medical History
      </button>

      <button type="submit">Submit</button>
    </form>
  )
}
```

### Form with Server Actions

```typescript
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { appointmentSchema } from '@/lib/schemas'
import { createAppointment } from '@/features/appointments/lib/actions'
import { toast } from 'sonner'

type AppointmentForm = z.infer<typeof appointmentSchema>

function AppointmentForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AppointmentForm>({
    resolver: zodResolver(appointmentSchema),
  })

  const onSubmit = async (data: AppointmentForm) => {
    try {
      const result = await createAppointment(data)
      
      if (result.success) {
        toast.success('Appointment created successfully!')
        reset()
      } else {
        toast.error(result.error || 'Failed to create appointment')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="patientName">Patient Name</label>
        <input
          id="patientName"
          {...register('patientName')}
          placeholder="Enter patient name"
        />
        {errors.patientName && (
          <span className="error">{errors.patientName.message}</span>
        )}
      </div>

      <div>
        <label htmlFor="appointmentDate">Appointment Date</label>
        <input
          id="appointmentDate"
          type="datetime-local"
          {...register('appointmentDate')}
        />
        {errors.appointmentDate && (
          <span className="error">{errors.appointmentDate.message}</span>
        )}
      </div>

      <div>
        <label htmlFor="reason">Reason for Visit</label>
        <textarea
          id="reason"
          {...register('reason')}
          placeholder="Describe the reason for the appointment"
        />
        {errors.reason && (
          <span className="error">{errors.reason.message}</span>
        )}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Appointment'}
      </button>
    </form>
  )
}
```

## Form State Management

### Watching Form Values

```typescript
function WatchingForm() {
  const { register, watch, control } = useForm<FormData>()

  // Watch all fields
  const watchedValues = watch()

  // Watch specific field
  const watchedName = watch('name')

  // Watch multiple fields
  const watchedFields = watch(['name', 'email'])

  // Watch with callback
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      console.log(value, name, type)
    })
    return () => subscription.unsubscribe()
  }, [watch])

  return (
    <form>
      <input {...register('name')} />
      <input {...register('email')} />
      
      <div>Current name: {watchedName}</div>
      <div>All values: {JSON.stringify(watchedValues)}</div>
    </form>
  )
}
```

### Form Submission States

```typescript
function SubmissionStates() {
  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
      isSubmitted,
      isSubmitSuccessful,
      isValid,
      isDirty,
      dirtyFields,
      touchedFields,
    },
    reset,
  } = useForm<FormData>({
    mode: 'onChange', // Validate on change
  })

  const onSubmit = async (data: FormData) => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    console.log(data)
  }

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset() // Reset form after successful submission
    }
  }, [isSubmitSuccessful, reset])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name', { required: true })} />
      
      <div>
        <p>Is Valid: {isValid ? 'Yes' : 'No'}</p>
        <p>Is Dirty: {isDirty ? 'Yes' : 'No'}</p>
        <p>Is Submitting: {isSubmitting ? 'Yes' : 'No'}</p>
        <p>Is Submitted: {isSubmitted ? 'Yes' : 'No'}</p>
        <p>Submit Successful: {isSubmitSuccessful ? 'Yes' : 'No'}</p>
      </div>

      <button type="submit" disabled={isSubmitting || !isValid}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  )
}
```

## Custom Hooks

### Reusable Form Hook

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

interface UseFormOptions<T> {
  schema: z.ZodSchema<T>
  onSubmit: (data: T) => Promise<void>
  defaultValues?: Partial<T>
}

export function useFormWithToast<T>({
  schema,
  onSubmit,
  defaultValues,
}: UseFormOptions<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit(data)
      toast.success('Form submitted successfully!')
      form.reset()
    } catch (error) {
      toast.error('Failed to submit form')
      console.error(error)
    }
  })

  return {
    ...form,
    onSubmit: handleSubmit,
  }
}

// Usage
function MyForm() {
  const { register, onSubmit, formState: { errors, isSubmitting } } = 
    useFormWithToast({
      schema: mySchema,
      onSubmit: async (data) => {
        await submitToApi(data)
      },
    })

  return (
    <form onSubmit={onSubmit}>
      {/* form fields */}
    </form>
  )
}
```

## Best Practices for MedBookings

1. **Use Zod**: Always combine with Zod for type-safe validation
2. **Error Handling**: Implement consistent error display patterns
3. **Loading States**: Show loading indicators during submission
4. **Form Reset**: Reset forms after successful submission
5. **Accessibility**: Use proper labels and ARIA attributes
6. **Server Integration**: Use with Next.js Server Actions for seamless backend integration

## Additional Resources

- [React Hook Form Documentation](https://react-hook-form.com)
- [API Reference](https://react-hook-form.com/api)
- [Zod Integration](https://react-hook-form.com/get-started#SchemaValidation)
- [TypeScript Guide](https://react-hook-form.com/ts)

Version: 7.57.0