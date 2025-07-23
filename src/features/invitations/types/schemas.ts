// =============================================================================
// INVITATIONS FEATURE SCHEMAS
// =============================================================================
// All Zod validation schemas for the invitations feature in one place
// Organized by: Entity Schemas -> Request Schemas -> Response Schemas

import { z } from 'zod';

import {
  InvitationAction,
  InvitationStatus,
  OrganizationPermission,
  OrganizationRole,
  ProviderInvitationStatus,
} from './types';

// =============================================================================
// ENUM SCHEMAS
// =============================================================================

export const invitationStatusSchema = z.nativeEnum(InvitationStatus);
export const providerInvitationStatusSchema = z.nativeEnum(ProviderInvitationStatus);
export const organizationRoleSchema = z.nativeEnum(OrganizationRole);
export const organizationPermissionSchema = z.nativeEnum(OrganizationPermission);
export const invitationActionSchema = z.nativeEnum(InvitationAction);

// =============================================================================
// ENTITY SCHEMAS
// =============================================================================

// Organization context schema
export const organizationContextSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  logo: z.string().url().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
});

// User context schema
export const userContextSchema = z.object({
  id: z.string().uuid(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  image: z.string().url().optional(),
});

// Invitation info schema
export const invitationInfoSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  token: z.string().min(1),
  status: z.union([invitationStatusSchema, providerInvitationStatusSchema]),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  acceptedAt: z.coerce.date().optional(),
  rejectedAt: z.coerce.date().optional(),
  cancelledAt: z.coerce.date().optional(),
});

// General invitation data schema
export const invitationDataSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  customMessage: z.string().max(1000).optional(),
  status: z.string(),
  expiresAt: z.string(),
  organization: organizationContextSchema,
  invitedBy: userContextSchema,
  role: organizationRoleSchema.optional(),
  permissions: z.array(organizationPermissionSchema).optional(),
});

// =============================================================================
// REQUEST SCHEMAS
// =============================================================================

// Create organization invitation request schema
export const createOrganizationInvitationRequestSchema = z.object({
  organizationId: z.string().uuid(),
  email: z.string().email(),
  role: organizationRoleSchema,
  permissions: z.array(organizationPermissionSchema),
  customMessage: z.string().max(1000).optional(),
  expiresInDays: z.number().int().min(1).max(365).optional().default(30),
});

// Create provider invitation request schema
export const createProviderInvitationRequestSchema = z.object({
  organizationId: z.string().uuid(),
  email: z.string().email(),
  customMessage: z.string().max(1000).optional(),
  expiresInDays: z.number().int().min(1).max(365).optional().default(30),
});

// Accept invitation request schema
export const acceptInvitationRequestSchema = z.object({
  token: z.string().min(1),
  userInfo: z
    .object({
      name: z.string().min(1).optional(),
      phone: z.string().optional(),
    })
    .optional(),
});

// Reject invitation request schema
export const rejectInvitationRequestSchema = z.object({
  token: z.string().min(1),
  reason: z.string().max(500).optional(),
});

// Resend invitation request schema
export const resendInvitationRequestSchema = z.object({
  invitationId: z.string().uuid(),
  customMessage: z.string().max(1000).optional(),
});

// Bulk invitation request schema
export const bulkInvitationRequestSchema = z.object({
  organizationId: z.string().uuid(),
  invitations: z
    .array(
      z.object({
        email: z.string().email(),
        role: organizationRoleSchema.optional(),
        permissions: z.array(organizationPermissionSchema).optional(),
        customMessage: z.string().max(1000).optional(),
      })
    )
    .min(1)
    .max(50),
  defaultRole: organizationRoleSchema.optional(),
  defaultPermissions: z.array(organizationPermissionSchema).optional(),
});

// =============================================================================
// QUERY SCHEMAS
// =============================================================================

// Invitation query options schema
export const invitationQueryOptionsSchema = z.object({
  organizationId: z.string().uuid().optional(),
  status: z
    .union([
      invitationStatusSchema,
      providerInvitationStatusSchema,
      z.array(invitationStatusSchema),
      z.array(providerInvitationStatusSchema),
    ])
    .optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  includeExpired: z.boolean().optional().default(false),
});

