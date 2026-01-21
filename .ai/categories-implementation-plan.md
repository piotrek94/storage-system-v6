# API Endpoint Implementation Plan: Categories (GET/POST)

## Analysis Summary

This plan covers two category endpoints:
1. **GET /api/categories** - List all categories with sorting
2. **POST /api/categories** - Create a new category

Both endpoints require authentication via Supabase session and enforce user data isolation through RLS policies.

---

## 1. Endpoint Overview

### GET /api/categories
Retrieves all categories for the authenticated user with optional sorting. Categories are essential for item classification and are returned without pagination (expected to be a manageable list for single-user MVP).

**Key Features:**
- Retrieves all user's categories
- Includes computed item count for each category
- Supports sorting by name or creation date
- No pagination (returns complete list)

### POST /api/categories
Creates a new category for the authenticated user with validation and uniqueness enforcement.

**Key Features:**
- Validates category name format and length
- Enforces case-insensitive uniqueness per user
- Returns newly created category with metadata
- Initial item count is always 0

---

## 2. Request Details

### GET /api/categories

- **HTTP Method:** `GET`
- **URL Structure:** `/api/categories`
- **Authentication:** Required (Supabase session via middleware)
- **Query Parameters:**
  - `sort` (optional, string, default: "name")
    - Allowed values: "name", "created_at"
    - Case-sensitive validation required
  - `order` (optional, string, default: "asc")
    - Allowed values: "asc", "desc"
    - Case-sensitive validation required
- **Request Body:** None
- **Content-Type:** N/A

**Example Request:**
```
GET /api/categories?sort=name&order=asc
Authorization: Bearer <supabase-jwt-token>
```

### POST /api/categories

- **HTTP Method:** `POST`
- **URL Structure:** `/api/categories`
- **Authentication:** Required (Supabase session via middleware)
- **Query Parameters:** None
- **Request Body:** JSON payload conforming to `CreateCategoryCommand`
  ```json
  {
    "name": "Outdoor Gear"
  }
  ```
- **Content-Type:** `application/json`

**Validation Requirements:**
- `name` (required, string)
  - Must be present (not null/undefined)
  - Must be 1-255 characters after trimming
  - Must contain at least one non-whitespace character
  - Must be unique per user (case-insensitive)

---

## 3. Response Details

### GET /api/categories

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Outdoor Gear",
      "itemCount": 25,
      "createdAt": "2026-01-05T12:00:00Z",
      "updatedAt": "2026-01-05T12:00:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Kitchen Items",
      "itemCount": 12,
      "createdAt": "2026-01-10T14:30:00Z",
      "updatedAt": "2026-01-10T14:30:00Z"
    }
  ]
}
```

**Response Type:** `CategoryListResponseDTO`

**Error Responses:**

| Status Code | Error Code | Scenario | Message |
|-------------|------------|----------|---------|
| 401 | AUTHENTICATION_ERROR | No valid session | "Authentication required" |
| 400 | VALIDATION_ERROR | Invalid sort field | "Invalid sort field. Must be 'name' or 'created_at'" |
| 400 | VALIDATION_ERROR | Invalid order | "Invalid order. Must be 'asc' or 'desc'" |
| 500 | SERVER_ERROR | Database error | "Failed to retrieve categories" |

### POST /api/categories

**Success Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Outdoor Gear",
  "itemCount": 0,
  "createdAt": "2026-01-20T10:30:00Z",
  "updatedAt": "2026-01-20T10:30:00Z"
}
```

**Response Type:** `CategoryDetailDTO`

**Headers:**
```
Location: /api/categories/550e8400-e29b-41d4-a716-446655440000
```

**Error Responses:**

| Status Code | Error Code | Scenario | Message | Details |
|-------------|------------|----------|---------|---------|
| 401 | AUTHENTICATION_ERROR | No valid session | "Authentication required" | null |
| 400 | VALIDATION_ERROR | Missing name | "Validation failed" | `[{ field: "name", message: "Name is required" }]` |
| 400 | VALIDATION_ERROR | Name too short/long | "Validation failed" | `[{ field: "name", message: "Name must be 1-255 characters" }]` |
| 400 | VALIDATION_ERROR | Name only whitespace | "Validation failed" | `[{ field: "name", message: "Name cannot be only whitespace" }]` |
| 400 | VALIDATION_ERROR | Invalid JSON | "Invalid request body" | null |
| 409 | CONFLICT | Duplicate name (case-insensitive) | "A category with this name already exists" | null |
| 500 | SERVER_ERROR | Database error | "Failed to create category" | null |

---

## 4. Used Types

### GET /api/categories

**Response Types:**
- `CategoryListResponseDTO` (defined in `src/types.ts`)
  ```typescript
  export type CategoryListResponseDTO = { data: CategoryListItemDTO[] };
  ```

