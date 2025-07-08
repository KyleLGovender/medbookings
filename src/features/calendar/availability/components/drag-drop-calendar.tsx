'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { AlertTriangle, CheckCircle, Move, Repeat, Save } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  CalendarEventIndicator,
  CalendarEventWithVisuals,
  VisualIndicatorConfig,
} from '@/features/calendar/availability/components/calendar-visual-indicators';
import { CalendarEvent, SlotStatus } from '@/features/calendar/availability/types/types';

export interface DragDropOperation {
  id: string;
  type: 'move' | 'copy' | 'resize';
  eventId: string;
  originalStart: Date;
  originalEnd: Date;
  newStart: Date;
  newEnd: Date;
  affectedSeries?: string;
  conflictEvents?: string[];
  isValid: boolean;
  validationMessage?: string;
}

export interface DragDropConfig {
  enableMove: boolean;
  enableCopy: boolean;
  enableResize: boolean;
  enableSeriesOperations: boolean;
  showConflicts: boolean;
  autoSave: boolean;
  snapToGrid: boolean;
  gridIntervalMinutes: number;
}

export interface SeriesUpdateOptions {
  updateType: 'single' | 'thisAndFuture' | 'allOccurrences';
  propagateChanges: boolean;
  maintainPattern: boolean;
}

interface DragDropCalendarProps {
  events: CalendarEventWithVisuals[];
  onEventUpdate: (eventId: string, updates: Partial<CalendarEvent>) => void;
  onSeriesUpdate?: (
    seriesId: string,
    updates: Partial<CalendarEvent>,
    options: SeriesUpdateOptions
  ) => void;
  onConflictDetected?: (conflicts: DragDropOperation[]) => void;
  config: DragDropConfig;
  visualConfig: VisualIndicatorConfig;
  viewMode?: 'day' | 'week' | 'month';
  currentDate: Date;
  workingHours?: { start: number; end: number };
  className?: string;
}

