// =============================================================================
// PROFILE FEATURE SCHEMAS
// =============================================================================
// Zod validation schemas for profile feature form inputs only
// Response types are automatically inferred from tRPC procedures
import { UserRole } from '@prisma/client';
import { z } from 'zod';

// =============================================================================
// ENUM SCHEMAS
// =============================================================================

export const userRoleSchema = z.nativeEnum(UserRole);

// =============================================================================
// INPUT VALIDATION SCHEMAS
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
// TYPE INFERENCE HELPERS
// =============================================================================

export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;
export type DeleteAccountRequest = z.infer<typeof deleteAccountRequestSchema>;
