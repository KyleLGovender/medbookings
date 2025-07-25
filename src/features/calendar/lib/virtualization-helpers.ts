/**
 * @fileoverview Virtualization helpers for optimizing calendar rendering with large datasets
 * 
 * This module provides utilities for efficiently rendering large numbers of calendar
 * events by implementing virtual scrolling and windowing techniques.
 * 
 * @author MedBookings Development Team
 */

import { CalendarEvent } from '@/features/calendar/types/types';

// =============================================================================
// VIRTUALIZATION TYPES
// =============================================================================

export interface VirtualizedWindow {
  startIndex: number;
  endIndex: number;
  visibleItems: CalendarEvent[];
  totalHeight: number;
  offsetY: number;
}

export interface VirtualizationConfig {
  itemHeight: number;
  containerHeight: number;
  overscan: number; // Number of items to render outside visible area
  scrollTop: number;
}

export interface TimeSlotVirtualization {
  visibleTimeSlots: number[];
  startHour: number;
  endHour: number;
  slotHeight: number;
}

// =============================================================================
// EVENT GROUPING AND OPTIMIZATION
// =============================================================================

/**
 * Groups events by date for efficient rendering
 * 
 * @param events - Array of calendar events
 * @returns Map of date strings to events
 */
export function groupEventsByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const grouped = new Map<string, CalendarEvent[]>();
  
  for (const event of events) {
    const dateKey = event.startTime.toDateString();
    const existingEvents = grouped.get(dateKey) || [];
    existingEvents.push(event);
    grouped.set(dateKey, existingEvents);
  }
  
  return grouped;
}

/**
 * Groups events by time slots for efficient day/week view rendering
 * 
 * @param events - Array of calendar events
 * @param slotDuration - Duration of each time slot in minutes
 * @returns Map of time slot keys to events
 */
export function groupEventsByTimeSlot(
  events: CalendarEvent[], 
  slotDuration: number = 30
): Map<string, CalendarEvent[]> {
  const grouped = new Map<string, CalendarEvent[]>();
  
  for (const event of events) {
    const startTime = new Date(event.startTime);
    const slotKey = getTimeSlotKey(startTime, slotDuration);
    
    const existingEvents = grouped.get(slotKey) || [];
    existingEvents.push(event);
    grouped.set(slotKey, existingEvents);
  }
  
  return grouped;
}

/**
 * Creates a time slot key for grouping
 * 
 * @param time - Date/time to create key for
 * @param slotDuration - Duration of each time slot in minutes
 * @returns Time slot key string
 */
