interface CalendarDay {
  date: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

export function generateDaysForDayCalendar(currentDate: Date) {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const daysInMonth = lastDay.getDate()
    
    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    let startPadding = firstDay.getDay()
    if (startPadding === 0) startPadding = 7  // Convert Sunday from 0 to 7
    startPadding -= 1  // Adjust to Monday-based (0-6)
    
    const days: CalendarDay[] = []
    
    // Add previous month's days
    const daysInPrevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate()
    
    for (let i = startPadding; i > 0; i--) {
      const dayNumber = daysInPrevMonth - i + 1;
      
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, dayNumber)
      
      days.push({
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        isCurrentMonth: false,
        isToday: isSameDay(date, new Date()),
        isSelected: isSameDay(date, currentDate)
      })
    }
    

    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i)
      days.push({
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        isCurrentMonth: true,
        isToday: isSameDay(date, new Date()),
        isSelected: isSameDay(date, currentDate)
      })
    }
    
    // Add next month's days
    const remainingDays = 42 - days.length // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i)
      days.push({
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        isCurrentMonth: false,
        isToday: isSameDay(date, new Date()),
        isSelected: isSameDay(date, currentDate)
      })
    }
    
    return days;
}

export function generateDaysForWeekCalendar(currentDate: Date) {
// Get the start of the week (Monday) for the current date
  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() === 0 ? -6 : 1))

  // Generate array of dates for the week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + i)
    return {
      date,
      isToday: isSameDay(date, new Date()),
      isSelected: isSameDay(date, currentDate),
    }
  })

  return weekDays;
}

export function generateDaysForMonthCalendar(currentDate: Date) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const firstDayWeekday = (firstDayOfMonth.getDay() + 6) % 7
  
  const days = []
  
  // Add days from previous month
  const prevMonth = new Date(year, month - 1)
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    const date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevMonthLastDay - i)
    days.push({
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      isCurrentMonth: false,
      events: []
    })
  }
  
  // Add days from current month
  const today = new Date()
  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    const date = new Date(year, month, day)
    days.push({
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      isCurrentMonth: true,
      isToday: isSameDay(date, today),
      events: []
    })
  }
  
  // Add days from next month
  const remainingDays = 42 - days.length
  const nextMonth = new Date(year, month + 1)
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), day)
    days.push({
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      isCurrentMonth: false,
      events: []
    })
  }
  
  return days
}

export function generateDaysForConsultsCalendar(currentDate: Date) {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    
    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    let startPadding = firstDay.getDay()
    if (startPadding === 0) startPadding = 7  // Convert Sunday from 0 to 7
    startPadding -= 1  // Adjust to Monday-based (0-6)
    
    const days = []
    
    // Add previous month's days
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    const daysInPrevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate()
    
    for (let i = startPadding; i > 0; i--) {
        const date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), daysInPrevMonth - i + 1)
        days.push({
            date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        })
    }
    
    // Add current month's days
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i)
        days.push({
            date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
            isCurrentMonth: true,
            isToday: isSameDay(date, new Date()),
            isSelected: isSameDay(date, currentDate)
        })
    }
    
    // Add next month's days to complete 42 days (6 weeks)
    const remainingDays = 42 - days.length
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    for (let i = 1; i <= remainingDays; i++) {
        const date = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), i)
        days.push({
            date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        })
    }
    
    return days
}

function isSameDay(date1: Date, date2: Date) {
    return (
        date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear()
    )
}

// Add this function to format the datetime consistently
export function formatDateTime(date: string) {
    return new Date(date).toISOString().split('.')[0].slice(0, -3)
}


