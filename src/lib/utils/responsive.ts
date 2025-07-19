/**
 * Responsive utility functions for device detection and screen size handling
 */

export interface DeviceType {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export interface ScreenSize {
  width: number;
  height: number;
  devicePixelRatio: number;
}

/**
 * Responsive breakpoints matching Tailwind CSS defaults
 */
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
} as const;

/**
 * Determines device type based on viewport width
 * @param width - Current viewport width
 * @returns DeviceType object with boolean flags
 */
export function getDeviceType(width: number): DeviceType {
  const isMobile = width < BREAKPOINTS.mobile;
  const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
  const isDesktop = width >= BREAKPOINTS.tablet;

  return {
    isMobile,
    isTablet,
    isDesktop,
  };
}

/**
 * Gets current screen size information
 * @returns ScreenSize object with dimensions and pixel ratio
 */
export function getScreenSize(): ScreenSize {
  if (typeof window === 'undefined') {
    // SSR fallback - assume desktop
    return {
      width: 1200,
      height: 800,
      devicePixelRatio: 1,
    };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
  };
}

/**
 * Checks if current device is mobile
 * @returns true if mobile device
 */
export function isMobileDevice(): boolean {
  const { width } = getScreenSize();
  return getDeviceType(width).isMobile;
}

/**
 * Checks if current device is tablet
 * @returns true if tablet device
 */
export function isTabletDevice(): boolean {
  const { width } = getScreenSize();
  return getDeviceType(width).isTablet;
}

/**
 * Checks if current device is desktop
 * @returns true if desktop device
 */
export function isDesktopDevice(): boolean {
  const { width } = getScreenSize();
  return getDeviceType(width).isDesktop;
}

/**
 * Hook for listening to window resize events
 * @param callback - Function to call on resize
 * @param throttleMs - Throttle delay in milliseconds
 */
export function useResizeListener(
  callback: (size: ScreenSize) => void,
  throttleMs: number = 100
): (() => void) | void {
  if (typeof window === 'undefined') return;

  let timeoutId: NodeJS.Timeout;

  const throttledCallback = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback(getScreenSize());
    }, throttleMs);
  };

  window.addEventListener('resize', throttledCallback);

  // Cleanup function (caller needs to handle this)
  return () => {
    window.removeEventListener('resize', throttledCallback);
    clearTimeout(timeoutId);
  };
}

/**
 * Determines if iPad should be treated as mobile for UI purposes
 * Based on user agent detection as viewport alone isn't sufficient
 * @returns true if iPad should use mobile UI
 */
export function shouldTreatIPadAsMobile(): boolean {
  if (typeof navigator === 'undefined') return false;

  const userAgent = navigator.userAgent.toLowerCase();
  const isIPad =
    userAgent.includes('ipad') || (userAgent.includes('macintosh') && 'ontouchend' in document);

  // For now, treat iPad as tablet (desktop-like), but this can be configured
  return false;
}

/**
 * Comprehensive mobile detection including iPad considerations
 * @returns true if device should use mobile UI
 */
export function isMobileForUI(): boolean {
  const { width } = getScreenSize();
  const deviceType = getDeviceType(width);

  if (deviceType.isMobile) return true;
  if (shouldTreatIPadAsMobile() && deviceType.isTablet) return true;

  return false;
}

/**
 * Gets appropriate calendar view modes for current device
 * @returns Array of allowed view modes
 */
export function getAllowedCalendarViewModes(): string[] {
  if (isMobileForUI()) {
    return ['day', '3-day', 'agenda'];
  }

  return ['day', '3-day', 'week', 'month', 'agenda'];
}