export function DragDropCalendar({
  events,
  onEventUpdate,
  onSeriesUpdate,
  onConflictDetected,
  config,
  visualConfig,
  viewMode = 'week',
  currentDate,
  workingHours = { start: 9, end: 17 },
  className = '',
}: DragDropCalendarProps) {
  const [draggedEvent, setDraggedEvent] = useState<CalendarEventWithVisuals | null>(null);
  const [dragOperation, setDragOperation] = useState<DragDropOperation | null>(null);
  const [pendingOperations, setPendingOperations] = useState<DragDropOperation[]>([]);
  const [isSeriesDialogOpen, setIsSeriesDialogOpen] = useState(false);
  const [seriesUpdateOptions, setSeriesUpdateOptions] = useState<SeriesUpdateOptions>({
    updateType: 'single',
    propagateChanges: true,
    maintainPattern: true,
  });

  const calendarRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Generate time slots for the grid
  const generateTimeSlots = useCallback(() => {
    const slots = [];
    const startHour = workingHours.start;
    const endHour = workingHours.end;
    const intervalMinutes = config.gridIntervalMinutes;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        const time = new Date(currentDate);
        time.setHours(hour, minute, 0, 0);
        slots.push(time);
      }
    }
    return slots;
  }, [currentDate, workingHours, config.gridIntervalMinutes]);

  const timeSlots = generateTimeSlots();

  // Snap time to grid
  const snapToGrid = useCallback(
    (time: Date): Date => {
      if (!config.snapToGrid) return time;

      const intervalMs = config.gridIntervalMinutes * 60 * 1000;
      const timeMs = time.getTime();
      const snappedMs = Math.round(timeMs / intervalMs) * intervalMs;
      return new Date(snappedMs);
    },
    [config.snapToGrid, config.gridIntervalMinutes]
  );

  // Detect conflicts
  const detectConflicts = useCallback(
    (operation: DragDropOperation): string[] => {
      const conflicts: string[] = [];

      events.forEach((event) => {
        if (event.id === operation.eventId) return;

        const eventStart = event.startTime.getTime();
        const eventEnd = event.endTime.getTime();
        const newStart = operation.newStart.getTime();
        const newEnd = operation.newEnd.getTime();

        // Check for time overlap
        if (newStart < eventEnd && newEnd > eventStart) {
          conflicts.push(event.id);
        }
      });

      return conflicts;
    },
    [events]
  );

  // Validate operation
  const validateOperation = useCallback(
    (operation: DragDropOperation): { isValid: boolean; message?: string } => {
      // Check if event exists
      const event = events.find((e) => e.id === operation.eventId);
      if (!event) {
        return { isValid: false, message: 'Event not found' };
      }

      // Check working hours
      const newStartHour = operation.newStart.getHours();
      const newEndHour = operation.newEnd.getHours();

      if (newStartHour < workingHours.start || newEndHour > workingHours.end) {
        return { isValid: false, message: 'Event must be within working hours' };
      }

      // Check minimum duration
      const durationMs = operation.newEnd.getTime() - operation.newStart.getTime();
      const minDurationMs = 15 * 60 * 1000; // 15 minutes

      if (durationMs < minDurationMs) {
        return { isValid: false, message: 'Event must be at least 15 minutes long' };
      }

      // Check for conflicts
      const conflicts = detectConflicts(operation);
      if (conflicts.length > 0 && config.showConflicts) {
        return { isValid: false, message: `Conflicts with ${conflicts.length} other event(s)` };
      }

      // Check booking restrictions
      if (event.type === 'booking' && event.status === SlotStatus.BOOKED) {
        return { isValid: false, message: 'Cannot move confirmed bookings' };
      }

      return { isValid: true };
    },
    [events, workingHours, detectConflicts, config.showConflicts]
  );

  // Handle drag start
  const handleDragStart = useCallback(
    (event: CalendarEventWithVisuals, clientX: number, clientY: number) => {
      if (!config.enableMove && !config.enableCopy) return;

      setDraggedEvent(event);
      dragStartPos.current = { x: clientX, y: clientY };
    },
    [config.enableMove, config.enableCopy]
  );

  // Handle drag move
  const handleDragMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!draggedEvent || !calendarRef.current) return;

      const rect = calendarRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // Calculate new time based on position
      const slotHeight = 60; // Assuming 60px per hour
      const hourOffset = Math.floor(y / slotHeight);
      const newStart = new Date(currentDate);
      newStart.setHours(workingHours.start + hourOffset, 0, 0, 0);

      if (config.snapToGrid) {
        const snappedStart = snapToGrid(newStart);
        newStart.setTime(snappedStart.getTime());
      }

      const duration = draggedEvent.endTime.getTime() - draggedEvent.startTime.getTime();
      const newEnd = new Date(newStart.getTime() + duration);

      const operation: DragDropOperation = {
        id: `drag-${Date.now()}`,
        type: 'move',
        eventId: draggedEvent.id,
        originalStart: draggedEvent.startTime,
        originalEnd: draggedEvent.endTime,
        newStart,
        newEnd,
        affectedSeries: draggedEvent.seriesId,
        conflictEvents: [],
        isValid: true,
      };

      const validation = validateOperation(operation);
      operation.isValid = validation.isValid;
      operation.validationMessage = validation.message;
      operation.conflictEvents = detectConflicts(operation);

      setDragOperation(operation);
    },
    [
      draggedEvent,
      currentDate,
      workingHours,
      config.snapToGrid,
      snapToGrid,
      validateOperation,
      detectConflicts,
    ]
  );

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (!dragOperation || !draggedEvent) {
      setDraggedEvent(null);
      setDragOperation(null);
      return;
    }

    if (!dragOperation.isValid) {
      setDraggedEvent(null);
      setDragOperation(null);
      return;
    }

    // Check if this is a recurring series
    if (draggedEvent.isRecurring && draggedEvent.seriesId && config.enableSeriesOperations) {
      setPendingOperations([dragOperation]);
      setIsSeriesDialogOpen(true);
    } else {
      // Apply single event update
      applyOperation(dragOperation);
    }

    setDraggedEvent(null);
    setDragOperation(null);
  }, [dragOperation, draggedEvent, config.enableSeriesOperations]);

  // Apply operation
  const applyOperation = useCallback(
    (operation: DragDropOperation) => {
      const updates: Partial<CalendarEvent> = {
        startTime: operation.newStart,
        endTime: operation.newEnd,
      };

      onEventUpdate(operation.eventId, updates);

      if (config.autoSave) {
        // Auto-save logic would go here
        console.log('Auto-saving operation:', operation);
      }
    },
    [onEventUpdate, config.autoSave]
  );

  // Apply series operation
  const applySeriesOperation = useCallback(
    (operation: DragDropOperation, options: SeriesUpdateOptions) => {
      if (!operation.affectedSeries || !onSeriesUpdate) return;

      const updates: Partial<CalendarEvent> = {
        startTime: operation.newStart,
        endTime: operation.newEnd,
      };

      onSeriesUpdate(operation.affectedSeries, updates, options);
      setIsSeriesDialogOpen(false);
      setPendingOperations([]);
    },
    [onSeriesUpdate]
  );

  // Get day columns for week view
  const getDayColumns = () => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }

    return days;
  };

  const dayColumns = getDayColumns();

  // Get events for a specific time slot
  const getEventsForSlot = (date: Date, hour: number) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString() && eventDate.getHours() === hour;
    });
  };

  // Mouse event handlers
  const handleMouseDown = (event: CalendarEventWithVisuals, e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(event, e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedEvent) {
      handleDragMove(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    if (draggedEvent) {
      handleDragEnd();
    }
  };

  // Touch event handlers
  const handleTouchStart = (event: CalendarEventWithVisuals, e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleDragStart(event, touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (draggedEvent) {
      const touch = e.touches[0];
      handleDragMove(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    if (draggedEvent) {
      handleDragEnd();
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (draggedEvent) {
        handleDragMove(e.clientX, e.clientY);
      }
    };

    const handleGlobalMouseUp = () => {
      if (draggedEvent) {
        handleDragEnd();
      }
    };

    if (draggedEvent) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggedEvent, handleDragMove, handleDragEnd]);

  return (
    <div className={className}>
      {/* Drag Drop Status */}
      {dragOperation && (
        <Alert
          className={`mb-4 ${dragOperation.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
        >
          <div className="flex items-center space-x-2">
            {dragOperation.isValid ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription>
              <strong>Moving event:</strong> {draggedEvent?.title} to{' '}
              {dragOperation.newStart.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
              {!dragOperation.isValid && (
                <span className="ml-2 text-red-600">- {dragOperation.validationMessage}</span>
              )}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Calendar Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Move className="h-4 w-4" />
              Drag & Drop Calendar
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant={config.enableMove ? 'default' : 'secondary'}>
                Move: {config.enableMove ? 'On' : 'Off'}
              </Badge>
              <Badge variant={config.enableCopy ? 'default' : 'secondary'}>
                Copy: {config.enableCopy ? 'On' : 'Off'}
              </Badge>
              <Badge variant={config.snapToGrid ? 'default' : 'secondary'}>
                Snap: {config.snapToGrid ? 'On' : 'Off'}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div
            ref={calendarRef}
            className="relative overflow-auto"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Week View Grid */}
            <div className="grid min-w-[800px] grid-cols-8 gap-1">
              {/* Time column header */}
              <div className="border-b p-2 text-center font-medium">Time</div>

              {/* Day headers */}
              {dayColumns.map((day, index) => (
                <div key={index} className="border-b p-2 text-center font-medium">
                  <div className="text-sm">{day.toLocaleDateString([], { weekday: 'short' })}</div>
                  <div className="text-xs text-muted-foreground">{day.getDate()}</div>
                </div>
              ))}

              {/* Time slots */}
              {Array.from({ length: workingHours.end - workingHours.start }, (_, hourIndex) => {
                const hour = workingHours.start + hourIndex;
                return (
                  <React.Fragment key={hour}>
                    {/* Time label */}
                    <div className="border-r p-2 text-right text-xs text-muted-foreground">
                      {hour.toString().padStart(2, '0')}:00
                    </div>

                    {/* Day slots */}
                    {dayColumns.map((day, dayIndex) => {
                      const slotEvents = getEventsForSlot(day, hour);
                      const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                      return (
                        <div
                          key={`${dayIndex}-${hour}`}
                          className={`relative min-h-[60px] border border-gray-200 p-1 ${config.snapToGrid ? 'bg-gray-50/50' : ''} ${isWeekend ? 'bg-gray-100' : ''} ${
                            dragOperation &&
                            dragOperation.newStart.getHours() === hour &&
                            dragOperation.newStart.toDateString() === day.toDateString()
                              ? 'border-blue-300 bg-blue-100'
                              : ''
                          } `}
                        >
                          {/* Grid lines for snap-to-grid */}
                          {config.snapToGrid && config.gridIntervalMinutes < 60 && (
                            <div className="pointer-events-none absolute inset-0">
                              {Array.from(
                                { length: 60 / config.gridIntervalMinutes - 1 },
                                (_, i) => (
                                  <div
                                    key={i}
                                    className="absolute w-full border-t border-gray-200"
                                    style={{
                                      top: `${(((i + 1) * config.gridIntervalMinutes) / 60) * 100}%`,
                                    }}
                                  />
                                )
                              )}
                            </div>
                          )}

                          {/* Events */}
                          {slotEvents.map((event) => (
                            <div
                              key={event.id}
                              className={`mb-1 cursor-move select-none ${draggedEvent?.id === event.id ? 'z-10 scale-105 transform opacity-50' : ''} ${config.enableMove || config.enableCopy ? 'hover:shadow-md' : ''} `}
                              onMouseDown={(e) => handleMouseDown(event, e)}
                              onTouchStart={(e) => handleTouchStart(event, e)}
                              draggable={false}
                            >
                              <CalendarEventIndicator
                                event={event}
                                config={visualConfig}
                                size="small"
                                showTooltip={!draggedEvent}
                              />
                            </div>
                          ))}

                          {/* Drop zone indicator */}
                          {dragOperation &&
                            dragOperation.newStart.getHours() === hour &&
                            dragOperation.newStart.toDateString() === day.toDateString() && (
                              <div
                                className={`pointer-events-none absolute inset-0 border-2 border-dashed ${dragOperation.isValid ? 'border-green-400 bg-green-100/50' : 'border-red-400 bg-red-100/50'} `}
                              >
                                <div className="flex h-full items-center justify-center">
                                  <span
                                    className={`text-xs font-medium ${dragOperation.isValid ? 'text-green-700' : 'text-red-700'}`}
                                  >
                                    {dragOperation.isValid ? 'Drop here' : 'Invalid'}
                                  </span>
                                </div>
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Series Update Dialog */}
      {isSeriesDialogOpen && pendingOperations.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              Update Recurring Series
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This event is part of a recurring series. How would you like to apply the changes?
            </p>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="single"
                  name="updateType"
                  checked={seriesUpdateOptions.updateType === 'single'}
                  onChange={() =>
                    setSeriesUpdateOptions((prev) => ({ ...prev, updateType: 'single' }))
                  }
                />
                <Label htmlFor="single" className="text-sm">
                  This occurrence only
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="thisAndFuture"
                  name="updateType"
                  checked={seriesUpdateOptions.updateType === 'thisAndFuture'}
                  onChange={() =>
                    setSeriesUpdateOptions((prev) => ({ ...prev, updateType: 'thisAndFuture' }))
                  }
                />
                <Label htmlFor="thisAndFuture" className="text-sm">
                  This and future occurrences
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="allOccurrences"
                  name="updateType"
                  checked={seriesUpdateOptions.updateType === 'allOccurrences'}
                  onChange={() =>
                    setSeriesUpdateOptions((prev) => ({ ...prev, updateType: 'allOccurrences' }))
                  }
                />
                <Label htmlFor="allOccurrences" className="text-sm">
                  All occurrences in the series
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="maintain-pattern"
                  checked={seriesUpdateOptions.maintainPattern}
                  onCheckedChange={(checked) =>
                    setSeriesUpdateOptions((prev) => ({ ...prev, maintainPattern: checked }))
                  }
                />
                <Label htmlFor="maintain-pattern" className="text-sm">
                  Maintain recurring pattern
                </Label>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={() => {
                  const operation = pendingOperations[0];
                  applySeriesOperation(operation, seriesUpdateOptions);
                }}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Apply Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsSeriesDialogOpen(false);
                  setPendingOperations([]);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
