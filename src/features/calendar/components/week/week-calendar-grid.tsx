'use client';

interface WeekCalendarGridProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onViewChange?: (view: 'day') => void;
}

export function WeekCalendarGrid({
  currentDate,
  onDateChange,
  onViewChange = () => {},
}: WeekCalendarGridProps) {
  const container = useRef<HTMLDivElement>(null);
  const containerNav = useRef<HTMLDivElement>(null);
  const containerOffset = useRef<HTMLDivElement>(null);

  const weekDays = generateDaysForWeekCalendar(currentDate);

  const handleDayClick = (date: Date) => {
    onDateChange(date);
    onViewChange('day');
  };

  // Keep scroll to current time effect
  useEffect(() => {
    if (!container.current || !containerNav.current || !containerOffset.current) return;

    const currentMinute = new Date().getHours() * 60;
    container.current.scrollTop =
      ((container.current.scrollHeight -
        containerNav.current.offsetHeight -
        containerOffset.current.offsetHeight) *
        currentMinute) /
      1440;
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div ref={container} className="isolate flex flex-auto flex-col overflow-auto bg-white">
        <div className="flex max-w-full flex-none flex-col">
          <div
            ref={containerNav}
            className="sticky top-0 z-30 flex-none bg-white shadow ring-1 ring-black/5"
          >
            <div className="flex">
              <div className="sticky left-0 z-10 w-14 flex-none bg-white" />
              <div className="grid flex-auto grid-cols-7 divide-x divide-gray-100">
                {weekDays.map((day, index) => (
                  <div key={index} className="flex items-center justify-center py-3">
                    <button
                      onClick={() => handleDayClick(day.date)}
                      className="cursor-pointer rounded-lg px-2 py-1 hover:bg-gray-100"
                    >
                      <span>
                        <span className="hidden sm:inline">
                          {day.date.toLocaleDateString('en-US', { weekday: 'short' })}{' '}
                        </span>
                        <span className="items-center justify-center font-semibold text-gray-900">
                          {day.date.getDate()}
                        </span>
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <WeekTimeGrid
            containerRef={container}
            navRef={containerNav}
            offsetRef={containerOffset}
            filteredSchedule={filteredSchedule}
          />
        </div>
      </div>
    </div>
  );
}
