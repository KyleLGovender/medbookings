import React, { RefObject } from 'react';

interface CalendarViewTimeColumnProps {
  offsetRef: RefObject<HTMLDivElement>;
}

export function CalendarViewTimeColumn({ offsetRef }: CalendarViewTimeColumnProps) {
  return (
    <div
      className="pointer-events-none z-20 col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100"
      style={{ gridTemplateRows: 'repeat(48, minmax(1.0rem, 1fr))' }}
    >
      <div ref={offsetRef} className="row-end-1 h-7" />
      {/* Time slots */}
      {Array.from({ length: 24 }, (_, hour) => (
        <React.Fragment key={hour}>
          <div>
            <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">
              {hour === 0
                ? '12AM'
                : hour < 12
                  ? `${hour}AM`
                  : hour === 12
                    ? '12PM'
                    : `${hour - 12}PM`}
            </div>
          </div>
          <div />
        </React.Fragment>
      ))}
    </div>
  );
}
