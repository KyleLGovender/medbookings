// =============================================================================
// ADMIN FEATURE TYPES
// =============================================================================
// All type definitions for the admin feature in one place
// Organized by: Enums -> Base Interfaces -> Complex Interfaces -> Utility Types

// =============================================================================
// ENUMS
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

export enum AdminApprovalStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum AdminProviderStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  TRIAL = 'TRIAL',
  TRIAL_EXPIRED = 'TRIAL_EXPIRED',
  ACTIVE = 'ACTIVE',
  PAYMENT_OVERDUE = 'PAYMENT_OVERDUE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
}

export enum AdminOrganizationStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  TRIAL = 'TRIAL',
  TRIAL_EXPIRED = 'TRIAL_EXPIRED',
  ACTIVE = 'ACTIVE',
  PAYMENT_OVERDUE = 'PAYMENT_OVERDUE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
}

export enum RequirementValidationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// =============================================================================
// BASE INTERFACES AND TYPES
// =============================================================================

// Basic Admin Action Types
export type AdminActionType = 'APPROVE' | 'REJECT' | 'SUSPEND';
export type ApprovalStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

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
export interface AdminProviderCounts {
  PENDING_APPROVAL: number;
  APPROVED: number;
  REJECTED: number;
  total: number;
}

export interface AdminOrganizationCounts {
  PENDING_APPROVAL: number;
  APPROVED: number;
  REJECTED: number;
  total: number;
}

export interface AdminDashboardData {
  providerCounts: AdminProviderCounts;
  organizationCounts: AdminOrganizationCounts;
}

// List Filter Types
export interface AdminListFilters {
  status?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
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
  status?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
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
// All server data types, hook interfaces, and API client interfaces have been
// removed from this manual type file as part of the dual-source type safety
// architecture migration.
//
// These will be replaced with:
// - tRPC RouterOutputs for server data (Task 4.0 component migration)
// - Hook return types inferred from tRPC hooks (Task 3.0 hook migration)
// - Direct tRPC client usage instead of manual API client interfaces
//
// Domain logic types (enums, form data, request types, route params) remain
// in this file as they represent client-side business logic, not server data.
