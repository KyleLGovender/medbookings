// =============================================================================
// COMMUNICATIONS FEATURE SCHEMAS
// =============================================================================
// All Zod validation schemas for the communications feature in one place
// Organized by: Entity Schemas -> Request Schemas -> Response Schemas
import { z } from 'zod';

import { CommunicationType, CommunicationChannel } from '@prisma/client';

// =============================================================================
// ENUM SCHEMAS
// =============================================================================

export const communicationChannelSchema = z.nativeEnum(CommunicationChannel);
export const communicationTypeSchema = z.nativeEnum(CommunicationType);

// =============================================================================
// ENTITY SCHEMAS
// =============================================================================

// Notification content schema
export const notificationContentSchema = z.object({
  subject: z.string().optional(),
  body: z.string().min(1, 'Message body is required'),
  templateId: z.string().optional(),
  data: z.record(z.unknown()).optional(),
});

// Notification recipient schema
export const notificationRecipientSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  name: z.string().min(1, 'Recipient name is required'),
});

// Notification options schema
export const notificationOptionsSchema = z.object({
  channels: z.array(communicationChannelSchema).optional(),
  priority: z.enum(['high', 'normal', 'low']).optional(),
  retry: z.boolean().optional(),
});

// =============================================================================
// REQUEST SCHEMAS
// =============================================================================

// Send notification request schema
export const sendNotificationRequestSchema = z.object({
  recipient: notificationRecipientSchema,
  content: notificationContentSchema,
  options: notificationOptionsSchema.optional(),
});

// Template data schema
export const templateDataSchema = z
  .object({
    recipientName: z.string().optional(),
    booking: z.any().optional(), // BookingView type
  })
  .passthrough(); // Allow additional properties

// =============================================================================
// RESPONSE SCHEMAS
// =============================================================================

// Notification result schema
export const notificationResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});

// =============================================================================
// TYPE INFERENCE HELPERS
// =============================================================================

export type NotificationContentInput = z.infer<typeof notificationContentSchema>;
export type NotificationRecipientInput = z.infer<typeof notificationRecipientSchema>;
export type NotificationOptionsInput = z.infer<typeof notificationOptionsSchema>;
export type SendNotificationRequestInput = z.infer<typeof sendNotificationRequestSchema>;
export type TemplateDataInput = z.infer<typeof templateDataSchema>;
export type NotificationResultInput = z.infer<typeof notificationResultSchema>;
