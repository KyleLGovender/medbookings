# Feature Components Documentation

This document provides comprehensive documentation for all feature-specific components and business logic components in the MedBookings application. These components handle specific functionality and business requirements.

## Table of Contents

- [Layout Components](#layout-components)
- [Authentication Components](#authentication-components)
- [Provider Components](#provider-components)
- [Search & Navigation Components](#search--navigation-components)
- [Form Components](#form-components)
- [Upload Components](#upload-components)
- [Status & Display Components](#status--display-components)
- [Skeleton Components](#skeleton-components)
- [Calendar Components](#calendar-components)
- [Organization Components](#organization-components)

---

## Layout Components

### Header

Application header with navigation and authentication.

**Location:** `src/components/header.tsx`

**Features:**
- Responsive navigation menu
- User authentication state management
- Dynamic navigation items based on user role
- Mobile-friendly hamburger menu
- Profile dropdown with role-based menu items

**Props:**
- None (uses session and hooks internally)

**Example:**
```tsx
import Header from '@/components/header';

// Used in layout
<Header />
```

**Key Dependencies:**
- `next-auth/react` for session management
- `useProviderByUserId` hook for provider data
- `useOrganizationByUserId` hook for organization data

### Footer

Application footer with links and information.

**Location:** `src/components/footer.tsx`

**Features:**
- Responsive footer layout
- Link sections
- Social media links
- Copyright information

**Example:**
```tsx
import Footer from '@/components/footer';

// Used in layout
<Footer />
```

### App Sidebar

Application sidebar for navigation.

**Location:** `src/components/app-sidebar.tsx`

**Features:**
- Collapsible sidebar
- Role-based navigation items
- User profile section
- Theme toggle integration

**Example:**
```tsx
import { AppSidebar } from '@/components/app-sidebar';

<AppSidebar />
```

---

## Authentication Components

### Auth Button

Authentication button with Google sign-in and user menu.

**Location:** `src/features/auth/components/auth-button.tsx`

**Features:**
- Google OAuth integration
- User avatar display
- Profile dropdown menu
- Sign out functionality
- Loading states

**Props:**
- `profileMenuItems`: Array of menu items for authenticated users
- `className`: Additional CSS classes

**Example:**
```tsx
import AuthButton from '@/features/auth/components/auth-button';

const profileMenuItems = [
  { label: 'Profile', href: '/profile' },
  { label: 'Settings', href: '/settings' },
];

<AuthButton profileMenuItems={profileMenuItems} />
```

**Dependencies:**
- `next-auth/react` for authentication
- Session management for user state

---

## Provider Components

### Provider Profile View

Displays service provider profile information.

**Location:** `src/features/providers/components/profile/provider-profile-view.tsx`

**Features:**
- Provider information display
- Service listings
- Availability calendar
- Contact information
- Review integration

**Example:**
```tsx
import { ProviderProfileView } from '@/features/providers/components';

<ProviderProfileView providerId={providerId} />
```

### Service Provider Calendar

Calendar management for service providers.

**Location:** `src/features/providers/components/service-provider-calendar.tsx`

**Features:**
- Availability management
- Booking calendar view
- Time slot configuration
- Integration with calendar services

**Example:**
```tsx
import { ServiceProviderCalendar } from '@/features/providers/components';

<ServiceProviderCalendar providerId={providerId} />
```

### Provider Onboarding Form

Multi-step onboarding form for new providers.

**Location:** `src/features/providers/components/onboarding/provider-onboarding-form.tsx`

**Features:**
- Multi-step form wizard
- Form validation
- Document upload integration
- Progress tracking

**Example:**
```tsx
import { ProviderOnboardingForm } from '@/features/providers/components';

<ProviderOnboardingForm onComplete={handleComplete} />
```

### Organization Connections Manager

Manages connections between providers and organizations.

**Location:** `src/features/providers/components/organization-connections-manager.tsx`

**Features:**
- Connection request management
- Organization search
- Connection status tracking
- Invitation handling

**Example:**
```tsx
import { OrganizationConnectionsManager } from '@/features/providers/components';

<OrganizationConnectionsManager providerId={providerId} />
```

### Connection Card

Displays organization connection information.

**Location:** `src/features/providers/components/connection-card.tsx`

**Features:**
- Connection status display
- Organization information
- Action buttons for connection management
- Status badges

**Example:**
```tsx
import { ConnectionCard } from '@/features/providers/components';

<ConnectionCard connection={connectionData} />
```

### Invitation Card

Displays and manages invitations.

**Location:** `src/features/providers/components/invitation-card.tsx`

**Features:**
- Invitation details
- Accept/decline actions
- Invitation status tracking
- Expiration handling

**Example:**
```tsx
import { InvitationCard } from '@/features/providers/components';

<InvitationCard invitation={invitationData} />
```

### Requirement Submission Card

Handles requirement submissions for providers.

**Location:** `src/features/providers/components/requirement-submission-card.tsx`

**Features:**
- Requirement display
- Document upload
- Submission status tracking
- Validation feedback

**Example:**
```tsx
import { RequirementSubmissionCard } from '@/features/providers/components';

<RequirementSubmissionCard requirement={requirementData} />
```

### Delete Provider Button

Confirmation button for provider deletion.

**Location:** `src/features/providers/components/delete-provider-button.tsx`

**Features:**
- Confirmation dialog
- Permanent deletion warning
- Loading states
- Error handling

**Example:**
```tsx
import { DeleteProviderButton } from '@/features/providers/components';

<DeleteProviderButton providerId={providerId} onDelete={handleDelete} />
```

---

## Search & Navigation Components

### Landing Booking Query

Multi-step booking search component for the landing page.

**Location:** `src/components/landing-booking-query.tsx`

**Features:**
- Multi-step search wizard
- Service type selection
- Location-based search
- Online/in-person consultation options
- Responsive design with container-based layout

**Props:**
- None (self-contained component)

**Example:**
```tsx
import LandingBookingQuery from '@/components/landing-booking-query';

<LandingBookingQuery />
```

**Key Features:**
- Adaptive grid layout based on container size
- Location services integration
- Service type filtering
- Search result aggregation

### Search Form

Sidebar search form component.

**Location:** `src/components/search-form.tsx`

**Features:**
- Real-time search
- Sidebar integration
- Search icon
- Accessibility labels

**Example:**
```tsx
import { SearchForm } from '@/components/search-form';

<SearchForm onSearch={handleSearch} />
```

### Back Button

Navigation back button with history integration.

**Location:** `src/components/back-button.tsx`

**Features:**
- Browser history navigation
- Customizable appearance
- Accessibility support

**Example:**
```tsx
import { BackButton } from '@/components/back-button';

<BackButton />
```

---

## Form Components

### Input Tags

Tag input component for multiple values.

**Location:** `src/components/input-tags.tsx`

**Features:**
- Multiple tag input
- Tag validation
- Duplicate prevention
- Keyboard shortcuts (Enter, Comma)
- Tag removal functionality

**Props:**
- `value`: Array of string tags
- `onChange`: Function to handle tag changes
- `placeholder`: Placeholder text

**Example:**
```tsx
import { InputTags } from '@/components/input-tags';

const [tags, setTags] = useState<string[]>([]);

<InputTags
  value={tags}
  onChange={setTags}
  placeholder="Add tags"
/>
```

**Key Features:**
- Automatic lowercase conversion
- Duplicate tag prevention
- Visual tag badges with removal buttons
- Keyboard navigation support

---

## Upload Components

### Document Uploader

Comprehensive file upload component with drag-and-drop support.

**Location:** `src/components/document-uploader.tsx`

**Features:**
- Drag and drop file upload
- File type validation
- Progress indicators
- File size limits
- Preview and removal options
- Integration with Vercel Blob storage

**Props:**
- `onUpload`: Callback function for upload completion
- `acceptedFormats`: Array of accepted file formats
- `currentFileUrl`: URL of currently uploaded file
- `directory`: Upload directory path
- `purpose`: Purpose identifier for file naming

**Example:**
```tsx
import { DocumentUploader } from '@/components/document-uploader';

<DocumentUploader
  onUpload={handleUpload}
  acceptedFormats={['.pdf', '.jpg', '.png']}
  directory="medical-documents"
  purpose="license-verification"
/>
```

**Key Features:**
- File validation (type and size)
- Progress tracking
- Error handling and toast notifications
- Current file display with view link
- Drag and drop visual feedback

---

## Status & Display Components

### Status Badge

Displays status information with color-coded badges.

**Location:** `src/components/status-badge.tsx`

**Features:**
- Multiple status types
- Color-coded display
- Dark/light theme support
- Consistent styling

**Props:**
- `status`: Status value ('PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED')
- `className`: Additional CSS classes

**Example:**
```tsx
import { StatusBadge } from '@/components/status-badge';

<StatusBadge status="APPROVED" />
<StatusBadge status="PENDING" />
<StatusBadge status="REJECTED" />
```

**Status Types:**
- **PENDING**: Yellow theme for pending actions
- **APPROVED**: Green theme for approved items
- **REJECTED**: Red theme for rejected items
- **SUSPENDED**: Gray theme for suspended items

### User Button with Name

User profile button with name display.

**Location:** `src/components/user-button-with-name.tsx`

**Features:**
- User avatar and name display
- Profile navigation
- Session integration

**Example:**
```tsx
import { UserButtonWithName } from '@/components/user-button-with-name';

<UserButtonWithName />
```

### Empty State

Empty state component for when no data is available.

**Location:** `src/components/empty-state.tsx`

**Features:**
- Customizable message
- Icon display
- Call-to-action button
- Responsive design

**Example:**
```tsx
import { EmptyState } from '@/components/empty-state';

<EmptyState
  title="No bookings found"
  description="You haven't made any bookings yet"
  action={<Button>Create Booking</Button>}
/>
```

---

## Skeleton Components

### Provider Profile Skeleton

Loading skeleton for provider profile pages.

**Location:** `src/components/skeletons/provider-profile-skeleton.tsx`

**Features:**
- Matches provider profile layout
- Responsive skeleton design
- Progressive loading states

**Example:**
```tsx
import { ProviderProfileSkeleton } from '@/components/skeletons/provider-profile-skeleton';

<ProviderProfileSkeleton />
```

### Organization Profile Skeleton

Loading skeleton for organization profile pages.

**Location:** `src/components/skeletons/organization-profile-skeleton.tsx`

**Features:**
- Matches organization profile layout
- Responsive skeleton design
- Progressive loading states

**Example:**
```tsx
import { OrganizationProfileSkeleton } from '@/components/skeletons/organization-profile-skeleton';

<OrganizationProfileSkeleton />
```

### General Skeleton

Generic skeleton component for loading states.

**Location:** `src/components/skeletons/skeleton.tsx`

**Features:**
- Customizable dimensions
- Animation effects
- Multiple skeleton types

**Example:**
```tsx
import { Skeleton } from '@/components/skeletons/skeleton';

<Skeleton className="h-4 w-[200px]" />
```

---

## Calendar Components

### Calendar Loader

Loading component for calendar operations.

**Location:** `src/components/calendar-loader.tsx`

**Features:**
- Calendar-specific loading states
- Progress indicators
- Error handling

**Example:**
```tsx
import { CalendarLoader } from '@/components/calendar-loader';

<CalendarLoader />
```

### Cancel Button

Cancellation button for bookings and appointments.

**Location:** `src/components/cancel-button.tsx`

**Features:**
- Confirmation dialog
- Cancellation logic
- Loading states

**Example:**
```tsx
import { CancelButton } from '@/components/cancel-button';

<CancelButton
  bookingId={bookingId}
  onCancel={handleCancel}
/>
```

---

## Organization Components

### Organization Connections Manager

Manages connections between organizations and providers.

**Location:** `src/features/organizations/components/organization-connections-manager.tsx`

**Features:**
- Provider search and invitation
- Connection management
- Status tracking
- Bulk operations

**Example:**
```tsx
import { OrganizationConnectionsManager } from '@/features/organizations/components';

<OrganizationConnectionsManager organizationId={organizationId} />
```

---

## Utility Components

### Section

Reusable section component for consistent layout.

**Location:** `src/components/section.tsx`

**Features:**
- Consistent spacing
- Title and description support
- Responsive design

**Example:**
```tsx
import { Section } from '@/components/section';

<Section title="Profile Information" description="Manage your profile settings">
  <ProfileForm />
</Section>
```

### Logo

Application logo component.

**Location:** `src/components/logo.tsx`

**Features:**
- SVG logo display
- Responsive sizing
- Theme integration

**Example:**
```tsx
import Logo from '@/components/logo';

<Logo />
```

### Google Icon

Google branding icon component.

**Location:** `src/components/google-icon.tsx`

**Features:**
- Official Google colors
- Proper sizing
- Accessibility support

**Example:**
```tsx
import { GoogleIcon } from '@/components/google-icon';

<GoogleIcon />
```

### Mode Toggle

Theme toggle component for dark/light mode.

**Location:** `src/components/mode-toggle.tsx`

**Features:**
- Theme switching
- System preference detection
- Persistent storage

**Example:**
```tsx
import { ModeToggle } from '@/components/mode-toggle';

<ModeToggle />
```

---

## Provider Integration

### Providers

Global providers for application state management.

**Location:** `src/components/providers.tsx`

**Features:**
- React Query provider
- Theme provider
- Session provider
- Toast provider

**Example:**
```tsx
import { Providers } from '@/components/providers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Query Loader

Loading component for React Query operations.

**Location:** `src/components/query-loader.tsx`

**Features:**
- Query state management
- Loading indicators
- Error boundaries

**Example:**
```tsx
import { QueryLoader } from '@/components/query-loader';

<QueryLoader query={query}>
  {(data) => <DataComponent data={data} />}
</QueryLoader>
```

---

## Best Practices

### Component Structure
- Follow the established feature-based organization
- Use TypeScript for all components
- Implement proper error boundaries
- Include loading states for async operations

### State Management
- Use React Query for server state
- Implement proper caching strategies
- Handle optimistic updates where appropriate
- Use proper error handling

### Accessibility
- Include proper ARIA labels
- Implement keyboard navigation
- Ensure color contrast compliance
- Test with screen readers

### Performance
- Implement code splitting where appropriate
- Use React.memo for expensive components
- Optimize re-renders with proper dependencies
- Implement proper loading states

### Testing
- Write unit tests for complex logic
- Test user interactions
- Verify accessibility compliance
- Test error scenarios

---

## Integration Notes

### Authentication
- All components integrate with NextAuth.js
- Session management is handled globally
- Role-based access control is implemented
- Secure API communication

### Data Fetching
- React Query is used for server state
- Proper error handling and retry logic
- Optimistic updates for better UX
- Caching strategies implemented

### Styling
- Tailwind CSS for consistent styling
- Dark/light theme support
- Responsive design principles
- Component-specific styling patterns

### Form Handling
- React Hook Form integration
- Zod validation schemas
- Proper error messaging
- Accessibility compliance
