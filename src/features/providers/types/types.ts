// =============================================================================
// PROVIDERS FEATURE TYPES
// =============================================================================
// All type definitions for the providers feature in one place
// Domain enums, business logic types, and form schemas only
//
// OPTION C COMPLIANT: 
// - NO Prisma enum re-exports (import directly from @prisma/client where used)
// - Server data interfaces removed (use tRPC RouterOutputs)
// - Only domain logic and client-only types remain
// =============================================================================

// =============================================================================
// PRISMA ENUM IMPORTS
// =============================================================================

import {
  ProviderStatus,
  RequirementsValidationStatus,
  RequirementValidationType,
  Languages,
} from '@prisma/client';

// =============================================================================
// DOMAIN-SPECIFIC TYPES (Not in Prisma)
// =============================================================================

// Export enums for backward compatibility
export const SUPPORTED_LANGUAGES = Languages;
export { RequirementValidationType };

// =============================================================================
// BASE INTERFACES (Client-only types)
// =============================================================================

// Provider-related base interfaces for client-side use
export interface BasicProviderInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  status: ProviderStatus;
  isActive: boolean;
}

// Types for client-side data structures
export type ProviderTypeData = {
  id: string;
  name: string;
  description: string | null;
};

export type RequirementTypeData = {
  id: string;
  name: string;
  description: string | null;
  validationType: RequirementValidationType;
  isRequired: boolean;
  validationConfig: any;
  displayPriority?: number;
};

export type ServiceTypeData = {
  id: string;
  name: string;
  description: string | null;
  defaultDuration: number;
  defaultPrice: number | string;
  displayPriority: number;
};

export interface ProviderTypeInfo {
  id: string;
  name: string;
  description?: string;
  displayPriority?: number;
}

export interface ServiceInfo {
  id: string;
  name: string;
  description?: string;
  category?: string;
  displayPriority?: number;
}

// =============================================================================
// VALIDATION CONFIGURATION TYPES (Domain Logic)
// =============================================================================

// Types for validation configurations
export interface ValidationConfigBase {
  helpText?: string;
  validationError?: string;
  placeholder?: string;
}

export interface BooleanValidationConfig extends ValidationConfigBase {
  trueLabel?: string;
  falseLabel?: string;
  defaultValue?: boolean | null;
}

export interface DocumentValidationConfig extends ValidationConfigBase {
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in bytes
  requiredFileFormat?: string;
}

export interface TextValidationConfig extends ValidationConfigBase {
  minLength?: number;
  maxLength?: number;
  regex?: string;
  regexErrorMessage?: string;
}

export interface DateValidationConfig extends ValidationConfigBase {
  minDate?: string;
  maxDate?: string;
  dateFormat?: string;
}

export interface NumberValidationConfig extends ValidationConfigBase {
  min?: number;
  max?: number;
  step?: number;
  isInteger?: boolean;
}

export interface PredefinedListValidationConfig extends ValidationConfigBase {
  options: Array<{ value: string; label: string }>;
  allowOther?: boolean;
  otherLabel?: string;
  otherValidation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
  };
}

// Union type for all validation configurations
export type ValidationConfig =
  | BooleanValidationConfig
  | DocumentValidationConfig
  | TextValidationConfig
  | DateValidationConfig
  | NumberValidationConfig
  | PredefinedListValidationConfig;

// Type for requirement type (used in forms and components)
export type RequirementType = {
  id: string;
  name: string;
  description?: string | null;
  validationType: RequirementValidationType;
  isRequired: boolean;
  validationConfig?: ValidationConfig;
  displayPriority?: number;
  index: number;
  existingSubmission?: {
    documentUrl: string | null;
    documentMetadata: Record<string, any> | null;
    value?: string | boolean | number | null;
  };
};

/**
 * Represents a provider's submission for a regulatory or business requirement.
 * Supports various submission types including documents, forms, and boolean validations.
 */
export type RequirementSubmission = {
  /** Unique identifier for the submission (generated on save) */
  id?: string;
  /** Reference to the requirement type being fulfilled */
  requirementTypeId: string;
  /** Provider making the submission */
  providerId?: string;
  /** Current validation status of the submission */
  status?: RequirementsValidationStatus;
  /** Metadata for document submissions including URLs and file info */
  documentMetadata?: Record<string, any> | null;
  /** Expiration date for time-sensitive requirements (e.g., licenses) */
  expiresAt?: Date | null;
  /** Additional notes or comments about the submission */
  notes?: string | null;
  /** Timestamp when the submission was validated */
  validatedAt?: Date | null;
  /** ID of the admin user who validated the submission */
  validatedById?: string | null;
  /** Form value for non-document submissions (text, boolean, number) */
  value?: string | boolean | number | null;
  /** Additional value for "other" option in predefined lists */
  otherValue?: string;
};

// =============================================================================
// FORM AND INPUT TYPES (Client-side)
// =============================================================================

export interface CreateProviderData {
  name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  providerTypeIds: string[];
  serviceIds: string[];
  requirementSubmissions?: Array<{
    requirementTypeId: string;
    notes?: string;
  }>;
}

export interface UpdateProviderData extends Partial<CreateProviderData> {
  id: string;
}

// =============================================================================
// API RESPONSE TYPES (Client-side)
// =============================================================================

export interface ProviderApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// =============================================================================
// CLIENT-ONLY SERVICE TYPE
// =============================================================================

// Enhanced Service interface for client-side use
export interface Service {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  duration: number;
}

// =============================================================================
// DEFAULT CONFIGURATIONS
// =============================================================================

export const getDefaultProviderData = (): Partial<CreateProviderData> => ({
  providerTypeIds: [],
  serviceIds: [],
  requirementSubmissions: [],
});

// =============================================================================
// NOTE ON PRISMA ENUMS
// =============================================================================
//
// The following enums are defined in Prisma schema and should be imported
// directly from '@prisma/client' where needed:
//
// - ProviderStatus (PENDING_APPROVAL, APPROVED, REJECTED, etc.)
// - RequirementsValidationStatus (PENDING, APPROVED, REJECTED)
// - RequirementValidationType (BOOLEAN, DOCUMENT, TEXT, etc.)
// - Languages (English, IsiZulu, IsiXhosa, etc.)
//
// Example usage:
// ```typescript
// import { ProviderStatus, Languages } from '@prisma/client';
// ```
//
// =============================================================================
// NOTE ON SERVER DATA TYPES
// =============================================================================
//
// For all server data (providers, services, requirements, etc.), 
// components should extract types directly from tRPC RouterOutputs:
//
// Example usage in components:
// ```typescript
// import { type RouterOutputs } from '@/utils/api';
// 
// type Provider = RouterOutputs['providers']['getById'];
// type ProviderList = RouterOutputs['providers']['search']['providers'];
// type ServiceDetail = RouterOutputs['providers']['getServices'][number];
// ```
//
// This ensures zero type drift between server and client code.
// =============================================================================