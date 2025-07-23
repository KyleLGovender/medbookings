// =============================================================================
// PROVIDERS FEATURE TYPE GUARDS
// =============================================================================
// Runtime type validation for provider-specific types and API responses

import { isValidDate, isValidDateString, isValidEmail, isValidPhone, isValidUUID } from '@/types/guards';

// =============================================================================
// ENUM GUARDS
// =============================================================================

export function isProviderStatus(value: unknown): value is 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' {
  return (
    typeof value === 'string' &&
    ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED'].includes(value)
  );
}

export function isRequirementSubmissionStatus(value: unknown): value is 'PENDING' | 'APPROVED' | 'REJECTED' {
  return (
    typeof value === 'string' &&
    ['PENDING', 'APPROVED', 'REJECTED'].includes(value)
  );
}

export function isRequirementValidationType(value: unknown): value is 'BOOLEAN' | 'DOCUMENT' | 'TEXT' | 'DATE' | 'FUTURE_DATE' | 'PAST_DATE' | 'NUMBER' | 'PREDEFINED_LIST' {
  return (
    typeof value === 'string' &&
    ['BOOLEAN', 'DOCUMENT', 'TEXT', 'DATE', 'FUTURE_DATE', 'PAST_DATE', 'NUMBER', 'PREDEFINED_LIST'].includes(value)
  );
}

export function isSupportedLanguage(value: unknown): value is string {
  const supportedLanguages = [
    'English', 'IsiZulu', 'IsiXhosa', 'Afrikaans', 'Sepedi', 'Setswana',
    'Sesotho', 'IsiNdebele', 'SiSwati', 'Tshivenda', 'Xitsonga',
    'Portuguese', 'French', 'Hindi', 'German', 'Mandarin'
  ];
  return (
    typeof value === 'string' &&
    supportedLanguages.includes(value)
  );
}

// =============================================================================
// PROVIDER CREATION AND UPDATE GUARDS
// =============================================================================

export function isValidCreateProviderData(value: unknown): value is {
  name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  providerTypeIds: string[];
  serviceIds: string[];
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'email' in value &&
    'providerTypeIds' in value &&
    'serviceIds' in value &&
    typeof (value as any).name === 'string' &&
    (value as any).name.length > 0 &&
    isValidEmail((value as any).email) &&
    Array.isArray((value as any).providerTypeIds) &&
    (value as any).providerTypeIds.every((id: unknown) => isValidUUID(id)) &&
    Array.isArray((value as any).serviceIds) &&
    (value as any).serviceIds.every((id: unknown) => isValidUUID(id)) &&
    (!(value as any).phone || isValidPhone((value as any).phone)) &&
    (!(value as any).whatsapp || isValidPhone((value as any).whatsapp))
  );
}

export function isValidUpdateProviderData(value: unknown): value is {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  status?: string;
  bio?: string;
  website?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    isValidUUID((value as any).id) &&
    (!(value as any).name || (typeof (value as any).name === 'string' && (value as any).name.length > 0)) &&
    (!(value as any).email || isValidEmail((value as any).email)) &&
    (!(value as any).phone || isValidPhone((value as any).phone)) &&
    (!(value as any).whatsapp || isValidPhone((value as any).whatsapp)) &&
    (!(value as any).status || isProviderStatus((value as any).status)) &&
    (!(value as any).bio || typeof (value as any).bio === 'string') &&
    (!(value as any).website || typeof (value as any).website === 'string')
  );
}

// =============================================================================
// REQUIREMENT SUBMISSION GUARDS
// =============================================================================

export function isValidRequirementSubmission(value: unknown): value is {
  requirementTypeId: string;
  providerId?: string;
  status?: string;
  documentMetadata?: Record<string, any> | null;
  value?: string | boolean | number | null;
  notes?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'requirementTypeId' in value &&
    isValidUUID((value as any).requirementTypeId) &&
    (!(value as any).providerId || isValidUUID((value as any).providerId)) &&
    (!(value as any).status || isRequirementSubmissionStatus((value as any).status)) &&
    (!(value as any).documentMetadata || 
      ((value as any).documentMetadata === null || typeof (value as any).documentMetadata === 'object')) &&
    (!(value as any).notes || typeof (value as any).notes === 'string')
  );
}

export function isValidRequirementType(value: unknown): value is {
  id: string;
  name: string;
  description?: string | null;
  validationType: string;
  isRequired: boolean;
  validationConfig?: Record<string, any>;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'validationType' in value &&
    'isRequired' in value &&
    isValidUUID((value as any).id) &&
    typeof (value as any).name === 'string' &&
    (value as any).name.length > 0 &&
    isRequirementValidationType((value as any).validationType) &&
    typeof (value as any).isRequired === 'boolean' &&
    (!(value as any).description || 
      ((value as any).description === null || typeof (value as any).description === 'string')) &&
    (!(value as any).validationConfig || typeof (value as any).validationConfig === 'object')
  );
}

