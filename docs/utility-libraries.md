# Utility Libraries Documentation

This document provides comprehensive documentation for all utility functions and helper libraries in the MedBookings application. These utilities provide reusable functionality for common tasks like styling, date handling, file operations, and server-side operations.

## Table of Contents

- [Core Utilities](#core-utilities)
- [Date & Time Utilities](#date--time-utilities)
- [File & Document Utilities](#file--document-utilities)
- [Server Utilities](#server-utilities)
- [Invitation Utilities](#invitation-utilities)
- [Debug Utilities](#debug-utilities)
- [Constants & Configuration](#constants--configuration)
- [Authentication Utilities](#authentication-utilities)
- [Query Utilities](#query-utilities)

---

## Core Utilities

### Class Name Utility (cn)

A utility function for merging CSS classes with Tailwind CSS support.

**Location:** `src/lib/utils.ts`

**Function:**

```typescript
function cn(...inputs: ClassValue[]): string;
```

**Description:** Combines multiple class names and merges Tailwind CSS classes intelligently, removing conflicts and duplicates.

**Parameters:**

- `inputs`: Array of class names, objects, or conditional classes

**Returns:** Merged and optimized class string

**Example:**

```typescript
import { cn } from '@/lib/utils';

// Basic usage
const className = cn('bg-red-500', 'text-white');
// Result: 'bg-red-500 text-white'

// Conditional classes
const className = cn(
  'px-4 py-2',
  isActive && 'bg-blue-500',
  !isActive && 'bg-gray-500'
);

// Merging conflicting classes (Tailwind-aware)
const className = cn('bg-red-500', 'bg-blue-500');
// Result: 'bg-blue-500' (later class wins)

// Object syntax
const className = cn({
  'bg-red-500': isError,
  'bg-green-500': isSuccess,
  'text-white': true
});

// Array with mixed types
const className = cn([
  'base-class',
  isActive && 'active-class',
  { 'conditional-class': shouldShow }
]);
```

**Key Features:**

- **Intelligent Merging**: Handles Tailwind CSS class conflicts
- **Conditional Support**: Supports boolean conditions
- **Multiple Formats**: Accepts strings, objects, arrays, and mixed types
- **Performance Optimized**: Efficient class merging and deduplication

---

## Date & Time Utilities

### Timezone Helper Functions

Utilities for handling timezone conversions and date formatting.

**Location:** `src/lib/timezone-helper.ts`

**Default Timezone:** `Africa/Johannesburg` (GMT+2)

#### convertUTCToLocal

Converts UTC date to local timezone.

```typescript
function convertUTCToLocal(utcDate: string | Date, timezone = DEFAULT_TIMEZONE): Date;
```

**Example:**

```typescript
import { convertUTCToLocal } from '@/lib/timezone-helper';

const utcDate = '2024-01-15T10:00:00Z';
const localDate = convertUTCToLocal(utcDate);
// Returns: Date object in Africa/Johannesburg timezone

// Custom timezone
const nycDate = convertUTCToLocal(utcDate, 'America/New_York');
```

#### convertLocalToUTC

Converts local date to UTC.

```typescript
function convertLocalToUTC(localDate: Date, timezone = DEFAULT_TIMEZONE): Date;
```

**Example:**

```typescript
import { convertLocalToUTC } from '@/lib/timezone-helper';

const localDate = new Date(2024, 0, 15, 12, 0); // January 15, 12:00 local
const utcDate = convertLocalToUTC(localDate);
// Returns: Date object in UTC
```

#### formatLocalTime

Formats UTC date as local time string (HH:mm).

```typescript
function formatLocalTime(utcDate: string | Date, timezone = DEFAULT_TIMEZONE): string;
```

**Example:**

```typescript
import { formatLocalTime } from '@/lib/timezone-helper';

const utcDate = '2024-01-15T10:00:00Z';
const timeString = formatLocalTime(utcDate);
// Returns: '12:00' (in Johannesburg timezone)
```

#### formatLocalDate

Formats UTC date as local date string (yyyy-MM-dd).

```typescript
function formatLocalDate(utcDate: string | Date, timezone = DEFAULT_TIMEZONE): string;
```

**Example:**

```typescript
import { formatLocalDate } from '@/lib/timezone-helper';

const utcDate = '2024-01-15T22:00:00Z';
const dateString = formatLocalDate(utcDate);
// Returns: '2024-01-16' (next day in Johannesburg timezone)
```

#### formatLocalDateWeekdayMonthDay

Formats UTC date as local date with weekday and month (EEE, MMM dd).

```typescript
function formatLocalDateWeekdayMonthDay(
  utcDate: string | Date,
  timezone = DEFAULT_TIMEZONE
): string;
```

**Example:**

```typescript
import { formatLocalDateWeekdayMonthDay } from '@/lib/timezone-helper';

const utcDate = '2024-01-15T10:00:00Z';
const formatted = formatLocalDateWeekdayMonthDay(utcDate);
// Returns: 'Mon, Jan 15'
```

#### getLocalDayBounds

Gets start and end of day in local timezone, returned as UTC dates.

```typescript
function getLocalDayBounds(
  utcDate: string | Date,
  timezone = DEFAULT_TIMEZONE
): { start: Date; end: Date };
```

**Example:**

```typescript
import { getLocalDayBounds } from '@/lib/timezone-helper';

const utcDate = '2024-01-15T10:00:00Z';
const bounds = getLocalDayBounds(utcDate);
// Returns: {
//   start: Date (UTC for start of day in Johannesburg),
//   end: Date (UTC for end of day in Johannesburg)
// }
```

### Time Formatting Helper

**Location:** `src/lib/helper.ts`

#### formatTime

Formats a Date object as a 24-hour time string.

```typescript
function formatTime(date: Date): string;
```

**Example:**

```typescript
import { formatTime } from '@/lib/helper';

const date = new Date('2024-01-15T14:30:00');
const timeString = formatTime(date);
// Returns: '14:30'
```

---

## File & Document Utilities

### Document Utilities

Utilities for handling document and file operations.

**Location:** `src/lib/utils/document-utils.ts`

#### extractFilenameFromUrl

Extracts the original filename from a URL following the application's naming convention.

```typescript
function extractFilenameFromUrl(url: string): string;
```

**Description:** Parses URLs generated by the upload system to extract the original filename from the encoded path.

**Parameters:**

- `url`: The full URL of the uploaded file

**Returns:** The original filename, decoded and formatted

**Example:**

```typescript
import { extractFilenameFromUrl } from '@/lib/utils/document-utils';

// URL with new naming convention
const url =
  'https://blob.vercel-storage.com/documents/uuid-|-license-|-20240115-143000-|-medical-license.pdf';
const filename = extractFilenameFromUrl(url);
// Returns: 'medical-license.pdf'

// URL with legacy naming convention
const legacyUrl =
  'https://blob.vercel-storage.com/documents/uuid-%7C-license-%7C-20240115-143000-%7C-medical-license.pdf';
const legacyFilename = extractFilenameFromUrl(legacyUrl);
// Returns: 'medical-license.pdf'

// Fallback for unrecognized format
const unknownUrl = 'https://example.com/unknown-format.pdf';
const fallback = extractFilenameFromUrl(unknownUrl);
// Returns: 'unknown-format.pdf'
```

**Naming Convention Support:**

- **Current**: Uses `-|-` as separators
- **Legacy**: Uses `-%7C-` (URL-encoded pipe) as separators
- **Format**: `{uuid}-|-{purpose}-|-{datetime}-|-{originalFilename}`

### File Upload Utilities

**Location:** `src/lib/utils/utils-upload-to-blob.ts`

#### uploadToBlob

Server action for uploading files to Vercel Blob storage.

```typescript
async function uploadToBlob(
  file: File,
  userId: string,
  directory: string = 'profile-images',
  purpose: string
): Promise<{ url?: string; success: boolean; error?: string }>;
```

**Description:** Uploads a file to Vercel Blob storage with organized naming convention.

**Parameters:**

- `file`: The File object to upload
- `userId`: ID of the user uploading the file
- `directory`: Storage directory (optional, defaults to 'profile-images')
- `purpose`: Purpose identifier for the file (e.g., 'license', 'certification')

**Returns:** Object with success status and URL or error message

**Example:**

```typescript
import { uploadToBlob } from '@/lib/utils/utils-upload-to-blob';

// Upload a medical license
const result = await uploadToBlob(file, 'user-123', 'documents', 'medical-license');

if (result.success) {
  console.log('File uploaded:', result.url);
} else {
  console.error('Upload failed:', result.error);
}
```

**File Naming Convention:**

```
{uuid}-|-{sanitizedPurpose}-|-{datetime}-|-{sanitizedFilename}
```

**Example Generated Filename:**

```
a1b2c3d4-e5f6-7890-abcd-ef1234567890-|-medical-license-|-20240115-143000-|-medical_license.pdf
```

**Features:**

- **Unique Identifiers**: Uses UUID for uniqueness
- **Timestamp**: Includes upload timestamp
- **Purpose Tracking**: Categorizes files by purpose
- **Sanitization**: Removes problematic characters from filenames
- **Public Access**: Files are publicly accessible via URL

---

## Server Utilities

### Server Helper Functions

Utilities for server-side operations and authentication.

**Location:** `src/lib/server-helper.ts`

#### getServiceProviderId

Gets service provider ID for a given user ID.

```typescript
async function getServiceProviderId(userId: string): Promise<string | null>;
```

**Example:**

```typescript
import { getServiceProviderId } from '@/lib/server-helper';

const providerId = await getServiceProviderId('user-123');
if (providerId) {
  console.log('Provider ID:', providerId);
} else {
  console.log('User is not a service provider');
}
```

#### getAuthenticatedServiceProvider

Gets authenticated service provider information from session.

```typescript
async function getAuthenticatedServiceProvider(): Promise<{
  serviceProviderId?: string;
  error?: string;
}>;
```

**Example:**

```typescript
import { getAuthenticatedServiceProvider } from '@/lib/server-helper';

const result = await getAuthenticatedServiceProvider();
if (result.serviceProviderId) {
  console.log('Authenticated provider:', result.serviceProviderId);
} else {
  console.error('Error:', result.error);
}
```

**Usage in API Routes:**

```typescript
import { getAuthenticatedServiceProvider } from '@/lib/server-helper';

export async function GET() {
  const result = await getAuthenticatedServiceProvider();

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  // Use result.serviceProviderId for authenticated operations
}
```

---

## Invitation Utilities

### Invitation Management Functions

Utilities for managing organization invitations.

**Location:** `src/lib/invitation-utils.ts`

#### generateInvitationToken

Generates a secure token for invitation links.

```typescript
function generateInvitationToken(): string;
```

**Example:**

```typescript
import { generateInvitationToken } from '@/lib/invitation-utils';

const token = generateInvitationToken();
// Returns: 64-character hex string (e.g., 'a1b2c3d4e5f6...')
```

#### getInvitationExpiryDate

Calculates expiration date for invitations (30 days from now).

```typescript
function getInvitationExpiryDate(): Date;
```

**Example:**

```typescript
import { getInvitationExpiryDate } from '@/lib/invitation-utils';

const expiryDate = getInvitationExpiryDate();
// Returns: Date object 30 days in the future
```

#### isInvitationExpired

Checks if an invitation token has expired.

```typescript
function isInvitationExpired(expiresAt: Date): boolean;
```

**Example:**

```typescript
import { isInvitationExpired } from '@/lib/invitation-utils';

const expired = isInvitationExpired(invitation.expiresAt);
if (expired) {
  console.log('Invitation has expired');
}
```

#### generateInvitationEmail

Generates email content for organization invitations.

```typescript
function generateInvitationEmail(params: {
  organizationName: string;
  inviterName: string;
  customMessage?: string;
  invitationToken: string;
  isExistingUser?: boolean;
}): { subject: string; htmlContent: string; textContent: string };
```

**Example:**

```typescript
import { generateInvitationEmail } from '@/lib/invitation-utils';

const emailContent = generateInvitationEmail({
  organizationName: 'City Medical Center',
  inviterName: 'Dr. Smith',
  customMessage: 'We would love to have you join our team!',
  invitationToken: 'abc123...',
  isExistingUser: true,
});

// Use emailContent.htmlContent, emailContent.textContent, and emailContent.subject
```

#### logEmail

Development utility for logging email content.

```typescript
function logEmail(params: {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  type: 'invitation' | 'cancellation' | 'reminder';
}): void;
```

**Example:**

```typescript
import { logEmail } from '@/lib/invitation-utils';

logEmail({
  to: 'doctor@example.com',
  subject: 'Invitation to join organization',
  htmlContent: '<h1>Welcome!</h1>',
  type: 'invitation',
});
// Logs formatted email content to console
```

---

## Debug Utilities

### Provider Debug System

Comprehensive debugging system for provider-related functionality.

**Location:** `src/lib/debug.ts`

#### Configuration

```typescript
const debugConfig = {
  enabled: true,
  components: {
    editRegulatoryRequirements: true,
    editBasicInfo: true,
    editServices: true,
  },
  server: {
    api: true,
    actions: true,
  },
  levels: {
    error: true,
    warn: true,
    info: true,
    debug: true,
    trace: false,
  },
};
```

#### providerDebug Object

```typescript
const providerDebug = {
  isEnabled(component?: string): boolean;
  isServerEnabled(type?: 'api' | 'actions'): boolean;
  isLevelEnabled(level: 'error' | 'warn' | 'info' | 'debug' | 'trace'): boolean;
  setEnabled(enabled: boolean): void;
  log(component: string, message: string, ...data: any[]): void;
  error(component: string, message: string, ...data: any[]): void;
  logFormData(component: string, formData: FormData): void;
};
```

**Example Usage:**

```typescript
import { providerDebug } from '@/lib/debug';

// Component debugging
if (providerDebug.isEnabled('editBasicInfo')) {
  providerDebug.log('editBasicInfo', 'Form submitted', formData);
}

// Server debugging
providerDebug.log('api', 'Processing provider creation', requestData);

// Error logging
providerDebug.error('editServices', 'Service validation failed', error);

// Form data debugging
providerDebug.logFormData('editRegulatoryRequirements', formData);

// Runtime control
providerDebug.setEnabled(false); // Disable all debugging
```

**Browser Console Access:**

```javascript
// Available in browser console
window.providerDebug.setEnabled(true);
window.providerDebug.log('custom', 'Debug message');
```

**Features:**

- **Component-specific debugging**: Enable/disable per component
- **Server-side debugging**: Separate controls for API and actions
- **Debug levels**: Control verbosity
- **Form data logging**: Specialized FormData inspection
- **Runtime control**: Enable/disable debugging dynamically

---

## Constants & Configuration

### Environment Detection

Utilities for detecting runtime environment.

**Location:** `src/lib/constants.ts`

#### Environment Detection Functions

```typescript
// Exported constants
export const isDevelopment: boolean;
export const isProduction: boolean;
export const isTest: boolean;
```

**Example:**

```typescript
import { isDevelopment, isProduction, isTest } from '@/lib/constants';

if (isDevelopment) {
  console.log('Running in development mode');
}

if (isProduction) {
  // Production-only code
  analytics.track('pageview');
}

// Conditional features
const debugMode = isDevelopment;
const enableAnalytics = isProduction;
```

**Environment Detection Logic:**

- **Client-side**: Uses `window.location.hostname`
  - `localhost` or `127.0.0.1` = development
  - Other hostnames = production
- **Server-side**: Defaults to development for safety

**Usage Patterns:**

```typescript
// Feature flags
const showDebugPanel = isDevelopment;
const enableErrorReporting = isProduction;

// API endpoints
const apiUrl = isProduction ? 'https://api.medbookings.com' : 'http://localhost:3000';

// Logging levels
const logLevel = isDevelopment ? 'debug' : 'error';
```

---

## Authentication Utilities

### Auth Configuration

Authentication utilities and configuration.

**Location:** `src/lib/auth.ts`

#### getCurrentUser

Gets the current authenticated user from session.

```typescript
async function getCurrentUser(): Promise<User | undefined>;
```

**Example:**

```typescript
import { getCurrentUser } from '@/lib/auth';

const user = await getCurrentUser();
if (user) {
  console.log('Current user:', user.email);
}
```

#### checkRole

Validates user role and throws error if unauthorized.

```typescript
async function checkRole(allowedRoles: UserRole[]): Promise<User>;
```

**Example:**

```typescript
import { UserRole } from '@prisma/client';

import { checkRole } from '@/lib/auth';

try {
  const user = await checkRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  // User is authorized
} catch (error) {
  // User is not authorized
  console.error('Access denied:', error.message);
}
```

### Database Connection

**Location:** `src/lib/prisma.ts`

```typescript
import { PrismaClient } from '@prisma/client';

export const prisma: PrismaClient;
```

**Usage:**

```typescript
import { prisma } from '@/lib/prisma';

const users = await prisma.user.findMany();
```

---

## Query Utilities

### React Query Configurations

Predefined query configurations for common operations.

**Location:** `src/lib/helper.ts`

#### getServiceProviderQuery

React Query configuration for fetching authenticated service provider.

```typescript
const getServiceProviderQuery = {
  queryKey: ['authenticatedServiceProvider'],
  queryFn: async () =>
    Promise<{
      serviceProviderId?: string;
      error?: string;
    }>,
  retry: 1,
  refetchOnWindowFocus: false,
  staleTime: 1000 * 60 * 5, // 5 minutes
};
```

**Example:**

```typescript
import { useQuery } from '@tanstack/react-query';
import { getServiceProviderQuery } from '@/lib/helper';

function MyComponent() {
  const { data, isLoading, error } = useQuery(getServiceProviderQuery);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.serviceProviderId ? (
        <p>Provider ID: {data.serviceProviderId}</p>
      ) : (
        <p>Not a service provider</p>
      )}
    </div>
  );
}
```

---

## Best Practices

### Error Handling

```typescript
// Always handle errors gracefully
try {
  const result = await uploadToBlob(file, userId, directory, purpose);
  if (!result.success) {
    throw new Error(result.error);
  }
  return result.url;
} catch (error) {
  console.error('Upload failed:', error);
  throw error;
}
```

### Type Safety

```typescript
// Use TypeScript for better type safety
interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

function handleUpload(file: File): Promise<UploadResult> {
  return uploadToBlob(file, userId, 'documents', 'license');
}
```

### Performance Optimization

```typescript
// Cache expensive operations
import { useMemo } from 'react';

function MyComponent({ utcDate }: { utcDate: string }) {
  const formattedDate = useMemo(() =>
    formatLocalDate(utcDate),
    [utcDate]
  );

  return <div>{formattedDate}</div>;
}
```

### Testing Utilities

```typescript
// Mock utilities for testing
jest.mock('@/lib/utils/utils-upload-to-blob', () => ({
  uploadToBlob: jest.fn().mockResolvedValue({
    success: true,
    url: 'mock-url',
  }),
}));
```

### Environment-Specific Code

```typescript
// Use environment constants for conditional logic
import { isDevelopment } from '@/lib/constants';

if (isDevelopment) {
  // Development-only code
  console.log('Debug info:', debugData);
}
```

---

## Integration Examples

### Form Handling with Utilities

```typescript
import { cn } from '@/lib/utils';
import { formatLocalTime } from '@/lib/timezone-helper';
import { uploadToBlob } from '@/lib/utils/utils-upload-to-blob';

function FormComponent() {
  const handleSubmit = async (data: FormData) => {
    const file = data.get('file') as File;

    if (file) {
      const result = await uploadToBlob(file, userId, 'documents', 'license');
      if (result.success) {
        // Handle success
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        className={cn(
          'block w-full',
          'border border-gray-300',
          'rounded-md px-3 py-2',
          'focus:ring-2 focus:ring-blue-500'
        )}
      />
      <button type="submit">Upload</button>
    </form>
  );
}
```

### Date Display with Timezone Handling

```typescript
import { formatLocalTime, formatLocalDate } from '@/lib/timezone-helper';

function EventDisplay({ event }: { event: { startTime: string } }) {
  const displayDate = formatLocalDate(event.startTime);
  const displayTime = formatLocalTime(event.startTime);

  return (
    <div>
      <p>Date: {displayDate}</p>
      <p>Time: {displayTime}</p>
    </div>
  );
}
```

### Debug-Enabled Component

```typescript
import { providerDebug } from '@/lib/debug';

function ProviderForm() {
  const handleSubmit = (formData: FormData) => {
    providerDebug.logFormData('editBasicInfo', formData);

    try {
      // Form processing
      providerDebug.log('editBasicInfo', 'Form submitted successfully');
    } catch (error) {
      providerDebug.error('editBasicInfo', 'Form submission failed', error);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```
