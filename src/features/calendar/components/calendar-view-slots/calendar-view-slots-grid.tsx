import { Button } from '@/components/ui/button';
import { convertUTCToLocal, formatLocalTime } from '@/lib/timezone-helper';
import { cn } from '@/lib/utils';

import { AvailabilitySlot, AvailabilityView } from '../../lib/types';

interface CalendarViewSlotsGridProps {
  rangeStartDate: string;
  availabilityData: AvailabilityView[];
  serviceProviderId: string;
  onRefresh: () => Promise<void>;
  onView: (availability: AvailabilityView) => void;
  onEdit: (availability: AvailabilityView) => void;
}

export function CalendarViewSlotsGrid({
  rangeStartDate,
  availabilityData,
  serviceProviderId,
  onRefresh,
  onView,
  onEdit,
}: CalendarViewSlotsGridProps) {
  // Add console logs to debug
  console.log('availabilityData:', availabilityData);

  // Find shortest duration with error handling
  const allSlots = availabilityData.flatMap((a) => a.slots);

  if (allSlots.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <h2 className="flex items-center justify-center border-b px-4 py-2 text-lg font-semibold text-gray-900">
          {convertUTCToLocal(rangeStartDate).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </h2>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-gray-500">No availability slots found for this date.</p>
        </div>
      </div>
    );
  }

  const shortestDuration = Math.min(
    ...allSlots.map(
      (slot) => (new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / 60000
    )
  );
  console.log('shortestDuration:', shortestDuration);

  // Find the earliest and latest times from available slots
  const earliestSlot = convertUTCToLocal(
    allSlots.reduce(
      (earliest, slot) => (slot.startTime < earliest ? slot.startTime : earliest),
      allSlots[0].startTime
    )
  );
  const latestSlot = convertUTCToLocal(
    allSlots.reduce(
      (latest, slot) => (slot.endTime > latest ? slot.endTime : latest),
      allSlots[0].endTime
    )
  );

  // Generate time slots only for the period with availability
  const timeSlots: Date[] = [];
  let currentTime = new Date(earliestSlot);
  currentTime.setMinutes(
    Math.floor(currentTime.getMinutes() / shortestDuration) * shortestDuration
  );

  while (currentTime < latestSlot) {
    timeSlots.push(new Date(currentTime));
    currentTime = new Date(currentTime.getTime() + shortestDuration * 60000);
  }
  console.log('timeSlots:', timeSlots);

  // Get all unique services
  const services = Array.from(
    new Set(
      availabilityData.flatMap((a) =>
        a.slots.map((slot) => JSON.stringify({ id: slot.service.id, name: slot.service.name }))
      )
    )
  ).map((str) => JSON.parse(str));

  // Track which cells are covered by rowSpan
  const coveredCells: Record<string, boolean> = {};

  const getSlotStyles = (slot: AvailabilitySlot) => {
    switch (slot.status) {
      case 'AVAILABLE':
        return 'border-green-500 text-green-600 hover:bg-green-50';
      case 'BOOKED':
        return 'border-blue-500 text-blue-600 hover:bg-blue-50';
      default:
        return 'border-gray-300 text-gray-400 cursor-not-allowed';
    }
  };

  return (
    <div className="flex h-full flex-col">
      <h2 className="flex items-center justify-center border-b px-4 py-2 text-lg font-semibold text-gray-900">
        {convertUTCToLocal(rangeStartDate).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}
      </h2>

      <div className="isolate flex flex-auto overflow-hidden bg-white">
        <div className="grid flex-auto overflow-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 grid auto-cols-[minmax(0,16rem)] grid-flow-col bg-white text-xs text-gray-500 shadow ring-1 ring-black/5">
            <div className="w-0"></div> {/* Hidden time column */}
            {services.map((service) => (
              <div key={service.id} className="py-3 text-center font-semibold">
                {service.name}
              </div>
            ))}
          </div>

          {/* Time slots grid */}
          <div className="grid grid-flow-row [&>*]:h-8">
            {timeSlots.map((time, timeIndex) => (
              <div
                key={`time-${time.getTime()}-${timeIndex}`}
                className="grid"
                style={{
                  gridTemplateColumns: `0px repeat(${services.length}, minmax(0, 16rem))`,
                }}
              >
                <div className="w-0"></div> {/* Hidden time column */}
                {services.map((service) => {
                  const cellKey = `${service.id}-${time.getTime()}`;
                  if (coveredCells[cellKey]) {
                    return <div key={cellKey} className="h-8" />;
                  }

                  const availability = availabilityData.find((a) =>
                    a.slots.some(
                      (s) =>
                        s.service.id === service.id &&
                        convertUTCToLocal(s.startTime).getTime() === time.getTime()
                    )
                  );

                  const slot = availability?.slots.find(
                    (s) =>
                      s.service.id === service.id &&
                      convertUTCToLocal(s.startTime).getTime() === time.getTime()
                  );

                  if (slot) {
                    const durationInMinutes =
                      (new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) /
                      60000;
                    const rowSpan = Math.floor(durationInMinutes / shortestDuration);

                    // Mark cells that will be covered by this slot
                    for (let i = 1; i < rowSpan; i++) {
                      const futureTime = new Date(time.getTime() + i * shortestDuration * 60000);
                      coveredCells[`${service.id}-${futureTime.getTime()}`] = true;
                    }

                    return (
                      <div
                        key={slot.id}
                        className="h-full"
                        style={{
                          gridRow: `span ${rowSpan}`,
                          height: `${rowSpan * 2}rem`, // 2rem (32px) per slot
                        }}
                      >
                        <Button
                          variant="outline"
                          onClick={() => slot.status !== 'BLOCKED' && onView(availability!)}
                          disabled={slot.status === 'BLOCKED'}
                          className={cn('h-full w-full', getSlotStyles(slot))}
                        >
                          {formatLocalTime(slot.startTime)}
                        </Button>
                      </div>
                    );
                  }

                  return <div key={cellKey} className="h-8" />;
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
