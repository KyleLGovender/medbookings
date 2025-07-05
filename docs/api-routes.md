# API Routes Documentation

This document provides comprehensive documentation for all REST API endpoints in the MedBookings application. All endpoints follow RESTful conventions and require proper authentication where indicated.

## Table of Contents

- [Authentication](#authentication)
- [Provider APIs](#provider-apis)
- [Organization APIs](#organization-apis)
- [File Upload APIs](#file-upload-apis)
- [Admin APIs](#admin-apis)
- [User APIs](#user-apis)
- [Calendar APIs](#calendar-apis)
- [Common Patterns](#common-patterns)
- [Error Handling](#error-handling)

---

## Authentication

### Authentication Requirements

Most API endpoints require authentication using NextAuth.js sessions. The session is checked server-side using `getServerSession()`.

**Authentication Flow:**
1. User signs in through OAuth (Google)
2. Session is created and stored
3. Subsequent API requests include session cookies
4. Server validates session for protected routes

**Protected Routes:**
- All `/api/admin/*` routes require ADMIN or SUPER_ADMIN role
- All `/api/providers/*` routes require authentication
- All `/api/organizations/*` routes require authentication
- `/api/upload/*` routes require authentication

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

## Provider APIs

### Create Provider

**Endpoint:** `POST /api/providers`

**Description:** Creates a new service provider profile.

**Authentication:** Required (authenticated user)

**Request Body:**
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
  serviceProviderTypeId: string;
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

**Response:**
```typescript
// Success
{
  success: true;
  redirect: string; // URL to redirect to
}

// Error
{
  error: string;
}
```

**Example:**
```typescript
const response = await fetch('/api/providers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    basicInfo: {
      name: 'Dr. John Smith',
      bio: 'Experienced family physician',
      email: 'john.smith@example.com',
      whatsapp: '+1234567890',
      languages: ['english', 'spanish']
    },
    serviceProviderTypeId: 'provider-type-id',
    services: {
      availableServices: ['service-id-1', 'service-id-2'],
      serviceConfigs: {
        'service-id-1': {
          duration: 30,
          price: 100
        }
      }
    }
  })
});
```

**Error Codes:**
- `401`: Unauthorized (no valid session)
- `404`: User not found
- `400`: Invalid request data
- `500`: Server error

### Get Provider Services

**Endpoint:** `GET /api/providers/services`

**Description:** Retrieves available services for providers.

**Authentication:** Required

**Query Parameters:**
- `type`: Filter by provider type (optional)
- `category`: Filter by service category (optional)

**Response:**
```typescript
{
  services: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    defaultDuration: number;
    defaultPrice: number;
  }>;
}
```

### Get Provider Types

**Endpoint:** `GET /api/providers/provider-types`

**Description:** Retrieves available provider types.

**Authentication:** Required

**Response:**
```typescript
{
  types: Array<{
    id: string;
    name: string;
    description: string;
    requirements: Array<{
      id: string;
      name: string;
      type: string;
      required: boolean;
    }>;
  }>;
}
```

### Get Provider by ID

**Endpoint:** `GET /api/providers/[id]`

**Description:** Retrieves a specific provider's information.

**Authentication:** Optional (public endpoint)

**Path Parameters:**
- `id`: Provider ID

**Response:**
```typescript
{
  id: string;
  name: string;
  bio: string;
  email: string;
  whatsapp?: string;
  website?: string;
  image?: string;
  languages: string[];
  services: Array<{
    id: string;
    name: string;
    duration: number;
    price: number;
  }>;
  availability: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
  rating: number;
  reviewCount: number;
}
```

### Update Provider

**Endpoint:** `PUT /api/providers/[id]`

**Description:** Updates a provider's information.

**Authentication:** Required (must be provider owner or admin)

**Path Parameters:**
- `id`: Provider ID

**Request Body:** Same as create provider

**Response:**
```typescript
{
  success: boolean;
  provider?: object;
  error?: string;
}
```

### Delete Provider

**Endpoint:** `DELETE /api/providers/[id]`

**Description:** Deletes a provider profile.

**Authentication:** Required (must be provider owner or admin)

**Path Parameters:**
- `id`: Provider ID

**Response:**
```typescript
{
  success: boolean;
  error?: string;
}
```

---

## Organization APIs

### Create Organization

**Endpoint:** `POST /api/organizations`

**Description:** Creates a new organization.

**Authentication:** Required

**Request Body:**
```typescript
{
  name: string;
  description?: string;
  email: string;
  phone?: string;
  website?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  logo?: string; // URL to uploaded logo
}
```

**Response:**
```typescript
{
  success: boolean;
  organization?: {
    id: string;
    name: string;
    // ... other fields
  };
  error?: string;
}
```

### Get Organization

**Endpoint:** `GET /api/organizations/[id]`

**Description:** Retrieves organization information.

**Authentication:** Optional (public endpoint)

**Path Parameters:**
- `id`: Organization ID

**Response:**
```typescript
{
  id: string;
  name: string;
  description: string;
  email: string;
  phone?: string;
  website?: string;
  address?: object;
  logo?: string;
  providers: Array<{
    id: string;
    name: string;
    specialization: string;
  }>;
  memberCount: number;
  createdAt: string;
}
```

### Update Organization

**Endpoint:** `PUT /api/organizations/[id]`

**Description:** Updates organization information.

**Authentication:** Required (must be organization admin)

**Path Parameters:**
- `id`: Organization ID

**Request Body:** Same as create organization

### Delete Organization

**Endpoint:** `DELETE /api/organizations/[id]`

**Description:** Deletes an organization.

**Authentication:** Required (must be organization admin)

**Path Parameters:**
- `id`: Organization ID

### Get Organization User

**Endpoint:** `GET /api/organizations/user`

**Description:** Gets organization for current user.

**Authentication:** Required

**Response:**
```typescript
{
  organization?: {
    id: string;
    name: string;
    role: 'ADMIN' | 'MEMBER';
    // ... other fields
  };
}
```

---

## File Upload APIs

### Upload File

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
  body: formData
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
  };
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
  };
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
  };
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
    const response = await request(app)
      .post('/api/providers')
      .send(validProviderData);
    
    expect(response.status).toBe(401);
  });
});
```

**Validation Test:**
```typescript
it('should validate required fields', async () => {
  const response = await authenticatedRequest
    .post('/api/providers')
    .send({}); // Empty data
  
  expect(response.status).toBe(400);
  expect(response.body.error).toContain('validation');
});
```

**Success Test:**
```typescript
it('should create provider successfully', async () => {
  const response = await authenticatedRequest
    .post('/api/providers')
    .send(validProviderData);
  
  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
});
```
