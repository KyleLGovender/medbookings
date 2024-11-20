'use client';

interface DayCalendarGridProps {
  currentDate: string;
  onDateChange: (dateStr: string) => void;
}

export function DayCalendarGrid({ currentDate, onDateChange }: DayCalendarGridProps) {
  const container = useRef<HTMLDivElement>(null);
  const containerNav = useRef<HTMLDivElement>(null);
  const containerOffset = useRef<HTMLDivElement>(null);

  const currentDateObj = new Date(currentDate);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentDateObj);
    date.setDate(currentDateObj.getDate() - currentDateObj.getDay() + i);
    return date;
  });

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
      <div className="isolate flex flex-auto overflow-hidden bg-white">
        <div ref={container} className="flex flex-auto flex-col overflow-auto">
          {/* Mobile week nav */}
          <div
            ref={containerNav}
            className="sticky top-0 z-10 grid flex-none grid-cols-7 bg-white text-xs text-gray-500 shadow ring-1 ring-black/5 md:hidden"
          >
            {weekDates.map((date) => {
              const isSelected = date.toDateString() === currentDateObj.toDateString();
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => onDateChange(date.toISOString())}
                  className="flex flex-col items-center pb-1.5 pt-3"
                >
                  <span>{date.toLocaleDateString('en-US', { weekday: 'short' })[0]}</span>
                  <span
                    className={classNames(
                      'mt-3 flex size-8 items-center justify-center rounded-full text-base font-semibold',
                      isSelected && 'bg-gray-900 text-white',
                      isToday && !isSelected && 'text-indigo-600',
                      !isSelected && !isToday && 'text-gray-900'
                    )}
                  >
                    {date.getDate()}
                  </span>
                </button>
              );
            })}
          </div>

          <DayTimeGrid
            containerRef={container}
            navRef={containerNav}
            offsetRef={containerOffset}
            currentDate={currentDate}
            filteredSchedule={filteredSchedule}
          />
        </div>
      </div>
    </div>
  );
}
