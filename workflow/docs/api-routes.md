# API Documentation

This document provides comprehensive documentation for the MedBookings application API layer. **Most APIs have been migrated to tRPC** for type-safe, end-to-end communication, with some legacy REST endpoints remaining for specific use cases.

## ⚠️ **IMPORTANT: tRPC Migration Status**

**✅ Migrated to tRPC:**

- Provider APIs
- Organization APIs
- Admin APIs
- User/Profile APIs
- Calendar APIs
- Most business logic endpoints

**🔄 Remaining as REST:**

- File upload APIs (`/api/upload/*`)
- Webhook endpoints
- Third-party integrations
- NextAuth.js routes (`/api/auth/*`)

## API Architecture Overview

### tRPC APIs (Primary)

- **Type Safety**: Full end-to-end type safety
- **Location**: `/lib/trpc/routers/`
- **Client Usage**: Via `api.router.procedure.useQuery()` or `api.router.procedure.useMutation()`
- **Validation**: Zod schemas for input/output validation
- **Error Handling**: Type-safe error handling with `TRPCError`

### REST APIs (Legacy/Specific Use Cases)

- **Location**: `/app/api/`
- **Usage**: Traditional HTTP endpoints
- **Format**: JSON request/response

## Table of Contents

- [tRPC Usage Patterns](#trpc-usage-patterns)
- [Authentication](#authentication)
- [tRPC APIs](#trpc-apis)
  - [Provider APIs (tRPC)](#provider-apis-trpc)
  - [Organization APIs (tRPC)](#organization-apis-trpc)
  - [Admin APIs (tRPC)](#admin-apis-trpc)
  - [User APIs (tRPC)](#user-apis-trpc)
  - [Calendar APIs (tRPC)](#calendar-apis-trpc)
- [Legacy REST APIs](#legacy-rest-apis)
  - [File Upload APIs](#file-upload-apis)
  - [Authentication APIs](#authentication-apis)
- [Common Patterns](#common-patterns)
- [Error Handling](#error-handling)

---

## tRPC Usage Patterns

### Client-Side Usage

#### Queries (Data Fetching)

```typescript
import { api } from '@/lib/trpc/client'

// Basic query
const { data, isLoading, error } = api.providers.getAll.useQuery()

// Query with input parameters
const { data } = api.providers.getById.useQuery({ id: 'provider-id' })

// Query with options
const { data } = api.providers.search.useQuery(
  { search: 'doctor', limit: 10 },
  {
    enabled: !!searchTerm, // Only run when searchTerm exists
    staleTime: 5 * 60 * 1000, // 5 minutes
  }
)
```

#### Mutations (Data Modification)

```typescript
// Basic mutation
const createProvider = api.providers.create.useMutation({
  onSuccess: (data) => {
    // Handle success - data is fully typed
    router.push(`/providers/${data.id}`);
  },
  onError: (error) => {
    // Handle error - error is typed TRPCError
    toast.error(error.message);
  },
});

// Using the mutation
const handleSubmit = async (formData) => {
  await createProvider.mutateAsync(formData);
};
```

#### Optimistic Updates

```typescript
const updateProvider = api.providers.update.useMutation({
  onMutate: async (updatedProvider) => {
    // Cancel outgoing refetches
    await utils.providers.getById.cancel({ id: updatedProvider.id });

    // Snapshot previous value
    const previousProvider = utils.providers.getById.getData({ id: updatedProvider.id });

    // Optimistically update
    utils.providers.getById.setData({ id: updatedProvider.id }, (old) => ({
      ...old,
      ...updatedProvider,
    }));

    return { previousProvider };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    if (context?.previousProvider) {
      utils.providers.getById.setData({ id: variables.id }, context.previousProvider);
    }
  },
  onSettled: (data, error, variables) => {
    // Always refetch after error or success
    utils.providers.getById.invalidate({ id: variables.id });
  },
});
```

### Server-Side Usage (tRPC Procedures)

#### Basic Procedure Structure

```typescript
// /lib/trpc/routers/providers.ts
import { z } from 'zod';

import { createProvider, getProviders } from '@/features/providers/lib/actions';

import { protectedProcedure, publicProcedure, router } from '../trpc';

export const providersRouter = router({
  // Query procedure
  getAll: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      return await getProviders(input);
    }),

  // Mutation procedure
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        bio: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await createProvider({
        ...input,
        userId: ctx.user.id, // From authenticated context
      });
    }),
});
```

#### Error Handling in Procedures

```typescript
import { TRPCError } from '@trpc/server';

export const providersRouter = router({
  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const provider = await getProviderById(input.id);

    if (!provider) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Provider not found',
      });
    }

    return provider;
  }),
});
```

### Type Safety Benefits

```typescript
// Client gets full type inference
const { data } = api.providers.getAll.useQuery();
// data is automatically typed as Provider[] | undefined

// Input validation is automatic
api.providers.create.useMutation();
// TypeScript will enforce the correct input schema

// Errors are typed
const mutation = api.providers.create.useMutation({
  onError: (error) => {
    // error.code is typed: 'BAD_REQUEST' | 'UNAUTHORIZED' | etc.
    // error.message is string
    // error.data contains additional context
  },
});
```

---

## Authentication

### Authentication Requirements

Authentication is handled through NextAuth.js sessions for both tRPC procedures and legacy REST endpoints.

**Authentication Flow:**

1. User signs in through OAuth (Google)
2. Session is created and stored
3. Subsequent requests include session cookies
4. Server validates session for protected procedures/routes

**tRPC Authentication:**

- **`publicProcedure`**: No authentication required
- **`protectedProcedure`**: Requires valid user session
- **`adminProcedure`**: Requires ADMIN or SUPER_ADMIN role

**Legacy REST Protected Routes:**

- All `/api/admin/*` routes require ADMIN or SUPER_ADMIN role
- `/api/upload/*` routes require authentication
- `/api/auth/*` routes handle authentication itself

### NextAuth API

**Location:** `/api/auth/[...nextauth]`

**Description:** NextAuth.js authentication handler for OAuth and session management.

**Supported Providers:**

- Google OAuth 2.0

**Configuration:**

```typescript
{
  providers: [GoogleProvider],
  adapter: PrismaAdapter,
  callbacks: {
    jwt: // JWT token handling
    session: // Session serialization
  }
}
```

---

## tRPC APIs

These APIs have been migrated to tRPC for full type safety and better developer experience.

### Provider APIs (tRPC)

**Router Location:** `/lib/trpc/routers/providers.ts`
**Client Usage:** `api.providers.*`

#### Create Provider

**Procedure:** `api.providers.create.useMutation()`

**Description:** Creates a new service provider profile with support for multiple provider types.

**Authentication:** `protectedProcedure` (authenticated user required)

**Input Schema:**

```typescript
{
  basicInfo: {
    name: string;
    bio?: string;
    email: string;
    whatsapp?: string;
    website?: string;
    image?: string; // URL to uploaded image
    languages?: string[];
  };
  serviceProviderTypeIds: string[]; // Array of provider type IDs
  services?: {
    availableServices: string[];
    serviceConfigs?: {
      [serviceId: string]: {
        duration?: number;
        price?: number;
      };
    };
  };
  regulatoryRequirements?: {
    requirements: Array<{
      requirementTypeId: string;
      value?: string;
      documentMetadata?: {
        value: string;
        // Additional metadata
      };
    }>;
  };
}
```

**Return Type:**

```typescript
{
  id: string;
  name: string;
  email: string;
  status: 'PENDING_APPROVAL';
  // ... other provider fields
}
```

**Example Usage:**

```typescript
const createProvider = api.providers.create.useMutation({
  onSuccess: (data) => {
    router.push(`/providers/${data.id}`);
  },
  onError: (error) => {
    toast.error(error.message);
  },
});

const handleSubmit = async (formData) => {
  await createProvider.mutateAsync({
    basicInfo: {
      name: 'Dr. John Smith',
      bio: 'Experienced family physician',
      email: 'john.smith@example.com',
      whatsapp: '+1234567890',
      languages: ['english', 'spanish'],
    },
    serviceProviderTypeIds: ['gp-type-id', 'psych-type-id'],
    services: {
      availableServices: ['service-id-1', 'service-id-2'],
      serviceConfigs: {
        'service-id-1': {
          duration: 30,
          price: 100,
        },
      },
    },
  });
};
```

**Error Handling:**

tRPC automatically handles and types errors. Common error codes:

- `UNAUTHORIZED`: No valid session
- `BAD_REQUEST`: Invalid input data
- `NOT_FOUND`: User not found
- `INTERNAL_SERVER_ERROR`: Server error

#### Search Providers

**Procedure:** `api.providers.search.useQuery()`

**Description:** Search and filter providers with enhanced support for multiple provider types.

**Authentication:** `publicProcedure` (no authentication required)

**Input Schema:**

```typescript
{
  search?: string;           // Text search across provider name, email, and bio
  typeIds?: string[];        // Array of provider type IDs for filtering
  status?: string;           // Provider status filter (default: 'APPROVED')
  limit?: number;            // Number of results per page (default: 50, max: 100)
  offset?: number;           // Number of results to skip for pagination (default: 0)
  includeServices?: boolean; // Include provider services in response (default: true)
}
```

**Return Type:**

```typescript
{
  providers: Array<{
    id: string;
    name: string;
    bio: string;
    email: string;
    status: string;
    typeAssignments: Array<{
      id: string;
      serviceProviderTypeId: string;
      serviceProviderType: {
        id: string;
        name: string;
        description: string;
      };
    }>;
    services?: Array<{
      id: string;
      name: string;
      defaultPrice: number;
      defaultDuration: number;
    }>;
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  }
}
```

**Example Usage:**

```typescript
// Basic search
const { data } = api.providers.search.useQuery({ search: 'Dr', limit: 10 })

// Filter by provider types
const { data } = api.providers.search.useQuery({
  typeIds: ['gp-type-id', 'psych-type-id']
})

// Complex search with loading state
const { data, isLoading, error } = api.providers.search.useQuery(
  { search: 'specialist', typeIds: ['psych-type-id'], status: 'APPROVED', limit: 20 },
  { enabled: !!searchTerm }
)
```

### Other tRPC APIs Summary

The following APIs have been migrated to tRPC with similar patterns:

#### Organization APIs (`api.organizations.*`)

- `getAll.useQuery()` - List organizations
- `getById.useQuery({ id })` - Get organization details
- `create.useMutation()` - Create organization
- `update.useMutation()` - Update organization
- `delete.useMutation()` - Delete organization
- `getUserOrganization.useQuery()` - Get current user's organization

#### Admin APIs (`api.admin.*`)

- `getDashboard.useQuery()` - Admin dashboard stats
- `providers.getAll.useQuery()` - All providers (admin view)
- `providers.updateStatus.useMutation()` - Update provider status
- `organizations.getAll.useQuery()` - All organizations (admin view)
- `users.getAll.useQuery()` - All users (admin view)

#### User APIs (`api.users.*`)

- `getProfile.useQuery()` - Current user profile
- `updateProfile.useMutation()` - Update user profile
- `getPreferences.useQuery()` - User preferences
- `updatePreferences.useMutation()` - Update preferences

#### Calendar APIs (`api.calendar.*`)

- `getEvents.useQuery()` - Get calendar events
- `createEvent.useMutation()` - Create calendar event
- `updateEvent.useMutation()` - Update calendar event
- `deleteEvent.useMutation()` - Delete calendar event
- `getAvailability.useQuery()` - Get provider availability

---

## Legacy REST APIs

These APIs remain as traditional REST endpoints for specific use cases.

### File Upload APIs

File uploads remain as REST endpoints due to their nature requiring `multipart/form-data`.

#### Upload File

**Endpoint:** `POST /api/upload`

**Description:** Uploads files to Vercel Blob storage.

**Authentication:** Required

**Request Body:** `multipart/form-data`

- `file`: File to upload
- `userId`: User ID
- `directory`: Upload directory (optional, defaults to 'profile-images')
- `purpose`: File purpose identifier (required)

**Response:**

```typescript
{
  success: boolean;
  url?: string; // Blob URL of uploaded file
  error?: string;
}
```

**Example:**

```typescript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('userId', userId);
formData.append('directory', 'documents');
formData.append('purpose', 'license-verification');

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});
```

**File Restrictions:**

- Maximum file size: 10MB
- Supported formats: PDF, JPG, PNG (configurable)
- Files are stored with organized naming convention

**Error Codes:**

- `400`: No file provided or invalid request
- `401`: Unauthorized
- `500`: Upload failed

---

## Admin APIs

### Get Admin Dashboard Data

**Endpoint:** `GET /api/admin`

**Description:** Retrieves admin dashboard statistics.

**Authentication:** Required (ADMIN or SUPER_ADMIN role)

**Response:**

```typescript
{
  stats: {
    totalProviders: number;
    totalOrganizations: number;
    totalUsers: number;
    pendingApprovals: number;
  }
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
}
```

### Get All Providers (Admin)

**Endpoint:** `GET /api/admin/providers`

**Description:** Retrieves all providers with admin details.

**Authentication:** Required (ADMIN or SUPER_ADMIN role)

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status
- `search`: Search term

**Response:**

```typescript
{
  providers: Array<{
    id: string;
    name: string;
    email: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
    createdAt: string;
    // ... other fields
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  }
}
```

### Update Provider Status

**Endpoint:** `PUT /api/admin/providers/[id]/status`

**Description:** Updates provider approval status.

**Authentication:** Required (ADMIN or SUPER_ADMIN role)

**Path Parameters:**

- `id`: Provider ID

**Request Body:**

```typescript
{
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  reason?: string; // Required for rejection
}
```

**Response:**

```typescript
{
  success: boolean;
  provider?: object;
  error?: string;
}
```

### Get All Organizations (Admin)

**Endpoint:** `GET /api/admin/organizations`

**Description:** Retrieves all organizations with admin details.

**Authentication:** Required (ADMIN or SUPER_ADMIN role)

**Query Parameters:** Same as admin providers

**Response:** Similar structure to admin providers

---

## User APIs

### Get User Profile

**Endpoint:** `GET /api/profile`

**Description:** Retrieves current user's profile.

**Authentication:** Required

**Response:**

```typescript
{
  id: string;
  email: string;
  name: string;
  image?: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  createdAt: string;
  provider?: {
    id: string;
    name: string;
    status: string;
  };
  organization?: {
    id: string;
    name: string;
    role: string;
  };
}
```

### Update User Profile

**Endpoint:** `PUT /api/profile`

**Description:** Updates user profile information.

**Authentication:** Required

**Request Body:**

```typescript
{
  name?: string;
  email?: string;
  image?: string;
  preferences?: {
    notifications: boolean;
    language: string;
  };
}
```

**Response:**

```typescript
{
  success: boolean;
  user?: object;
  error?: string;
}
```

---

## Calendar APIs

### Get Calendar Events

**Endpoint:** `GET /api/calendar`

**Description:** Retrieves calendar events for authenticated user.

**Authentication:** Required

**Query Parameters:**

- `start`: Start date (ISO string)
- `end`: End date (ISO string)
- `providerId`: Filter by provider ID (optional)

**Response:**

```typescript
{
  events: Array<{
    id: string;
    title: string;
    start: string;
    end: string;
    providerId: string;
    patientId?: string;
    status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
    type: 'APPOINTMENT' | 'BLOCKED' | 'AVAILABLE';
  }>;
}
```

### Create Calendar Event

**Endpoint:** `POST /api/calendar`

**Description:** Creates a new calendar event.

**Authentication:** Required

**Request Body:**

```typescript
{
  title: string;
  start: string; // ISO date string
  end: string; // ISO date string
  providerId: string;
  patientId?: string;
  type: 'APPOINTMENT' | 'BLOCKED' | 'AVAILABLE';
  notes?: string;
}
```

**Response:**

```typescript
{
  success: boolean;
  event?: object;
  error?: string;
}
```

### Update Calendar Event

**Endpoint:** `PUT /api/calendar/[id]`

**Description:** Updates a calendar event.

**Authentication:** Required

**Path Parameters:**

- `id`: Event ID

**Request Body:** Same as create event

### Delete Calendar Event

**Endpoint:** `DELETE /api/calendar/[id]`

**Description:** Deletes a calendar event.

**Authentication:** Required

**Path Parameters:**

- `id`: Event ID

**Response:**

```typescript
{
  success: boolean;
  error?: string;
}
```

---

## Common Patterns

### Request/Response Format

**Standard Success Response:**

```typescript
{
  success: true;
  data?: any;
  message?: string;
}
```

**Standard Error Response:**

```typescript
{
  success: false;
  error: string;
  details?: any;
}
```

### Pagination

**Query Parameters:**

- `page`: Page number (1-based)
- `limit`: Items per page
- `sort`: Sort field
- `order`: Sort order ('asc' | 'desc')

**Response Format:**

```typescript
{
  data: Array<any>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }
}
```

### Filtering and Search

**Query Parameters:**

- `search`: General search term
- `filter[field]`: Filter by specific field
- `status`: Filter by status
- `category`: Filter by category
- `date_from`: Filter from date
- `date_to`: Filter to date

### Authentication Headers

**Session-based Authentication:**

- Authentication is handled via HTTP-only cookies
- No additional headers required
- Session validation on server-side

---

## Error Handling

### HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (no valid session)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate data)
- `422`: Unprocessable Entity (business logic errors)
- `500`: Internal Server Error

### Error Response Format

```typescript
{
  success: false;
  error: string;
  details?: {
    field?: string;
    code?: string;
    message?: string;
  };
  timestamp: string;
}
```

### Common Error Scenarios

**Authentication Errors:**

```typescript
{
  success: false;
  error: "Unauthorized",
  details: {
    code: "AUTH_REQUIRED",
    message: "Valid session required"
  }
}
```

**Validation Errors:**

```typescript
{
  success: false;
  error: "Validation failed",
  details: {
    field: "email",
    code: "INVALID_EMAIL",
    message: "Please provide a valid email address"
  }
}
```

**Permission Errors:**

```typescript
{
  success: false;
  error: "Insufficient permissions",
  details: {
    code: "FORBIDDEN",
    message: "Admin role required"
  }
}
```

### Error Handling Best Practices

1. **Always return consistent error formats**
2. **Include helpful error messages**
3. **Log errors server-side for debugging**
4. **Don't expose sensitive information in error messages**
5. **Use appropriate HTTP status codes**
6. **Provide actionable error messages to users**

---

## Rate Limiting

### Upload Endpoints

- File uploads: 10 requests per minute per user
- Maximum file size: 10MB
- Concurrent uploads: 3 per user

### API Endpoints

- General API: 100 requests per minute per user
- Authentication: 10 requests per minute per IP
- Admin endpoints: 50 requests per minute per admin

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

---

## Security Considerations

### Input Validation

- All inputs are validated using Zod schemas
- File uploads are scanned for malicious content
- SQL injection protection via Prisma ORM

### Authentication Security

- Session-based authentication with HTTP-only cookies
- CSRF protection enabled
- Secure session storage

### Data Protection

- Sensitive data is encrypted at rest
- Personal information is handled according to privacy policies
- File access is controlled via signed URLs

### API Security

- Rate limiting on all endpoints
- Input sanitization
- Output encoding
- Security headers implemented

---

## Testing API Endpoints

### Example Test Cases

**Authentication Test:**

```typescript
describe('POST /api/providers', () => {
  it('should require authentication', async () => {
    const response = await request(app).post('/api/providers').send(validProviderData);

    expect(response.status).toBe(401);
  });
});
```

**Validation Test:**

```typescript
it('should validate required fields', async () => {
  const response = await authenticatedRequest.post('/api/providers').send({}); // Empty data

  expect(response.status).toBe(400);
  expect(response.body.error).toContain('validation');
});
```

**Success Test:**

```typescript
it('should create provider successfully', async () => {
  const response = await authenticatedRequest.post('/api/providers').send(validProviderData);

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
});
```