// Invitation validation query schema
export const invitationValidationQuerySchema = z.object({
  token: z.string().min(1),
});

// =============================================================================
// ROUTE PARAMETER SCHEMAS
// =============================================================================

// Invitation token params schema
export const invitationTokenParamsSchema = z.object({
  token: z.string().min(1),
});

// Invitation ID params schema
export const invitationIdParamsSchema = z.object({
  invitationId: z.string().uuid(),
});

// Organization invitation params schema
export const organizationInvitationParamsSchema = z.object({
  organizationId: z.string().uuid(),
  invitationId: z.string().uuid(),
});

// =============================================================================
// RESPONSE SCHEMAS
// =============================================================================

// Invitation response schema
export const invitationResponseSchema = z.object({
  success: z.boolean(),
  invitation: invitationDataSchema.optional(),
  error: z.string().optional(),
  redirectUrl: z.string().url().optional(),
});

// Invitation validation response schema
export const invitationValidationResponseSchema = z.object({
  isValid: z.boolean(),
  invitation: invitationDataSchema.optional(),
  error: z.string().optional(),
  reason: z.enum(['EXPIRED', 'NOT_FOUND', 'ALREADY_ACCEPTED', 'CANCELLED']).optional(),
});

// Invitation stats response schema
export const invitationStatsResponseSchema = z.object({
  total: z.number().int().min(0),
  pending: z.number().int().min(0),
  accepted: z.number().int().min(0),
  rejected: z.number().int().min(0),
  expired: z.number().int().min(0),
  cancelled: z.number().int().min(0),
});

// =============================================================================
// EMAIL TEMPLATE SCHEMAS
// =============================================================================

// Invitation email template schema
export const invitationEmailTemplateSchema = z.object({
  recipientEmail: z.string().email(),
  inviterName: z.string().min(1),
  organizationName: z.string().min(1),
  invitationUrl: z.string().url(),
  customMessage: z.string().max(1000).optional(),
  expiresAt: z.coerce.date(),
  role: z.string().optional(),
});

// =============================================================================
// TYPE INFERENCE HELPERS
// =============================================================================

export type OrganizationContextInput = z.infer<typeof organizationContextSchema>;
export type UserContextInput = z.infer<typeof userContextSchema>;
export type InvitationInfoInput = z.infer<typeof invitationInfoSchema>;
export type InvitationDataInput = z.infer<typeof invitationDataSchema>;
export type CreateOrganizationInvitationRequestInput = z.infer<
  typeof createOrganizationInvitationRequestSchema
>;
export type CreateProviderInvitationRequestInput = z.infer<typeof createProviderInvitationRequestSchema>;
export type AcceptInvitationRequestInput = z.infer<typeof acceptInvitationRequestSchema>;
export type RejectInvitationRequestInput = z.infer<typeof rejectInvitationRequestSchema>;
export type ResendInvitationRequestInput = z.infer<typeof resendInvitationRequestSchema>;
export type BulkInvitationRequestInput = z.infer<typeof bulkInvitationRequestSchema>;
export type InvitationQueryOptionsInput = z.infer<typeof invitationQueryOptionsSchema>;
export type InvitationValidationQueryInput = z.infer<typeof invitationValidationQuerySchema>;
export type InvitationTokenParamsInput = z.infer<typeof invitationTokenParamsSchema>;
export type InvitationIdParamsInput = z.infer<typeof invitationIdParamsSchema>;
export type OrganizationInvitationParamsInput = z.infer<typeof organizationInvitationParamsSchema>;
export type InvitationResponseInput = z.infer<typeof invitationResponseSchema>;
export type InvitationValidationResponseInput = z.infer<typeof invitationValidationResponseSchema>;
export type InvitationStatsResponseInput = z.infer<typeof invitationStatsResponseSchema>;
export type InvitationEmailTemplateInput = z.infer<typeof invitationEmailTemplateSchema>;