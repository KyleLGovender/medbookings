import { OrganizationStatus, ProviderStatus } from '@prisma/client';
import { z } from 'zod';

import { AdminAction, ApprovalEntityType } from './types';

// Form validation schemas
export const rejectionReasonSchema = z.object({
  reason: z
    .string()
    .min(1, 'Rejection reason is required')
    .max(1000, 'Rejection reason must be less than 1000 characters')
    .trim(),
});

export const adminActionSchema = z.object({
  action: z.nativeEnum(AdminAction),
  reason: z.string().optional(),
});

// API request schemas
export const approveProviderRequestSchema = z.object({
  // Currently no additional data needed, but schema ready for future extensions
});

export const rejectProviderRequestSchema = z.object({
  reason: z
    .string()
    .min(1, 'Rejection reason is required')
    .max(1000, 'Rejection reason must be less than 1000 characters')
    .trim(),
});

export const approveOrganizationRequestSchema = z.object({
  // Currently no additional data needed, but schema ready for future extensions
});

export const rejectOrganizationRequestSchema = z.object({
  reason: z
    .string()
    .min(1, 'Rejection reason is required')
    .max(1000, 'Rejection reason must be less than 1000 characters')
    .trim(),
});

export const approveRequirementRequestSchema = z.object({
  // Currently no additional data needed, but schema ready for future extensions
});

export const rejectRequirementRequestSchema = z.object({
  reason: z
    .string()
    .min(1, 'Rejection reason is required')
    .max(1000, 'Rejection reason must be less than 1000 characters')
    .trim(),
});

// Search params schemas
// Note: Using union of Prisma enums to allow filtering by either provider or organization status
export const adminSearchParamsSchema = z.object({
  status: z.union([z.nativeEnum(ProviderStatus), z.nativeEnum(OrganizationStatus)]).optional(),
  search: z.string().optional(),
});

// Route params schemas
export const adminRouteParamsSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export const adminRequirementRouteParamsSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  requirementId: z.string().min(1, 'Requirement ID is required'),
});

// Type inference helpers
export type RejectionReasonInput = z.infer<typeof rejectionReasonSchema>;
export type AdminActionInput = z.infer<typeof adminActionSchema>;
export type ApproveProviderRequestInput = z.infer<typeof approveProviderRequestSchema>;
export type RejectProviderRequestInput = z.infer<typeof rejectProviderRequestSchema>;
export type ApproveOrganizationRequestInput = z.infer<typeof approveOrganizationRequestSchema>;
export type RejectOrganizationRequestInput = z.infer<typeof rejectOrganizationRequestSchema>;
export type ApproveRequirementRequestInput = z.infer<typeof approveRequirementRequestSchema>;
export type RejectRequirementRequestInput = z.infer<typeof rejectRequirementRequestSchema>;
export type AdminSearchParamsInput = z.infer<typeof adminSearchParamsSchema>;
export type AdminRouteParamsInput = z.infer<typeof adminRouteParamsSchema>;
export type AdminRequirementRouteParamsInput = z.infer<typeof adminRequirementRouteParamsSchema>;
