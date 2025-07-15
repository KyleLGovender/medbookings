# Product Requirements Document: Admin Approval Workflow System (MVP)

## Introduction/Overview

The Admin Approval Workflow System MVP enables administrators to review, approve, or reject service provider and organization registrations through a centralized dashboard. This system manages the core approval lifecycle from initial registration through final approval, with granular control over individual regulatory requirements for service providers.

**Problem Statement**: Currently, there is no systematic way for administrators to review and approve pending registrations. The system needs a streamlined workflow to manage the approval process for both service providers (with individual regulatory requirement validation) and organizations.

**Goal**: Create an efficient, user-friendly admin dashboard that streamlines the core approval process while maintaining proper oversight and documentation of approval decisions.

**Implementation Strategy**: Rapid MVP development in one night (6-8 hours) focusing on core functionality using existing patterns and components.

## Goals

1. **Centralized Management**: Provide a single dashboard for all approval workflows
2. **Granular Control**: Enable individual regulatory requirement approval for service providers
3. **Core Processing**: Support individual approval/rejection operations
4. **Clear Status Tracking**: Maintain clear visibility of approval states across the system
5. **Basic Audit Trail**: Track who approved/rejected items and when
6. **Rapid Delivery**: Build functional MVP in one development session

## User Stories

### Admin User Stories

**As an Admin, I want to:**

1. **Dashboard Overview**: See a comprehensive dashboard showing all pending approvals, rejected items, and approved items so I can prioritize my work
2. **Provider Review**: Review individual service provider applications with all their regulatory requirements in one place
3. **Individual Requirement Approval**: Approve or reject individual regulatory requirements while keeping the overall provider status pending
4. **Overall Provider Approval**: Give final approval to a service provider only when all regulatory requirements are approved
5. **Organization Review**: Review and approve/reject organization registrations with feedback capability
6. **Manual Refresh**: Refresh the page to see updated approval status

### Service Provider User Stories

**As a Service Provider, I want to:**

1. **Status Visibility**: See the approval status of my overall application and individual regulatory requirements
2. **Clear Feedback**: Understand why specific requirements or my overall application was rejected
3. **Manual Refresh**: Refresh the page to see updated approval status

### Organization User Stories

**As an Organization, I want to:**

1. **Status Visibility**: See the approval status of my organization registration
2. **Clear Feedback**: Understand why my organization registration was rejected
3. **Manual Refresh**: Refresh the page to see updated approval status

## Functional Requirements

### 1. Admin Dashboard

1.1. **Main Dashboard View**

- Display summary cards showing counts of pending, approved, and rejected items
- Separate sections for Service Providers and Organizations
- Manual refresh to update data

  1.2. **Service Provider Management**

- List view of all service providers with status indicators
- Detailed view showing provider information and all regulatory requirements
- Individual requirement approval/rejection with notes
- Overall provider approval (only available when all requirements approved)

  1.3. **Organization Management**

- List view of all organizations with status indicators
- Detailed view showing organization information
- Organization approval/rejection with feedback

### 2. Approval Workflow Logic

2.1. **Service Provider Workflow**

- New providers start with status `PENDING_APPROVAL`
- Individual regulatory requirements can be approved/rejected independently
- Provider status remains `PENDING_APPROVAL` until overall approval is given
- If any requirement is rejected, provider can be rejected overall
- Only when all requirements are approved can admin give overall approval
- Overall approval changes status to `APPROVED`
- Overall rejection changes status to `REJECTED`

  2.2. **Organization Workflow**

- New organizations start with status `PENDING_APPROVAL`
- Organizations can be approved/rejected as a single unit
- Approval changes status to `APPROVED`
- Rejection changes status to `REJECTED`

### 3. Data Management

3.1. **Status Tracking**

- Update `approvedBy`, `approvedById`, `approvedAt` fields on approval
- Update `rejectedAt`, `rejectionReason` fields on rejection
- Track individual requirement submission status

  3.2. **Communication Logging**

- Console log all future communication details instead of sending actual notifications
- Log approval/rejection actions with timestamps and admin details

### 4. Access Control

4.1. **Admin Authentication**

- Restrict access to users with `ADMIN` or `SUPER_ADMIN` roles
- Redirect unauthorized users to appropriate pages

## Non-Goals (Out of Scope for MVP)

1. **Bulk Operations**: Selecting multiple items for batch approval/rejection
2. **Advanced Filtering**: Complex search and filter capabilities
3. **Real-time Updates**: Live updates without manual refresh
4. **Email Notifications**: Actual email sending (console logged instead)
5. **Advanced UI**: Complex animations, advanced styling
6. **Comprehensive Error Handling**: Beyond basic validation
7. **Analytics Dashboard**: Usage statistics and reporting
8. **Advanced Audit Trail**: Detailed history tracking
9. **Role Management**: Admin role assignment interface

## Design Considerations

- **Reuse Existing Components**: Leverage current UI components and patterns
- **Consistent Styling**: Follow existing design system and Tailwind classes
- **Responsive Design**: Ensure mobile-friendly layouts using existing responsive patterns
- **Simple Navigation**: Integrate with existing dashboard navigation structure

## Technical Considerations

### Implementation Strategy

- **Phase 1 (1-2h)**: Admin API routes using existing TanStack Query pattern
- **Phase 2 (2-3h)**: Admin dashboard UI adapting existing components
- **Phase 3 (2-3h)**: Core approval workflow with simple status updates
- **Phase 4 (1h)**: Integration, admin role protection, and testing

### Architecture Decisions

1. **API Routes**: Follow existing pattern in `/app/api/admin/` directory
2. **Server Actions**: Extend existing functions in `/features/providers/lib/actions/administer-provider.ts`
3. **Custom Hooks**: Create hooks in `/features/admin/hooks/` that encapsulate TanStack Query mutations
4. **Existing Components**: Leverage existing UI components and patterns
5. **Database**: Use existing approval fields in ServiceProvider and Organization models

### Dependencies

- Existing TanStack Query setup
- Current authentication system
- Existing Prisma schema with approval fields
- Current UI component library

## Success Metrics

1. **Functional Completeness**: All core approval workflows operational
2. **Admin Efficiency**: Admins can process approvals without external tools
3. **Status Visibility**: Clear approval status for providers and organizations
4. **Development Speed**: Complete MVP in single development session (6-8 hours)
5. **Code Quality**: Follow existing patterns and maintain consistency

## Open Questions

1. **Admin Role Assignment**: How should users become ADMIN or SUPER_ADMIN? (Database update via Prisma Studio recommended for MVP)
2. **Future Communication**: Console logging format for future email integration
3. **Manual Refresh**: Acceptable UX for MVP vs future real-time updates
4. **Error Handling**: Level of error handling needed for MVP
5. **Testing Strategy**: Manual testing vs automated tests for MVP

## Implementation Timeline

**Total Estimated Time**: 6-8 hours

**Phase 1: Core Data & API (1-2 hours)**

- Admin API routes
- Server actions extension
- Database queries

**Phase 2: Admin Dashboard UI (2-3 hours)**

- Admin layout
- Provider list component
- Organization list component
- Approval buttons

**Phase 3: Approval Workflow (2-3 hours)**

- Individual requirement approval
- Overall approval logic
- Rejection with feedback
- Status updates

**Phase 4: Integration & Testing (1 hour)**

- Route protection
- Manual testing
- Console logging verification
