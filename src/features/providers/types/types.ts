import { z } from 'zod';

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
  documentUrl?: string | null;
  documentMetadata?: Record<string, any> | null;
  documentFile?: File; // For file uploads in forms
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
});

export const providerTypeSchema = z.object({
  providerType: z.string().min(1, 'Please select a provider type'),
});

export const regulatoryRequirementsSchema = z.object({
  requirements: z
    .array(
      z.object({
        requirementTypeId: z.string(),
        value: z.any().optional(),
        documentFile: z.any().optional(),
        otherValue: z.string().optional(),
      })
    )
    .min(1, 'Please complete all required regulatory requirements'),
});

export const servicesSchema = z.object({
  availableServices: z.array(z.string()).min(1, 'Please select at least one service'),
  serviceConfigs: z
    .record(
      z.object({
        duration: z.number().min(1).optional(),
        price: z.number().min(0).optional(),
      })
    )
    .optional(),
});

// Combined schema for the entire form
export const providerFormSchema = z.object({
  basicInfo: basicInfoSchema,
  providerType: providerTypeSchema,
  regulatoryRequirements: regulatoryRequirementsSchema,
  services: servicesSchema,
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

// Type for the entire form data
export type ServiceProviderFormType = z.infer<typeof providerFormSchema>;
