// =============================================================================
// PROFILE FEATURE TYPES
// =============================================================================
// All type definitions for the profile feature in one place
// Organized by: Enums -> Base Interfaces -> Complex Interfaces -> Utility Types

// =============================================================================
// ENUMS
// =============================================================================

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

// =============================================================================
// BASE INTERFACES
// =============================================================================

export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  phone: string | null;
  whatsapp: string | null;
  role: UserRole;
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  error?: string;
  user?: UserProfile;
}

export interface DeleteAccountResponse {
  success: boolean;
  error?: string;
}
