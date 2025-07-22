// Types and schemas moved to centralized location
// Import all types from the centralized providers types
export {
  SUPPORTED_LANGUAGES,
  RequirementValidationType,
  RequirementsValidationStatus,
  type SupportedLanguage,
  type SerializedService,
  type SerializedProvider,
  type ValidationConfigBase,
  type BooleanValidationConfig,
  type DocumentValidationConfig,
  type TextValidationConfig,
  type DateValidationConfig,
  type NumberValidationConfig,
  type PredefinedListValidationConfig,
  type ValidationConfig,
  type RequirementType,
  type RequirementSubmission,
} from '@/features/providers/types/types';

// Import schemas from centralized location
export {
  basicInfoSchema,
  providerTypeSchema,
  regulatoryRequirementsSchema,
  servicesSchema,
  providerFormSchema,
  type ProviderFormType,
} from '@/features/providers/types/schemas';
