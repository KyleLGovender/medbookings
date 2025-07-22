import { BookingView } from '@/features/calendar/types/types';

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

export const NotificationChannel = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  WHATSAPP: 'WHATSAPP',
} as const;

export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];

export interface NotificationOptions {
  channels?: NotificationChannel[];
  priority?: 'high' | 'normal' | 'low';
  retry?: boolean;
}

// Enum for template types
export const TemplateType = {
  BOOKING_CONFIRMATION: 'BOOKING_CONFIRMATION',
  BOOKING_UPDATE: 'BOOKING_UPDATE',
  BOOKING_CANCELLATION: 'BOOKING_CANCELLATION',
} as const;

export type TemplateType = (typeof TemplateType)[keyof typeof TemplateType];

export interface TemplateData {
  booking?: BookingView;
  recipientName?: string;
  [key: string]: unknown;
}

// Add after TemplateType definition
export const NotificationType = {
  BOOKING_CONFIRMATION: 'BOOKING_CONFIRMATION',
  BOOKING_UPDATE: 'BOOKING_UPDATE',
  BOOKING_CANCELLATION: 'BOOKING_CANCELLATION',
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
