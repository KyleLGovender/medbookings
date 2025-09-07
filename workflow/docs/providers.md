# Provider API Documentation

This document describes the Provider API endpoints that support multiple service provider types per provider.

## Overview

The Provider API has been enhanced to support multiple service provider types per provider through an n:n relationship. This allows providers to offer services across multiple specialties (e.g., a provider can be both a General Practitioner and Psychologist).

## Endpoints

### GET /api/providers

Search and filter providers with support for multiple provider types.

#### Query Parameters

| Parameter             | Type    | Description                                      | Example                     |
| --------------------- | ------- | ------------------------------------------------ | --------------------------- |
| `search`              | string  | Text search across provider name, email, and bio | `?search=Dr`                |
| `typeIds`             | string  | Comma-separated list of provider type IDs        | `?typeIds=gp-id,psych-id`   |
| `status`              | string  | Provider status filter                           | `?status=APPROVED`          |
| `limit`               | number  | Number of results per page (default: 50)         | `?limit=20`                 |
| `offset`              | number  | Number of results to skip (default: 0)           | `?offset=100`               |
| `includeServices`     | boolean | Include provider services (default: true)        | `?includeServices=false`    |
| `includeRequirements` | boolean | Include requirement submissions (default: false) | `?includeRequirements=true` |

#### Response

