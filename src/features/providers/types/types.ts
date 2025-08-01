// =============================================================================
// PROVIDERS FEATURE TYPES
// =============================================================================
// All type definitions for the providers feature in one place
// Domain enums, business logic types, and form schemas only
//
// =============================================================================
// MIGRATION NOTES - SERVER DATA REMOVED
// =============================================================================
//
// Removed server data:
// - All Prisma imports and re-exports
// - Provider aliases and extensions (Provider, ProviderWithRelations)
// - All Prisma GetPayload types (ProviderDetailSelect, etc.)
// - Server data interfaces that extend Prisma types
//
// Components will use tRPC RouterOutputs for server data in Task 4.0

// =============================================================================
// ENUMS
// =============================================================================

// Provider-related enums (matching Prisma schema)
export enum ProviderStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum RequirementSubmissionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// Enum for requirement validation types (matching Prisma schema)
export enum RequirementValidationType {
  BOOLEAN = 'BOOLEAN', // Yes/No or True/False answers
  DOCUMENT = 'DOCUMENT', // Document upload required
  TEXT = 'TEXT', // Free text input
  DATE = 'DATE', // Regular date input
  FUTURE_DATE = 'FUTURE_DATE', // Date that must be in the future (e.g., expiry dates)
  PAST_DATE = 'PAST_DATE', // Date that must be in the past (e.g., graduation date)
  NUMBER = 'NUMBER', // Numeric input
  PREDEFINED_LIST = 'PREDEFINED_LIST', // Selection from a predefined list of options
}

// Enum for requirements validation status (matching Prisma schema)
export enum RequirementsValidationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Supported languages for service providers
 * This should match the Languages enum from the Prisma schema
 */
export const SUPPORTED_LANGUAGES = [
  'English',
  'IsiZulu',
  'IsiXhosa',
  'Afrikaans',
  'Sepedi',
  'Setswana',
  'Sesotho',
  'IsiNdebele',
  'SiSwati',
  'Tshivenda',
  'Xitsonga',
  'Portuguese',
  'French',
  'Hindi',
  'German',
  'Mandarin',
] as const;

/**
 * Type for supported languages
 */
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// =============================================================================
// BASE INTERFACES
// =============================================================================

// Provider-related base interfaces
export interface BasicProviderInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  status: ProviderStatus;
  isActive: boolean;
}

// Types moved from provider-types.ts
export type ProviderTypeData = {
  id: string;
  name: string;
  description: string | null;
};