- `CategoryListItemDTO` (defined in `src/types.ts`)
  ```typescript
  export interface CategoryListItemDTO {
    id: Category["id"];
    name: Category["name"];
    itemCount: number;
    createdAt: Category["created_at"];
    updatedAt: Category["updated_at"];
  }
  ```

**Query Parameter Validation Schema:**
```typescript
// Using Zod for validation
const getCategoriesQuerySchema = z.object({
  sort: z.enum(["name", "created_at"]).optional().default("name"),
  order: z.enum(["asc", "desc"]).optional().default("asc")
});
```

### POST /api/categories

**Request Types:**
- `CreateCategoryCommand` (defined in `src/types.ts`)
  ```typescript
  export type CreateCategoryCommand = Pick<TablesInsert<"categories">, "name">;
  ```

**Response Types:**
- `CategoryDetailDTO` (defined in `src/types.ts`)
  ```typescript
  export type CategoryDetailDTO = CategoryListItemDTO;
  ```

**Validation Schema:**
```typescript
// Using Zod for validation
const createCategorySchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(255, "Name must not exceed 255 characters")
    .refine(
      (val) => val.trim().length > 0,
      "Name cannot be only whitespace"
    )
    .transform((val) => val.trim())
});
```

### Shared Error Type

- `ErrorResponseDTO` (defined in `src/types.ts`)
  ```typescript
  export interface ErrorResponseDTO {
    error: {
      code: string;
      message: string;
      details?: Array<{
        field: string;
        message: string;
      }>;
    };
  }
  ```

---

## 5. Data Flow

### GET /api/categories

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ GET /api/categories?sort=name&order=asc
       │ Authorization: Bearer <token>
       ▼
┌─────────────────────┐
│ Astro Middleware    │
│ - Verify JWT token  │
│ - Extract user_id   │
│ - Inject into       │
│   context.locals    │
└──────┬──────────────┘
       │ user_id extracted
       ▼
┌─────────────────────┐
│ GET Handler         │
│ /api/categories.ts  │
│ - Parse query       │
│ - Validate params   │
└──────┬──────────────┘
       │ Validated params
       ▼
┌─────────────────────┐
│ CategoryService     │
│ - Build query       │
│ - Apply sorting     │
│ - Execute query     │
│ - Count items       │
└──────┬──────────────┘
       │ SQL Query
       ▼
┌─────────────────────┐
│ Supabase DB         │
│ - Apply RLS         │
│ - Filter by user_id │
│ - Join items count  │
│ - Apply sort/order  │
└──────┬──────────────┘
       │ Raw DB results
       ▼
┌─────────────────────┐
│ CategoryService     │
│ - Map to DTO        │
│ - Format response   │
└──────┬──────────────┘
       │ CategoryListResponseDTO
       ▼
┌─────────────────────┐
│ GET Handler         │
│ - Return 200 OK     │
│ - Send JSON         │
└──────┬──────────────┘
       │ Response
       ▼
┌─────────────┐
│   Client    │
└─────────────┘
```

**Database Query (Conceptual):**
```sql
SELECT 
  c.id,
  c.name,
  c.created_at,
  c.updated_at,
  COUNT(i.id) as item_count
FROM categories c
LEFT JOIN items i ON i.category_id = c.id
WHERE c.user_id = $user_id
GROUP BY c.id
ORDER BY c.name ASC;
-- RLS policy automatically enforces user_id filter
```

### POST /api/categories

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /api/categories
       │ Body: { "name": "Outdoor Gear" }
       │ Authorization: Bearer <token>
       ▼
┌─────────────────────┐
│ Astro Middleware    │
│ - Verify JWT token  │
│ - Extract user_id   │
│ - Inject into       │
│   context.locals    │
└──────┬──────────────┘
       │ user_id extracted
       ▼
┌─────────────────────┐
│ POST Handler        │
│ /api/categories.ts  │
│ - Parse JSON body   │
│ - Validate schema   │
└──────┬──────────────┘
       │ Validated command
       ▼
┌─────────────────────┐
│ CategoryService     │
│ - Check uniqueness  │
│   (case-insensitive)│
└──────┬──────────────┘
       │ Uniqueness check
       ▼
┌─────────────────────┐
│ Supabase DB         │
│ - Query existing    │
│ - LOWER(name) match │
└──────┬──────────────┘
       │ Exists? No
       ▼
┌─────────────────────┐
│ CategoryService     │
│ - Insert category   │
│ - Include user_id   │
└──────┬──────────────┘
       │ INSERT query
       ▼
┌─────────────────────┐
│ Supabase DB         │
│ - Validate CHECK    │
│   constraints       │
│ - Apply RLS         │
│ - Enforce UNIQUE    │
│   index             │
│ - Auto-generate id  │
│ - Set timestamps    │
└──────┬──────────────┘
       │ New category record
       ▼
┌─────────────────────┐
│ CategoryService     │
│ - Map to DTO        │
│ - Set itemCount = 0 │
└──────┬──────────────┘
       │ CategoryDetailDTO
       ▼
┌─────────────────────┐
│ POST Handler        │
│ - Return 201        │
│ - Set Location hdr  │
│ - Send JSON         │
└──────┬──────────────┘
       │ Response
       ▼
┌─────────────┐
│   Client    │
└─────────────┘
```

