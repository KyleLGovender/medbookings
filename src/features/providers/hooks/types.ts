import { z } from 'zod';

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

/**
 * Type for serialized Service
 */
export interface SerializedService {
  id: string;
  name: string;
  description?: string | null;
  defaultDuration: number | null;
  defaultPrice: number | null;
  displayPriority: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Type for serialized ServiceProvider
 */
export interface SerializedServiceProvider {
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
  serviceProviderTypeId: string;
  createdAt: string;
  updatedAt: string;
  services: SerializedService[];
  serviceProviderType: {
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
  validationType: RequirementValidationType | string;
  isRequired: boolean;
  validationConfig?: ValidationConfig;
  displayPriority?: number;
  index: number;
  existingSubmission?: {
    documentUrl: string | null;
    documentMetadata: Record<string, any> | null;
  };
};

// Type for requirement submission
export type RequirementSubmission = {
  id?: string;
  requirementTypeId: string;
  serviceProviderId?: string;
  status?: RequirementsValidationStatus;
  documentMetadata?: Record<string, any> | null; // Includes document URLs in the value field
  expiresAt?: Date | null;
  notes?: string | null;
  validatedAt?: Date | null;
  validatedById?: string | null;
  value?: string | boolean | number | null; // For form submissions
  otherValue?: string; // For "other" option in predefined lists
};

// Zod schemas for form validation
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

// No longer needed as we're validating serviceProviderTypeId directly at the root level
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
  serviceProviderTypeIds: z.array(z.string()).min(1, 'Please select at least one provider type'),
  // Keep the old single field for backward compatibility
  serviceProviderTypeId: z.string().optional(),
  regulatoryRequirements: regulatoryRequirementsSchema,
  services: servicesSchema,
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

// Type for the entire form data
export type ServiceProviderFormType = z.infer<typeof providerFormSchema>;
