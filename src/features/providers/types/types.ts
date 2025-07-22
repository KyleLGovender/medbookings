// =============================================================================
// PROVIDERS FEATURE TYPES
// =============================================================================
// All type definitions for the providers feature in one place
// Organized by: Enums -> Base Interfaces -> Complex Interfaces -> Utility Types
import {
  Provider,
  ProviderType,
  RequirementType,
  RequirementSubmission,
  Service,
  User,
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
    requirementType: RequirementType;
    validatedBy?: User;
  }>;
  approvedBy?: User;
}

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