**Database Operations:**

1. **Uniqueness Check:**
```sql
SELECT id FROM categories
WHERE user_id = $user_id
  AND LOWER(name) = LOWER($name);
-- If returns results, throw 409 Conflict
```

2. **Insert:**
```sql
INSERT INTO categories (user_id, name)
VALUES ($user_id, $name)
RETURNING *;
-- RLS and constraints automatically enforced
```

---

## 6. Security Considerations

### Authentication
- **Middleware Enforcement:** All requests must pass through Astro middleware that validates Supabase JWT tokens
- **Token Validation:** Middleware verifies token signature, expiration, and extracts `user_id` from `auth.uid()`
- **Context Injection:** Authenticated user context is injected into `context.locals.supabase` for use in handlers

### Authorization
- **Row-Level Security (RLS):** Database policies automatically filter all queries by authenticated user
- **RLS Policies Applied:**
  ```sql
  -- GET: Users can view own categories
  CREATE POLICY "Users can view own categories"
    ON categories FOR SELECT
    USING (auth.uid() = user_id);
  
  -- POST: Users can insert own categories
  CREATE POLICY "Users can insert own categories"
    ON categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  ```
- **No Cross-User Access:** Even if application logic fails, database ensures users cannot access other users' data

### Input Validation
- **Zod Schema Validation:** All inputs validated against strict schemas before processing
- **SQL Injection Prevention:** Using Supabase client with parameterized queries (no raw SQL from user input)
- **XSS Prevention:** Category names stored as plain text, sanitized on frontend when rendering
- **Length Limits:** Database CHECK constraints enforce max 255 characters, preventing DoS via large inputs
- **Whitespace Handling:** Trim inputs and reject whitespace-only strings

### Data Integrity
- **Unique Constraint:** Database enforces case-insensitive uniqueness via `UNIQUE INDEX idx_categories_user_name_unique ON categories(user_id, LOWER(name))`
- **Check Constraints:** Database validates name length at storage level: `CHECK (length(trim(name)) >= 1 AND length(name) <= 255)`
- **Foreign Key Protection:** ON DELETE CASCADE from profiles ensures orphaned categories are cleaned up if user deleted

### Rate Limiting Considerations
- **Future Enhancement:** Consider implementing rate limiting (e.g., 100 requests/minute per user)
- **POST Specific:** Stricter limits on POST (e.g., 20 creates/minute) to prevent abuse

### CORS and Headers
- **CORS Configuration:** API should validate Origin header for production
- **Content-Type Enforcement:** Reject POST requests without `application/json` content type
- **Response Headers:** Include security headers (X-Content-Type-Options, etc.)

### Error Information Disclosure
- **Generic Server Errors:** Don't expose database error details to client (log internally)
- **Specific Validation Errors:** Provide clear field-level errors for better UX
- **No User Enumeration:** Don't reveal whether specific categories exist for other users

---

## 7. Error Handling

### GET /api/categories Error Scenarios

| Error Scenario | Detection Point | Status Code | Error Code | Response Message | Logging |
|----------------|-----------------|-------------|------------|------------------|---------|
| No authentication token | Middleware | 401 | AUTHENTICATION_ERROR | "Authentication required" | Log attempt with IP |
| Invalid/expired token | Middleware | 401 | AUTHENTICATION_ERROR | "Authentication required" | Log attempt with token info |
| Invalid sort parameter | Handler validation | 400 | VALIDATION_ERROR | "Invalid sort field. Must be 'name' or 'created_at'" | Log with query params |
| Invalid order parameter | Handler validation | 400 | VALIDATION_ERROR | "Invalid order. Must be 'asc' or 'desc'" | Log with query params |
| Database connection failure | Service layer | 500 | SERVER_ERROR | "Failed to retrieve categories" | Log full error + stack trace |
| RLS policy failure | Database | 500 | SERVER_ERROR | "Failed to retrieve categories" | Log user_id + error |
| Malformed query string | Handler parsing | 400 | VALIDATION_ERROR | "Invalid query parameters" | Log query string |

### POST /api/categories Error Scenarios

