// =============================================================================
// COMMUNICATIONS FEATURE TYPES
// =============================================================================
// All type definitions for the communications feature in one place
// Organized by: Prisma Imports -> Domain Enums -> Business Logic -> Communication Interfaces

// =============================================================================
// PRISMA TYPE IMPORTS
// =============================================================================
// Import database enums directly from Prisma to prevent type drift

import {
  CommunicationType,
  CommunicationChannel
} from '@prisma/client';

// =============================================================================
// MIGRATION NOTES - CROSS-FEATURE IMPORTS REMOVED
// =============================================================================
//
// Removed cross-feature imports:
// - BookingView from calendar types (server data structure)
//
// Components will use tRPC RouterOutputs for server data in Task 4.0

// =============================================================================
// DOMAIN ENUMS AND CONSTANTS
// =============================================================================
// Note: Database enums are now imported from Prisma above.
// Custom const objects replaced with proper enum imports.

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
  channels?: CommunicationChannel[];
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
