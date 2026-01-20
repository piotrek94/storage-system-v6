# REST API Plan - Home Storage System

## 1. Resources

The API is organized around the following main resources, each corresponding to database tables:

- **Profiles** - User profile data (extends Supabase Auth)
- **Containers** - Physical storage locations
- **Categories** - Item classification system
- **Items** - Stored physical items (core entity)
- **Images** - Image metadata for items and containers (polymorphic)
- **Dashboard** - Aggregated statistics and data

## 2. Endpoints

### 2.1 Authentication

Authentication is handled by Supabase Auth. The application uses Supabase's built-in authentication system with direct client-side integration. All API endpoints require a valid Supabase session token passed via the `Authorization` header.

#### Session Verification Middleware

**Endpoint:** N/A (Astro middleware)  
**Purpose:** Validates Supabase session on server-side for protected routes  
**Implementation:** Astro middleware verifies JWT token and injects user context

---

### 2.2 Dashboard Statistics

#### Get Dashboard Statistics

**Method:** `GET`  
**Path:** `/api/dashboard/stats`  
**Description:** Retrieves aggregated statistics for the dashboard view

**Query Parameters:** None

**Request Payload:** None

**Response Payload:**
```json
{
  "totalItems": 150,
  "totalContainers": 12,
  "totalCategories": 8,
  "itemsOut": 5,
  "recentItems": [
    {
      "id": "uuid",
      "name": "Camping Tent",
      "thumbnail": "url",
      "category": "Outdoor Gear",
      "container": "Garage Box A",
      "isIn": true,
      "createdAt": "2026-01-15T10:30:00Z"
    }
  ]
}
```

**Success Response:**
- **Code:** `200 OK`
- **Message:** Statistics retrieved successfully

**Error Responses:**
- **Code:** `401 Unauthorized`
- **Message:** "Authentication required"

---

### 2.3 Containers

#### List All Containers

**Method:** `GET`  
**Path:** `/api/containers`  
**Description:** Retrieves all containers for the authenticated user

**Query Parameters:**
- `page` (optional, integer, default: 1) - Page number for pagination
- `limit` (optional, integer, default: 20, max: 100) - Items per page
- `sort` (optional, string, default: "created_at") - Sort field (name, created_at)
- `order` (optional, string, default: "desc") - Sort order (asc, desc)

**Request Payload:** None

**Response Payload:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Garage Box A",
      "description": "Large plastic box in garage, top shelf",
      "thumbnail": "url-to-thumbnail",
      "imageCount": 3,
      "itemCount": 15,
      "createdAt": "2026-01-10T14:30:00Z",
      "updatedAt": "2026-01-15T09:20:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

**Success Response:**
- **Code:** `200 OK`
- **Message:** Containers retrieved successfully

**Error Responses:**
- **Code:** `401 Unauthorized`
- **Message:** "Authentication required"
- **Code:** `400 Bad Request`
- **Message:** "Invalid query parameters"

---

#### Get Single Container

**Method:** `GET`  
**Path:** `/api/containers/:id`  
**Description:** Retrieves detailed information for a specific container

**Query Parameters:** None

**Request Payload:** None

**Response Payload:**
```json
{
  "id": "uuid",
  "name": "Garage Box A",
  "description": "Large plastic box in garage, top shelf",
  "images": [
    {
      "id": "uuid",
      "url": "full-size-url",
      "thumbnailUrl": "thumbnail-url",
      "displayOrder": 1
    }
  ],
  "items": [
    {
      "id": "uuid",
      "name": "Camping Tent",
      "thumbnail": "url",
      "category": "Outdoor Gear",
      "isIn": true
    }
  ],
  "itemCount": 15,
  "createdAt": "2026-01-10T14:30:00Z",
  "updatedAt": "2026-01-15T09:20:00Z"
}
```

**Success Response:**
- **Code:** `200 OK`
- **Message:** Container retrieved successfully

