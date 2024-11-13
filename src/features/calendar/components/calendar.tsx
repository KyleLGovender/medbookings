'use client'

import { CalendarHeader } from '@/features/calendar/components/calendar-header'
import ConsultsCalendar from '@/features/calendar/components/consults'
import DayCalendar from '@/features/calendar/components/day'
import MonthCalendar from '@/features/calendar/components/month'
import WeekCalendar from '@/features/calendar/components/week'
import { useState } from 'react'

type ViewType = 'day' | 'week' | 'month' | 'consults'

interface ServiceProviderCalendarProps {
  providerId: string
  providerName: string
}

const ServiceProviderCalendar: React.FC<ServiceProviderCalendarProps> = ({
  providerId,
  providerName,
}) => {
  const [view, setView] = useState<ViewType>('week')
  const [currentDate, setCurrentDate] = useState(new Date())

  const handlePrevious = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      switch (view) {
        case 'day':
          newDate.setDate(prev.getDate() - 1)
          break
        case 'week':
          newDate.setDate(prev.getDate() - 7)
          break
        case 'month':
          newDate.setMonth(prev.getMonth() - 1)
          break
        default:
          newDate.setDate(prev.getDate() - 1)
      }
      return newDate
    })
  }

  const handleNext = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      switch (view) {
        case 'day':
          newDate.setDate(prev.getDate() + 1)
          break
        case 'week':
          newDate.setDate(prev.getDate() + 7)
          break
        case 'month':
          newDate.setMonth(prev.getMonth() + 1)
          break
        default:
          newDate.setDate(prev.getDate() + 1)
      }
      return newDate
    })
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const formatTitle = (date: Date, view: ViewType): string => {
    switch (view) {
      case 'day':
        return date.toLocaleDateString('en-ZA', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'short', 
          day: '2-digit' 
        })
      case 'week': {
        // Get Monday of the current week
        const monday = new Date(date)
        monday.setDate(date.getDate() - date.getDay() + 1)
        
        // Get Sunday of the current week
        const sunday = new Date(monday)
        sunday.setDate(monday.getDate() + 6)
        
        // Format as "Week of Mon 1 - Sun 7 January"
        return `${monday.toLocaleDateString('en-ZA', { 
          weekday: 'short', 
          day: '2-digit'
        })} - ${sunday.toLocaleDateString('en-ZA', { 
          weekday: 'short', 
          day: '2-digit',
          month: 'short'
        })}`
      }
      case 'month':
        return date.toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })
      default:
        return date.toLocaleDateString('en-ZA', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'short', 
          day: '2-digit' 
        })
    }
  }

  const renderCalendar = () => {
    const props = {
      currentDate,
      onDateChange: setCurrentDate,
    }

    switch (view) {
      case 'day':
        return <DayCalendar {...props} />
      case 'week':
        return <WeekCalendar {...props} />
      case 'month':
        return <MonthCalendar {...props} />
      case 'consults':
        return <ConsultsCalendar {...props} />
      default:
        return <WeekCalendar {...props} />
    }
  }

  return (
    <div className="max-w-[100vw] overflow-x-hidden p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {providerName}'s Availability
        </h1>
      </div>

      <div className="rounded-lg bg-white shadow">
        <CalendarHeader
          view={view}
          onViewChange={setView}
          currentDate={currentDate}
          title={formatTitle(currentDate, view)}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onToday={handleToday}
        />
        {renderCalendar()}
      </div>
    </div>
  )
}

export default ServiceProviderCalendar
