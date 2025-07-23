// =============================================================================
// PROVIDERS FEATURE TYPES
// =============================================================================
// All type definitions for the providers feature in one place
// Organized by: Enums -> Base Interfaces -> Complex Interfaces -> Utility Types
import {
  ConnectionStatus,
  OrganizationProviderConnection,
  Prisma,
  ProviderInvitation,
  ProviderInvitationStatus,
  Provider as PrismaProvider,
  ProviderType,
  RequirementType as PrismaRequirementType,
  RequirementSubmission as PrismaRequirementSubmission,
  Service as PrismaService,
  User,
  Organization,
} from '@prisma/client';

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

// Provider with full relations
export interface ProviderWithRelations extends Provider {
  user: User;
  typeAssignments: Array<{
    id: string;
    providerType: ProviderTypeInfo;
  }>;
  services: ServiceInfo[];
  requirementSubmissions: Array<{
    id: string;
    status: RequirementSubmissionStatus;
    notes?: string;
    validatedAt?: Date;
    requirementType: PrismaRequirementType;
    validatedBy?: User;
  }>;
  approvedBy?: User;
}

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
  };
};

// Type for requirement submission
export type RequirementSubmission = {
  id?: string;
  requirementTypeId: string;
  providerId?: string;
  status?: RequirementsValidationStatus;
  documentMetadata?: Record<string, any> | null; // Includes document URLs in the value field
  expiresAt?: Date | null;
  notes?: string | null;
  validatedAt?: Date | null;
  validatedById?: string | null;
  value?: string | boolean | number | null; // For form submissions
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

// Provider invitation types
export type ProviderInvitationWithOrganization = ProviderInvitation & {
  organization: Organization;
  invitedBy?: {
    name: string | null;
    email: string;
  } | null;
  connection?: {
    id: string;
    status: ConnectionStatus;
    acceptedAt: Date | null;
  } | null;
};

export type OrganizationConnectionWithDetails = OrganizationProviderConnection & {
  organization: Organization;
  invitation?: {
    id: string;
    customMessage: string | null;
    createdAt: Date;
    invitedBy: {
      name: string | null;
      email: string;
    } | null;
  } | null;
};

// Enhanced Provider interface
export interface Provider extends PrismaProvider {
  showPrice: boolean; // Whether to display prices to patients looking to book
}

// Enhanced Service interface
export interface Service {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  duration: number;
}

// Re-export Prisma types for convenience
export type {
  ConnectionStatus,
  OrganizationProviderConnection,
  ProviderInvitation,
  ProviderInvitationStatus,
};

// =============================================================================
// PRISMA INCLUDE CONFIGURATIONS
// =============================================================================

// Helper configuration for including provider relations
export const includeProviderRelations = {
  user: true,
  typeAssignments: {
    include: {
      providerType: true,
    },
  },
  services: true,
  requirementSubmissions: {
    include: {
      requirementType: true,
      validatedBy: true,
    },
  },
  approvedBy: true,
};

// =============================================================================
// DEFAULT CONFIGURATIONS
// =============================================================================

export const getDefaultProviderData = (): Partial<CreateProviderData> => ({
  providerTypeIds: [],
  serviceIds: [],
  requirementSubmissions: [],
});

// =============================================================================
// PRISMA-DERIVED TYPES
// =============================================================================

// Provider with comprehensive relations for detailed views
export type ProviderDetailSelect = Prisma.ProviderGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        email: true;
        phone: true;
        whatsapp: true;
        image: true;
        role: true;
      };
    };
    typeAssignments: {
      include: {
        providerType: {
          select: {
            id: true;
            name: true;
            description: true;
            category: true;
            isActive: true;
          };
        };
      };
    };
    services: {
      include: {
        providerType: {
          select: {
            id: true;
            name: true;
            category: true;
            description: true;
          };
        };
      };
    };
    requirementSubmissions: {
      include: {
        requirementType: {
          select: {
            id: true;
            name: true;
            description: true;
            category: true;
            isRequired: true;
            allowedFileTypes: true;
            maxFileSize: true;
          };
        };
        validatedBy: {
          select: {
            id: true;
            name: true;
            email: true;
          };
        };
      };
    };
    organizationConnections: {
      include: {
        organization: {
          select: {
            id: true;
            name: true;
            email: true;
            status: true;
          };
        };
      };
    };
    approvedBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    subscriptions: {
      include: {
        plan: {
          select: {
            id: true;
            name: true;
            basePrice: true;
            currency: true;
            interval: true;
            includedSlots: true;
          };
        };
      };
    };
  };
}>;

// Provider for list views (minimal relations)
export type ProviderListSelect = Prisma.ProviderGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        email: true;
        image: true;
      };
    };
    typeAssignments: {
      include: {
        providerType: {
          select: {
            id: true;
            name: true;
          };
        };
      };
    };
    _count: {
      select: {
        services: true;
        requirementSubmissions: true;
        organizationConnections: true;
      };
    };
  };
}>;

// Provider with basic info for dropdowns and selectors
export type ProviderBasicSelect = Prisma.ProviderGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    typeAssignments: {
      include: {
        providerType: {
          select: {
            name: true;
          };
        };
      };
    };
  };
}>;

// Service with relations for provider service management
export type ServiceDetailSelect = Prisma.ServiceGetPayload<{
  include: {
    providerType: {
      select: {
        id: true;
        name: true;
        category: true;
        description: true;
      };
    };
    providers: {
      include: {
        user: {
          select: {
            id: true;
            name: true;
          };
        };
      };
    };
    availabilityConfigs: {
      select: {
        id: true;
        duration: true;
        price: true;
        isOnlineAvailable: true;
        locationId: true;
      };
    };
  };
}>;

// Requirement submission with relations for compliance tracking
export type RequirementSubmissionDetailSelect = Prisma.RequirementSubmissionGetPayload<{
  include: {
    requirementType: {
      select: {
        id: true;
        name: true;
        description: true;
        category: true;
        isRequired: true;
        allowedFileTypes: true;
        maxFileSize: true;
        displayPriority: true;
      };
    };
    provider: {
      include: {
        user: {
          select: {
            id: true;
            name: true;
            email: true;
          };
        };
      };
    };
    validatedBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
  };
}>;

// Provider invitation with relations
export type ProviderInvitationDetailSelect = Prisma.ProviderInvitationGetPayload<{
  include: {
    organization: {
      select: {
        id: true;
        name: true;
        email: true;
        description: true;
        logo: true;
        website: true;
      };
    };
    invitedBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
  };
}>;