**Error Responses:**
- **Code:** `401 Unauthorized`
- **Message:** "Authentication required"
- **Code:** `404 Not Found`
- **Message:** "Container not found"

---

#### Create Container

**Method:** `POST`  
**Path:** `/api/containers`  
**Description:** Creates a new container for the authenticated user

**Query Parameters:** None

**Request Payload:**
```json
{
  "name": "Garage Box A",
  "description": "Large plastic box in garage, top shelf"
}
```

**Response Payload:**
```json
{
  "id": "uuid",
  "name": "Garage Box A",
  "description": "Large plastic box in garage, top shelf",
  "images": [],
  "itemCount": 0,
  "createdAt": "2026-01-20T10:30:00Z",
  "updatedAt": "2026-01-20T10:30:00Z"
}
```

**Success Response:**
- **Code:** `201 Created`
- **Message:** "Container created successfully"

**Error Responses:**
- **Code:** `401 Unauthorized`
- **Message:** "Authentication required"
- **Code:** `400 Bad Request`
- **Message:** "Validation failed: [details]"
  - Name is required
  - Name must be 1-255 characters
  - Name cannot be only whitespace
  - Description must be max 10,000 characters

---

#### Update Container

**Method:** `PATCH`  
**Path:** `/api/containers/:id`  
**Description:** Updates an existing container

**Query Parameters:** None

**Request Payload:**
```json
{
  "name": "Garage Box A - Updated",
  "description": "Large plastic box, now on middle shelf"
}
```

**Response Payload:**
```json
{
  "id": "uuid",
  "name": "Garage Box A - Updated",
  "description": "Large plastic box, now on middle shelf",
  "images": [],
  "itemCount": 15,
  "createdAt": "2026-01-10T14:30:00Z",
  "updatedAt": "2026-01-20T11:45:00Z"
}
```

**Success Response:**
- **Code:** `200 OK`
- **Message:** "Container updated successfully"

**Error Responses:**
- **Code:** `401 Unauthorized`
- **Message:** "Authentication required"
- **Code:** `404 Not Found`
- **Message:** "Container not found"
- **Code:** `400 Bad Request`
- **Message:** "Validation failed: [details]"

---

#### Delete Container

**Method:** `DELETE`  
**Path:** `/api/containers/:id`  
**Description:** Deletes an empty container (fails if container has items)

**Query Parameters:** None

**Request Payload:** None

**Response Payload:**
```json
{
  "message": "Container deleted successfully",
  "id": "uuid"
}
```

**Success Response:**
- **Code:** `200 OK`
- **Message:** "Container deleted successfully"

**Error Responses:**
- **Code:** `401 Unauthorized`
- **Message:** "Authentication required"
- **Code:** `404 Not Found`
- **Message:** "Container not found"
- **Code:** `409 Conflict`
- **Message:** "Cannot delete [Container Name] because it contains 15 items"

---

### 2.4 Categories

#### List All Categories

**Method:** `GET`  
**Path:** `/api/categories`  
**Description:** Retrieves all categories for the authenticated user

**Query Parameters:**
- `sort` (optional, string, default: "name") - Sort field (name, created_at)
- `order` (optional, string, default: "asc") - Sort order (asc, desc)

**Request Payload:** None

