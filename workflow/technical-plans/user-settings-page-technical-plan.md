# Technical Plan: User Settings Page

## Overview

Implement a comprehensive user settings page at `/settings` route that provides role-based configuration management for all user types in the MedBookings application.

## Technical Analysis

### Current State Assessment

**Existing Infrastructure:**
- Settings navigation exists in sidebar (`app-sidebar.tsx:117`) and header pointing to `/settings` route
- No `/settings` page currently exists - this is a missing route
- Existing profile management in `/src/features/profile/` with basic CRUD operations
- tRPC profile router with get/update/delete procedures
- User model supports all required fields for settings management

**User Role Architecture:**
Based on Prisma schema analysis, we have:
- **Regular Users** (`USER` role): Basic account and communication preferences
- **Service Providers** (`USER` role + Provider model): Additional provider-specific settings
- **Admins** (`ADMIN/SUPER_ADMIN` roles): System administration settings
- **Organization Members**: Additional organization-specific preferences

### Feature Scope Definition

**Minimal Viable Implementation:**
1. **Account Settings** (all users) - Profile information, contact details, password management
2. **Communication Preferences** (all users) - Notification settings via `CommunicationPreference` model
3. **Provider Settings** (approved providers only) - Business configuration, calendar integration
4. **Organization Settings** (org members only) - Role-specific preferences

**Out of Scope:**
- Billing/subscription management (separate feature)
- Advanced admin configuration (separate admin panel)
- Real-time preference sync
- Mobile-specific settings

## Technical Architecture

### 1. Feature Module Structure

Create new `/src/features/settings/` module following established patterns:

```
src/features/settings/
├── components/
│   ├── account-settings-form.tsx       # Personal info management
│   ├── communication-preferences-form.tsx  # Notification settings
│   ├── provider-settings-form.tsx      # Provider-specific config
│   ├── organization-settings-form.tsx  # Organization preferences
│   ├── settings-navigation.tsx         # Settings sidebar/tabs
│   └── settings-layout.tsx            # Main settings page layout
├── hooks/
│   ├── use-user-settings.ts           # User profile & preferences
│   ├── use-communication-preferences.ts # Notification settings
│   ├── use-provider-settings.ts       # Provider configuration
│   └── use-organization-settings.ts   # Organization preferences
├── lib/
│   ├── actions.ts                     # Server actions for validation
│   └── utils.ts                       # Settings-specific utilities
└── types/
    ├── types.ts                       # Settings domain types
    ├── schemas.ts                     # Zod validation schemas
    └── guards.ts                      # Type guards for role checking
```

### 2. Database Integration

**Existing Models to Extend:**
- `User` model: Already has required fields (name, email, phone, whatsapp)
- `CommunicationPreference` model: Perfect for notification settings
- `Provider` model: Contains business settings, calendar integration
- `OrganizationMembership` model: For organization-specific preferences

**Required tRPC Router Extensions:**
- Extend `profileRouter` with preference management procedures
- Create `settingsRouter` for complex multi-model operations
- Add procedures for communication preference CRUD

### 3. Type System Architecture

**Type Flow Pattern:**
```typescript
// Extract types from tRPC procedures
type UserSettings = RouterOutputs['profile']['get'];
type CommunicationPrefs = RouterOutputs['settings']['getCommunicationPreferences'];
type ProviderSettings = RouterOutputs['settings']['getProviderSettings'];

// Domain-specific types in feature module
interface SettingsSection {
  id: string;
  title: string;
  description: string;
  component: ComponentType;
  requiredRole?: UserRole[];
}
```

### 4. Component Architecture

**Role-Based Rendering Pattern:**
```typescript
// Main settings page with conditional sections
const SettingsPage = () => {
  const { data: user } = useCurrentUser();
  const { data: provider } = useProviderData(user?.id);
  const { data: orgMemberships } = useOrganizationMemberships(user?.id);

  const sections = useMemo(() => {
    const baseSections = [
      { id: 'account', component: AccountSettingsForm },
      { id: 'communication', component: CommunicationPreferencesForm }
    ];

    if (provider?.status === 'APPROVED' || provider?.status === 'ACTIVE') {
      baseSections.push({ id: 'provider', component: ProviderSettingsForm });
    }

    if (orgMemberships?.length > 0) {
      baseSections.push({ id: 'organization', component: OrganizationSettingsForm });
    }

    return baseSections;
  }, [user, provider, orgMemberships]);

  return <SettingsLayout sections={sections} />;
};
```

## Implementation Sequence