| Error Scenario | Detection Point | Status Code | Error Code | Response Message | Logging |
|----------------|-----------------|-------------|------------|------------------|---------|
| No authentication token | Middleware | 401 | AUTHENTICATION_ERROR | "Authentication required" | Log attempt with IP |
| Invalid/expired token | Middleware | 401 | AUTHENTICATION_ERROR | "Authentication required" | Log attempt with token info |
| Missing request body | Handler parsing | 400 | VALIDATION_ERROR | "Invalid request body" | Log with headers |
| Invalid JSON syntax | Handler parsing | 400 | VALIDATION_ERROR | "Invalid request body" | Log raw body (truncated) |
| Missing name field | Zod validation | 400 | VALIDATION_ERROR | "Validation failed" + details | Log validation errors |
| Name empty string | Zod validation | 400 | VALIDATION_ERROR | "Validation failed" + details | Log validation errors |
| Name only whitespace | Zod validation | 400 | VALIDATION_ERROR | "Validation failed" + details | Log validation errors |
| Name > 255 characters | Zod validation | 400 | VALIDATION_ERROR | "Validation failed" + details | Log validation errors |
| Duplicate name (case-insensitive) | Service uniqueness check OR DB constraint | 409 | CONFLICT | "A category with this name already exists" | Log user_id + name |
| Database connection failure | Service layer | 500 | SERVER_ERROR | "Failed to create category" | Log full error + stack trace |
| RLS policy failure | Database | 500 | SERVER_ERROR | "Failed to create category" | Log user_id + error |
| CHECK constraint violation | Database | 500 | SERVER_ERROR | "Failed to create category" | Log constraint error |
| Wrong Content-Type | Handler | 400 | VALIDATION_ERROR | "Content-Type must be application/json" | Log headers |

### Error Response Format

All errors follow the standard `ErrorResponseDTO` format:

```typescript
// Simple error (no field details)
{
  "error": {
    "code": "CONFLICT",
    "message": "A category with this name already exists"
  }
}

// Validation error (with field details)
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "name",
        "message": "Name must be 1-255 characters"
      }
    ]
  }
}
```

### Error Handling Implementation Pattern

```typescript
try {
  // Business logic
} catch (error) {
  // Log error internally with full context
  console.error('[CategoryService] Error:', {
    userId: user_id,
    operation: 'create',
    error: error.message,
    stack: error.stack
  });
  
  // Return user-friendly error
  if (error instanceof ZodError) {
    return new Response(JSON.stringify({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: formatZodErrors(error)
      }
    }), { status: 400 });
  }
  
  if (error.code === '23505') { // Unique constraint violation
    return new Response(JSON.stringify({
      error: {
        code: 'CONFLICT',
        message: 'A category with this name already exists'
      }
    }), { status: 409 });
  }
  
  // Generic server error (don't expose internals)
  return new Response(JSON.stringify({
    error: {
      code: 'SERVER_ERROR',
      message: 'Failed to create category'
    }
  }), { status: 500 });
}
```

### Logging Strategy

- **Successful Operations:** Log at INFO level with user_id, operation, and category_id
- **Validation Errors:** Log at WARN level with validation details
- **Server Errors:** Log at ERROR level with full error object and stack trace
- **Authentication Failures:** Log at WARN level with IP address and timestamp
- **PII Considerations:** Don't log full tokens, only truncated identifiers

---

## 8. Performance Considerations

### GET /api/categories

**Expected Load:**
- Low frequency (categories change infrequently)
- Small result sets (expected < 100 categories per user in MVP)
- Read-heavy operation

**Optimization Strategies:**

1. **Database Indexes:**
   - Primary key index on `categories(id)` (automatic)
   - Foreign key index on `categories(user_id)` (automatic)
   - Index on `categories(user_id, name)` for sorting
   - Index on `items(category_id)` for efficient counting

2. **Query Optimization:**
   - Use `LEFT JOIN` with `COUNT()` and `GROUP BY` for efficient item counting
   - Leverage Supabase's query planner for optimal execution
   - RLS policies use indexed `user_id` column

3. **Caching Opportunities:**
   - **Client-side caching:** Cache categories list for 5-10 minutes (rarely changes)
   - **HTTP caching:** Set `Cache-Control: private, max-age=300` header
   - **Server-side caching:** Consider Redis cache for frequently accessed category lists (future)

4. **Query Pattern:**
   ```sql
   -- Efficient query using indexes
   SELECT 
     c.id,
     c.name,
     c.created_at,
     c.updated_at,
     COUNT(i.id) as item_count
   FROM categories c
   LEFT JOIN items i ON i.category_id = c.id AND i.user_id = c.user_id
   WHERE c.user_id = $user_id
   GROUP BY c.id, c.name, c.created_at, c.updated_at
   ORDER BY 
     CASE WHEN $sort = 'name' THEN c.name END ASC/DESC,
     CASE WHEN $sort = 'created_at' THEN c.created_at END ASC/DESC;
   ```

