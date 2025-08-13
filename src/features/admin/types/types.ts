// =============================================================================
// ADMIN FEATURE TYPES
// =============================================================================
// All type definitions for the admin feature in one place
// Organized by: Enums -> Base Interfaces -> Complex Interfaces -> Utility Types
// =============================================================================
// PRISMA TYPE IMPORTS
// =============================================================================
// Import database enums directly from Prisma to prevent type drift
import {
  OrganizationStatus,
  ProviderStatus,
  RequirementsValidationStatus,
  UserRole,
} from '@prisma/client';

// =============================================================================
// DOMAIN-SPECIFIC ENUMS (Not in Prisma)
// =============================================================================

export enum AdminAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  SUSPEND = 'SUSPEND',
}

export enum ApprovalEntityType {
  PROVIDER = 'PROVIDER',
  ORGANIZATION = 'ORGANIZATION',
  REQUIREMENT = 'REQUIREMENT',
}

// =============================================================================
// BASE INTERFACES AND TYPES
// =============================================================================

// Basic Admin Action Types
export type AdminActionType = 'APPROVE' | 'REJECT' | 'SUSPEND';

// Approval status type that handles both Provider and Organization statuses
// Note: Using union type since admin can approve both providers and organizations
export type ApprovalStatus = ProviderStatus | OrganizationStatus;

// Specific approval statuses for filtering (common values across provider and organization)
export type AdminFilterStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

// API Response Types
export interface AdminApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AdminApiErrorResponse {
  error: string;
  unapprovedRequirements?: Array<{
    id: string;
    name: string;
    status: string;
  }>;
}

// Request Body Types
export interface ApproveProviderRequest {
  // Currently no additional data needed
}

export interface RejectProviderRequest {
  reason: string;
}

export interface ApproveOrganizationRequest {
  // Currently no additional data needed
}

export interface RejectOrganizationRequest {
  reason: string;
}

export interface ApproveRequirementRequest {
  // Currently no additional data needed
}

export interface RejectRequirementRequest {
  reason: string;
}

// Form Data Types
export interface RejectionFormData {
  reason: string;
}

export interface ApprovalFormData {
  // Currently empty but typed for future extensions
}

// Server Action Result Types
export interface ServerActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export type ApproveProviderAction = (providerId: string) => Promise<ServerActionResult>;
export type SuspendProviderAction = (providerId: string) => Promise<ServerActionResult>;
export type DeleteProviderAction = (providerId: string) => Promise<ServerActionResult>;
export type RejectProviderAction = (
  providerId: string,
  reason: string
) => Promise<ServerActionResult>;
export type ApproveOrganizationAction = (organizationId: string) => Promise<ServerActionResult>;
export type RejectOrganizationAction = (
  organizationId: string,
  reason: string
) => Promise<ServerActionResult>;
export type ApproveRequirementAction = (requirementId: string) => Promise<ServerActionResult>;
export type RejectRequirementAction = (
  requirementId: string,
  reason: string
) => Promise<ServerActionResult>;

// Dashboard Data Types
// Note: Using Prisma enum values as keys for count aggregation
export interface AdminProviderCounts {
  [ProviderStatus.PENDING_APPROVAL]: number;
  [ProviderStatus.APPROVED]: number;
  [ProviderStatus.REJECTED]: number;
  total: number;
}

export interface AdminOrganizationCounts {
  [OrganizationStatus.PENDING_APPROVAL]: number;
  [OrganizationStatus.APPROVED]: number;
  [OrganizationStatus.REJECTED]: number;
  total: number;
}

export interface AdminDashboardData {
  providerCounts: AdminProviderCounts;
  organizationCounts: AdminOrganizationCounts;
}

// List Filter Types
export interface AdminListFilters {
  status?: AdminFilterStatus;
  search?: string;
}

// Route Parameter Types
export interface AdminRouteParams {
  id: string;
}

export interface AdminRequirementRouteParams {
  id: string;
  requirementId: string;
}

export interface AdminSearchParams {
  status?: AdminFilterStatus;
}

// Page Props Types
export interface AdminProvidersPageProps {
  searchParams: AdminSearchParams;
}

export interface AdminProviderDetailPageProps {
  params: AdminRouteParams;
}

export interface AdminOrganizationsPageProps {
  searchParams: AdminSearchParams;
}

export interface AdminOrganizationDetailPageProps {
  params: AdminRouteParams;
}

// Component Props Types (using tRPC types, not manual interfaces)
// These will be migrated to use RouterOutputs extraction in Task 4.0

export interface ApprovalButtonsProps {
  entityType: ApprovalEntityType;
  entityId: string;
  currentStatus: ApprovalStatus;
  onApprove?: () => void;
  onReject?: () => void;
  disabled?: boolean;
}

export interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReject: (reason: string) => void;
  entityType: ApprovalEntityType;
  entityName?: string;
  isLoading?: boolean;
}

// =============================================================================
// MIGRATION NOTES
// =============================================================================
//
// ✅ TASK 3.2 COMPLETE: Prisma Type Import Migration
//
// REMOVED duplicate enums (now using Prisma imports):
// - AdminApprovalStatus → Use ApprovalStatus (union of ProviderStatus | OrganizationStatus)
// - AdminProviderStatus → Use ProviderStatus from @prisma/client
// - AdminOrganizationStatus → Use OrganizationStatus from @prisma/client
// - RequirementValidationStatus → Use RequirementsValidationStatus from @prisma/client
//
// KEPT domain-specific enums (not in Prisma):
// - AdminAction (UI-specific approval actions)
// - ApprovalEntityType (UI-specific entity categorization)
//
// All server data types, hook interfaces, and API client interfaces have been
// removed from this manual type file as part of the dual-source type safety
// architecture migration.
//
// These will be replaced with:
// - tRPC RouterOutputs for server data (Task 6.0 component migration)
// - Hook return types inferred from tRPC hooks (Task 5.0 hook migration)
// - Direct tRPC client usage instead of manual API client interfaces
//
// Domain logic types (enums, form data, request types, route params) remain
// in this file as they represent client-side business logic, not server data.