export type RequirementTypeData = {
  id: string;
  name: string;
  description: string | null;
  validationType: string;
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
// COMPLEX INTERFACES
// =============================================================================

// ProviderWithRelations moved to server data - use tRPC RouterOutputs

// Serialized types (moved from hooks/types.ts)
export interface SerializedService {
  id: string;
  name: string;
  description?: string | null;
  defaultDuration: number | null;
  defaultPrice: number | null;
  displayPriority: number;
  createdAt?: string;
  updatedAt?: string;
  // Fields added by provider services API
  isSelected?: boolean;
  currentPrice?: number | null;
  currentDuration?: number | null;
  hasCustomConfig?: boolean;
  customConfig?: {
    id: string;
    duration: number;
    price: number | null;
    isOnlineAvailable: boolean;
    isInPerson: boolean;
    locationId: string | null;
  };
}

export interface SerializedProvider {
  id: string;
  userId: string;
  name: string;
  bio: string | null;
  image: string | null;
  email: string;
  whatsapp: string | null;
  website: string | null;
  languages: string[];
  showPrice: boolean;
  billingType: string | null;
  status: string;
  providerTypeId: string;
  createdAt: string;
  updatedAt: string;
  services: SerializedService[];
  serviceConfigs?: Array<{
    id: string;
    serviceId: string;
    duration: number;
    price: number;
    isOnlineAvailable: boolean;
    isInPerson: boolean;
    locationId: string | null;
    createdAt: string;
    updatedAt: string;
    service: SerializedService;
  }>;
  providerType: {
    name: string;
    description: string | null;
  };
  requirementSubmissions?: Array<{
    id: string;
    requirementTypeId: string;
    documentUrl: string | null;
    documentMetadata: Record<string, any> | null;
    createdAt: string;
    updatedAt: string;
    status?: RequirementsValidationStatus;
    requirementType?: {
      id: string;
      name: string;
      description: string | null;
      validationType: string;
    };
  }>;
  user: {
    email: string;
  };
}

// =============================================================================
// VALIDATION CONFIGURATION TYPES
// =============================================================================

// Types for validation configurations (moved from hooks/types.ts)
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
  validationType: RequirementValidationType | string;
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
 *
 * @interface RequirementSubmission
 *
 * @example
 * ```typescript
 * // Document submission for medical license
 * const licenseSubmission: RequirementSubmission = {
 *   requirementTypeId: "req-medical-license",
 *   providerId: "provider-123",
 *   status: RequirementsValidationStatus.PENDING,
 *   documentMetadata: {
 *     filename: "medical_license.pdf",
 *     url: "https://storage.example.com/docs/license.pdf",
 *     uploadedAt: "2024-01-15T10:30:00Z"
 *   },
 *   expiresAt: new Date("2025-12-31"),
 *   notes: "Medical license valid through 2025"
 * };
 *
 * // Boolean form submission
 * const consentSubmission: RequirementSubmission = {
 *   requirementTypeId: "req-hipaa-consent",
 *   value: true,
 *   status: RequirementsValidationStatus.APPROVED,
 *   validatedAt: new Date()
 * };
 * ```
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
  documentMetadata?: Record<string, any> | null; // Includes document URLs in the value field
  /** Expiration date for time-sensitive requirements (e.g., licenses) */
  expiresAt?: Date | null;
  /** Additional notes or comments about the submission */
  notes?: string | null;
  /** Timestamp when the submission was validated */
  validatedAt?: Date | null;
  /** ID of the admin user who validated the submission */
  validatedById?: string | null;
  /** Form value for non-document submissions (text, boolean, number) */
  value?: string | boolean | number | null; // For form submissions
  /** Additional value for "other" option in predefined lists */
  otherValue?: string; // For "other" option in predefined lists
};

// =============================================================================
// FORM AND INPUT TYPES
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
// API RESPONSE TYPES
// =============================================================================

export interface ProviderApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type ProviderStatusType = keyof typeof ProviderStatus;
export type RequirementStatusType = keyof typeof RequirementSubmissionStatus;

// =============================================================================
// PROVIDER INVITATION AND CONNECTION TYPES (moved from barrel export)
// =============================================================================

// Server data types moved to tRPC RouterOutputs:
// - ProviderInvitationWithOrganization → Use RouterOutputs['providers']['getProviderInvitations']
// - OrganizationConnectionWithDetails → Use RouterOutputs['providers']['getOrganizationConnections']

// Provider interface moved to server data - use tRPC RouterOutputs

// Enhanced Service interface
export interface Service {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  duration: number;
}

// Prisma re-exports removed - components will use tRPC RouterOutputs

// =============================================================================
// PRISMA CONFIGURATIONS REMOVED
// =============================================================================
//
// Prisma include configurations moved to server actions.
// tRPC procedures will handle data fetching patterns in server layer.

// =============================================================================
// DEFAULT CONFIGURATIONS
// =============================================================================

export const getDefaultProviderData = (): Partial<CreateProviderData> => ({
  providerTypeIds: [],
  serviceIds: [],
  requirementSubmissions: [],
});

// =============================================================================
// PRISMA-DERIVED TYPES REMOVED
// =============================================================================
//
// All Prisma GetPayload types removed:
// - ProviderDetailSelect → Use RouterOutputs['providers']['getProviderDetail']
// - ProviderListSelect → Use RouterOutputs['providers']['getProviders']
// - ProviderBasicSelect → Use RouterOutputs['providers']['getProviderBasic']
// - ServiceDetailSelect → Use RouterOutputs['providers']['getServiceDetail']
// - RequirementSubmissionDetailSelect → Use RouterOutputs['providers']['getRequirementSubmissions']
// - ProviderInvitationDetailSelect → Use RouterOutputs['providers']['getProviderInvitations']
//
// Components will extract types directly from tRPC RouterOutputs in Task 4.0