5. **Response Size:**
   - Expected payload: ~50-100 bytes per category × 50 categories = ~5KB
   - Enable gzip compression for responses
   - No pagination needed for MVP (manageable result sets)

**Potential Bottlenecks:**
- Item count calculation for users with many items (thousands)
- Multiple concurrent requests during page load

**Mitigation:**
- Index on `items(category_id)` ensures fast counting
- Consider materialized item counts in future if performance degrades

### POST /api/categories

**Expected Load:**
- Very low frequency (category creation is infrequent)
- Short transaction time
- Write operation (heavier than reads)

**Optimization Strategies:**

1. **Database Indexes:**
   - Unique index on `categories(user_id, LOWER(name))` for uniqueness check
   - This index also speeds up duplicate detection

2. **Validation Order:**
   - Perform cheap validations first (schema validation)
   - Perform expensive operations last (database uniqueness check)
   - Consider application-level uniqueness check before INSERT to provide better errors

3. **Transaction Handling:**
   - Keep transactions short and focused
   - Single INSERT operation (no complex transactions in MVP)
   - Database handles uniqueness atomically

4. **Uniqueness Check Strategy:**

   **Option A: Check Before Insert (current recommendation)**
   ```typescript
   // Pre-check for better error messages
   const existing = await supabase
     .from('categories')
     .select('id')
     .eq('user_id', user_id)
     .ilike('name', trimmedName)
     .maybeSingle();
   
   if (existing.data) {
     throw new ConflictError('A category with this name already exists');
   }
   
   // Then insert
   const { data } = await supabase
     .from('categories')
     .insert({ user_id, name: trimmedName })
     .select()
     .single();
   ```

   **Option B: Insert and Catch Constraint Violation (more atomic)**
   ```typescript
   // Let database handle uniqueness
   const { data, error } = await supabase
     .from('categories')
     .insert({ user_id, name: trimmedName })
     .select()
     .single();
   
   if (error?.code === '23505') {
     throw new ConflictError('A category with this name already exists');
   }
   ```

   **Recommendation:** Use Option B for better atomicity and one less database round-trip

5. **Response Optimization:**
   - Return created category immediately (no additional query needed)
   - Use `.select().single()` to get created record in same query
   - Item count is always 0 for new categories (no query needed)

**Potential Bottlenecks:**
- Unique constraint check with many categories (mitigated by index)
- Concurrent duplicate name submissions (handled by database atomically)

**Mitigation:**
- Unique index ensures fast lookup
- Database handles race conditions via constraint
- Debounce form submissions on frontend

### General Performance Notes

- **Connection Pooling:** Supabase handles connection pooling automatically
- **Monitoring:** Track endpoint response times (aim for < 100ms for GET, < 200ms for POST)
- **Scaling:** Single-user workload means vertical scaling sufficient for MVP
- **Future Optimizations:**
  - Add Redis caching layer for category lists
  - Implement materialized item counts if needed
  - Consider GraphQL subscription for real-time updates

---

## 9. Implementation Steps

### Step 1: Create Zod Validation Schemas

**File:** `src/lib/validators/category.validators.ts` (create new file)

```typescript
import { z } from "zod";

/**
 * Validation schema for GET /api/categories query parameters
 */
export const getCategoriesQuerySchema = z.object({
  sort: z.enum(["name", "created_at"]).optional().default("name"),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
});

export type GetCategoriesQuery = z.infer<typeof getCategoriesQuerySchema>;

/**
 * Validation schema for POST /api/categories request body
 */
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must not exceed 255 characters")
    .refine((val) => val.trim().length > 0, "Name cannot be only whitespace")
    .transform((val) => val.trim()),
});

export type CreateCategoryBody = z.infer<typeof createCategorySchema>;
```

**Notes:**
- Place validators in dedicated file for reusability
- Export inferred types for type safety
- Use `.transform()` to normalize input (trim whitespace)

### Step 2: Create Category Service

**File:** `src/lib/services/category.service.ts` (create new file)

