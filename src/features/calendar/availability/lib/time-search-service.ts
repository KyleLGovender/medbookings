import { prisma } from '@/lib/prisma';
import { AvailabilityStatus, SlotStatus } from '../types';
import { optimizedSlotSearch } from './search-performance-service';

export interface TimeSearchParams {
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  specificDate?: Date;
  timeRange?: {
    startTime: string; // Format: "HH:MM" (24-hour)
    endTime: string;   // Format: "HH:MM" (24-hour)
  };
  preferredTimes?: string[]; // Array of preferred times ["09:00", "14:30"]
  timeFlexibility?: number; // Minutes of flexibility around preferred times
  dayOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  excludeWeekends?: boolean;
  excludeHolidays?: boolean;
  minDuration?: number; // Minimum appointment duration in minutes
  maxDuration?: number; // Maximum appointment duration in minutes
}

export interface TimeFilteredSlot {
  slotId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  dayOfWeek: number;
  timeOfDay: string; // "HH:MM" format
  isWeekend: boolean;
  providerId: string;
  serviceId: string;
  locationId?: string;
  price: number;
  isOnlineAvailable: boolean;
  status: string;
}

export interface TimeSearchResult {
  totalSlotsFound: number;
  slotsInTimeRange: TimeFilteredSlot[];
  availableDates: Date[];
  availableTimeSlots: Array<{
    time: string;
    slotCount: number;
    avgPrice: number;
  }>;
  dayOfWeekStats: Array<{
    dayOfWeek: number;
    dayName: string;
    slotCount: number;
    earliestTime: string;
    latestTime: string;
  }>;
}

/**
 * Service for time-based filtering and search of availability slots
 */
export class TimeSearchService {
  
  /**
   * Convert time string (HH:MM) to minutes since midnight
   */
  private timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert Date to time string (HH:MM)
   */
  private dateToTimeString(date: Date): string {
    return date.toTimeString().substring(0, 5);
  }

