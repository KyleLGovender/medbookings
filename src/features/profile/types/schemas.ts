// =============================================================================
// PROFILE FEATURE SCHEMAS
// =============================================================================
// All Zod validation schemas for the profile feature in one place
// Organized by: Entity Schemas -> Request Schemas -> Response Schemas

import { z } from 'zod';

import { UserRole } from './types';

// =============================================================================
// ENUM SCHEMAS
// =============================================================================

export const userRoleSchema = z.nativeEnum(UserRole);

// =============================================================================
// ENTITY SCHEMAS
// =============================================================================

// User profile schema
export const userProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  email: z.string().email().nullable(),
  image: z.string().url().nullable(),
  phone: z.string().nullable(),
  whatsapp: z.string().nullable(),
  role: userRoleSchema,
});

// =============================================================================
// REQUEST SCHEMAS
// =============================================================================

// Update profile request schema
export const updateProfileRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
});

// Delete account request schema
export const deleteAccountRequestSchema = z.object({
  confirmationText: z.string().min(1, 'Confirmation is required').optional(),
});

// =============================================================================
// RESPONSE SCHEMAS
// =============================================================================

// Update profile response schema
export const updateProfileResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  user: userProfileSchema.optional(),
});

// Delete account response schema
export const deleteAccountResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});

// =============================================================================
// TYPE INFERENCE HELPERS
// =============================================================================

export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type UpdateProfileRequestInput = z.infer<typeof updateProfileRequestSchema>;
export type DeleteAccountRequestInput = z.infer<typeof deleteAccountRequestSchema>;
export type UpdateProfileResponseInput = z.infer<typeof updateProfileResponseSchema>;
export type DeleteAccountResponseInput = z.infer<typeof deleteAccountResponseSchema>;