// =============================================================================
// ORGANIZATIONS FEATURE SCHEMAS
// =============================================================================
// Validation schemas for organizations feature forms and API endpoints
// Organized by: Input Schemas -> Response Schemas -> Utility Schemas
import {
  InvitationStatus,
  MembershipStatus,
  OrganizationBillingModel,
  OrganizationRole,
  OrganizationStatus,
} from '@prisma/client';
import { z } from 'zod';

// =============================================================================
// INPUT SCHEMAS
// =============================================================================

export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(255, 'Name too long'),
  email: z.union([z.string().email('Invalid email format'), z.literal('')]).optional(),
  phone: z.string().optional(),
  website: z.union([z.string().url('Invalid website URL'), z.literal('')]).optional(),
  description: z.string().optional(),
});

export const updateOrganizationSchema = createOrganizationSchema.partial().extend({
  id: z.string(),
});

export const createMembershipSchema = z.object({
  organizationId: z.string(),
  userId: z.string(),
  role: z.nativeEnum(OrganizationRole),
});

export const createLocationSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string(),
  name: z.string().min(1, 'Location name is required'),
  formattedAddress: z.string().min(1, 'Address is required'),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  googlePlaceId: z.string().optional().or(z.literal('')),
  coordinates: z.any().optional(),
  searchTerms: z.array(z.string()).optional(),
});

// Additional schemas referenced by components
export const organizationBasicInfoSchema = createOrganizationSchema;

export const organizationRegistrationSchema = z.object({
  organization: createOrganizationSchema.extend({
    billingModel: z.nativeEnum(OrganizationBillingModel).default('CONSOLIDATED'),
    logo: z.string().optional().or(z.literal('')),
  }),
  locations: z
    .array(createLocationSchema.omit({ organizationId: true }))
    .optional()
    .default([]),
});

export const organizationLocationsSchema = z.object({
  locations: z.array(createLocationSchema),
});

export const ProviderInvitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  customMessage: z.string().optional().or(z.literal('')),
});

export const organizationStatusSchema = z.nativeEnum(OrganizationStatus);

export const membershipRoleSchema = z.nativeEnum(OrganizationRole);

export const membershipStatusSchema = z.nativeEnum(MembershipStatus);

// =============================================================================
// RESPONSE SCHEMAS
// =============================================================================

export const organizationResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  description: z.string().nullable(),
  status: organizationStatusSchema,
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const membershipResponseSchema = z.object({
  id: z.string(),
  role: membershipRoleSchema,
  status: membershipStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const locationResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  formattedAddress: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  googlePlaceId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// =============================================================================
// UTILITY SCHEMAS
// =============================================================================

export const organizationSearchParamsSchema = z.object({
  status: organizationStatusSchema.optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const membershipSearchParamsSchema = z.object({
  organizationId: z.string().optional(),
  role: membershipRoleSchema.optional(),
  status: membershipStatusSchema.optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// =============================================================================
// INFERRED TYPES
// =============================================================================

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type CreateMembershipInput = z.infer<typeof createMembershipSchema>;
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type ProviderInvitationData = z.infer<typeof ProviderInvitationSchema>;
export type OrganizationSearchParams = z.infer<typeof organizationSearchParamsSchema>;
export type MembershipSearchParams = z.infer<typeof membershipSearchParamsSchema>;