// =============================================================================
// SERVICE CONFIGURATION GUARDS
// =============================================================================

export function isValidServiceData(value: unknown): value is {
  id: string;
  name: string;
  description?: string | null;
  defaultDuration?: number | null;
  defaultPrice?: number | null;
  displayPriority: number;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'displayPriority' in value &&
    isValidUUID((value as any).id) &&
    typeof (value as any).name === 'string' &&
    (value as any).name.length > 0 &&
    typeof (value as any).displayPriority === 'number' &&
    (!(value as any).description || 
      ((value as any).description === null || typeof (value as any).description === 'string')) &&
    (!(value as any).defaultDuration || 
      ((value as any).defaultDuration === null || 
       (typeof (value as any).defaultDuration === 'number' && (value as any).defaultDuration > 0))) &&
    (!(value as any).defaultPrice || 
      ((value as any).defaultPrice === null || 
       (typeof (value as any).defaultPrice === 'number' && (value as any).defaultPrice >= 0)))
  );
}

export function isValidProviderTypeData(value: unknown): value is {
  id: string;
  name: string;
  description?: string | null;
  category?: string;
  displayPriority?: number;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    isValidUUID((value as any).id) &&
    typeof (value as any).name === 'string' &&
    (value as any).name.length > 0 &&
    (!(value as any).description || 
      ((value as any).description === null || typeof (value as any).description === 'string')) &&
    (!(value as any).category || typeof (value as any).category === 'string') &&
    (!(value as any).displayPriority || typeof (value as any).displayPriority === 'number')
  );
}

// =============================================================================
// INVITATION AND CONNECTION GUARDS
// =============================================================================

export function isValidProviderInvitation(value: unknown): value is {
  id: string;
  email: string;
  status: string;
  organizationId: string;
  customMessage?: string;
  expiresAt: string;
  invitedById?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value &&
    'status' in value &&
    'organizationId' in value &&
    'expiresAt' in value &&
    isValidUUID((value as any).id) &&
    isValidEmail((value as any).email) &&
    typeof (value as any).status === 'string' &&
    isValidUUID((value as any).organizationId) &&
    isValidDateString((value as any).expiresAt) &&
    (!(value as any).customMessage || typeof (value as any).customMessage === 'string') &&
    (!(value as any).invitedById || isValidUUID((value as any).invitedById))
  );
}

export function isValidProviderConnection(value: unknown): value is {
  id: string;
  providerId: string;
  organizationId: string;
  status: string;
  acceptedAt?: string | null;
  suspendedAt?: string | null;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'providerId' in value &&
    'organizationId' in value &&
    'status' in value &&
    isValidUUID((value as any).id) &&
    isValidUUID((value as any).providerId) &&
    isValidUUID((value as any).organizationId) &&
    typeof (value as any).status === 'string' &&
    (!(value as any).acceptedAt || 
      ((value as any).acceptedAt === null || isValidDateString((value as any).acceptedAt))) &&
    (!(value as any).suspendedAt || 
      ((value as any).suspendedAt === null || isValidDateString((value as any).suspendedAt)))
  );
}

// =============================================================================
// VALIDATION CONFIGURATION GUARDS
// =============================================================================

export function isValidBooleanValidationConfig(value: unknown): value is {
  trueLabel?: string;
  falseLabel?: string;
  defaultValue?: boolean | null;
  helpText?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    (!(value as any).trueLabel || typeof (value as any).trueLabel === 'string') &&
    (!(value as any).falseLabel || typeof (value as any).falseLabel === 'string') &&
    (!(value as any).defaultValue || 
      ((value as any).defaultValue === null || typeof (value as any).defaultValue === 'boolean')) &&
    (!(value as any).helpText || typeof (value as any).helpText === 'string')
  );
}

export function isValidDocumentValidationConfig(value: unknown): value is {
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  requiredFileFormat?: string;
  helpText?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    (!(value as any).acceptedFileTypes || (
      Array.isArray((value as any).acceptedFileTypes) &&
      (value as any).acceptedFileTypes.every((type: unknown) => typeof type === 'string')
    )) &&
    (!(value as any).maxFileSize || 
      (typeof (value as any).maxFileSize === 'number' && (value as any).maxFileSize > 0)) &&
    (!(value as any).requiredFileFormat || typeof (value as any).requiredFileFormat === 'string') &&
    (!(value as any).helpText || typeof (value as any).helpText === 'string')
  );
}

export function isValidTextValidationConfig(value: unknown): value is {
  minLength?: number;
  maxLength?: number;
  regex?: string;
  regexErrorMessage?: string;
  helpText?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    (!(value as any).minLength || 
      (typeof (value as any).minLength === 'number' && (value as any).minLength >= 0)) &&
    (!(value as any).maxLength || 
      (typeof (value as any).maxLength === 'number' && (value as any).maxLength > 0)) &&
    (!(value as any).regex || typeof (value as any).regex === 'string') &&
    (!(value as any).regexErrorMessage || typeof (value as any).regexErrorMessage === 'string') &&
    (!(value as any).helpText || typeof (value as any).helpText === 'string')
  );
}