**Response Payload:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Outdoor Gear",
      "itemCount": 25,
      "createdAt": "2026-01-05T12:00:00Z",
      "updatedAt": "2026-01-05T12:00:00Z"
    }
  ]
}
```

**Success Response:**
- **Code:** `200 OK`
- **Message:** Categories retrieved successfully

**Error Responses:**
- **Code:** `401 Unauthorized`
- **Message:** "Authentication required"

---

#### Get Single Category

**Method:** `GET`  
**Path:** `/api/categories/:id`  
**Description:** Retrieves detailed information for a specific category

**Query Parameters:** None

**Request Payload:** None

**Response Payload:**
```json
{
  "id": "uuid",
  "name": "Outdoor Gear",
  "itemCount": 25,
  "createdAt": "2026-01-05T12:00:00Z",
  "updatedAt": "2026-01-05T12:00:00Z"
}
```

**Success Response:**
- **Code:** `200 OK`
- **Message:** Category retrieved successfully

**Error Responses:**
- **Code:** `401 Unauthorized`
- **Message:** "Authentication required"
- **Code:** `404 Not Found`
- **Message:** "Category not found"

---

#### Create Category

**Method:** `POST`  
**Path:** `/api/categories`  
**Description:** Creates a new category for the authenticated user

**Query Parameters:** None

**Request Payload:**
```json
{
  "name": "Outdoor Gear"
}
```

**Response Payload:**
```json
{
  "id": "uuid",
  "name": "Outdoor Gear",
  "itemCount": 0,
  "createdAt": "2026-01-20T10:30:00Z",
  "updatedAt": "2026-01-20T10:30:00Z"
}
```

**Success Response:**
- **Code:** `201 Created`
- **Message:** "Category created successfully"

**Error Responses:**
- **Code:** `401 Unauthorized`
- **Message:** "Authentication required"
- **Code:** `400 Bad Request`
- **Message:** "Validation failed: [details]"
  - Name is required
  - Name must be 1-255 characters
  - Name cannot be only whitespace
- **Code:** `409 Conflict`
- **Message:** "A category with this name already exists"

---

#### Update Category

**Method:** `PATCH`  
**Path:** `/api/categories/:id`  
**Description:** Updates an existing category name

**Query Parameters:** None

**Request Payload:**
```json
{
  "name": "Camping & Outdoor Gear"
}
```

**Response Payload:**
```json
{
  "id": "uuid",
  "name": "Camping & Outdoor Gear",
  "itemCount": 25,
  "createdAt": "2026-01-05T12:00:00Z",
  "updatedAt": "2026-01-20T11:30:00Z"
}
```

**Success Response:**
- **Code:** `200 OK`
- **Message:** "Category updated successfully"

**Error Responses:**
- **Code:** `401 Unauthorized`
- **Message:** "Authentication required"
- **Code:** `404 Not Found`
- **Message:** "Category not found"
- **Code:** `400 Bad Request`
- **Message:** "Validation failed: [details]"
- **Code:** `409 Conflict`
- **Message:** "A category with this name already exists"

---

#### Delete Category

**Method:** `DELETE`  
**Path:** `/api/categories/:id`  
**Description:** Deletes an unused category (fails if category has items)

**Query Parameters:** None

**Request Payload:** None

**Response Payload:**
```json
{
  "message": "Category deleted successfully",
  "id": "uuid"
}
```

**Success Response:**
- **Code:** `200 OK`
- **Message:** "Category deleted successfully"

**Error Responses:**
- **Code:** `401 Unauthorized`
- **Message:** "Authentication required"
- **Code:** `404 Not Found`
- **Message:** "Category not found"
- **Code:** `409 Conflict`
- **Message:** "Cannot delete [Category Name] because it contains 25 items"

---

### 2.5 Items

#### List All Items

**Method:** `GET`  
**Path:** `/api/items`  
**Description:** Retrieves items for the authenticated user with optional filtering

**Query Parameters:**
- `page` (optional, integer, default: 1) - Page number for pagination
- `limit` (optional, integer, default: 20, max: 100) - Items per page
- `search` (optional, string) - Case-insensitive text search on item name
- `category` (optional, uuid or comma-separated uuids) - Filter by category ID(s)
- `container` (optional, uuid or comma-separated uuids) - Filter by container ID(s)
- `status` (optional, string: "in", "out", "all", default: "all") - Filter by in/out status
- `sort` (optional, string, default: "created_at") - Sort field (name, created_at, updated_at)
- `order` (optional, string, default: "desc") - Sort order (asc, desc)

**Request Payload:** None

**Response Payload:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Camping Tent",
      "thumbnail": "url-to-thumbnail",
      "category": {
        "id": "uuid",
        "name": "Outdoor Gear"
      },
      "container": {
        "id": "uuid",
        "name": "Garage Box A"
      },
      "isIn": true,
      "quantity": 1,
      "createdAt": "2026-01-15T10:30:00Z",
      "updatedAt": "2026-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Success Response:**
- **Code:** `200 OK`
- **Message:** Items retrieved successfully

**Error Responses:**
- **Code:** `401 Unauthorized`
- **Message:** "Authentication required"
- **Code:** `400 Bad Request`
- **Message:** "Invalid query parameters"

---

#### Get Single Item

**Method:** `GET`  
**Path:** `/api/items/:id`  
**Description:** Retrieves detailed information for a specific item

**Query Parameters:** None

**Request Payload:** None

**Response Payload:**
```json
{
  "id": "uuid",
  "name": "Camping Tent",
  "description": "4-person dome tent, waterproof, includes stakes and rain fly",
  "category": {
    "id": "uuid",
    "name": "Outdoor Gear"
  },
  "container": {
    "id": "uuid",
    "name": "Garage Box A"
  },
  "isIn": true,
  "quantity": 1,
  "images": [
    {
      "id": "uuid",
      "url": "full-size-url",
      "thumbnailUrl": "thumbnail-url",
      "displayOrder": 1
    }
  ],
  "createdAt": "2026-01-15T10:30:00Z",
  "updatedAt": "2026-01-15T10:30:00Z"
}
```

**Success Response:**
- **Code:** `200 OK`
- **Message:** Item retrieved successfully

**Error Responses:**
- **Code:** `401 Unauthorized`
- **Message:** "Authentication required"
- **Code:** `404 Not Found`
- **Message:** "Item not found"

---

#### Create Item

**Method:** `POST`  
**Path:** `/api/items`  
**Description:** Creates a new item for the authenticated user

**Query Parameters:** None

**Request Payload:**
```json
{
  "name": "Camping Tent",
  "description": "4-person dome tent, waterproof, includes stakes and rain fly",
  "categoryId": "uuid",
  "containerId": "uuid",
  "isIn": true,
  "quantity": 1
}
```

**Response Payload:**
```json
{
  "id": "uuid",
  "name": "Camping Tent",
  "description": "4-person dome tent, waterproof, includes stakes and rain fly",
  "category": {
    "id": "uuid",
    "name": "Outdoor Gear"
  },
  "container": {
    "id": "uuid",
    "name": "Garage Box A"
  },
  "isIn": true,
  "quantity": 1,
  "images": [],
  "createdAt": "2026-01-20T10:30:00Z",
  "updatedAt": "2026-01-20T10:30:00Z"
}
```

**Success Response:**
- **Code:** `201 Created`
- **Message:** "Item created successfully"

**Error Responses:**
- **Code:** `401 Unauthorized`
- **Message:** "Authentication required"
- **Code:** `400 Bad Request`
- **Message:** "Validation failed: [details]"
  - Name is required
  - Name must be 1-255 characters
  - Name cannot be only whitespace
  - Description must be max 10,000 characters
  - Category ID is required
  - Container ID is required
  - Quantity must be a positive integer
  - Category does not exist or does not belong to user
  - Container does not exist or does not belong to user

---

#### Update Item

**Method:** `PATCH`  
**Path:** `/api/items/:id`  
**Description:** Updates an existing item

**Query Parameters:** None

**Request Payload:**
```json
{
  "name": "Camping Tent - 4 Person",
  "description": "Updated description",
  "categoryId": "uuid",
  "containerId": "uuid",
  "isIn": false,
  "quantity": 1
}
```

**Response Payload:**
```json
{
  "id": "uuid",
  "name": "Camping Tent - 4 Person",
  "description": "Updated description",
  "category": {
    "id": "uuid",
    "name": "Outdoor Gear"
  },
  "container": {
    "id": "uuid",
    "name": "Garage Box B"
  },
  "isIn": false,
  "quantity": 1,
  "images": [],
  "createdAt": "2026-01-15T10:30:00Z",
  "updatedAt": "2026-01-20T11:45:00Z"
}
```

**Success Response:**
- **Code:** `200 OK`
- **Message:** "Item updated successfully"

**Error Responses:**
- **Code:** `401 Unauthorized`
- **Message:** "Authentication required"
- **Code:** `404 Not Found`
- **Message:** "Item not found"
- **Code:** `400 Bad Request`
- **Message:** "Validation failed: [details]"

---

#### Delete Item

**Method:** `DELETE`  
**Path:** `/api/items/:id`  
**Description:** Deletes an item and its associated images

**Query Parameters:** None

**Request Payload:** None

**Response Payload:**
```json
{
  "message": "Item deleted successfully",
  "id": "uuid"
}
```

**Success Response:**
- **Code:** `200 OK`
- **Message:** "Item deleted successfully"

**Error Responses:**
- **Code:** `401 Unauthorized`
- **Message:** "Authentication required"
- **Code:** `404 Not Found`
- **Message:** "Item not found"

---

### 2.6 Images

#### Upload Image for Item

**Method:** `POST`  
**Path:** `/api/items/:id/images`  
**Description:** Uploads and attaches an image to an item

**Query Parameters:** None

**Request Payload:**
- Content-Type: `multipart/form-data`
- Field: `file` (binary image data)
- Field: `displayOrder` (optional, integer 1-5, auto-assigned if not provided)

**Response Payload:**
```json
{
  "id": "uuid",
  "url": "full-size-url",
  "thumbnailUrl": "thumbnail-url",
  "displayOrder": 1,
  "createdAt": "2026-01-20T10:30:00Z"
}
```

**Success Response:**
- **Code:** `201 Created`
- **Message:** "Image uploaded successfully"

**Error Responses:**
- **Code:** `401 Unauthorized`
- **Message:** "Authentication required"
- **Code:** `404 Not Found`
- **Message:** "Item not found"
- **Code:** `400 Bad Request`
- **Message:** "Validation failed: [details]"
  - File is required
  - File must be JPEG, PNG, or WebP format
  - File size must not exceed 5MB
  - Cannot add more than 5 images per item
  - Display order must be between 1 and 5
  - Display order already exists for this item

---

#### Upload Image for Container

**Method:** `POST`  
**Path:** `/api/containers/:id/images`  
**Description:** Uploads and attaches an image to a container

**Query Parameters:** None

**Request Payload:**
- Content-Type: `multipart/form-data`
- Field: `file` (binary image data)
- Field: `displayOrder` (optional, integer 1-5, auto-assigned if not provided)

**Response Payload:**
```json
{
  "id": "uuid",
  "url": "full-size-url",
  "thumbnailUrl": "thumbnail-url",
  "displayOrder": 1,
  "createdAt": "2026-01-20T10:30:00Z"
}
```

**Success Response:**
- **Code:** `201 Created`
- **Message:** "Image uploaded successfully"

**Error Responses:**
- **Code:** `401 Unauthorized`
- **Message:** "Authentication required"
- **Code:** `404 Not Found`
- **Message:** "Container not found"
- **Code:** `400 Bad Request`
- **Message:** "Validation failed: [details]"

---

#### Update Image Display Order

**Method:** `PATCH`  
**Path:** `/api/items/:itemId/images/:imageId`  
**Description:** Updates the display order of an image

**Query Parameters:** None

**Request Payload:**
```json
{
  "displayOrder": 2
}
```

**Response Payload:**
```json
{
  "id": "uuid",
  "url": "full-size-url",
  "thumbnailUrl": "thumbnail-url",
  "displayOrder": 2,
  "updatedAt": "2026-01-20T11:30:00Z"
}
```

**Success Response:**
- **Code:** `200 OK`
- **Message:** "Image updated successfully"

**Error Responses:**
- **Code:** `401 Unauthorized`
- **Message:** "Authentication required"
- **Code:** `404 Not Found`
- **Message:** "Image not found"
- **Code:** `400 Bad Request`
- **Message:** "Display order must be between 1 and 5"
- **Code:** `409 Conflict`
- **Message:** "Display order already exists for this item"

---

#### Delete Image from Item

**Method:** `DELETE`  
**Path:** `/api/items/:itemId/images/:imageId`  
**Description:** Deletes an image from an item

**Query Parameters:** None

**Request Payload:** None

**Response Payload:**
```json
{
  "message": "Image deleted successfully",
  "id": "uuid"
}
```

**Success Response:**
- **Code:** `200 OK`
- **Message:** "Image deleted successfully"

**Error Responses:**
- **Code:** `401 Unauthorized`
- **Message:** "Authentication required"
- **Code:** `404 Not Found`
- **Message:** "Image not found"

---

#### Delete Image from Container

**Method:** `DELETE`  
**Path:** `/api/containers/:containerId/images/:imageId`  
**Description:** Deletes an image from a container

**Query Parameters:** None

**Request Payload:** None

**Response Payload:**
```json
{
  "message": "Image deleted successfully",
  "id": "uuid"
}
```

**Success Response:**
- **Code:** `200 OK`
- **Message:** "Image deleted successfully"

**Error Responses:**
- **Code:** `401 Unauthorized`
- **Message:** "Authentication required"
- **Code:** `404 Not Found`
- **Message:** "Image not found"

---

## 3. Authentication and Authorization

### 3.1 Authentication Mechanism

The API uses **Supabase Authentication** with JWT (JSON Web Tokens) for secure user authentication:

- **Registration/Login/Logout:** Handled directly by Supabase Auth SDK on the client side
- **Password Reset:** Managed through Supabase Auth's built-in email flow
- **Session Management:** JWT tokens stored in HTTP-only cookies or local storage (configured in Supabase client)

### 3.2 Authorization Flow

1. **Client Authentication:**
   - Users authenticate using Supabase Auth SDK (client-side)
   - Supabase returns a JWT access token and refresh token
   - Tokens are automatically managed by the Supabase client

2. **API Request Authorization:**
   - All API requests include the JWT token in the `Authorization` header: `Bearer <token>`
   - Astro middleware intercepts requests and verifies the JWT token
   - Middleware extracts the user ID (`auth.uid()`) from the verified token
   - User context is injected into the request for use in API endpoints

3. **Database-Level Security:**
   - PostgreSQL Row-Level Security (RLS) policies enforce data isolation
   - All database queries automatically filter by `auth.uid()` through RLS
   - Even if application logic fails, database ensures users can only access their own data

### 3.3 Implementation Details

**Astro Middleware (`src/middleware/index.ts`):**
```typescript
// Verify Supabase session and inject user context
// Redirect unauthenticated users to login page
// Pass authenticated requests to API endpoints
```

**API Endpoint Pattern:**
```typescript
// 1. Verify user session (handled by middleware)
// 2. Extract user_id from authenticated context
// 3. Validate request payload
// 4. Execute database query (RLS automatically filters by user)
// 5. Return response
```

**Supabase Client Configuration:**
- Server-side client for API endpoints (uses service role for admin operations if needed)
- Client-side client for direct auth operations
- Both clients respect RLS policies

### 3.4 Security Measures

- **JWT Token Validation:** All API requests validate token signature and expiration
- **Row-Level Security:** Database enforces user data isolation automatically
- **HTTPS Only:** All production traffic requires HTTPS
- **CORS Configuration:** API restricts cross-origin requests to authorized domains
- **Rate Limiting:** Implement rate limiting on API endpoints (future consideration)
- **Input Sanitization:** All user inputs are validated and sanitized
- **SQL Injection Prevention:** Using Supabase client with parameterized queries
- **File Upload Security:** Validate file types, sizes, and scan for malicious content

---

## 4. Validation and Business Logic

### 4.1 Validation Conditions by Resource

#### Containers

| Field | Validation Rule | Error Message |
|-------|----------------|---------------|
| name | Required, 1-255 characters, non-empty when trimmed | "Name is required and must be 1-255 characters" |
| description | Optional, max 10,000 characters | "Description must not exceed 10,000 characters" |

**Business Logic:**
- Containers cannot be deleted if they have items assigned (ON DELETE RESTRICT)
- Before deletion, query item count and return 409 Conflict with message: "Cannot delete [name] because it contains X items"

---

#### Categories

| Field | Validation Rule | Error Message |
|-------|----------------|---------------|
| name | Required, 1-255 characters, non-empty when trimmed, unique (case-insensitive) per user | "Name is required and must be 1-255 characters" or "A category with this name already exists" |

**Business Logic:**
- Categories cannot be deleted if they have items assigned (ON DELETE RESTRICT)
- Category names must be unique per user (case-insensitive)
- Before deletion, query item count and return 409 Conflict with message: "Cannot delete [name] because it contains X items"
- Uniqueness check uses `LOWER(name)` for case-insensitive comparison

---

#### Items

| Field | Validation Rule | Error Message |
|-------|----------------|---------------|
| name | Required, 1-255 characters, non-empty when trimmed | "Name is required and must be 1-255 characters" |
| description | Optional, max 10,000 characters | "Description must not exceed 10,000 characters" |
| categoryId | Required, must exist and belong to user | "Category is required and must be valid" |
| containerId | Required, must exist and belong to user | "Container is required and must be valid" |
| isIn | Required, boolean | "Status is required" |
| quantity | Optional, must be positive integer if provided | "Quantity must be a positive integer" |

**Business Logic:**
- **Pre-creation validation:** Validate category and container exist and belong to the user before creating item
- **Referential integrity:** Database enforces foreign key constraints with ON DELETE RESTRICT
- **In/Out status:** Boolean flag with default value `true` (in storage)

---

#### Images

| Field | Validation Rule | Error Message |
|-------|----------------|---------------|
| file | Required, JPEG/PNG/WebP format, max 5MB | "Invalid file format or size exceeds 5MB" |
| displayOrder | Required, integer 1-5, unique per entity | "Display order must be between 1 and 5" or "Display order already exists" |
| entity_type | Must be 'item' or 'container' | "Invalid entity type" |
| entity_id | Must exist and belong to user | "Entity not found" |

**Business Logic:**
- **Image limit enforcement:** Maximum 5 images per entity (enforced by database trigger)
- Before upload, query current image count and return 400 Bad Request if >= 5
- **Thumbnail convention:** Image with display_order = 1 is the thumbnail
- **Automatic cleanup:** When item or container is deleted, delete associated images from Supabase Storage
- **Display order uniqueness:** Unique constraint on `(entity_type, entity_id, display_order)`
- **Storage path format:** `user_id/entity_type/entity_id/image_id.ext`

---

### 4.2 Search and Filtering Logic

#### Multi-Filter Query Construction

All filters combine with **AND logic**:

```sql
SELECT * FROM items
WHERE user_id = auth.uid()
  AND (name ILIKE '%search_term%' OR search IS NULL)
  AND (category_id = ANY($categories) OR $categories IS NULL)
  AND (container_id = ANY($containers) OR $containers IS NULL)
  AND (is_in = $status OR $status = 'all')
