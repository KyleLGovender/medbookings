# Comprehensive User Roles & Permission Management System - Product Requirements Document

## Introduction/Overview

The Comprehensive User Roles & Permission Management System will implement a unified role-based access control framework that encompasses all user types in the MedBookings platform: guests, authenticated users, providers, organization members, and system administrators. This system addresses the need for granular access control across all platform features while maintaining clear separation between system-wide roles, organization-specific roles, and provider-specific permissions.

The system builds upon the existing database schema with `UserRole`, `OrganizationRole`, and `OrganizationPermission` enums, extending functionality to support guest user verification, administrative oversight capabilities, and a flexible permission framework that can be applied throughout the codebase incrementally.

## Goals

1. **Establish unified role hierarchy** with clear inheritance patterns across system and organization roles
2. **Implement guest user verification workflow** for booking appointments without account creation
3. **Enable administrative oversight capabilities** allowing system admins to access and manage any provider or organization
4. **Create flexible permission framework** that can be applied at page, feature, and data levels throughout the application
5. **Support multi-role assignments** where users can simultaneously be providers and hold organization roles
6. **Build extensible system** that allows adding new access controls incrementally without breaking existing functionality

## User Stories

### Guest Users (Unauthenticated)
- As a guest, I want to search for and book appointments with providers so that I can schedule healthcare services without creating an account
- As a guest, I want to verify my contact information (email/WhatsApp) so that providers can confirm my booking
- As a guest, I want to receive booking confirmations and reminders so that I don't miss my appointments

### Regular Users (USER role)
- As a registered user, I want all guest capabilities plus profile management so that I can maintain my healthcare history
- As a registered user, I want to manage my bookings and communication preferences so that I have control over my healthcare interactions
- As a registered user, I want to leave reviews for providers so that I can share my experience with other patients

### Service Providers (Independent Role System)
- As a provider, I want to manage my provider profile and services independently of any organization roles I may have
- As a provider, I want to create my own availability and accept organization-proposed availability so that I can control my schedule
- As a provider, I want to connect with organizations while maintaining my independent provider status

### Organization Members (Hierarchical Roles)
- As an organization STAFF member, I want basic operational access to perform my assigned daily tasks
- As an organization MANAGER, I want to manage specific locations and providers assigned to my oversight
- As an organization ADMIN, I want operational control over all providers and bookings within my organization
- As an organization OWNER, I want full control including billing, member management, and organization settings

### System Administrators (Global Override)
- As a system ADMIN, I want to approve/reject provider and organization applications so that I can maintain platform quality
- As a system ADMIN, I want to access any provider or organization account so that I can provide support and resolve issues
- As a SUPER_ADMIN, I want to manage other administrators so that I can maintain platform operations and security

## Functional Requirements

### 1. Role System Architecture

1.1. **System-Wide Roles** (UserRole enum):
- `USER`: Basic authenticated users (default for all registered users)
- `ADMIN`: System administrators with global oversight capabilities
- `SUPER_ADMIN`: Platform super administrators who can manage other admins

1.2. **Organization Roles** (OrganizationRole enum with hierarchy):
- `STAFF`: Basic operational access (lowest level)
- `MANAGER`: Limited admin rights for specific locations/providers
- `ADMIN`: Operational control over organization providers and bookings
- `OWNER`: Full organizational control including billing (highest level)

1.3. **Provider Status** (Independent system):
- Provider entities are linked to Users but operate independently from UserRole and OrganizationRole
- Providers have status-based permissions based on ProviderStatus enum
- Users can simultaneously be providers and hold various organization roles

### 2. Guest User System

2.1. **Booking Capabilities**:
- Must allow guests to search providers and book appointments with two options:
  1. **Guest Booking**: Provide contact details (email or WhatsApp) with verification
  2. **Quick Account Creation**: Use Google OAuth to create account and auto-populate verified email
- Must prevent guest access to user account features, administrative functions, or historical data
- Must seamlessly transition OAuth users to full account capabilities after booking

2.2. **Verification Workflow**:
- Must implement email verification for guest bookings (send verification link before confirming booking)
- Must implement WhatsApp verification option as alternative to email
- Must require at least one verified contact method before booking confirmation
- Must store verification status and method for guest booking records

2.3. **Guest Data Management**:
- Must handle guest data separately from registered user data
- Must provide clear communication channels for guest bookings (email, WhatsApp)
- Must respect guest privacy while enabling booking management

### 3. System Administrator Capabilities

3.1. **Administrative Oversight**:
- ADMIN role must have permission to approve/reject provider applications
- ADMIN role must have permission to approve/reject organization registrations
- ADMIN role must have permission to access and manage any provider account for support purposes
- ADMIN role must have permission to access and manage any organization account for support purposes

3.2. **Global Override Powers**:
- System ADMIN must override all organization-level access restrictions
- System ADMIN must access all platform data for operational purposes
- System ADMIN must resolve disputes between organizations and providers
- System ADMIN must assist with account setup and configuration across all entity types

3.3. **Super Administrator Functions**:
- SUPER_ADMIN must manage ADMIN role assignments and permissions
- SUPER_ADMIN must have all ADMIN capabilities plus platform configuration access
- SUPER_ADMIN must handle system-level security and compliance functions

### 4. Organization Member Management

4.1. **Invitation Workflow**:
- Organization OWNERS must send invitations with specific roles and permissions
- Organization ADMINS must send invitations for MANAGER and STAFF roles
- System must provide email-based invitation acceptance workflow
- System must support invitation expiration and cancellation