```typescript
import type { SupabaseClient } from "../db/supabase.client";
import type {
  CategoryListItemDTO,
  CategoryDetailDTO,
  CategoryListResponseDTO,
  CreateCategoryCommand,
} from "../../types";

/**
 * Service layer for category operations
 * Handles all business logic and database interactions for categories
 */
export class CategoryService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Retrieves all categories for a user with sorting
   * Includes computed item count for each category
   */
  async listCategories(
    userId: string,
    sort: "name" | "created_at" = "name",
    order: "asc" | "desc" = "asc"
  ): Promise<CategoryListResponseDTO> {
    // Query categories with item count
    const { data: categories, error } = await this.supabase
      .from("categories")
      .select(
        `
        id,
        name,
        created_at,
        updated_at
      `
      )
      .eq("user_id", userId)
      .order(sort === "name" ? "name" : "created_at", { ascending: order === "asc" });

    if (error) {
      console.error("[CategoryService] Error fetching categories:", error);
      throw new Error("Failed to retrieve categories");
    }

    // Get item counts for each category
    const categoryIds = categories.map((c) => c.id);
    const { data: itemCounts, error: countError } = await this.supabase
      .from("items")
      .select("category_id")
      .in("category_id", categoryIds);

    if (countError) {
      console.error("[CategoryService] Error fetching item counts:", countError);
      throw new Error("Failed to retrieve categories");
    }

    // Map counts to categories
    const countMap = new Map<string, number>();
    itemCounts?.forEach((item) => {
      countMap.set(item.category_id, (countMap.get(item.category_id) || 0) + 1);
    });

    // Build response DTOs
    const data: CategoryListItemDTO[] = categories.map((category) => ({
      id: category.id,
      name: category.name,
      itemCount: countMap.get(category.id) || 0,
      createdAt: category.created_at,
      updatedAt: category.updated_at,
    }));

    return { data };
  }

  /**
   * Creates a new category for a user
   * Enforces case-insensitive uniqueness
   */
  async createCategory(
    userId: string,
    command: CreateCategoryCommand
  ): Promise<CategoryDetailDTO> {
    const trimmedName = command.name.trim();

    // Insert category and let database handle uniqueness constraint
    const { data: category, error } = await this.supabase
      .from("categories")
      .insert({
        user_id: userId,
        name: trimmedName,
      })
      .select()
      .single();

    // Handle errors
    if (error) {
      // PostgreSQL unique constraint violation error code
      if (error.code === "23505") {
        console.warn("[CategoryService] Duplicate category name:", {
          userId,
          name: trimmedName,
        });
        throw new ConflictError("A category with this name already exists");
      }

      console.error("[CategoryService] Error creating category:", error);
      throw new Error("Failed to create category");
    }

    // Build response DTO (new categories always have 0 items)
    return {
      id: category.id,
      name: category.name,
      itemCount: 0,
      createdAt: category.created_at,
      updatedAt: category.updated_at,
    };
  }
}

/**
 * Custom error for conflict scenarios
 */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}
```

**Notes:**
- Encapsulate all database logic in service layer
- Use TypeScript for type safety
- Log errors with context for debugging
- Let database handle uniqueness atomically (no race conditions)

### Step 3: Create Error Handling Utilities

**File:** `src/lib/utils/error-handler.ts` (create new file)

```typescript
import type { ErrorResponseDTO } from "../../types";
import { ZodError } from "zod";
import { ConflictError } from "../services/category.service";

/**
 * Formats Zod validation errors into ErrorResponseDTO format
 */
export function formatZodErrors(error: ZodError): ErrorResponseDTO["error"]["details"] {
  return error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: ErrorResponseDTO["error"]["details"]
): ErrorResponseDTO {
  return {
    error: {
      code,
      message,
      details,
    },
  };
}

/**
 * Handles errors and returns appropriate Response object
 */
export function handleError(error: unknown): Response {
  // Zod validation errors
  if (error instanceof ZodError) {
    return new Response(
      JSON.stringify(
        createErrorResponse("VALIDATION_ERROR", "Validation failed", formatZodErrors(error))
      ),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Conflict errors (duplicate category name)
  if (error instanceof ConflictError) {
    return new Response(
      JSON.stringify(createErrorResponse("CONFLICT", error.message)),
      {
        status: 409,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Generic errors
  const message = error instanceof Error ? error.message : "An unexpected error occurred";
  return new Response(
    JSON.stringify(createErrorResponse("SERVER_ERROR", message)),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

**Notes:**
- Centralize error handling logic
- Consistent error response format
- Type-safe error creation

### Step 4: Create API Endpoint File

**File:** `src/pages/api/categories.ts` (create new file)

```typescript
import type { APIRoute } from "astro";
import { CategoryService } from "../../lib/services/category.service";
import {
  getCategoriesQuerySchema,
  createCategorySchema,
} from "../../lib/validators/category.validators";
import { handleError, createErrorResponse } from "../../lib/utils/error-handler";

export const prerender = false;