ORDER BY created_at DESC
LIMIT $limit OFFSET $offset;
```

**Filter Specifications:**
- **Search:** Case-insensitive partial match on item name using `ILIKE`
- **Category:** Exact match on category UUID(s), supports multiple selections
- **Container:** Exact match on container UUID(s), supports multiple selections
- **Status:** Exact match on boolean `is_in` field (in/out/all)

**Performance Optimization:**
- Use database indexes for efficient filtering (defined in schema)
- Apply debounce on client side (300ms) to reduce API calls
- Return only necessary fields in list views (exclude full descriptions)

---

### 4.3 Pagination Strategy

**Offset-based pagination** for simplicity in MVP:

- Default page size: 20 items
- Maximum page size: 100 items
- Response includes pagination metadata (total count, total pages, current page)

**Calculation:**
```
offset = (page - 1) * limit
```

**Future consideration:** Cursor-based pagination for better performance with large datasets

---

### 4.4 Error Handling Standards

All API endpoints follow consistent error response format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "User-friendly error message",
    "details": [
      {
        "field": "name",
        "message": "Name is required"
      }
    ]
  }
}
```

**Error Code Categories:**
- `VALIDATION_ERROR` - Input validation failures (400)
- `AUTHENTICATION_ERROR` - Missing or invalid authentication (401)
- `AUTHORIZATION_ERROR` - Insufficient permissions (403)
- `NOT_FOUND` - Resource not found (404)
- `CONFLICT` - Business logic conflict (409, e.g., delete with dependencies)
- `SERVER_ERROR` - Unexpected server errors (500)

