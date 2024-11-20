// Server Component
interface DayTimeGridProps {
  containerRef: RefObject<HTMLDivElement>;
  navRef: RefObject<HTMLDivElement>;
  offsetRef: RefObject<HTMLDivElement>;
  currentDate: string;
  filteredSchedule: Schedule[];
}

export function DayTimeGrid({
  containerRef,
  navRef,
  offsetRef,
  currentDate,
  filteredSchedule
}: DayTimeGridProps) {
  const currentDateObj = new Date(currentDate);

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
          <div
            className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100"
            style={{ gridTemplateRows: 'repeat(48, minmax(1.0rem, 1fr))' }}
          >
            <div ref={offsetRef} className="row-end-1 h-7" />
            {/* Time slots */}
            {Array.from({ length: 24 }, (_, hour) => (
              <React.Fragment key={hour}>
                <div>
                  <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">
                    {hour === 0 ? '12AM' : hour < 12 ? `${hour}AM` : hour === 12 ? '12PM' : `${hour - 12}PM`}
                  </div>
                </div>
                <div />
              </React.Fragment>
            ))}
          </div>

          {/* Events */}
          <ol
            className="col-start-1 col-end-2 row-start-1 grid grid-cols-1"
            style={{ gridTemplateRows: '1.75rem repeat(288, minmax(0, 1fr)) auto' }}
          >
            {filteredSchedule.map((availability) => (
              // Render availability and bookings
              // ... existing event rendering logic
            ))}
          </ol>
        </div>
      </div>
    </>
  );
} 