function getTimeSlotKey(time: Date, slotDuration: number): string {
  const hour = time.getHours();
  const minute = Math.floor(time.getMinutes() / slotDuration) * slotDuration;
  const date = time.toDateString();
  
  return `${date}-${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

// =============================================================================
// VIRTUAL SCROLLING CALCULATIONS
// =============================================================================

/**
 * Calculates which items should be visible in a virtualized list
 * 
 * @param items - All items in the list
 * @param config - Virtualization configuration
 * @returns Virtual window information
 */
export function calculateVirtualWindow<T>(
  items: T[],
  config: VirtualizationConfig
): VirtualizedWindow {
  const { itemHeight, containerHeight, overscan, scrollTop } = config;
  
  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const endIndex = Math.min(items.length - 1, startIndex + visibleCount + overscan * 2);
  
  // Get visible items
  const visibleItems = items.slice(startIndex, endIndex + 1) as CalendarEvent[];
  
  // Calculate layout
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;
  
  return {
    startIndex,
    endIndex,
    visibleItems,
    totalHeight,
    offsetY,
  };
}

/**
 * Calculates visible time slots for day/week views
 * 
 * @param startHour - Start hour of the day
 * @param endHour - End hour of the day
 * @param slotHeight - Height of each time slot in pixels
 * @param containerHeight - Height of the container
 * @param scrollTop - Current scroll position
 * @returns Time slot virtualization info
 */
export function calculateVisibleTimeSlots(
  startHour: number,
  endHour: number,
  slotHeight: number,
  containerHeight: number,
  scrollTop: number
): TimeSlotVirtualization {
  const totalSlots = (endHour - startHour) * 2; // 30-minute slots
  const firstVisibleSlot = Math.floor(scrollTop / slotHeight);
  const visibleSlotCount = Math.ceil(containerHeight / slotHeight);
  const lastVisibleSlot = Math.min(totalSlots - 1, firstVisibleSlot + visibleSlotCount);
  
  const visibleTimeSlots: number[] = [];
  for (let i = firstVisibleSlot; i <= lastVisibleSlot; i++) {
    visibleTimeSlots.push(startHour + (i * 0.5)); // Each slot is 30 minutes
  }
  
  return {
    visibleTimeSlots,
    startHour: startHour + (firstVisibleSlot * 0.5),
    endHour: startHour + ((lastVisibleSlot + 1) * 0.5),
    slotHeight,
  };
}

// =============================================================================
// EVENT FILTERING AND OPTIMIZATION
// =============================================================================

/**
 * Filters events to only those visible in the current time range
 * 
 * @param events - All events
 * @param startTime - Start of visible time range
 * @param endTime - End of visible time range
 * @returns Filtered events
 */
export function filterEventsInTimeRange(
  events: CalendarEvent[],
  startTime: Date,
  endTime: Date
): CalendarEvent[] {
  return events.filter(event => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    
    // Event overlaps with visible range if:
    // - Event starts before range ends AND
    // - Event ends after range starts
    return eventStart < endTime && eventEnd > startTime;
  });
}

/**
 * Sorts events for optimal rendering order
 * 
 * @param events - Events to sort
 * @returns Sorted events
 */
export function sortEventsForRendering(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    // Sort by start time first
    const timeCompare = new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    if (timeCompare !== 0) return timeCompare;
    
    // Then by duration (longer events first for better visual layering)
    const aDuration = new Date(a.endTime).getTime() - new Date(a.startTime).getTime();
    const bDuration = new Date(b.endTime).getTime() - new Date(b.startTime).getTime();
    
    return bDuration - aDuration;
  });
}

// =============================================================================
// PERFORMANCE OPTIMIZATION UTILITIES
// =============================================================================

/**
 * Chunks a large array into smaller batches for processing
 * 
 * @param items - Items to chunk
 * @param chunkSize - Size of each chunk
 * @returns Array of chunks
 */
export function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  
  return chunks;
}

/**
 * Processes events in batches to avoid blocking the main thread
 * 
 * @param events - Events to process
 * @param processor - Function to process each event
 * @param batchSize - Number of events to process in each batch
 * @returns Promise that resolves when all events are processed
 */
export async function processEventsInBatches<T>(
  events: CalendarEvent[],
  processor: (event: CalendarEvent) => T,
  batchSize: number = 50
): Promise<T[]> {
  const results: T[] = [];
  const chunks = chunkArray(events, batchSize);
  
  for (const chunk of chunks) {
    // Process chunk
    const chunkResults = chunk.map(processor);
    results.push(...chunkResults);
    
    // Yield to main thread
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  return results;
}

/**
 * Debounces a function to prevent excessive calls during scrolling
 * 
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttles a function to limit how often it can be called
 * 
 * @param func - Function to throttle
 * @param delay - Minimum delay between calls in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

// =============================================================================
// MEMORY OPTIMIZATION
// =============================================================================

/**
 * Creates a memoized version of an event processor function
 * 
 * @param processor - Function to memoize
 * @param keyGenerator - Function to generate cache key
 * @returns Memoized function
 */
export function memoizeEventProcessor<T>(
  processor: (event: CalendarEvent) => T,
  keyGenerator: (event: CalendarEvent) => string = (event) => event.id
): (event: CalendarEvent) => T {
  const cache = new Map<string, T>();
  
  return (event: CalendarEvent): T => {
    const key = keyGenerator(event);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = processor(event);
    cache.set(key, result);
    
    // Limit cache size to prevent memory leaks
    if (cache.size > 1000) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  };
}

/**
 * Cleans up event data to reduce memory usage
 * 
 * @param event - Event to clean
 * @returns Cleaned event with only essential properties
 */
export function createLightweightEvent(event: CalendarEvent): Partial<CalendarEvent> {
  return {
    id: event.id,
    type: event.type,
    title: event.title,
    startTime: event.startTime,
    endTime: event.endTime,
    status: event.status,
  };
}

// =============================================================================
// CONFIGURATION CONSTANTS
// =============================================================================

export const VIRTUALIZATION_DEFAULTS = {
  EVENT_HEIGHT: 24, // Default height for list view events
  TIME_SLOT_HEIGHT: 56, // Default height for time slots
  OVERSCAN_COUNT: 5, // Number of items to render outside visible area
  BATCH_SIZE: 50, // Events to process per batch
  SCROLL_DEBOUNCE: 16, // Debounce delay for scroll events (60fps)
  MEMORY_CACHE_LIMIT: 1000, // Maximum items in memory cache
} as const;