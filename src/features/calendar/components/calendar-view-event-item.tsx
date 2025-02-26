'use client';

import { useState } from 'react';

import { formatTime } from '@/lib/helper';
import { cn } from '@/lib/utils';

import { AvailabilitySlot } from '../lib/types';

interface CalendarViewEventItemProps {
  slot: AvailabilitySlot;
  gridPosition: string;
  gridColumn: number;
  onEventClick?: (slot: AvailabilitySlot) => void;
}

export function CalendarViewEventItem({
  slot,
  gridPosition,
  gridColumn,
  onEventClick,
}: CalendarViewEventItemProps) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const isBooked = slot.status === 'BOOKED';

  function getStatusIndicator() {
    if (isBooked) {
      return 'bg-red-500'; // Booked
    }
    return 'bg-green-500'; // Available
  }

  return (
    <li
      className={cn('relative mt-px flex', `sm:col-start-${gridColumn}`)}
      style={{ gridRow: gridPosition }}
    >
      <button
        onClick={() => onEventClick?.(slot)}
        onMouseEnter={() => setIsTooltipVisible(true)}
        onMouseLeave={() => setIsTooltipVisible(false)}
        className={cn(
          'group absolute inset-1 flex w-full flex-col overflow-y-auto rounded-lg p-2 text-xs/5',
          'transition-colors duration-200',
          isBooked ? 'bg-red-50 hover:bg-red-100' : 'bg-green-50 hover:bg-green-100'
        )}
      >
        {/* Status Indicator */}
        <span className={cn('absolute right-1 top-1 size-2 rounded-full', getStatusIndicator())} />

        {/* Main Content */}
        <div className="flex flex-col gap-0.5">
          <p className={cn('order-1 font-semibold', isBooked ? 'text-red-700' : 'text-green-700')}>
            {slot.service.name}
          </p>

          <p className={cn('text-xs', isBooked ? 'text-red-500' : 'text-green-500')}>
            {formatTime(slot.startTime)}
            {' - '}
            {formatTime(slot.endTime)}
          </p>

          {/* Additional Info */}
          <div className="mt-1 hidden flex-col gap-0.5 text-xs text-gray-500 group-hover:flex">
            <p>Duration: {slot.serviceConfig.duration}min</p>
            <p>Price: R{slot.serviceConfig.price}</p>
            <p>
              {[
                slot.serviceConfig.isOnlineAvailable && 'Online',
                slot.serviceConfig.isInPerson && 'In-Person',
              ]
                .filter(Boolean)
                .join(' | ')}
            </p>
          </div>
        </div>

        {/* Tooltip */}
        {isTooltipVisible && (
          <div className="absolute left-full top-0 z-50 ml-2 w-48 rounded-lg bg-white p-2 text-xs shadow-lg ring-1 ring-gray-200">
            <div className="flex flex-col gap-1">
              <p className="font-semibold">{slot.service.name}</p>
              <p>Duration: {slot.serviceConfig.duration}min</p>
              <p>Price: R{slot.serviceConfig.price}</p>
              <p>
                {[
                  slot.serviceConfig.isOnlineAvailable && 'Online',
                  slot.serviceConfig.isInPerson && 'In-Person',
                ]
                  .filter(Boolean)
                  .join(' | ')}
              </p>
              {isBooked && slot.booking && (
                <div className="mt-1 border-t pt-1">
                  <p className="font-semibold">Booking Details:</p>
                  <p>{slot.booking.client?.name ?? slot.booking.guestName}</p>
                  {slot.booking.guestEmail && <p>Email: {slot.booking.guestEmail}</p>}
                  {slot.booking.guestPhone && <p>Phone: {slot.booking.guestPhone}</p>}
                  {slot.booking.guestWhatsapp && <p>WhatsApp: {slot.booking.guestWhatsapp}</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </button>
    </li>
  );
}
