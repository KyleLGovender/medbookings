# Comprehensive Permission System Documentation

This documentation covers the complete permission and role management system implemented in MedBookings, providing developers with patterns, examples, and best practices for implementing secure access control.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Concepts](#core-concepts)
3. [Permission Types](#permission-types)
4. [Role Hierarchy](#role-hierarchy)
5. [Implementation Patterns](#implementation-patterns)
6. [API Reference](#api-reference)
7. [Component Usage](#component-usage)
8. [Testing Permissions](#testing-permissions)
9. [Security Considerations](#security-considerations)
10. [Migration Guide](#migration-guide)

## Architecture Overview

The permission system is built on several key layers:

```
┌─────────────────────────────────────────┐
│           User Interface Layer          │
│  PermissionGate, PermissionButton,     │
│  PermissionNavigation, PermissionForm  │
├─────────────────────────────────────────┤
│           Component Layer               │
│  usePermissions hook, session helpers  │
├─────────────────────────────────────────┤
│           Business Logic Layer          │
│  Permission checking, role inheritance │
├─────────────────────────────────────────┤
│           Data Layer                    │
│  User roles, organization memberships  │
└─────────────────────────────────────────┘
```

### Key Features

- **Role-Based Access Control (RBAC)**: System, organization, and provider roles
- **Permission Inheritance**: Hierarchical permission system
- **Context-Aware Permissions**: Organization and provider-scoped permissions
- **Real-Time Updates**: Session-based permission caching with invalidation
- **UI Integration**: Seamless integration with React components
- **Audit Logging**: Comprehensive activity tracking for security

## Core Concepts

### Permissions

Permissions are specific capabilities that users can have:

```typescript
enum Permission {
  // System-level
  MANAGE_PLATFORM = 'MANAGE_PLATFORM',
  APPROVE_PROVIDERS = 'APPROVE_PROVIDERS',

  // Organization-level
  MANAGE_ORGANIZATION = 'MANAGE_ORGANIZATION',
  INVITE_MEMBERS = 'INVITE_MEMBERS',

  // Provider-level
  MANAGE_AVAILABILITY = 'MANAGE_AVAILABILITY',
  MANAGE_SERVICES = 'MANAGE_SERVICES',
}
```

### Roles

Roles are collections of permissions with inheritance:

```typescript
// System roles (platform-wide)
enum SystemRole {
  USER = 'USER', // Basic authenticated user
  ADMIN = 'ADMIN', // Platform administrator
  SUPER_ADMIN = 'SUPER_ADMIN', // Full platform control
}

// Organization roles (per-organization)
enum OrganizationRole {
  STAFF = 'STAFF', // Basic organization access
  MANAGER = 'MANAGER', // Manage calendar and bookings
  ADMIN = 'ADMIN', // Manage members and settings
  OWNER = 'OWNER', // Full organization control
}
```

### Permission Context

Permissions can be scoped to specific contexts:

```typescript
interface PermissionContext {
  organizationId?: string; // Organization-scoped permission
  providerId?: string; // Provider-scoped permission
  userId?: string; // User-scoped permission
}
```

## Permission Types

### 1. System Permissions

Global permissions that apply across the entire platform:

```typescript
// Check if user is system admin
const { isSystemAdmin } = usePermissions();

// Check specific system permission
const canApproveProviders = hasPermission(Permission.APPROVE_PROVIDERS);
```

### 2. Organization Permissions

Permissions scoped to specific organizations:

```typescript
// Check organization-specific permission
const canManageOrg = hasPermission(Permission.MANAGE_ORGANIZATION, { organizationId: 'org-123' });

// Check organization role
const { getOrganizationRole } = usePermissions();
const role = getOrganizationRole('org-123');
```

### 3. Provider Permissions

Permissions related to provider capabilities:

```typescript
// Check if user is a provider
const { isProvider } = usePermissions();

// Check provider-specific permission
const canManageAvailability = hasPermission(Permission.MANAGE_AVAILABILITY, {
  providerId: 'provider-456',
});
```

## Role Hierarchy

### System Role Hierarchy

```
SUPER_ADMIN
    ↓ inherits from
  ADMIN
    ↓ inherits from
  USER
```

### Organization Role Hierarchy

```
OWNER
    ↓ inherits from
  ADMIN
    ↓ inherits from
  MANAGER
    ↓ inherits from
  STAFF
```

### Permission Inheritance Example

```typescript
// ADMIN inherits all USER permissions plus additional ones
const adminPermissions = [
  ...getUserPermissions(SystemRole.USER),
  Permission.APPROVE_PROVIDERS,
  Permission.APPROVE_ORGANIZATIONS,
];
```

## Implementation Patterns

### 1. Page-Level Protection

Use middleware for route-based access control:

```typescript
// middleware.ts
export default withAuth(async (req) => {
  const hasAccess = await checkRoutePermissions(req.nextUrl.pathname, token);
  if (!hasAccess) {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }
  return NextResponse.next();
});
```

### 2. Component-Level Protection

Use PermissionGate for conditional rendering:

```tsx
<PermissionGate permission={Permission.MANAGE_ORGANIZATION} context={{ organizationId }}>
  <AdminPanel />
</PermissionGate>
```

### 3. API Route Protection

Use permission checking in API routes:

```typescript
export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  requirePermission(currentUser.permissions, Permission.CREATE_AVAILABILITY);

  // Process request...
}
```

### 4. Form Field Control

Use permission-based form components:

```tsx
<PermissionInput
  form={form}
  name="adminNotes"
  label="Admin Notes"
  permission={Permission.MANAGE_PLATFORM}
/>
```

## API Reference

### Core Functions

#### `hasPermission(permissions, permission, context?)`

Check if user has a specific permission:

```typescript
const canEdit = hasPermission(userPermissions, Permission.MANAGE_ORGANIZATION, {
  organizationId: 'org-123',
});
```

#### `requirePermission(permissions, permission, context?)`

Throw error if user lacks permission (for API routes):

```typescript
requirePermission(currentUser.permissions, Permission.APPROVE_PROVIDERS);
```

#### `canManageUser(managerPerms, targetPerms, organizationId?)`

Check if one user can manage another:

```typescript
const canManage = canManageUser(adminPermissions, userPermissions, 'org-123');
```

### React Hooks

#### `usePermissions(context?)`

Main hook for permission checking in components:

```typescript
const { hasPermission, isSystemAdmin, isProvider, getOrganizationRole, permissions } =
  usePermissions({ organizationId: 'org-123' });
```

#### `useOrganizationPermissions(organizationId)`

Specialized hook for organization context:

```typescript
const { organizationRole, isAdmin, hasOrganizationPermission } =
  useOrganizationPermissions('org-123');
```

### Session Management

#### `getCurrentUser()`

Get current user with permissions (server-side):

```typescript
const currentUser = await getCurrentUser();
if (!currentUser) {
  redirect('/login');
}
```

#### `invalidateUserPermissions(email)`

Invalidate cached permissions:

```typescript
await invalidateUserPermissions('user@example.com');
```

## Component Usage

### Permission Gates

Basic usage:

```tsx
<PermissionGate permission={Permission.MANAGE_MEMBERS}>
  <MemberManagementPanel />
</PermissionGate>
```

Multiple permissions (require all):

```tsx
<PermissionGate
  permissions={[Permission.MANAGE_ORGANIZATION, Permission.MANAGE_BILLING]}
  requireAll={true}
>
  <BillingSettings />
</PermissionGate>
```

Role-based access:

```tsx
<PermissionGate systemRole={[SystemRole.ADMIN, SystemRole.SUPER_ADMIN]}>
  <AdminDashboard />
</PermissionGate>
```

Custom permission check:

```tsx
<PermissionGate custom={(permissions) => permissions.providerId === currentProviderId}>
  <ProviderSettings />
</PermissionGate>
```

### Permission Forms

```tsx
<PermissionForm form={form} onSubmit={handleSubmit}>
  <PermissionInput
    form={form}
    name="organizationName"
    label="Organization Name"
    permission={Permission.MANAGE_ORGANIZATION}
  />

  <PermissionSection title="Admin Settings" permission={Permission.MANAGE_PLATFORM}>
    <PermissionSelect
      form={form}
      name="status"
      label="Status"
      options={statusOptions}
      systemRole={SystemRole.ADMIN}
    />
  </PermissionSection>
</PermissionForm>
```

### Permission Navigation

```tsx
const navigationItems: NavigationItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: <Home />,
  },
  {
    href: '/admin',
    label: 'Admin',
    icon: <Shield />,
    systemRole: [SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
  },
  {
    href: '/organizations/new',
    label: 'Create Organization',
    permission: Permission.MANAGE_ORGANIZATION,
  },
];

<PermissionNavigation items={navigationItems} />;
```

## Testing Permissions

### Unit Testing

```typescript
import { hasPermission } from '@/lib/auth/permissions';
import { Permission, SystemRole } from '@/types/permissions';

describe('Permission System', () => {
  it('should grant admin permissions', () => {
    const permissions = {
      systemRole: SystemRole.ADMIN,
      organizationRoles: [],
      providerRole: undefined,
    };

    const result = hasPermission(permissions, Permission.APPROVE_PROVIDERS);
    expect(result).toBe(true);
  });
});
```

### Integration Testing

```typescript
// Test API route protection
const response = await fetch('/api/admin/providers', {
  headers: { Authorization: `Bearer ${userToken}` },
});

expect(response.status).toBe(403); // Forbidden for non-admin
```

### Component Testing

```tsx
import { render, screen } from '@testing-library/react';

import { PermissionGate } from '@/components/auth/permission-gate';

test('renders content for authorized user', () => {
  render(
    <MockPermissionProvider hasPermission={true}>
      <PermissionGate permission={Permission.MANAGE_ORGANIZATION}>
        <div>Admin Content</div>
      </PermissionGate>
    </MockPermissionProvider>
  );

  expect(screen.getByText('Admin Content')).toBeInTheDocument();
});
```

## Security Considerations

### 1. Server-Side Validation

**Always validate permissions on the server side:**

```typescript
// ❌ BAD - Client-side only
<PermissionGate permission={Permission.DELETE_USER}>
  <DeleteButton />
</PermissionGate>

// ✅ GOOD - Server-side validation
export async function DELETE(request: Request) {
  const currentUser = await getCurrentUser();
  requirePermission(currentUser.permissions, Permission.DELETE_USER);
  // Process deletion...
}
```

### 2. Context Validation

**Validate context parameters:**

```typescript
// ❌ BAD - Trusting client-provided IDs
const canEdit = hasPermission(permission, { organizationId: clientProvidedId });

// ✅ GOOD - Validate user belongs to organization
const membership = await getUserOrganizationMembership(userId, organizationId);
if (!membership) throw new Error('Access denied');
```

### 3. Audit Logging

**Log all permission-sensitive actions:**

```typescript
await logSecurityEvent({
  action: 'PERMISSION_CHECK',
  userId: currentUser.id,
  permission: Permission.APPROVE_PROVIDERS,
  result: hasAccess,
  context: { organizationId },
});
```

### 4. Permission Caching

**Implement proper cache invalidation:**

```typescript
// Invalidate cache when roles change
await prisma.organizationMembership.update({
  where: { id: membershipId },
  data: { role: newRole },
});

await invalidateUserPermissions(user.email);
```

## Migration Guide

### Adding New Permissions

1. **Define the permission:**

```typescript
// types/permissions.ts
enum Permission {
  // ... existing permissions
  NEW_FEATURE_ACCESS = 'NEW_FEATURE_ACCESS',
}
```

2. **Add to role hierarchy:**

```typescript
// lib/auth/roles.ts
[SystemRole.ADMIN]: {
  permissions: [
    // ... existing permissions
    Permission.NEW_FEATURE_ACCESS
  ]
}
```

3. **Implement checks:**

```tsx
<PermissionGate permission={Permission.NEW_FEATURE_ACCESS}>
  <NewFeature />
</PermissionGate>
```

### Adding New Roles

1. **Define the role:**

```typescript
enum OrganizationRole {
  // ... existing roles
  SPECIALIST = 'SPECIALIST',
}
```

2. **Define permissions:**

```typescript
[OrganizationRole.SPECIALIST]: {
  role: OrganizationRole.SPECIALIST,
  inherits: [OrganizationRole.STAFF],
  permissions: [Permission.MANAGE_SPECIALIZED_CONTENT]
}
```

3. **Update UI:**

```tsx
<PermissionGate organizationRole={OrganizationRole.SPECIALIST}>
  <SpecialistPanel />
</PermissionGate>
```

### Incremental Implementation

For existing codebases, implement permissions incrementally:

1. **Start with page-level protection** (middleware)
2. **Add API route protection** (server actions)
3. **Implement UI components** (permission gates)
4. **Add form field controls** (permission forms)

### Database Migrations

When adding new roles or permissions:

```sql
-- Add new role to enum
ALTER TYPE "OrganizationRole" ADD VALUE 'SPECIALIST';

-- Update existing users if needed
UPDATE "OrganizationMembership"
SET role = 'SPECIALIST'
WHERE conditions...;
```

## Performance Optimization

### Permission Caching

```typescript
// Cache permissions for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

// Use Redis in production
const cached = await redis.get(`permissions:${userId}`);
if (cached && !isExpired(cached)) {
  return JSON.parse(cached);
}
```

### Bulk Permission Checks

```typescript
// Instead of multiple individual checks
const checks = [
  { permission: Permission.READ_ORGANIZATION, context: { organizationId } },
  { permission: Permission.WRITE_ORGANIZATION, context: { organizationId } },
];

const results = hasPermissions(userPermissions, checks);
```

### Database Optimization

```typescript
// Fetch permissions with user data
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    organizationMemberships: {
      include: { organization: true },
    },
    serviceProvider: true,
  },
});
```

This documentation provides a comprehensive guide to implementing and using the permission system. For specific implementation questions, refer to the code examples in the respective component files.
