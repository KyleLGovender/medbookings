import { CalendarViewTimeColumn } from '../calendar-view-time-column';

// Server Component
interface CalendarViewDayTimeGridProps {
  containerRef: RefObject<HTMLDivElement>;
  navRef: RefObject<HTMLDivElement>;
  offsetRef: RefObject<HTMLDivElement>;
  currentDate: string;
  scheduleData: Schedule[];
}

export function CalendarViewDayTimeGrid({
  containerRef,
  navRef,
  offsetRef,
  currentDate,
  scheduleData,
}: CalendarViewDayTimeGridProps) {
  const currentDateObj = new Date(currentDate);

  // Filter schedule for current day
  const daySchedule = scheduleData.filter(
    (schedule) => new Date(schedule.startTime).toDateString() === currentDateObj.toDateString()
  );

  return (
    <>
      <header className="flex items-center justify-center border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">
          {currentDateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </h1>
      </header>

      <div className="flex w-full flex-auto">
        <div className="w-14 flex-none bg-white ring-1 ring-gray-100" />
        <div className="grid flex-auto grid-cols-1 grid-rows-1">
          {/* Time grid */}
          <CalendarViewTimeColumn offsetRef={offsetRef} />

          {/* Events */}
          <ol
            className="col-start-1 col-end-2 row-start-1 grid grid-cols-1"
            style={{ gridTemplateRows: '1.75rem repeat(288, minmax(0, 1fr)) auto' }}
          >
            {daySchedule.map((schedule) => (
              <CalendarViewEventItem
                key={schedule.id}
                schedule={schedule}
                gridPosition={getEventGridPosition(schedule.startTime, schedule.endTime)}
                gridColumn={1}
              />
            ))}
          </ol>
        </div>
      </div>
    </>
  );
}