// =============================================================================
// API RESPONSE GUARDS
// =============================================================================

export function isProviderListResponse(value: unknown): value is Array<{
  id: string;
  status: string;
  user: { name: string; email: string };
  typeAssignments: Array<{ providerType: { name: string } }>;
}> {
  return (
    Array.isArray(value) &&
    value.every((item: unknown) =>
      typeof item === 'object' &&
      item !== null &&
      'id' in item &&
      'status' in item &&
      'user' in item &&
      'typeAssignments' in item &&
      isValidUUID((item as any).id) &&
      isProviderStatus((item as any).status) &&
      typeof (item as any).user === 'object' &&
      (item as any).user !== null &&
      'name' in (item as any).user &&
      'email' in (item as any).user &&
      typeof (item as any).user.name === 'string' &&
      isValidEmail((item as any).user.email) &&
      Array.isArray((item as any).typeAssignments)
    )
  );
}

export function isServiceListResponse(value: unknown): value is Array<{
  id: string;
  name: string;
  description?: string;
  defaultDuration?: number;
  defaultPrice?: number;
}> {
  return (
    Array.isArray(value) &&
    value.every((item: unknown) =>
      typeof item === 'object' &&
      item !== null &&
      'id' in item &&
      'name' in item &&
      isValidUUID((item as any).id) &&
      typeof (item as any).name === 'string' &&
      (!(item as any).description || typeof (item as any).description === 'string') &&
      (!(item as any).defaultDuration || typeof (item as any).defaultDuration === 'number') &&
      (!(item as any).defaultPrice || typeof (item as any).defaultPrice === 'number')
    )
  );
}

export function isRequirementSubmissionListResponse(value: unknown): value is Array<{
  id: string;
  status: string;
  requirementType: { name: string; validationType: string };
  documentMetadata?: Record<string, any> | null;
}> {
  return (
    Array.isArray(value) &&
    value.every((item: unknown) =>
      typeof item === 'object' &&
      item !== null &&
      'id' in item &&
      'status' in item &&
      'requirementType' in item &&
      isValidUUID((item as any).id) &&
      isRequirementSubmissionStatus((item as any).status) &&
      typeof (item as any).requirementType === 'object' &&
      (item as any).requirementType !== null &&
      'name' in (item as any).requirementType &&
      'validationType' in (item as any).requirementType &&
      typeof (item as any).requirementType.name === 'string' &&
      isRequirementValidationType((item as any).requirementType.validationType)
    )
  );
}

// =============================================================================
// SEARCH AND FILTER GUARDS
// =============================================================================

export function isValidProviderSearchParams(value: unknown): value is {
  name?: string;
  email?: string;
  status?: string;
  providerTypeIds?: string[];
  serviceIds?: string[];
  organizationId?: string;
  locationId?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    (!(value as any).name || typeof (value as any).name === 'string') &&
    (!(value as any).email || typeof (value as any).email === 'string') &&
    (!(value as any).status || isProviderStatus((value as any).status)) &&
    (!(value as any).providerTypeIds || (
      Array.isArray((value as any).providerTypeIds) &&
      (value as any).providerTypeIds.every((id: unknown) => isValidUUID(id))
    )) &&
    (!(value as any).serviceIds || (
      Array.isArray((value as any).serviceIds) &&
      (value as any).serviceIds.every((id: unknown) => isValidUUID(id))
    )) &&
    (!(value as any).organizationId || isValidUUID((value as any).organizationId)) &&
    (!(value as any).locationId || isValidUUID((value as any).locationId))
  );
}

export function isValidServiceSearchParams(value: unknown): value is {
  name?: string;
  category?: string;
  providerTypeIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    (!(value as any).name || typeof (value as any).name === 'string') &&
    (!(value as any).category || typeof (value as any).category === 'string') &&
    (!(value as any).providerTypeIds || (
      Array.isArray((value as any).providerTypeIds) &&
      (value as any).providerTypeIds.every((id: unknown) => isValidUUID(id))
    )) &&
    (!(value as any).minPrice || 
      (typeof (value as any).minPrice === 'number' && (value as any).minPrice >= 0)) &&
    (!(value as any).maxPrice || 
      (typeof (value as any).maxPrice === 'number' && (value as any).maxPrice >= 0)) &&
    (!(value as any).minDuration || 
      (typeof (value as any).minDuration === 'number' && (value as any).minDuration > 0)) &&
    (!(value as any).maxDuration || 
      (typeof (value as any).maxDuration === 'number' && (value as any).maxDuration > 0))
  );
}