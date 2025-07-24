// =============================================================================
// ORGANIZATIONS FEATURE SCHEMAS
// =============================================================================
// Validation schemas for organizations feature forms and API endpoints
// Organized by: Input Schemas -> Response Schemas -> Utility Schemas
import { z } from 'zod';

// =============================================================================
// INPUT SCHEMAS
// =============================================================================

export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(255, 'Name too long'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
});

export const updateOrganizationSchema = createOrganizationSchema.partial().extend({
  id: z.string().uuid(),
});

export const createMembershipSchema = z.object({
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER']),
});

export const createLocationSchema = z.object({
  id: z.string().uuid().optional(),
  organizationId: z.string().uuid(),
  name: z.string().min(1, 'Location name is required'),
  formattedAddress: z.string().min(1, 'Address is required'),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  googlePlaceId: z.string().min(1, 'Google Place ID is required'),
  coordinates: z.any().optional(),
  searchTerms: z.array(z.string()).optional(),
});

// Additional schemas referenced by components
export const organizationBasicInfoSchema = createOrganizationSchema;

export const organizationRegistrationSchema = createOrganizationSchema.extend({
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

export const organizationLocationsSchema = z.object({
  locations: z.array(createLocationSchema),
});

export const ProviderInvitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  customMessage: z.string().optional().or(z.literal('')),
});

export const organizationStatusSchema = z.enum([
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'SUSPENDED',
]);

export const membershipRoleSchema = z.enum(['ADMIN', 'MANAGER', 'MEMBER']);

export const membershipStatusSchema = z.enum(['PENDING', 'ACTIVE', 'INACTIVE']);

// =============================================================================
// RESPONSE SCHEMAS
// =============================================================================

export const organizationResponseSchema = z.object({
  id: z.string().uuid(),
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
  id: z.string().uuid(),
  role: membershipRoleSchema,
  status: membershipStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const locationResponseSchema = z.object({
  id: z.string().uuid(),
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
  organizationId: z.string().uuid().optional(),
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
