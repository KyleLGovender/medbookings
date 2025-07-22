// =============================================================================
// PROVIDERS FEATURE SCHEMAS
// =============================================================================
// Validation schemas for providers feature forms and API endpoints
// Organized by: Input Schemas -> Response Schemas -> Utility Schemas

import { z } from 'zod';

// =============================================================================
// INPUT SCHEMAS
// =============================================================================

export const createProviderSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  providerTypeIds: z.array(z.string().uuid()).min(1, 'At least one provider type is required'),
  serviceIds: z.array(z.string().uuid()).min(1, 'At least one service is required'),
  requirementSubmissions: z.array(z.object({
    requirementTypeId: z.string().uuid(),
    notes: z.string().optional(),
  })).optional(),
});

export const updateProviderSchema = createProviderSchema.partial().extend({
  id: z.string().uuid(),
});

export const providerStatusSchema = z.enum(['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED']);

export const requirementStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

// =============================================================================
// RESPONSE SCHEMAS
// =============================================================================

export const providerResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  whatsapp: z.string().nullable(),
  status: providerStatusSchema,
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// =============================================================================
// UTILITY SCHEMAS
// =============================================================================

export const providerSearchParamsSchema = z.object({
  status: providerStatusSchema.optional(),
  providerTypeId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// =============================================================================
// INFERRED TYPES
// =============================================================================

export type CreateProviderInput = z.infer<typeof createProviderSchema>;
export type UpdateProviderInput = z.infer<typeof updateProviderSchema>;
export type ProviderSearchParams = z.infer<typeof providerSearchParamsSchema>;