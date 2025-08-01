// =============================================================================
// COMMUNICATIONS FEATURE TYPES
// =============================================================================
// All type definitions for the communications feature in one place
// Organized by: Domain Enums -> Business Logic -> Communication Interfaces
//
// =============================================================================
// MIGRATION NOTES - CROSS-FEATURE IMPORTS REMOVED
// =============================================================================
//
// Removed cross-feature imports:
// - BookingView from calendar types (server data structure)
//
// Components will use tRPC RouterOutputs for server data in Task 4.0

// =============================================================================
// ENUMS AND CONSTANTS
// =============================================================================

export const NotificationChannel = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  WHATSAPP: 'WHATSAPP',
} as const;

export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];

export const TemplateType = {
  BOOKING_CONFIRMATION: 'BOOKING_CONFIRMATION',
  BOOKING_UPDATE: 'BOOKING_UPDATE',
  BOOKING_CANCELLATION: 'BOOKING_CANCELLATION',
} as const;

export type TemplateType = (typeof TemplateType)[keyof typeof TemplateType];

export const NotificationType = {
  BOOKING_CONFIRMATION: 'BOOKING_CONFIRMATION',
  BOOKING_UPDATE: 'BOOKING_UPDATE',
  BOOKING_CANCELLATION: 'BOOKING_CANCELLATION',
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

// =============================================================================
// BASE INTERFACES
// =============================================================================

export interface NotificationContent {
  subject?: string;
  body: string;
  templateId?: string;
  data?: Record<string, unknown>;
}

export interface NotificationRecipient {
  email?: string;
  phone?: string;
  whatsapp?: string;
  name: string;
}

export interface NotificationResult {
  success: boolean;
  error?: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  content: string;
}

export interface NotificationOptions {
  channels?: NotificationChannel[];
  priority?: 'high' | 'normal' | 'low';
  retry?: boolean;
}

// =============================================================================
// COMPLEX INTERFACES
// =============================================================================

export interface TemplateData {
  // booking will be typed using tRPC RouterOutputs in Task 4.0
  booking?: any; // Temporary - will use RouterOutputs['calendar']['getBookingView']
  recipientName?: string;
  [key: string]: unknown;
}
