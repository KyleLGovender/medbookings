/**
 * @fileoverview Performance monitoring for calendar operations
 * 
 * This module provides performance monitoring capabilities for calendar
 * operations, including rendering times, data processing, and user interactions.
 * 
 * @author MedBookings Development Team
 */

// =============================================================================
// PERFORMANCE METRICS TYPES
// =============================================================================

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface CalendarPerformanceData {
  renderTime: number;
  dataProcessingTime: number;
  eventCount: number;
  viewMode: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  userAgent: string;
  timestamp: Date;
}

// =============================================================================
// PERFORMANCE TRACKER CLASS
// =============================================================================

class PerformanceTracker {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private isEnabled: boolean;

  constructor() {
    // Enable performance monitoring in development and with feature flag
    this.isEnabled = 
      process.env.NODE_ENV === 'development' || 
      process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true';
  }

  /**
   * Starts timing a performance metric
   * 
   * @param name - Unique name for the metric
   * @param metadata - Additional metadata to store
   */
  start(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata,
    };

    this.metrics.set(name, metric);

    // Mark performance timeline if available
    if (performance.mark) {
      performance.mark(`${name}-start`);
    }
  }

  /**
   * Stops timing a performance metric and calculates duration
   * 
   * @param name - Name of the metric to stop
   * @returns The completed metric or null if not found
   */
  end(name: string): PerformanceMetric | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric '${name}' was not started`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    // Mark performance timeline if available
    if (performance.mark && performance.measure) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    }

    // Log slow operations in development
    if (process.env.NODE_ENV === 'development' && metric.duration > 100) {
      console.warn(`Slow calendar operation detected: ${name} took ${metric.duration.toFixed(2)}ms`, metric.metadata);
    }

    return metric;
  }

  /**
   * Gets a completed metric by name
   * 
   * @param name - Name of the metric
   * @returns The metric or null if not found
   */
  getMetric(name: string): PerformanceMetric | null {
    return this.metrics.get(name) || null;
  }

  /**
   * Gets all completed metrics
   * 
   * @returns Array of all metrics
   */
  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Clears all stored metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Records a calendar performance snapshot
   * 
   * @param data - Calendar performance data
   */
  recordCalendarPerformance(data: CalendarPerformanceData): void {
    if (!this.isEnabled) return;

    // Log performance data in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Calendar Performance:', {
        renderTime: `${data.renderTime.toFixed(2)}ms`,
        dataProcessingTime: `${data.dataProcessingTime.toFixed(2)}ms`,
        eventCount: data.eventCount,
        viewMode: data.viewMode,
        eventsPerMs: data.eventCount / (data.renderTime + data.dataProcessingTime),
      });
    }

    // In production, you would send this to your analytics service
    // Example: Google Analytics, Mixpanel, custom analytics endpoint
    // analyticsService.track('calendar_performance', data);
  }
}

// =============================================================================
// GLOBAL INSTANCE
// =============================================================================

export const performanceTracker = new PerformanceTracker();

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Times a function execution and returns both result and duration
 * 
 * @param name - Name for the performance metric
 * @param fn - Function to time
 * @param metadata - Additional metadata
 * @returns Object containing result and duration
 */
export async function timeFunction<T>(
  name: string,
  fn: () => T | Promise<T>,
  metadata?: Record<string, any>
): Promise<{ result: T; duration: number }> {
  performanceTracker.start(name, metadata);
  
  try {
    const result = await fn();
    const metric = performanceTracker.end(name);
    
    return {
      result,
      duration: metric?.duration || 0,
    };
  } catch (error) {
    performanceTracker.end(name);
    throw error;
  }
}

/**
 * React hook for measuring component render performance
 * 
 * @param componentName - Name of the component
 * @param dependencies - Dependencies that trigger re-measurement
 */
export function usePerformanceMonitor(
  componentName: string,
  dependencies: any[] = []
): void {
  const React = require('react');
  
  React.useEffect(() => {
    const metricName = `${componentName}-render`;
    performanceTracker.start(metricName, {
      component: componentName,
      dependencyCount: dependencies.length,
    });

    return () => {
      performanceTracker.end(metricName);
    };
  }, dependencies);
}

/**
 * Decorator for timing class methods
 * 
 * @param metricName - Name for the performance metric
 */
export function timed(metricName?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const name = metricName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      performanceTracker.start(name, {
        className: target.constructor.name,
        methodName: propertyKey,
        argumentCount: args.length,
      });

      try {
        const result = await originalMethod.apply(this, args);
        performanceTracker.end(name);
        return result;
      } catch (error) {
        performanceTracker.end(name);
        throw error;
      }
    };

    return descriptor;
  };
}

// =============================================================================
// CALENDAR-SPECIFIC PERFORMANCE UTILITIES
// =============================================================================

/**
 * Measures calendar data processing performance
 * 
 * @param eventCount - Number of events being processed
 * @param viewMode - Current view mode
 * @param processingFn - Function that processes the data
 * @returns Processing result and performance data
 */
export async function measureCalendarDataProcessing<T>(
  eventCount: number,
  viewMode: string,
  processingFn: () => T | Promise<T>
): Promise<{ result: T; duration: number }> {
  return timeFunction(
    'calendar-data-processing',
    processingFn,
    { eventCount, viewMode }
  );
}

/**
 * Measures calendar rendering performance
 * 
 * @param eventCount - Number of events being rendered
 * @param viewMode - Current view mode
 * @param renderFn - Function that performs the rendering
 * @returns Rendering result and performance data
 */
export async function measureCalendarRendering<T>(
  eventCount: number,
  viewMode: string,
  renderFn: () => T | Promise<T>
): Promise<{ result: T; duration: number }> {
  return timeFunction(
    'calendar-rendering',
    renderFn,
    { eventCount, viewMode }
  );
}

/**
 * Records overall calendar performance after a complete render cycle
 * 
 * @param eventCount - Number of events rendered
 * @param viewMode - Current view mode
 * @param dateRange - Date range being displayed
 */
export function recordCalendarCyclePerformance(
  eventCount: number,
  viewMode: string,
  dateRange: { start: Date; end: Date }
): void {
  const dataProcessingMetric = performanceTracker.getMetric('calendar-data-processing');
  const renderingMetric = performanceTracker.getMetric('calendar-rendering');

  if (dataProcessingMetric?.duration && renderingMetric?.duration) {
    const performanceData: CalendarPerformanceData = {
      renderTime: renderingMetric.duration,
      dataProcessingTime: dataProcessingMetric.duration,
      eventCount,
      viewMode,
      dateRange,
      userAgent: navigator.userAgent,
      timestamp: new Date(),
    };

    performanceTracker.recordCalendarPerformance(performanceData);
  }
}

// =============================================================================
// PERFORMANCE THRESHOLDS
// =============================================================================

export const PERFORMANCE_THRESHOLDS = {
  RENDER_TIME_WARNING: 100, // ms
  RENDER_TIME_ERROR: 500, // ms
  DATA_PROCESSING_WARNING: 50, // ms
  DATA_PROCESSING_ERROR: 200, // ms
  TOTAL_CYCLE_WARNING: 150, // ms
  TOTAL_CYCLE_ERROR: 700, // ms
} as const;

/**
 * Checks if performance metrics exceed warning thresholds
 * 
 * @param renderTime - Render time in milliseconds
 * @param dataProcessingTime - Data processing time in milliseconds
 * @returns Performance warnings if any
 */
export function checkPerformanceThresholds(
  renderTime: number,
  dataProcessingTime: number
): string[] {
  const warnings: string[] = [];
  const totalTime = renderTime + dataProcessingTime;

  if (renderTime > PERFORMANCE_THRESHOLDS.RENDER_TIME_ERROR) {
    warnings.push(`Critical: Calendar rendering took ${renderTime.toFixed(2)}ms (threshold: ${PERFORMANCE_THRESHOLDS.RENDER_TIME_ERROR}ms)`);
  } else if (renderTime > PERFORMANCE_THRESHOLDS.RENDER_TIME_WARNING) {
    warnings.push(`Warning: Calendar rendering took ${renderTime.toFixed(2)}ms (threshold: ${PERFORMANCE_THRESHOLDS.RENDER_TIME_WARNING}ms)`);
  }

  if (dataProcessingTime > PERFORMANCE_THRESHOLDS.DATA_PROCESSING_ERROR) {
    warnings.push(`Critical: Data processing took ${dataProcessingTime.toFixed(2)}ms (threshold: ${PERFORMANCE_THRESHOLDS.DATA_PROCESSING_ERROR}ms)`);
  } else if (dataProcessingTime > PERFORMANCE_THRESHOLDS.DATA_PROCESSING_WARNING) {
    warnings.push(`Warning: Data processing took ${dataProcessingTime.toFixed(2)}ms (threshold: ${PERFORMANCE_THRESHOLDS.DATA_PROCESSING_WARNING}ms)`);
  }

  if (totalTime > PERFORMANCE_THRESHOLDS.TOTAL_CYCLE_ERROR) {
    warnings.push(`Critical: Total calendar cycle took ${totalTime.toFixed(2)}ms (threshold: ${PERFORMANCE_THRESHOLDS.TOTAL_CYCLE_ERROR}ms)`);
  } else if (totalTime > PERFORMANCE_THRESHOLDS.TOTAL_CYCLE_WARNING) {
    warnings.push(`Warning: Total calendar cycle took ${totalTime.toFixed(2)}ms (threshold: ${PERFORMANCE_THRESHOLDS.TOTAL_CYCLE_WARNING}ms)`);
  }

  return warnings;
}