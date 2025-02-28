'use client';

import { useState } from 'react';

import { formatTime } from '@/lib/helper';
import { cn } from '@/lib/utils';

import { AvailabilityView } from '../lib/types';

interface CalendarViewAvailabilityProps {
  availability: AvailabilityView;
  gridPosition: string;
  gridColumn: number;
  onAvailabilityClick?: (availability: AvailabilityView) => void;
  onAvailabilityEdit?: (availability: AvailabilityView) => void;
}

export function CalendarViewAvailability({
  availability,
  gridPosition,
  gridColumn,
  onAvailabilityClick,
  onAvailabilityEdit,
}: CalendarViewAvailabilityProps) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onAvailabilityEdit?.(availability);
  };

  return (
    <li
      className={cn('relative mt-px flex', `sm:col-start-${gridColumn}`)}
      style={{ gridRow: gridPosition }}
    >
      <button
        onClick={() => onAvailabilityClick?.(availability)}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsTooltipVisible(true)}
        onMouseLeave={() => setIsTooltipVisible(false)}
        className="group absolute inset-1 flex w-full flex-col overflow-y-auto rounded-lg bg-blue-50 p-2 text-xs/5 hover:bg-blue-100"
      >
        {/* Simple Time Display */}
        <p className="font-semibold text-blue-700">
          {formatTime(availability.startTime)} - {formatTime(availability.endTime)}
        </p>

        {/* Tooltip with detailed info */}
        {isTooltipVisible && (
          <div className="absolute left-full top-0 z-50 ml-2 w-48 rounded-lg bg-white p-2 text-xs shadow-lg ring-1 ring-gray-200">
            <div className="flex flex-col gap-1">
              <p className="font-semibold">Available Services:</p>
              {availability.availableServices.map((service) => (
                <div key={service.serviceId} className="border-t pt-1 first:border-t-0 first:pt-0">
                  <p>Duration: {service.duration}min</p>
                  <p>Price: R{service.price}</p>
                  <p>
                    {[service.isOnlineAvailable && 'Online', service.isInPerson && 'In-Person']
                      .filter(Boolean)
                      .join(' | ')}
                  </p>
                  {service.location && <p>Location: {service.location}</p>}
                </div>
              ))}
              <p className="mt-2 text-xs text-gray-500">Right-click to edit availability</p>
            </div>
          </div>
        )}
      </button>
    </li>
  );
}
