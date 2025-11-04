/**
 * Simple debug utility for provider form debugging
 *
 * This utility provides a simple way to toggle debugging on/off across
 * all provider form components and related server actions.
 *
 * Now integrated with the centralized logger infrastructure for consistency.
 */
import { logger } from '@/lib/logger';

// Configuration object with debug settings
const debugConfig = {
  // Master switch for all debugging
  enabled: false,

  // Component-specific debugging
  components: {
    editRegulatoryRequirements: true,
    editBasicInfo: true,
    editServices: true,
  },

  // API and server action debugging
  server: {
    api: true,
    actions: true,
  },

  // Debug levels
  levels: {
    error: true, // Always show errors
    warn: true, // Show warnings
    info: true, // Show info messages
    debug: true, // Show detailed debug info
    trace: false, // Show very verbose tracing (off by default)
  },
};

/**
 * Debug utility for provider forms
 */
export const providerDebug = {
  /**
   * Check if debugging is enabled for a specific component
   */
  isEnabled(component?: keyof typeof debugConfig.components): boolean {
    if (!debugConfig.enabled) return false;
    return component ? !!debugConfig.components[component] : true;
  },

  /**
   * Check if server debugging is enabled
   */
  isServerEnabled(type?: keyof typeof debugConfig.server): boolean {
    if (!debugConfig.enabled) return false;
    return type ? !!debugConfig.server[type] : true;
  },

  /**
   * Check if a specific debug level is enabled
   */
  isLevelEnabled(level: keyof typeof debugConfig.levels): boolean {
    return debugConfig.enabled && !!debugConfig.levels[level];
  },

  /**
   * Enable or disable all debugging
   */
  setEnabled(enabled: boolean): void {
    debugConfig.enabled = enabled;
  },

  /**
   * Log a message if debugging is enabled for the component
   */
  log(
    component: keyof typeof debugConfig.components | 'api' | 'action',
    message: string,
    ...data: unknown[]
  ): void {
    const isApi = component === 'api';
    const isAction = component === 'action';
    const isServer = isApi || isAction;

    const serverType = isApi ? 'api' : isAction ? 'actions' : undefined;

    if (
      (isServer && this.isServerEnabled(serverType) && this.isLevelEnabled('debug')) ||
      (!isServer &&
        this.isEnabled(component as keyof typeof debugConfig.components) &&
        this.isLevelEnabled('debug'))
    ) {
      // Use centralized logger with 'providers' feature flag
      logger.debug('providers', `[${component.toUpperCase()}] ${message}`, {
        component,
        data: data.length > 0 ? data : undefined,
      });
    }
  },

  /**
   * Log an error message
   */
  error(
    component: keyof typeof debugConfig.components | 'api' | 'action',
    message: string,
    ...data: unknown[]
  ): void {
    if (this.isLevelEnabled('error')) {
      // Use centralized logger for error logging
      const errorData = data.length > 0 && data[0] instanceof Error ? data[0] : undefined;
      logger.error(`[${component.toUpperCase()}] ${message}`, errorData, {
        component,
        additionalData: data.length > 1 ? data.slice(1) : undefined,
      });
    }
  },

  /**
   * Log form data in a readable format
   */
  logFormData(component: keyof typeof debugConfig.components, formData: FormData): void {
    if (this.isEnabled(component) && this.isLevelEnabled('debug')) {
      // Convert FormData to object for logging
      const formDataObject = Object.fromEntries(Array.from(formData.entries()));
      logger.debug('providers', `[${component.toUpperCase()}] Form data entries`, {
        component,
        formData: formDataObject,
      });
    }
  },
};

// Make debug controls available in browser console
declare global {
  interface Window {
    providerDebug: typeof providerDebug;
  }
}

if (typeof window !== 'undefined') {
  window.providerDebug = providerDebug;
}