4.2. **Role Assignment and Permissions**:
- Each organization role must have specific permission sets defined by OrganizationPermission enum
- Higher roles must inherit permissions from lower roles within organizations
- System must support role modifications by authorized users (OWNER can modify all, ADMIN can modify MANAGER/STAFF)

4.3. **Multi-Organization Support**:
- Users must be able to hold different roles in different organizations simultaneously
- System must provide organization context switching for users with multiple memberships
- Permission checks must consider the current organization context

### 5. Provider-Organization Relationships

5.1. **Independent Provider Operations**:
- Providers must manage their own profiles, services, and availability independently
- Provider permissions must not depend on organization membership status
- Users can be providers without being organization members

5.2. **Organization Connections**:
- Organizations must invite providers to create connections (via ProviderInvitation)
- Providers must accept/reject organization connection requests
- Organization members (ADMIN/MANAGER) must propose availability to connected providers
- Providers must accept/reject organization-proposed availability

5.3. **Billing Context Management**:
- System must track whether availability/bookings are billed to provider or organization
- Provider-created availability must default to provider billing
- Organization-accepted availability must default to organization billing

### 6. Permission Framework Implementation

6.1. **Page-Level Access Control**:
- Must implement middleware for route protection based on user roles
- Must redirect unauthorized users to appropriate login or unauthorized pages
- Must provide loading states while checking permissions

6.2. **Feature-Level Permissions**:
- Must provide utility functions for component-level permission checking
- Must hide/show UI elements based on user roles and permissions
- Must gracefully handle permission changes during user sessions

6.3. **Data-Level Permissions**:
- Must implement database query filtering based on user roles and organization context
- Must ensure users only access data they're authorized to see
- Must log permission violations for security monitoring

6.4. **Framework Extensibility**:
- Must provide clear patterns for adding new permission checks throughout the codebase
- Must allow incremental rollout of access controls without breaking existing functionality
- Must support future role additions without core system changes

## Non-Goals (Out of Scope)

1. **Custom Permission Creation**: Users cannot create custom permissions beyond the defined role structure
2. **Temporary Role Assignments**: No support for time-limited or temporary role assignments
3. **Per-Record Permissions**: No individual booking or appointment-level permission assignments
4. **External Role Synchronization**: No integration with external HR or identity management systems
5. **Role-Based UI Theming**: No visual theme changes based on user roles (only functionality changes)
6. **Automatic Role Migration**: No automatic migration of existing users to new role structure

## Technical Considerations

1. **Database Schema Integration**: Must work with existing Prisma schema without breaking changes
2. **Session Management**: Must integrate with NextAuth.js for role persistence across sessions
3. **Organization Context**: Must handle organization-scoped permissions and context switching
4. **Performance Optimization**: Permission checks must be cached to avoid repeated database queries
5. **Type Safety**: Must provide TypeScript types for all permission checking functions
6. **Middleware Implementation**: Must use Next.js middleware for efficient route protection

## Design Considerations

1. **Permission Components**: Create reusable React components that render based on user permissions
2. **Navigation System**: Implement dynamic navigation that shows/hides items based on roles
3. **Error Handling**: Provide clear unauthorized access pages with contextual messaging
4. **Loading States**: Ensure permission checking doesn't create jarring user experiences
5. **Mobile Responsiveness**: Ensure permission-based UI changes work across all device sizes

## Success Metrics

1. **Security Coverage**: 100% of administrative functions protected by appropriate role checks
2. **Guest Conversion**: At least 70% of guest bookings successfully verified and confirmed
3. **User Experience**: No reported confusion about access restrictions or permission errors
4. **Performance Impact**: Permission checks add less than 100ms to page load times
5. **Framework Adoption**: Clear documentation enables developers to add new permission checks easily
6. **Administrative Efficiency**: System admins can resolve 90% of account issues without developer intervention

## Implementation Priority

### Phase 1: Core Framework
1. Implement basic permission checking utilities and middleware
2. Set up guest user verification workflow
3. Establish admin override capabilities for provider and organization access

### Phase 2: Organization Features
4. Build organization member invitation workflow
5. Implement organization role hierarchy and permission inheritance
6. Add organization context switching for multi-membership users

### Phase 3: Advanced Features
7. Implement comprehensive page-level access control
8. Add feature-level permission components
9. Establish data-level permission filtering

### Phase 4: Framework Extension
10. Document permission patterns for future development
11. Create developer tools for testing permission scenarios
12. Establish monitoring and logging for permission violations

## Technical Specifications

### Resolved Requirements

1. **Guest Verification Timeout**: Email/WhatsApp verification links valid for **15 minutes** (recommended for security balance)
2. **Admin Access Logging**: No audit logging required for admin access to accounts
3. **Permission Caching Strategy**: **Session-based caching** recommended - store user permissions in NextAuth session for performance
4. **Multi-Organization Interface**: Single organization screens with sidebar organization selector for users with multiple memberships
5. **Guest Account Options**: Users can choose between guest booking (with verification) or Google OAuth account creation

### Remaining Open Questions

1. **Provider-Organization Conflict Resolution**: What happens when a provider disputes an organization's booking or availability proposal?
2. **Permission Cache Invalidation**: How should permission changes be propagated when roles are modified during active sessions?

---

**Complete PRD** - Ready for implementation with clear phases and success metrics defined.