### Phase 1: Core Infrastructure (Day 1)
1. **Route Creation**: Create `/src/app/(dashboard)/settings/page.tsx`
2. **Feature Module**: Set up `/src/features/settings/` structure
3. **Basic Layout**: Implement settings navigation and responsive layout
4. **Type Definitions**: Create settings-specific types and schemas

### Phase 2: Account Settings (Day 2)
1. **Profile Integration**: Extend existing profile hooks for settings context
2. **Account Form**: Personal information management (name, email, phone, whatsapp)
3. **Validation**: Form validation with existing profile schemas
4. **Password Management**: Link to password change functionality

### Phase 3: Communication Preferences (Day 3)
1. **tRPC Procedures**: CRUD operations for `CommunicationPreference` model
2. **Preference Form**: Email, SMS, WhatsApp notification toggles
3. **Reminder Settings**: Hours before appointment configuration
4. **Real-time Updates**: Optimistic updates for preference changes

### Phase 4: Provider Settings (Day 4)
1. **Provider Detection**: Check user's provider status and approval state
2. **Business Settings**: Bio, languages, website, contact info management
3. **Calendar Integration**: Google Calendar connection status and settings
4. **Service Configuration**: Link to service management (if in scope)

### Phase 5: Organization Settings (Day 5)
1. **Membership Detection**: Check user's organization memberships
2. **Role-Specific Settings**: Settings based on organization role
3. **Multi-Organization Support**: Handle users in multiple organizations
4. **Permission-Based UI**: Show/hide settings based on organization permissions

## Technical Considerations

### Performance Optimizations
- **Lazy Loading**: Load provider/organization data only when tabs are accessed
- **Optimistic Updates**: Immediate UI feedback for preference changes
- **Efficient Queries**: Select only required fields for each settings section
- **Caching Strategy**: Leverage tRPC query caching for settings data

### Error Handling Patterns
- **Validation Errors**: Display field-specific errors using React Hook Form
- **Permission Errors**: Gracefully handle access denied scenarios
- **Loading States**: Skeleton loading for each settings section
- **Rollback Support**: Revert optimistic updates on API failures

### Security Considerations
- **Role Validation**: Server-side role checking for all settings procedures
- **Input Sanitization**: Comprehensive validation for all user inputs
- **Privacy Controls**: Ensure users can only modify their own settings
- **Audit Logging**: Track significant settings changes for compliance

### Integration Points
- **Profile Router**: Extend existing profile procedures vs creating new ones
- **Communication System**: Settings changes should affect notification delivery
- **Calendar Integration**: Settings should reflect in Google Calendar sync
- **Organization Management**: Settings should respect organization permissions

## Risk Mitigation

### Technical Risks
1. **Complex Role Logic**: Use type guards and server-side validation to prevent unauthorized access
2. **Data Consistency**: Use database transactions for multi-model updates
3. **Performance Impact**: Implement progressive loading and efficient caching
4. **UI Complexity**: Start with simple tab-based navigation, enhance progressively

### Implementation Risks
1. **Scope Creep**: Strict adherence to minimal viable scope, defer advanced features
2. **Integration Issues**: Thorough testing with existing profile management system
3. **User Experience**: Consistent form patterns and validation messaging
4. **Mobile Responsiveness**: Ensure settings work well on all device sizes

## Success Metrics

### Functional Requirements
- [ ] All user roles can access appropriate settings sections
- [ ] Settings changes persist correctly across sessions
- [ ] Form validation prevents invalid data submission
- [ ] Loading and error states provide clear user feedback

### Non-Functional Requirements
- [ ] Settings page loads within 2 seconds on average
- [ ] Mobile-responsive design works on all supported devices
- [ ] Accessibility compliance for form controls and navigation
- [ ] No breaking changes to existing profile management

## Future Enhancement Opportunities

1. **Advanced Preferences**: Theme selection, language preferences, timezone settings
2. **Bulk Operations**: Import/export settings, bulk communication preference updates
3. **Admin Settings**: System-wide configuration management for admin users
4. **Integration Settings**: Advanced calendar sync options, third-party integrations
5. **Audit Trail**: Complete history of settings changes for compliance

## Technical Validation Required

Before implementation begins:
1. **Database Schema Review**: Confirm `CommunicationPreference` model supports all notification types
2. **Permission Model**: Verify organization permission checking for settings access
3. **Provider Status Flow**: Understand complete provider approval workflow
4. **Existing Profile Usage**: Identify all current profile modification touchpoints
5. **Mobile Navigation**: Confirm settings navigation works with responsive design

---

**Estimated Implementation Time**: 5 days
**Primary Dependencies**: Existing profile management system, tRPC infrastructure
**Risk Level**: Medium (well-defined scope, existing patterns to follow)
**Priority**: High (user-facing feature gap, referenced from multiple navigation points)