/**
 * GET /api/categories
 * Lists all categories for the authenticated user
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Check authentication (handled by middleware)
    const supabase = locals.supabase;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify(createErrorResponse("AUTHENTICATION_ERROR", "Authentication required")),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      sort: url.searchParams.get("sort") || undefined,
      order: url.searchParams.get("order") || undefined,
    };

    const validatedQuery = getCategoriesQuerySchema.parse(queryParams);

    // 3. Execute business logic
    const categoryService = new CategoryService(supabase);
    const result = await categoryService.listCategories(
      user.id,
      validatedQuery.sort,
      validatedQuery.order
    );

    // 4. Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=300", // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error("[GET /api/categories] Error:", error);
    return handleError(error);
  }
};

/**
 * POST /api/categories
 * Creates a new category for the authenticated user
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Check authentication (handled by middleware)
    const supabase = locals.supabase;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify(createErrorResponse("AUTHENTICATION_ERROR", "Authentication required")),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Validate Content-Type
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return new Response(
        JSON.stringify(
          createErrorResponse("VALIDATION_ERROR", "Content-Type must be application/json")
        ),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify(createErrorResponse("VALIDATION_ERROR", "Invalid request body")),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validatedBody = createCategorySchema.parse(body);

    // 4. Execute business logic
    const categoryService = new CategoryService(supabase);
    const result = await categoryService.createCategory(user.id, {
      name: validatedBody.name,
    });

    // 5. Return success response
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        Location: `/api/categories/${result.id}`,
      },
    });
  } catch (error) {
    console.error("[POST /api/categories] Error:", error);
    return handleError(error);
  }
};
```

**Notes:**
- Use Astro's `APIRoute` type for type safety
- Set `prerender = false` for dynamic API routes
- Verify authentication in each handler
- Use middleware-injected `locals.supabase` client
- Add appropriate response headers (Cache-Control, Location)

### Step 5: Update or Verify Middleware Configuration

**File:** `src/middleware/index.ts` (verify exists and configured)

```typescript
import { defineMiddleware } from "astro:middleware";
import { createServerClient } from "@supabase/ssr";

export const onRequest = defineMiddleware(async ({ request, locals }, next) => {
  // Create Supabase client
  locals.supabase = createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (key) => {
          const cookies = request.headers.get("cookie");
          if (!cookies) return undefined;
          const match = cookies.match(new RegExp(`(^| )${key}=([^;]+)`));
          return match ? match[2] : undefined;
        },
        set: () => {}, // Handled by response headers
        remove: () => {}, // Handled by response headers
      },
    }
  );

  return next();
});
```

**Notes:**
- Middleware injects Supabase client into `locals`
- Handles cookie-based session management
- Runs before all API route handlers

### Step 6: Create Unit Tests (Optional but Recommended)

**File:** `src/lib/services/category.service.test.ts`

```typescript
import { describe, it, expect, vi } from "vitest";
import { CategoryService, ConflictError } from "./category.service";

describe("CategoryService", () => {
  describe("listCategories", () => {
    it("should return categories with item counts", async () => {
      // Mock Supabase client
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() =>
                Promise.resolve({
                  data: [
                    { id: "1", name: "Test", created_at: "2024-01-01", updated_at: "2024-01-01" },
                  ],
                  error: null,
                })
              ),
            })),
          })),
          in: vi.fn(() =>
            Promise.resolve({
              data: [{ category_id: "1" }, { category_id: "1" }],
              error: null,
            })
          ),
        })),
      };

      const service = new CategoryService(mockSupabase as any);
      const result = await service.listCategories("user-123");

      expect(result.data).toHaveLength(1);
      expect(result.data[0].itemCount).toBe(2);
    });
  });

  describe("createCategory", () => {
    it("should throw ConflictError on duplicate name", async () => {
      const mockSupabase = {
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: null,
                  error: { code: "23505" },
                })
              ),
            })),
          })),
        })),
      };

      const service = new CategoryService(mockSupabase as any);
      await expect(
        service.createCategory("user-123", { name: "Test" })
      ).rejects.toThrow(ConflictError);
    });
  });
});
```

**Notes:**
- Use Vitest for testing (matches Astro ecosystem)
- Mock Supabase client for unit tests
- Test error scenarios
- Test business logic in isolation

### Step 7: Update TypeScript Types (if needed)

**File:** `src/env.d.ts` (verify locals type definition)

```typescript
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    supabase: import("./db/supabase.client").SupabaseClient;
  }
}
```

**Notes:**
- Ensures TypeScript recognizes `locals.supabase`
- Provides autocomplete and type checking

### Step 8: Manual Testing

**Test GET /api/categories:**

1. **Test valid request:**
   ```bash
   curl -X GET "http://localhost:4321/api/categories?sort=name&order=asc" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   Expected: 200 OK with category list

2. **Test invalid sort parameter:**
   ```bash
   curl -X GET "http://localhost:4321/api/categories?sort=invalid" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   Expected: 400 Bad Request with validation error

3. **Test without authentication:**
   ```bash
   curl -X GET "http://localhost:4321/api/categories"
   ```
   Expected: 401 Unauthorized

**Test POST /api/categories:**

1. **Test valid creation:**
   ```bash
   curl -X POST "http://localhost:4321/api/categories" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"Outdoor Gear"}'
   ```
   Expected: 201 Created with category object

2. **Test duplicate name:**
   ```bash
   curl -X POST "http://localhost:4321/api/categories" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"Outdoor Gear"}'
   ```
   Expected: 409 Conflict

3. **Test empty name:**
   ```bash
   curl -X POST "http://localhost:4321/api/categories" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":""}'
   ```
   Expected: 400 Bad Request with validation error

4. **Test name with only whitespace:**
   ```bash
   curl -X POST "http://localhost:4321/api/categories" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"   "}'
   ```
   Expected: 400 Bad Request with validation error

5. **Test missing name:**
   ```bash
   curl -X POST "http://localhost:4321/api/categories" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```
   Expected: 400 Bad Request with validation error

6. **Test name too long (>255 chars):**
   ```bash
   curl -X POST "http://localhost:4321/api/categories" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d "{\"name\":\"$(python3 -c 'print("a"*256)')\"}"
   ```
   Expected: 400 Bad Request with validation error

### Step 9: Integration Testing with Frontend

1. **Create a simple test page** (`src/pages/test-categories.astro`):

```astro
---
export const prerender = false;
---

<html>
  <body>
    <h1>Category API Test</h1>
    
    <div>
      <h2>List Categories</h2>
      <button id="listBtn">Fetch Categories</button>
      <pre id="listResult"></pre>
    </div>
    
    <div>
      <h2>Create Category</h2>
      <input type="text" id="nameInput" placeholder="Category name" />
      <button id="createBtn">Create</button>
      <pre id="createResult"></pre>
    </div>

    <script>
      const listBtn = document.getElementById('listBtn');
      const createBtn = document.getElementById('createBtn');
      const listResult = document.getElementById('listResult');
      const createResult = document.getElementById('createResult');
      const nameInput = document.getElementById('nameInput');

      listBtn?.addEventListener('click', async () => {
        const res = await fetch('/api/categories');
        const data = await res.json();
        listResult.textContent = JSON.stringify(data, null, 2);
      });

      createBtn?.addEventListener('click', async () => {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: nameInput.value })
        });
        const data = await res.json();
        createResult.textContent = JSON.stringify(data, null, 2);
      });
    </script>
  </body>
</html>
```

2. **Test in browser:**
   - Navigate to `/test-categories`
   - Test listing categories
   - Test creating categories with various inputs
   - Verify error responses display correctly

### Step 10: Documentation and Cleanup

1. **Update API documentation** if needed
2. **Remove test page** before production
3. **Add inline code comments** for complex logic
4. **Update changelog** or commit messages
5. **Review and optimize** based on testing results

---

## 10. Deployment Checklist

- [ ] All TypeScript types are defined and exported correctly
- [ ] Zod validation schemas are comprehensive and tested
- [ ] Service layer handles all error scenarios gracefully
- [ ] Error responses follow consistent format
- [ ] Authentication is enforced by middleware
- [ ] RLS policies are enabled and tested in database
- [ ] Unique constraint on category names is working
- [ ] Unit tests pass for service layer
- [ ] Manual API tests pass for all scenarios
- [ ] Frontend integration works correctly
- [ ] Error logging is implemented and tested
- [ ] Performance benchmarks meet expectations (< 100ms GET, < 200ms POST)
- [ ] Security review completed (no SQL injection, XSS, etc.)
- [ ] Documentation is updated
- [ ] Environment variables are configured correctly

---

## 11. Future Enhancements

### Short Term (Phase 2)
- Add Redis caching for GET /api/categories response
- Implement rate limiting (100 req/min general, 20 req/min POST)
- Add comprehensive integration tests
- Implement request/response logging middleware

### Medium Term (Phase 3)
- Add bulk category operations (bulk create, bulk delete)
- Implement category reordering/custom sorting
- Add category icons or colors for visual distinction
- Implement audit logging for category changes

### Long Term (Phase 4)
- Add category hierarchy/nesting support
- Implement category templates or suggestions
- Add category usage analytics
- Support category import/export

---

## 12. Related Documentation

- [API Plan - Full Specification](./.ai/api-plan.md)
- [Database Schema](./.ai/db-plan.md)
- [Type Definitions](../src/types.ts)
- [Astro Guidelines](./.cursor/rules/astro.mdc)
- [Backend Guidelines](./.cursor/rules/backend.mdc)

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-21  
**Author:** AI Architect  
**Status:** Ready for Implementation