---

### 4.5 Business Logic Implementation Summary

1. **Deletion Protection:**
   - Query dependent items before allowing deletion
   - Return helpful error messages with counts
   - Enforce at both application and database levels

2. **Uniqueness Enforcement:**
   - Case-insensitive category name validation
   - Database unique constraints as final authority
   - Application-level pre-validation for better UX

3. **Referential Integrity:**
   - Validate foreign key relationships before insert/update
   - Database constraints prevent invalid references
   - Pre-creation workflow: containers/categories must exist before items

4. **Image Management:**
   - Validate format, size, and count before upload
   - Automatic cleanup when parent entities deleted
   - Enforce ordering and thumbnail conventions

5. **User Data Isolation:**
   - All queries scoped to authenticated user
   - RLS policies as final security layer
   - Middleware ensures user context in all requests

---

## 5. Additional Considerations

### 5.1 Rate Limiting

**Recommendation:** Implement rate limiting in future phases:
- 100 requests per minute per user for general endpoints
- 10 requests per minute for image uploads
- 5 requests per minute for authentication endpoints

### 5.2 Caching Strategy

**Recommendation:** Consider caching for:
- Category lists (rarely change, frequently accessed)
- Container lists (relatively stable)
- Dashboard statistics (can tolerate slight staleness)

**Implementation:** Use HTTP cache headers or Redis for server-side caching

### 5.3 API Versioning

**Current approach:** No versioning for MVP (Phase 1)

**Future consideration:** Use URL versioning (`/api/v1/`, `/api/v2/`) for breaking changes

### 5.4 Monitoring and Logging

**Recommendations:**
- Log all API errors with context (user_id, endpoint, error details)
- Track API performance metrics (response times, error rates)
- Monitor authentication failures and suspicious activity
- Set up alerts for critical errors and performance degradation

### 5.5 Testing Strategy

**Recommended test coverage:**
- Unit tests for validation logic
- Integration tests for API endpoints
- End-to-end tests for critical workflows
- Load tests for performance validation
- Security tests for authentication and authorization

### 5.6 Documentation Maintenance

**Keep updated:**
- API endpoint documentation (this document)
- Request/response payload examples
- Error code catalog
- Authentication flow diagrams
- Database schema changes

---

## Appendix: HTTP Status Code Reference

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Validation errors, malformed requests |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Business logic conflict (e.g., deletion with dependencies) |
| 422 | Unprocessable Entity | Semantic validation errors |
| 500 | Internal Server Error | Unexpected server errors |
| 503 | Service Unavailable | Temporary service outage |