  /**
   * Get day of week name
   */
  private getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  }

  /**
   * Check if a date is a weekend
   */
  private isWeekend(date: Date): boolean {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  }

  /**
   * Check if a time falls within a specified time range
   */
  private isTimeInRange(
    slotTime: Date,
    timeRange: { startTime: string; endTime: string }
  ): boolean {
    const slotTimeMinutes = slotTime.getHours() * 60 + slotTime.getMinutes();
    const startMinutes = this.timeToMinutes(timeRange.startTime);
    const endMinutes = this.timeToMinutes(timeRange.endTime);

    // Handle overnight ranges (e.g., 22:00 to 06:00)
    if (startMinutes > endMinutes) {
      return slotTimeMinutes >= startMinutes || slotTimeMinutes <= endMinutes;
    }
    
    return slotTimeMinutes >= startMinutes && slotTimeMinutes <= endMinutes;
  }

  /**
   * Check if a time is within flexibility range of preferred times
   */
  private isTimeNearPreferred(
    slotTime: Date,
    preferredTimes: string[],
    flexibilityMinutes: number
  ): boolean {
    const slotTimeMinutes = slotTime.getHours() * 60 + slotTime.getMinutes();

    return preferredTimes.some(preferredTime => {
      const preferredMinutes = this.timeToMinutes(preferredTime);
      const diff = Math.abs(slotTimeMinutes - preferredMinutes);
      
      // Handle day boundary (e.g., comparing 23:30 with 00:30)
      const dayBoundaryDiff = Math.min(diff, 1440 - diff); // 1440 = minutes in a day
      
      return dayBoundaryDiff <= flexibilityMinutes;
    });
  }

  /**
   * Search for slots with time-based filtering
   */
  async searchSlotsByTime(
    params: TimeSearchParams,
    additionalFilters?: {
      serviceProviderId?: string;
      serviceId?: string;
      locationId?: string;
      isOnlineAvailable?: boolean;
    }
  ): Promise<TimeSearchResult> {
    try {
      const {
        dateRange,
        specificDate,
        timeRange,
        preferredTimes,
        timeFlexibility = 30,
        dayOfWeek,
        excludeWeekends = false,
        minDuration,
        maxDuration,
      } = params;

      // Use optimized slot search for better performance
      let searchDateRange = dateRange;
      if (specificDate && !dateRange) {
        const startOfDay = new Date(specificDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(specificDate);
        endOfDay.setHours(23, 59, 59, 999);
        searchDateRange = { startDate: startOfDay, endDate: endOfDay };
      }

      // Extract time range hours for optimization
      let timeRangeHours: { startHour: number; endHour: number } | undefined;
      if (timeRange) {
        timeRangeHours = {
          startHour: this.timeToMinutes(timeRange.startTime) / 60,
          endHour: this.timeToMinutes(timeRange.endTime) / 60,
        };
      }

      const optimizedResults = await optimizedSlotSearch({
        serviceProviderId: additionalFilters?.serviceProviderId,
        serviceIds: additionalFilters?.serviceId ? [additionalFilters.serviceId] : undefined,
        dateRange: searchDateRange,
        timeRange: timeRangeHours,
        limit: 200, // Allow for additional filtering
      });

      // Convert optimized results and apply additional filters
      let slots = optimizedResults.slots.map(slot => ({
        slotId: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        duration: slot.duration,
        dayOfWeek: slot.startTime.getDay(),
        timeOfDay: this.dateToTimeString(slot.startTime),
        isWeekend: this.isWeekend(slot.startTime),
        providerId: slot.availability.serviceProviderId,
        serviceId: slot.serviceId,
        locationId: slot.locationId,
        price: slot.price,
        isOnlineAvailable: slot.isOnlineAvailable,
        status: 'AVAILABLE',
      }));

      // If optimized search returned results, use them; otherwise fallback to original implementation
      if (slots.length === 0 && !searchDateRange) {
        // Fallback to original implementation for complex queries

      // Build date filter
      let dateFilter: any = {};
      
      if (specificDate) {
        const startOfDay = new Date(specificDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(specificDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        dateFilter = {
          startTime: { gte: startOfDay, lte: endOfDay }
        };
      } else if (dateRange) {
        const startOfRange = new Date(dateRange.startDate);
        startOfRange.setHours(0, 0, 0, 0);
        const endOfRange = new Date(dateRange.endDate);
        endOfRange.setHours(23, 59, 59, 999);
        
        dateFilter = {
          startTime: { gte: startOfRange, lte: endOfRange }
        };
      } else {
        // Default to next 30 days if no date filter specified
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + 30);
        
        dateFilter = {
          startTime: { gte: today, lte: futureDate }
        };
      }

      // Build duration filter
      const durationFilter: any = {};
      if (minDuration) durationFilter.gte = minDuration;
      if (maxDuration) durationFilter.lte = maxDuration;

      // Get slots from database
      const slots = await prisma.calculatedAvailabilitySlot.findMany({
        where: {
          status: SlotStatus.AVAILABLE,
          ...dateFilter,
          ...(Object.keys(durationFilter).length > 0 ? { duration: durationFilter } : {}),
          ...(additionalFilters?.serviceProviderId ? {
            availability: { serviceProviderId: additionalFilters.serviceProviderId }
          } : {}),
          ...(additionalFilters?.serviceId ? { serviceId: additionalFilters.serviceId } : {}),
          ...(additionalFilters?.locationId ? { locationId: additionalFilters.locationId } : {}),
          ...(additionalFilters?.isOnlineAvailable !== undefined ? {
            isOnlineAvailable: additionalFilters.isOnlineAvailable
          } : {}),
          availability: {
            status: AvailabilityStatus.ACTIVE,
            ...(additionalFilters?.serviceProviderId ? {
              serviceProviderId: additionalFilters.serviceProviderId
            } : {}),
          },
        },
        include: {
          availability: {
            include: {
              serviceProvider: true,
            },
          },
          service: true,
        },
        orderBy: {
          startTime: 'asc',
        },
      });

      // Apply time-based filters
      let filteredSlots = slots.map(slot => ({
        slotId: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        duration: slot.duration,
        dayOfWeek: slot.startTime.getDay(),
        timeOfDay: this.dateToTimeString(slot.startTime),
        isWeekend: this.isWeekend(slot.startTime),
        providerId: slot.availability.serviceProviderId,
        serviceId: slot.serviceId,
        locationId: slot.locationId,
        price: slot.price,
        isOnlineAvailable: slot.isOnlineAvailable,
        status: slot.status,
      }));

      // Filter by time range
      if (timeRange) {
        filteredSlots = filteredSlots.filter(slot =>
          this.isTimeInRange(slot.startTime, timeRange)
        );
      }

      // Filter by preferred times with flexibility
      if (preferredTimes && preferredTimes.length > 0) {
        filteredSlots = filteredSlots.filter(slot =>
          this.isTimeNearPreferred(slot.startTime, preferredTimes, timeFlexibility)
        );
      }

      // Filter by day of week
      if (dayOfWeek && dayOfWeek.length > 0) {
        filteredSlots = filteredSlots.filter(slot =>
          dayOfWeek.includes(slot.dayOfWeek)
        );
      }

      // Exclude weekends if requested
      if (excludeWeekends) {
        filteredSlots = filteredSlots.filter(slot => !slot.isWeekend);
      }

      // Calculate statistics
      const availableDates = Array.from(
        new Set(
          filteredSlots.map(slot =>
            slot.startTime.toISOString().split('T')[0]
          )
        )
      ).map(dateStr => new Date(dateStr));

      // Group by time slots
      const timeSlotMap = new Map<string, { count: number; totalPrice: number }>();
      filteredSlots.forEach(slot => {
        const timeKey = slot.timeOfDay;
        const existing = timeSlotMap.get(timeKey) || { count: 0, totalPrice: 0 };
        timeSlotMap.set(timeKey, {
          count: existing.count + 1,
          totalPrice: existing.totalPrice + slot.price,
        });
      });

      const availableTimeSlots = Array.from(timeSlotMap.entries())
        .map(([time, stats]) => ({
          time,
          slotCount: stats.count,
          avgPrice: Math.round(stats.totalPrice / stats.count),
        }))
        .sort((a, b) => a.time.localeCompare(b.time));

      // Calculate day of week statistics
      const dayStatsMap = new Map<number, { count: number; times: string[] }>();
      filteredSlots.forEach(slot => {
        const existing = dayStatsMap.get(slot.dayOfWeek) || { count: 0, times: [] };
        dayStatsMap.set(slot.dayOfWeek, {
          count: existing.count + 1,
          times: [...existing.times, slot.timeOfDay],
        });
      });

      const dayOfWeekStats = Array.from(dayStatsMap.entries())
        .map(([dayNum, stats]) => {
          const sortedTimes = stats.times.sort();
          return {
            dayOfWeek: dayNum,
            dayName: this.getDayName(dayNum),
            slotCount: stats.count,
            earliestTime: sortedTimes[0] || '',
            latestTime: sortedTimes[sortedTimes.length - 1] || '',
          };
        })
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek);

      return {
        totalSlotsFound: slots.length,
        slotsInTimeRange: filteredSlots,
        availableDates,
        availableTimeSlots,
        dayOfWeekStats,
      };

    } catch (error) {
      console.error('Error searching slots by time:', error);
      return {
        totalSlotsFound: 0,
        slotsInTimeRange: [],
        availableDates: [],
        availableTimeSlots: [],
        dayOfWeekStats: [],
      };
    }
  }

  /**
   * Find optimal time slots based on preferences
   */
  async findOptimalTimeSlots(
    params: TimeSearchParams & {
      serviceProviderId?: string;
      serviceId?: string;
      requiredDuration: number;
      maxResults?: number;
    }
  ): Promise<Array<{
    slotId: string;
    startTime: Date;
    endTime: Date;
    score: number; // Higher is better match
    reasons: string[];
  }>> {
    try {
      const { requiredDuration, maxResults = 10, ...timeParams } = params;

      const searchResult = await this.searchSlotsByTime(timeParams, {
        serviceProviderId: params.serviceProviderId,
        serviceId: params.serviceId,
      });

      // Score each slot based on preferences
      const scoredSlots = searchResult.slotsInTimeRange
        .filter(slot => slot.duration >= requiredDuration)
        .map(slot => {
          let score = 0;
          const reasons: string[] = [];

          // Base score for availability
          score += 10;
          reasons.push('Available slot');

          // Prefer earlier dates
          const daysFromNow = Math.ceil(
            (slot.startTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          if (daysFromNow <= 7) {
            score += 15;
            reasons.push('Available this week');
          } else if (daysFromNow <= 14) {
            score += 10;
            reasons.push('Available within 2 weeks');
          }

          // Prefer preferred times if specified
          if (params.preferredTimes && params.preferredTimes.length > 0) {
            const isNearPreferred = this.isTimeNearPreferred(
              slot.startTime,
              params.preferredTimes,
              params.timeFlexibility || 30
            );
            if (isNearPreferred) {
              score += 20;
              reasons.push('Near preferred time');
            }
          }

          // Prefer weekdays if weekends excluded
          if (params.excludeWeekends && !slot.isWeekend) {
            score += 5;
            reasons.push('Weekday appointment');
          }

          // Prefer exact duration match
          if (slot.duration === requiredDuration) {
            score += 5;
            reasons.push('Exact duration match');
          }

          // Prefer business hours (9 AM - 5 PM)
          const hour = slot.startTime.getHours();
          if (hour >= 9 && hour <= 17) {
            score += 5;
            reasons.push('Business hours');
          }

          return {
            slotId: slot.slotId,
            startTime: slot.startTime,
            endTime: slot.endTime,
            score,
            reasons,
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);

      return scoredSlots;

    } catch (error) {
      console.error('Error finding optimal time slots:', error);
      return [];
    }
  }

  /**
   * Get availability heatmap for a date range
   */
  async getAvailabilityHeatmap(
    dateRange: { startDate: Date; endDate: Date },
    filters?: {
      serviceProviderId?: string;
      serviceId?: string;
      locationId?: string;
    }
  ): Promise<Array<{
    date: string; // YYYY-MM-DD format
    dayOfWeek: number;
    slotCount: number;
    timeSlots: Array<{
      hour: number;
      slotCount: number;
    }>;
  }>> {
    try {
      const searchResult = await this.searchSlotsByTime(
        { dateRange },
        filters
      );

      // Group by date
      const dateMap = new Map<string, TimeFilteredSlot[]>();
      searchResult.slotsInTimeRange.forEach(slot => {
        const dateKey = slot.startTime.toISOString().split('T')[0];
        const existing = dateMap.get(dateKey) || [];
        dateMap.set(dateKey, [...existing, slot]);
      });

      // Build heatmap data
      const heatmapData = Array.from(dateMap.entries()).map(([dateStr, slots]) => {
        const date = new Date(dateStr);
        
        // Group by hour
        const hourMap = new Map<number, number>();
        slots.forEach(slot => {
          const hour = slot.startTime.getHours();
          hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
        });

        const timeSlots = Array.from({ length: 24 }, (_, hour) => ({
          hour,
          slotCount: hourMap.get(hour) || 0,
        }));

        return {
          date: dateStr,
          dayOfWeek: date.getDay(),
          slotCount: slots.length,
          timeSlots,
        };
      });

      return heatmapData.sort((a, b) => a.date.localeCompare(b.date));

    } catch (error) {
      console.error('Error generating availability heatmap:', error);
      return [];
    }
  }
}

/**
 * Search slots with time-based filtering
 */
export async function searchSlotsByTime(
  params: TimeSearchParams,
  additionalFilters?: {
    serviceProviderId?: string;
    serviceId?: string;
    locationId?: string;
    isOnlineAvailable?: boolean;
  }
): Promise<TimeSearchResult> {
  const service = new TimeSearchService();
  return await service.searchSlotsByTime(params, additionalFilters);
}

/**
 * Find optimal time slots based on preferences
 */
export async function findOptimalTimeSlots(
  params: TimeSearchParams & {
    serviceProviderId?: string;
    serviceId?: string;
    requiredDuration: number;
    maxResults?: number;
  }
): Promise<Array<{
  slotId: string;
  startTime: Date;
  endTime: Date;
  score: number;
  reasons: string[];
}>> {
  const service = new TimeSearchService();
  return await service.findOptimalTimeSlots(params);
}

/**
 * Get availability heatmap for visualization
 */
export async function getAvailabilityHeatmap(
  dateRange: { startDate: Date; endDate: Date },
  filters?: {
    serviceProviderId?: string;
    serviceId?: string;
    locationId?: string;
  }
): Promise<Array<{
  date: string;
  dayOfWeek: number;
  slotCount: number;
  timeSlots: Array<{
    hour: number;
    slotCount: number;
  }>;
}>> {
  const service = new TimeSearchService();
  return await service.getAvailabilityHeatmap(dateRange, filters);
}