```json
{
  "providers": [
    {
      "id": "provider-id",
      "name": "Dr. Jane Smith",
      "email": "jane@example.com",
      "bio": "Experienced healthcare provider",
      "status": "APPROVED",
      "typeAssignments": [
        {
          "id": "assignment-id-1",
          "providerTypeId": "gp-id",
          "providerType": {
            "id": "gp-id",
            "name": "General Practitioner",
            "description": "Primary healthcare provider"
          }
        },
        {
          "id": "assignment-id-2",
          "providerTypeId": "psych-id",
          "providerType": {
            "id": "psych-id",
            "name": "Psychologist",
            "description": "Mental health specialist"
          }
        }
      ],
      "providerTypes": [
        {
          "id": "gp-id",
          "name": "General Practitioner"
        },
        {
          "id": "psych-id",
          "name": "Psychologist"
        }
      ],
      "services": [
        {
          "id": "service-id",
          "name": "General Consultation",
          "defaultPrice": 650.0,
          "defaultDuration": 15
        }
      ]
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

#### Examples

**Search providers by text:**

```
GET /api/providers?search=Dr&limit=10
```

**Filter providers by single type:**

```
GET /api/providers?typeIds=gp-id&limit=20
```

**Filter providers by multiple types (OR logic):**

```
GET /api/providers?typeIds=gp-id,psych-id&limit=20
```

**Complex search with multiple filters:**

```
GET /api/providers?search=specialist&typeIds=psych-id&status=APPROVED&limit=10&offset=20
```

### POST /api/providers

Register a new provider with multiple provider types.

#### Request Body

```json
{
  "basicInfo": {
    "name": "Dr. John Doe",
    "bio": "Experienced healthcare provider specializing in multiple areas",
    "email": "john@example.com",
    "whatsapp": "+27123456789",
    "website": "https://johndoe.com",
    "languages": ["English", "Afrikaans"],
    "image": "https://example.com/image.jpg"
  },
  "providerTypeIds": ["gp-id", "psych-id"],
  "services": {
    "availableServices": ["service-1", "service-2"],
    "serviceConfigs": {
      "service-1": {
        "duration": 30,
        "price": 800
      }
    }
  },
  "regulatoryRequirements": {
    "requirements": [
      {
        "requirementTypeId": "hpcsa-registration",
        "value": "MP12345"
      }
    ]
  }
}
```

#### Response

```json
{
  "success": true,
  "redirect": "/profile"
}
```

#### Error Responses

**Missing provider types:**

```json
{
  "error": "At least one provider type is required"
}
```

**Invalid provider type combination:**

```json
{
  "error": "Invalid provider type combination"
}
```

### GET /api/providers/[id]

Get detailed information about a specific provider.

#### Response

```json
{
  "id": "provider-id",
  "name": "Dr. Jane Smith",
  "bio": "Healthcare provider",
  "email": "jane@example.com",
  "status": "APPROVED",
  "typeAssignments": [
    {
      "id": "assignment-id",
      "providerTypeId": "gp-id",
      "providerType": {
        "id": "gp-id",
        "name": "General Practitioner",
        "description": "Primary healthcare provider"
      },
      "createdAt": "2025-01-19T10:00:00Z"
    }
  ],
  "services": [
    {
      "id": "service-id",
      "name": "General Consultation",
      "defaultPrice": 650.0,
      "defaultDuration": 15
    }
  ],
  "requirementSubmissions": [
    {
      "id": "submission-id",
      "requirementTypeId": "hpcsa-registration",
      "status": "APPROVED",
      "documentMetadata": {
        "registrationNumber": "MP12345"
      }
    }
  ]
}
```

### PUT /api/providers/[id]/basic-info

Update provider basic information including provider types.

#### Request Body (FormData)

| Field             | Type     | Description                                     |
| ----------------- | -------- | ----------------------------------------------- |
| `providerTypeIds` | string[] | Array of provider type IDs                      |
| `providerTypeId`  | string   | Legacy single type (for backward compatibility) |
| `name`            | string   | Provider name                                   |
| `bio`             | string   | Provider biography                              |
| `email`           | string   | Contact email                                   |
| `whatsapp`        | string   | WhatsApp number                                 |
| `website`         | string   | Website URL                                     |
| `languages`       | string[] | Spoken languages                                |
| `showPrice`       | boolean  | Whether to display prices                       |

#### Response

```json
{
  "success": true,
  "data": {
    "id": "provider-id",
    "name": "Updated Name",
    "typeAssignments": [
      {
        "providerTypeId": "new-type-id",
        "providerType": {
          "name": "New Provider Type"
        }
      }
    ]
  }
}
```

## Data Model

### ProviderTypeAssignment

The n:n relationship between providers and provider types.

```typescript
interface ProviderTypeAssignment {
  id: string;
  providerId: string;
  providerTypeId: string;
  createdAt: Date;
  updatedAt: Date;
  serviceProvider: Provider;
  providerType: ProviderType;
}
```

### Updated Provider

```typescript
interface Provider {
  id: string;
  name: string;
  bio: string;
  email: string;
  status: ProviderStatus;
  // Multiple type assignments (n:n relationship)
  typeAssignments: ProviderTypeAssignment[];
  // Derived fields for convenience
  providerTypes: ProviderType[];
  providerType?: ProviderType; // Legacy compatibility
}
```

## Approval Workflow

The approval workflow validates requirements from ALL assigned provider types:

1. **Requirement Collection**: System collects all required requirements from all assigned provider types
2. **Deduplication**: Removes duplicate requirements (same requirement required by multiple types)
3. **Validation**: Ensures ALL unique requirements have approved submissions
4. **Approval**: Provider is approved only when all requirements from all types are satisfied

### Example Scenario

Provider assigned to both "General Practitioner" and "Psychologist":

- GP requires: HPCSA Registration, Medical Degree, Insurance
- Psychologist requires: HPCSA Registration, Psychology Degree
- **Total unique requirements**: HPCSA Registration, Medical Degree, Insurance, Psychology Degree
- **Approval condition**: All 4 requirements must be approved

## Performance Optimizations

### Database Indexes

The following indexes optimize query performance:

- `ProviderTypeAssignment_providerId_idx`
- `ProviderTypeAssignment_providerTypeId_idx`
- `ProviderTypeAssignment_providerId_providerTypeId_idx`

### Caching

- Provider search results: 5-minute TTL
- Provider type statistics: 30-minute TTL
- Provider by type lookups: 20-minute TTL

### Query Optimizations

- Conditional includes to avoid unnecessary JOINs
- Optimized WHERE clauses using indexed fields
- Efficient pagination with offset/limit

## Migration Guide

### From Single to Multiple Provider Types

**Before:**

```json
{
  "providerTypeId": "gp-id"
}
```

**After:**

```json
{
  "providerTypeIds": ["gp-id"],
  "providerTypeId": "gp-id"
}
```

**Note:** The `providerTypeId` field is maintained for backward compatibility.

### API Changes

1. **New fields in responses:**

   - `typeAssignments[]` - Full assignment details
   - `providerTypes[]` - Array of all assigned types

2. **New query parameters:**

   - `includeServices` - Control service inclusion
   - `includeRequirements` - Control requirement inclusion

3. **Enhanced filtering:**
   - `typeIds` supports multiple comma-separated values
   - OR logic for multiple type filtering

### Backward Compatibility

All existing API integrations continue to work:

- `providerTypeId` field maintained in responses
- Single type registration still supported
- Existing query parameters unchanged
