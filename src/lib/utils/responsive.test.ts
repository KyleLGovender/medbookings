/**
 * Unit tests for responsive utility functions
 */

import {
  getDeviceType,
  getScreenSize,
  isMobileDevice,
  isTabletDevice,
  isDesktopDevice,
  shouldTreatIPadAsMobile,
  isMobileForUI,
  getAllowedCalendarViewModes,
  BREAKPOINTS,
} from './responsive';

// Mock window object for testing
const mockWindow = (width: number, height: number = 800) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  Object.defineProperty(window, 'devicePixelRatio', {
    writable: true,
    configurable: true,
    value: 1,
  });
};

describe('responsive utilities', () => {
  describe('getDeviceType', () => {
    it('should identify mobile devices correctly', () => {
      const result = getDeviceType(400);
      expect(result.isMobile).toBe(true);
      expect(result.isTablet).toBe(false);
      expect(result.isDesktop).toBe(false);
    });

    it('should identify tablet devices correctly', () => {
      const result = getDeviceType(800);
      expect(result.isMobile).toBe(false);
      expect(result.isTablet).toBe(true);
      expect(result.isDesktop).toBe(false);
    });

    it('should identify desktop devices correctly', () => {
      const result = getDeviceType(1200);
      expect(result.isMobile).toBe(false);
      expect(result.isTablet).toBe(false);
      expect(result.isDesktop).toBe(true);
    });

    it('should handle edge cases correctly', () => {
      // Exactly at mobile breakpoint
      const mobile = getDeviceType(BREAKPOINTS.mobile - 1);
      expect(mobile.isMobile).toBe(true);

      // Exactly at tablet breakpoint
      const tablet = getDeviceType(BREAKPOINTS.mobile);
      expect(tablet.isTablet).toBe(true);

      // Exactly at desktop breakpoint
      const desktop = getDeviceType(BREAKPOINTS.tablet);
      expect(desktop.isDesktop).toBe(true);
    });
  });

  describe('getScreenSize', () => {
    beforeEach(() => {
      mockWindow(1024, 768);
    });

    it('should return current screen dimensions', () => {
      const result = getScreenSize();
      expect(result.width).toBe(1024);
      expect(result.height).toBe(768);
      expect(result.devicePixelRatio).toBe(1);
    });

    it('should handle SSR case when window is undefined', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const result = getScreenSize();
      expect(result.width).toBe(1200);
      expect(result.height).toBe(800);
      expect(result.devicePixelRatio).toBe(1);

      global.window = originalWindow;
    });
  });

  describe('device detection functions', () => {
    it('should correctly identify mobile devices', () => {
      mockWindow(400);
      expect(isMobileDevice()).toBe(true);
      expect(isTabletDevice()).toBe(false);
      expect(isDesktopDevice()).toBe(false);
    });

    it('should correctly identify tablet devices', () => {
      mockWindow(800);
      expect(isMobileDevice()).toBe(false);
      expect(isTabletDevice()).toBe(true);
      expect(isDesktopDevice()).toBe(false);
    });

    it('should correctly identify desktop devices', () => {
      mockWindow(1200);
      expect(isMobileDevice()).toBe(false);
      expect(isTabletDevice()).toBe(false);
      expect(isDesktopDevice()).toBe(true);
    });
  });

  describe('shouldTreatIPadAsMobile', () => {
    const originalNavigator = global.navigator;

    afterEach(() => {
      global.navigator = originalNavigator;
    });

    it('should return false for non-iPad devices', () => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        configurable: true,
      });
      expect(shouldTreatIPadAsMobile()).toBe(false);
    });

    it('should handle missing navigator', () => {
      // @ts-ignore
      delete global.navigator;
      expect(shouldTreatIPadAsMobile()).toBe(false);
    });
  });

  describe('isMobileForUI', () => {
    it('should return true for mobile devices', () => {
      mockWindow(400);
      expect(isMobileForUI()).toBe(true);
    });

    it('should return false for tablet devices', () => {
      mockWindow(800);
      expect(isMobileForUI()).toBe(false);
    });

    it('should return false for desktop devices', () => {
      mockWindow(1200);
      expect(isMobileForUI()).toBe(false);
    });
  });

  describe('getAllowedCalendarViewModes', () => {
    it('should return limited view modes for mobile', () => {
      mockWindow(400);
      const modes = getAllowedCalendarViewModes();
      expect(modes).toEqual(['day', '3-day', 'agenda']);
    });

    it('should return all view modes for tablet', () => {
      mockWindow(800);
      const modes = getAllowedCalendarViewModes();
      expect(modes).toEqual(['day', '3-day', 'week', 'month', 'agenda']);
    });

    it('should return all view modes for desktop', () => {
      mockWindow(1200);
      const modes = getAllowedCalendarViewModes();
      expect(modes).toEqual(['day', '3-day', 'week', 'month', 'agenda']);
    });
  });
});