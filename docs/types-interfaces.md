# Types & Interfaces Documentation

This document provides comprehensive documentation for all TypeScript types and interfaces in the MedBookings application. These type definitions ensure type safety, better developer experience, and clear contracts between different parts of the application.

## Table of Contents

- [Core Types](#core-types)
- [Authentication Types](#authentication-types)
- [API Response Types](#api-response-types)
- [Calendar & Scheduling Types](#calendar--scheduling-types)
- [Provider Types](#provider-types)
- [Organization Types](#organization-types)
- [Notification Types](#notification-types)
- [Admin Types](#admin-types)
- [Component Props Types](#component-props-types)
- [Utility Types](#utility-types)
- [Third-Party Type Declarations](#third-party-type-declarations)

---

## Core Types

### API Response Types

General-purpose API response types used throughout the application.

**Location:** `src/lib/types.ts`

```typescript
export type ApiResponse<T> = {
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
};
```

**Usage:**

```typescript
// API function return type
async function fetchProviders(): Promise<ApiResponse<Provider[]>> {
  // Implementation
}

// Component handling API response
function MyComponent() {
  const [response, setResponse] = useState<ApiResponse<User>>();

  if (response?.error) {
    return <div>Error: {response.error}</div>;
  }

  return <div>User: {response?.data?.name}</div>;
}
```

**Features:**

- **Generic**: Supports any data type
- **Error Handling**: Structured error information
- **Validation**: Field-level and form-level error support

---

## Authentication Types

### NextAuth Extended Types

Extended types for NextAuth.js integration with user roles.

**Location:** `src/types/next-auth.d.ts`

```typescript
import { UserRole } from '@prisma/client';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession['user'];
  }

  interface User {
    role: UserRole;
  }
}
```

**Extended Session Interface:**

- `user.id`: User database ID
- `user.role`: User role from Prisma enum
- `user.name`: User's display name
- `user.email`: User's email address
- `user.image`: User's profile image URL

**User Roles:**

```typescript
enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}
```

**Usage:**

```typescript
import { useSession } from 'next-auth/react';

function ProfileComponent() {
  const { data: session } = useSession();

  if (session?.user) {
    return (
      <div>
        <p>Welcome, {session.user.name}</p>
        <p>Role: {session.user.role}</p>
        <p>ID: {session.user.id}</p>
      </div>
    );
  }

  return <div>Please sign in</div>;
}
```

### User Profile Types

**Location:** `src/features/profile/types/types.ts`

```typescript
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  preferences?: Record<string, any>;
}

export interface UpdateProfileRequest {
  name?: string;
  image?: string;
  preferences?: Record<string, any>;
}

export interface UpdateProfileResponse {
  success: boolean;
  user?: UserProfile;
  error?: string;
}

export interface DeleteAccountResponse {
  success: boolean;
  error?: string;
}
```

---

## API Response Types

### Standard Response Patterns

Common response types used across different API endpoints.

```typescript
// Generic success response
interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// Generic error response
interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
  timestamp?: string;
}

// Combined response type
type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
```

### Pagination Types

```typescript
interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

---

## Calendar & Scheduling Types

### Calendar View Types

**Location:** `src/types/calendar.ts`

```typescript
export const CalendarViewType = {
  slots: 'slots',
} as const;

export const ProviderCalendarViewType = {
  day: 'day',
  week: 'week',
  schedule: 'schedule',
} as const;

export type CalendarViewType = (typeof CalendarViewType)[keyof typeof CalendarViewType];

export type ProviderCalendarViewType =
  (typeof ProviderCalendarViewType)[keyof typeof ProviderCalendarViewType];

export interface TimeRange {
  earliestTime: number; // 24-hour format (e.g., 9 for 9:00)
  latestTime: number; // 24-hour format (e.g., 17 for 17:00)
}
```

### Availability Types

**Location:** `src/features/calendar/availability/types/interfaces.ts`

```typescript
export interface Availability extends PrismaAvailability {}

export interface AvailabilityWithRelations extends PrismaAvailability {
  provider: {
    id: string;
    name: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  service?: {
    id: string;
    name: string;
    duration: number;
  };
  location?: {
    id: string;
    name: string;
    address: string;
  };
}

export interface RecurrencePattern {
  type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  dayOfMonth?: number;
  weekOfMonth?: number;
  monthOfYear?: number;
  endDate?: string;
  maxOccurrences?: number;
  timezone?: string;
  excludeDates?: string[];
  customRules?: Record<string, any>;
}

export interface TimeSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  isBooked: boolean;
  providerId: string;
  serviceId?: string;
  locationId?: string;
  metadata?: Record<string, any>;
}
```

### Scheduling Types

```typescript
export interface SchedulingRuleConfig {
  type: 'buffer' | 'break' | 'lunch' | 'custom';
  duration: number; // minutes
  applyBefore?: boolean;
  applyAfter?: boolean;
  priority: number;
}

export interface SlotGenerationRequest {
  startDate: Date;
  endDate: Date;
  availabilityIds: string[];
  includeBooked?: boolean;
  filterByService?: string;
}

export interface SlotGenerationResult {
  slots: TimeSlot[];
  totalGenerated: number;
  conflicts: AvailabilityConflict[];
  warnings: string[];
}

export interface AvailabilityConflict {
  type: 'overlapping' | 'scheduling_rule' | 'booking_conflict';
  description: string;
  affectedSlots: string[];
  severity: 'low' | 'medium' | 'high';
  resolutionSuggestion?: string;
}
```

### Booking Types

**Location:** `src/features/calendar/bookings/types/types.ts`

```typescript
export type BookingView = Pick<z.infer<typeof BookingSchema>, 'id' | 'status'> & {
  startTime: Date;
  endTime: Date;
  service: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
  provider: {
    id: string;
    name: string;
    email: string;
  };
  patient?: {
    id: string;
    name: string;
    email: string;
  };
  location?: {
    id: string;
    name: string;
    address: string;
  };
};

export type BookingFormValues = {
  serviceId: string;
  providerId: string;
  startTime: Date;
  patientId?: string;
  locationId?: string;
  notes?: string;
  isOnline: boolean;
  paymentMethod?: string;
};

export type BookingResponse = ApiResponse<{
  booking: BookingView;
  paymentUrl?: string;
  confirmationCode: string;
}>;
```

---

## Provider Types

### Provider Form Types

**Location:** `src/features/providers/hooks/types.ts`

```typescript
export interface SerializedService {
  id: string;
  name: string;
  description: string;
  category: string;
  serviceTypeId: string;
  isActive: boolean;
  defaultDuration: number;
  defaultPrice: number;
  requiresLocation: boolean;
  supportsOnline: boolean;
  metadata?: Record<string, any>;
}

export interface SerializedProvider {
  id: string;
  name: string;
  bio?: string;
  email: string;
  whatsapp?: string;
  website?: string;
  image?: string;
  languages: string[];
  isActive: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  providerTypeId: string;
  services: SerializedService[];
  locations: any[];
  rating?: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export const SUPPORTED_LANGUAGES = [
  'english',
  'afrikaans',
  'zulu',
  'xhosa',
  'sotho',
  'tswana',
  'pedi',
  'venda',
  'tsonga',
  'ndebele',
  'swati',
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
```

### Validation Configuration Types

```typescript
export interface ValidationConfigBase {
  required: boolean;
  label: string;
  helpText?: string;
  errorMessage?: string;
}

export interface BooleanValidationConfig extends ValidationConfigBase {
  type: 'boolean';
  defaultValue?: boolean;
}

export interface DocumentValidationConfig extends ValidationConfigBase {
  type: 'document';
  acceptedFormats: string[];
  maxSizeInMB: number;
}

export interface TextValidationConfig extends ValidationConfigBase {
  type: 'text';
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  placeholder?: string;
}

export interface DateValidationConfig extends ValidationConfigBase {
  type: 'date';
  minDate?: Date;
  maxDate?: Date;
  format?: string;
}

export interface NumberValidationConfig extends ValidationConfigBase {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export interface PredefinedListValidationConfig extends ValidationConfigBase {
  type: 'predefined_list';
  options: Array<{ value: string; label: string }>;
  allowMultiple: boolean;
}

export type ValidationConfig =
  | BooleanValidationConfig
  | DocumentValidationConfig
  | TextValidationConfig
  | DateValidationConfig
  | NumberValidationConfig
  | PredefinedListValidationConfig;
```

### Provider Data Types

```typescript
export type ProviderTypeData = {
  id: string;
  name: string;
  description?: string;
  requirements: RequirementTypeData[];
};

export type RequirementTypeData = {
  id: string;
  name: string;
  description?: string;
  type: string;
  required: boolean;
  validationConfig: ValidationConfig;
  displayOrder: number;
  isActive: boolean;
};

export type ServiceTypeData = {
  id: string;
  name: string;
  description?: string;
  category: string;
  defaultDuration: number;
  defaultPrice: number;
  requiresLocation: boolean;
  supportsOnline: boolean;
  isActive: boolean;
};
```

---

## Organization Types

### Organization Registration Types

**Location:** `src/features/organizations/types/types.ts`

```typescript
export type OrganizationRegistrationData = z.infer<typeof organizationRegistrationSchema>;

export type OrganizationBasicInfoData = z.infer<typeof organizationBasicInfoSchema>;

export type OrganizationLocationsData = z.infer<typeof organizationLocationsSchema>;

export interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
}
```

### Invitation Types

```typescript
export type ProviderInvitationData = z.infer<typeof ProviderInvitationSchema>;

export type ProviderInvitationWithDetails = ProviderInvitation & {
  organization: {
    id: string;
    name: string;
    email: string;
    logo?: string;
  };
  invitedBy: {
    id: string;
    name: string;
    email: string;
  };
};

export type InvitationAction = z.infer<typeof InvitationActionSchema>;
```

### Connection Types

```typescript
export interface OrganizationProviderConnection {
  id: string;
  organizationId: string;
  providerId: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  role: 'MEMBER' | 'ADMIN' | 'OWNER';
  startDate: Date;
  endDate?: Date;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type OrganizationConnectionWithDetails = OrganizationProviderConnection & {
  organization: {
    id: string;
    name: string;
    email: string;
    logo?: string;
    address?: string;
  };
  provider: {
    id: string;
    name: string;
    email: string;
    image?: string;
    specialization?: string;
  };
};
```

---

## Notification Types

### Communication Types

**Location:** `src/features/communications/types/types.ts`

```typescript
export interface NotificationContent {
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
}

export interface NotificationRecipient {
  id: string;
  email?: string;
  phone?: string;
  userId?: string;
  preferredChannels: NotificationChannel[];
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: TemplateType;
  content: {
    subject?: string;
    body: string;
    variables: string[];
  };
  isActive: boolean;
}

export const NotificationChannel = {
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  IN_APP: 'in_app',
} as const;

export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];

export const TemplateType = {
  BOOKING_CONFIRMATION: 'booking_confirmation',
  BOOKING_REMINDER: 'booking_reminder',
  BOOKING_CANCELLATION: 'booking_cancellation',
  INVITATION: 'invitation',
  PASSWORD_RESET: 'password_reset',
} as const;

export type TemplateType = (typeof TemplateType)[keyof typeof TemplateType];

export const NotificationType = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
```

### Notification Options

```typescript
export interface NotificationOptions {
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduleAt?: Date;
  retryAttempts?: number;
  channels: NotificationChannel[];
  template?: string;
  variables?: Record<string, string>;
}

export interface TemplateData {
  [key: string]: string | number | boolean | Date;
}
```

---

## Admin Types

### Admin Interface Types

**Location:** `src/features/admin/types/interfaces.ts`

```typescript
export interface UseAdminProvidersResult {
  providers: any[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseAdminOrganizationsResult {
  organizations: any[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface AdminMutationOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export interface UseApproveProviderMutation {
  mutate: (data: { id: string; reason?: string }) => void;
  isLoading: boolean;
  error: Error | null;
}

export interface UseRejectProviderMutation {
  mutate: (data: { id: string; reason: string }) => void;
  isLoading: boolean;
  error: Error | null;
}
```

### Admin API Types

**Location:** `src/features/admin/types/types.ts`

```typescript
export interface AdminApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AdminApiErrorResponse {
  success: false;
  error: string;
  details?: any;
  code?: string;
  timestamp: string;
}

export interface ApproveProviderRequest {
  id: string;
  reason?: string;
}

export interface RejectProviderRequest {
  id: string;
  reason: string;
}

export interface ApproveOrganizationRequest {
  id: string;
  reason?: string;
}

export interface RejectOrganizationRequest {
  id: string;
  reason: string;
}
```

### Admin Schema Types

**Location:** `src/features/admin/types/schemas.ts`

```typescript
export type RejectionReasonInput = z.infer<typeof rejectionReasonSchema>;
export type AdminActionInput = z.infer<typeof adminActionSchema>;
export type ApproveProviderRequestInput = z.infer<typeof approveProviderRequestSchema>;
export type RejectProviderRequestInput = z.infer<typeof rejectProviderRequestSchema>;
export type ApproveOrganizationRequestInput = z.infer<typeof approveOrganizationRequestSchema>;
export type RejectOrganizationRequestInput = z.infer<typeof rejectOrganizationRequestSchema>;
export type AdminSearchParamsInput = z.infer<typeof adminSearchParamsSchema>;
export type AdminRouteParamsInput = z.infer<typeof adminRouteParamsSchema>;
```

---

## Component Props Types

### Common Props Patterns

Throughout the application, component props follow consistent patterns:

```typescript
// Base component props
interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Page component props (from Next.js routing)
interface PageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

// Form component props
interface FormComponentProps {
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  initialData?: any;
  errors?: Record<string, string[]>;
}

// Modal/Dialog props
interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Table/List component props
interface ListComponentProps<T> {
  data: T[];
  isLoading?: boolean;
  onRowClick?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  pagination?: PaginationParams;
}
```

### Specific Component Props Examples

```typescript
// Auth button props
interface AuthButtonProps {
  profileMenuItems?: MenuItemType[];
  className?: string;
}

// Provider profile view props
interface ProviderProfileViewProps {
  providerId: string;
  editable?: boolean;
  showActions?: boolean;
}

// Organization calendar props
interface OrganizationCalendarViewProps {
  organizationId: string;
  view: 'day' | 'week' | 'month';
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onViewChange: (view: string) => void;
}

// Search interface props
interface ProviderSearchInterfaceProps {
  initialFilters?: ServiceFilterParams;
  onResultsChange?: (results: ServiceResult[]) => void;
  showMap?: boolean;
  enableBooking?: boolean;
}
```

---

## Utility Types

### Hook Return Types

Common patterns for custom hook return types:

```typescript
// Query hook return type
interface UseQueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Mutation hook return type
interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  isLoading: boolean;
  error: Error | null;
  reset: () => void;
}

// Form hook return type
interface UseFormResult<T> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  handleChange: (field: keyof T, value: any) => void;
  handleSubmit: (onSubmit: (values: T) => void) => void;
  reset: () => void;
  setValues: (values: Partial<T>) => void;
}
```

### Event Handler Types

```typescript
// Form event handlers
type FormSubmitHandler<T> = (data: T, event?: React.FormEvent) => void;
type FormChangeHandler<T> = (field: keyof T, value: any) => void;
type FormValidationHandler<T> = (data: T) => Record<keyof T, string>;

// Click event handlers
type ClickHandler = (event: React.MouseEvent) => void;
type ButtonClickHandler = (event: React.MouseEvent<HTMLButtonElement>) => void;

// Navigation handlers
type NavigationHandler = (url: string) => void;
type RouteChangeHandler = (route: string, params?: any) => void;
```

### Conditional Types

```typescript
// Make certain fields optional
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Make certain fields required
type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Extract specific fields
type PickByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};

// Exclude specific fields
type OmitByType<T, U> = {
  [K in keyof T as T[K] extends U ? never : K]: T[K];
};
```

---

## Third-Party Type Declarations

### VCards Library Types

**Location:** `src/types/vcards-js.d.ts`

```typescript
declare module 'vcards-js' {
  interface VCard {
    firstName: string;
    lastName?: string;
    workPhone?: string;
    url?: string;
    getFormattedString(): string;
  }

  function vCards(): VCard;
  export = vCards;
}
```

**Usage:**

```typescript
import vCards from 'vcards-js';

function generateVCard(provider: Provider) {
  const vCard = vCards();
  vCard.firstName = provider.name.split(' ')[0];
  vCard.lastName = provider.name.split(' ').slice(1).join(' ');
  vCard.workPhone = provider.whatsapp;
  vCard.url = provider.website;

  return vCard.getFormattedString();
}
```

### Prisma Generated Types

The application relies heavily on Prisma-generated types:

```typescript
// Import Prisma types
import {
  Availability,
  Booking,
  BookingStatus,
  Organization,
  SchedulingRule,
  Provider,
  User,
  UserRole,
} from '@prisma/client';

// Extended types with relations
type ProviderWithRelations = Provider & {
  user: User;
  services: Service[];
  bookings: Booking[];
  availability: Availability[];
  organizations: Organization[];
};

type BookingWithRelations = Booking & {
  patient: User;
  provider: Provider;
  service: Service;
  organization?: Organization;
};
```

---

## Type Guards and Validation

### Type Guard Functions

```typescript
// User role type guards
function isAdmin(user: User): user is User & { role: 'ADMIN' | 'SUPER_ADMIN' } {
  return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
}

function isProvider(user: User): boolean {
  return Boolean(user.provider);
}

// API response type guards
function isSuccessResponse<T>(response: ApiResponse<T>): response is SuccessResponse<T> {
  return 'success' in response && response.success === true;
}

function isErrorResponse(response: ApiResponse<any>): response is ErrorResponse {
  return 'success' in response && response.success === false;
}

// Object type guards
function hasRequiredFields<T extends Record<string, any>>(obj: any, fields: (keyof T)[]): obj is T {
  return fields.every((field) => field in obj && obj[field] !== undefined);
}
```

### Validation Schemas with Zod

```typescript
import { z } from 'zod';

// User validation schema
const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']),
  isActive: z.boolean(),
});

// Provider registration schema
const providerRegistrationSchema = z.object({
  basicInfo: z.object({
    name: z.string().min(2).max(100),
    bio: z.string().max(500).optional(),
    email: z.string().email(),
    whatsapp: z.string().optional(),
    website: z.string().url().optional(),
    languages: z.array(z.string()).min(1),
  }),
  providerTypeId: z.string().uuid(),
  services: z.object({
    availableServices: z.array(z.string().uuid()).min(1),
    serviceConfigs: z
      .record(
        z.object({
          duration: z.number().min(15).max(480),
          price: z.number().min(0),
        })
      )
      .optional(),
  }),
});

// Infer types from schemas
type User = z.infer<typeof userSchema>;
type ProviderRegistration = z.infer<typeof providerRegistrationSchema>;
```

---

## Best Practices

### Type Definition Guidelines

1. **Use Interface for Object Types**

   ```typescript
   // Preferred
   interface User {
     id: string;
     name: string;
   }

   // Avoid for object types
   type User = {
     id: string;
     name: string;
   }
   ```

2. **Use Type for Unions and Computed Types**

   ```typescript
   // Preferred
   type Status = 'pending' | 'approved' | 'rejected';
   type UserWithProvider = User & { provider: Provider };
   ```

3. **Use Enums for Constants**

   ```typescript
   enum UserRole {
     USER = 'USER',
     ADMIN = 'ADMIN',
     SUPER_ADMIN = 'SUPER_ADMIN',
   }
   ```

4. **Generic Type Constraints**
   ```typescript
   interface ApiClient<T extends Record<string, any>> {
     get(id: string): Promise<T>;
     create(data: Omit<T, 'id'>): Promise<T>;
     update(id: string, data: Partial<T>): Promise<T>;
   }
   ```

### Naming Conventions

- **Interfaces**: PascalCase, descriptive names
- **Types**: PascalCase, often with suffix like `Type`, `Data`, `Props`
- **Enums**: PascalCase for enum name, UPPER_CASE for values
- **Generic Parameters**: Single letters (`T`, `K`, `V`) or descriptive names

### Documentation

```typescript
/**
 * Represents a service provider in the system
 * @interface Provider
 */
interface Provider {
  /** Unique identifier for the provider */
  id: string;

  /** Provider's display name */
  name: string;

  /** Optional biographical information */
  bio?: string;

  /** Provider's current status in the system */
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

  /** Services offered by this provider */
  services: Service[];
}
```

### Error Handling with Types

```typescript
// Result type for operations that can fail
type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

// Usage
async function fetchUser(id: string): Promise<Result<User, string>> {
  try {
    const user = await userRepository.findById(id);
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

---

## Testing Types

### Mock Types for Testing

```typescript
// Mock data factory types
type MockFactory<T> = (overrides?: Partial<T>) => T;

// Test utilities
interface TestWrapper {
  component: ReactWrapper;
  props: any;
  rerender: (newProps?: any) => void;
  unmount: () => void;
}

// Mock API response
type MockApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  delay?: number;
};
```

This comprehensive type system ensures type safety throughout the application, provides excellent developer experience with IntelliSense, and helps catch errors at compile time rather than runtime.
