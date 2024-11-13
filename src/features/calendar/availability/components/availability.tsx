'use client'

import ConsultsCalendar from '@/features/calendar/components/consults'
import DayCalendar from '@/features/calendar/components/day'
import MonthCalendar from '@/features/calendar/components/month'
import WeekCalendar from '@/features/calendar/components/week'
import { useState } from 'react'

type ViewType = 'day' | 'week' | 'month' | 'consults'

interface ServiceProviderAvailabilityProps {
  providerId: string
  providerName: string
}

const ServiceProviderAvailability: React.FC<ServiceProviderAvailabilityProps> = ({
  providerId,
  providerName,
}) => {
  const [view, setView] = useState<ViewType>('week')

  const renderCalendar = () => {
    switch (view) {
      case 'day':
        return <DayCalendar />
      case 'week':
        return <WeekCalendar />
      case 'month':
        return <MonthCalendar />
      case 'consults':
        return <ConsultsCalendar />
      default:
        return <WeekCalendar />
    }
  }

  return (
    <div className="max-w-[100vw] overflow-x-hidden p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {providerName}'s Availability
        </h1>
      </div>

      {/* Calendar View */}
      <div className="rounded-lg bg-white shadow">
        {renderCalendar()}
      </div>
    </div>
  )
}

export default ServiceProviderAvailability
