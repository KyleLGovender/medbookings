'use client'

import { Button, Checkbox, Input, Select, SelectItem } from '@nextui-org/react'
import { useFormState, useFormStatus } from 'react-dom'
import { createAvailability } from '../lib/actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button 
      type="submit" 
      color="primary"
      isLoading={pending}
    >
      Add Availability
    </Button>
  )
}

export function AvailabilityForm() {
  const [state, formAction] = useFormState(createAvailability, null)

  const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ]

  return (
    <form action={formAction}>
      <div className="flex flex-col gap-4">
        <Select
          name="dayOfWeek"
          label="Day of Week"
          placeholder="Select a day"
          isRequired
          errorMessage={state?.errors?.dayOfWeek}
        >
          {daysOfWeek.map((day) => (
            <SelectItem key={day} value={day}>
              {day}
            </SelectItem>
          ))}
        </Select>

        <Input
          type="time"
          name="startTime"
          label="Start Time"
          isRequired
          errorMessage={state?.errors?.startTime}
        />

        <Input
          type="time" 
          name="endTime"
          label="End Time"
          isRequired
          errorMessage={state?.errors?.endTime}
        />

        <Checkbox 
          name="isRecurring" 
          defaultSelected
        >
          Recurring weekly
        </Checkbox>

        {state?.error && (
          <p className="text-danger text-sm">{state.error}</p>
        )}

        <SubmitButton />
      </div>
    </form>
  )
}
