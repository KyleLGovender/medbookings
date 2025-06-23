# Admin Approval Workflow System - Implementation Tasks

Based on the PRD: `prd-admin-approval-workflow.md`

**Implementation Strategy**: MVP development in one night (6-8 hours)

## Relevant Files

- `src/app/api/admin/providers/route.ts` - API route for fetching providers with approval status filtering
- `src/app/api/admin/providers/[id]/route.ts` - API route for fetching individual provider details with requirements
- `src/app/api/admin/providers/[id]/approve/route.ts` - API route for overall provider approval
- `src/app/api/admin/providers/[id]/reject/route.ts` - API route for overall provider rejection
- `src/app/api/admin/providers/[id]/requirements/[reqId]/approve/route.ts` - API route for individual requirement approval
- `src/app/api/admin/providers/[id]/requirements/[reqId]/reject/route.ts` - API route for individual requirement rejection
- `src/app/api/admin/organizations/route.ts` - API route for fetching organizations with approval status filtering
- `src/app/api/admin/organizations/[id]/route.ts` - API route for fetching individual organization details
- `src/app/api/admin/organizations/[id]/approve/route.ts` - API route for organization approval
- `src/app/api/admin/organizations/[id]/reject/route.ts` - API route for organization rejection
- `src/features/admin/lib/actions/approve-provider.ts` - Server actions for provider approval workflow
- `src/features/admin/lib/actions/approve-organization.ts` - Server actions for organization approval workflow
- `src/features/admin/hooks/useAdminProviders.ts` - Custom hook for fetching providers with admin context
- `src/features/admin/hooks/useAdminOrganizations.ts` - Custom hook for fetching organizations with admin context
- `src/features/admin/hooks/useApproveProvider.ts` - Custom hook for provider approval mutations
- `src/features/admin/hooks/useApproveOrganization.ts` - Custom hook for organization approval mutations
- `src/features/admin/components/dashboard/admin-dashboard.tsx` - Main admin dashboard component
- `src/features/admin/components/providers/provider-list.tsx` - Provider list component with approval controls
- `src/features/admin/components/providers/provider-detail.tsx` - Provider detail view with requirement approval
- `src/features/admin/components/organizations/organization-list.tsx` - Organization list component with approval controls
- `src/features/admin/components/organizations/organization-detail.tsx` - Organization detail view with approval controls
- `src/features/admin/components/ui/approval-button.tsx` - Reusable approval button component
- `src/features/admin/components/ui/rejection-modal.tsx` - Modal for rejection with feedback
- `src/features/admin/components/ui/status-badge.tsx` - Status badge component for approval states
- `src/app/(dashboard)/admin/page.tsx` - Admin dashboard page route
- `src/app/(dashboard)/admin/providers/page.tsx` - Admin providers list page route
- `src/app/(dashboard)/admin/providers/[id]/page.tsx` - Admin provider detail page route
- `src/app/(dashboard)/admin/organizations/page.tsx` - Admin organizations list page route
- `src/app/(dashboard)/admin/organizations/[id]/page.tsx` - Admin organization detail page route
- `src/features/admin/index.ts` - Feature module exports

### Notes

- Leverage existing TanStack Query patterns and API route structure
- Extend existing `administer-provider.ts` functions instead of creating from scratch
- Reuse existing UI components and styling patterns
- Console log all communication actions for future email integration
- Focus on MVP functionality - no bulk operations or advanced filtering

## Tasks

- [x] 1.0 Setup Admin Infrastructure and API Routes

  - [x] 1.1 Create admin feature module structure (`src/features/admin/`)
  - [x] 1.2 Create admin API routes for provider data (`/api/admin/providers/`)
  - [x] 1.3 Create admin API routes for organization data (`/api/admin/organizations/`)
  - [x] 1.4 Create provider approval API endpoints (`approve`, `reject`, `requirements/approve`)
  - [x] 1.5 Create organization approval API endpoints (`approve`, `reject`)
  - [x] 1.6 Create admin dashboard page routes (`/admin`, `/admin/providers`, `/admin/organizations`)

- [x] 2.0 Implement Provider Approval Workflow

  - [x] 2.1 Extend existing `administer-provider.ts` with requirement-specific approval functions
  - [x] 2.2 Create server actions for individual requirement approval/rejection
  - [x] 2.3 Implement overall provider approval logic (requires all requirements approved)
  - [x] 2.4 Add console logging for all provider approval communications
  - [x] 2.5 Create custom hooks for provider approval mutations (`useApproveProvider`)
  - [x] 2.6 Create custom hooks for fetching admin provider data (`useAdminProviders`)

- [ ] 3.0 Implement Organization Approval Workflow

  - [ ] 3.1 Create server actions for organization approval/rejection workflow
  - [ ] 3.2 Implement organization approval logic with rejection feedback
  - [ ] 3.3 Add console logging for all organization approval communications
  - [ ] 3.4 Create custom hooks for organization approval mutations (`useApproveOrganization`)
  - [ ] 3.5 Create custom hooks for fetching admin organization data (`useAdminOrganizations`)

- [ ] 4.0 Build Admin Dashboard UI

  - [ ] 4.1 Create main admin dashboard with summary cards (pending/approved/rejected counts)
  - [ ] 4.2 Build provider list component with status indicators and approval buttons
  - [ ] 4.3 Build provider detail component with individual requirement approval interface
  - [ ] 4.4 Build organization list component with status indicators and approval buttons
  - [ ] 4.5 Build organization detail component with approval interface
  - [ ] 4.6 Create reusable UI components (approval buttons, status badges, rejection modal)
  - [ ] 4.7 Implement rejection modal with feedback text input

- [ ] 5.0 Integration, Testing, and Access Control
  - [ ] 5.1 Implement admin role-based access control (ADMIN/SUPER_ADMIN only)
  - [ ] 5.2 Add admin navigation to existing dashboard layout
  - [ ] 5.3 Test provider approval workflow end-to-end
  - [ ] 5.4 Test organization approval workflow end-to-end
  - [ ] 5.5 Verify console logging for all approval actions
  - [ ] 5.6 Test unauthorized access protection
  - [ ] 5.7 Manual testing of all approval states and transitions
