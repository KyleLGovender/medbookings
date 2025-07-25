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
  requirementSubmissions: z
    .array(
      z.object({
        requirementTypeId: z.string().uuid(),
        notes: z.string().optional(),
      })
    )
    .optional(),
});

export const updateProviderSchema = createProviderSchema.partial().extend({
  id: z.string().uuid(),
});

export const providerStatusSchema = z.enum([
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'SUSPENDED',
]);

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
// FORM VALIDATION SCHEMAS (moved from hooks/types.ts)
// =============================================================================

export const basicInfoSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  bio: z
    .string()
    .min(50, 'Bio must be at least 50 characters')
    .max(500, 'Bio must be less than 500 characters'),
  image: z.string().min(1, 'Profile image is required'),
  languages: z.array(z.string()).min(1, 'Please select at least one language'),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  email: z.string().email('Please enter a valid email address'),
  whatsapp: z.string().min(10, 'Please enter a valid WhatsApp number'),
  showPrice: z.boolean().default(true),
});

export const providerTypeSchema = z.object({});

export const regulatoryRequirementsSchema = z.object({
  requirements: z
    .array(
      z.object({
        requirementTypeId: z.string(),
        value: z.any().optional(),
        documentMetadata: z.record(z.any()).optional(), // For storing document URLs and other metadata
        otherValue: z.string().optional(),
      })
    )
    .min(1, 'Please complete all required regulatory requirements'),
});

export const servicesSchema = z.object({
  availableServices: z.array(z.string()).min(1, 'Please select at least one service'),
  loadedServices: z.array(z.any()).optional(), // For storing available services
  serviceConfigs: z
    .record(
      z.object({
        duration: z.coerce.number().min(1, 'Duration must be at least 1 minute'),
        price: z.coerce.number().min(0, 'Price cannot be negative'),
      })
    )
    .optional(),
});

// Combined schema for the entire form
export const providerFormSchema = z.object({
  basicInfo: basicInfoSchema,
  providerType: providerTypeSchema,
  providerTypeIds: z.array(z.string()).min(1, 'Please select at least one provider type'),
  // Keep the old single field for backward compatibility
  providerTypeId: z.string().optional(),
  regulatoryRequirements: regulatoryRequirementsSchema,
  services: servicesSchema,
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

// =============================================================================
// INFERRED TYPES
// =============================================================================

export type CreateProviderInput = z.infer<typeof createProviderSchema>;
export type UpdateProviderInput = z.infer<typeof updateProviderSchema>;
export type ProviderSearchParams = z.infer<typeof providerSearchParamsSchema>;

// Type for the entire form data (moved from hooks/types.ts)
export type ProviderFormType = z.infer<typeof providerFormSchema>;

// =============================================================================
// PROVIDER INVITATION AND CONNECTION SCHEMAS (moved from barrel export)
// =============================================================================

// Schema for accepting/rejecting invitations
export const InvitationResponseSchema = z.object({
  action: z.enum(['accept', 'reject']),
  rejectionReason: z.string().optional(),
});

export type InvitationResponse = z.infer<typeof InvitationResponseSchema>;

// Schema for connection management
export const ConnectionUpdateSchema = z.object({
  status: z.enum(['ACCEPTED', 'SUSPENDED'] as const),
});

export type ConnectionUpdate = z.infer<typeof ConnectionUpdateSchema>;
