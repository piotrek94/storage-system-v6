# API Endpoint Implementation Plan: Create Category

## 1. Endpoint Overview

The Create Category endpoint allows authenticated users to create new categories for organizing their items in the storage system. Categories are logical classification units that items must be assigned to. Each user maintains their own isolated set of categories with case-insensitive unique names.

**Purpose:** Create a new category owned by the authenticated user  
**Business Context:** Categories must be created before items can be assigned to them (enforced by foreign key constraint with ON DELETE RESTRICT)

## 2. Request Details

### HTTP Method
`POST`

### URL Structure
`/api/categories`

### Authentication
**Required:** Yes  
**Method:** Supabase session-based authentication via `context.locals.supabase`

### Request Headers
- `Content-Type: application/json` (required)
- `Authorization: Bearer <token>` (handled by Supabase client)

### Request Body

**Content Type:** `application/json`

**Schema:**
```json
{
  "name": "string (required, 1-255 characters, non-whitespace)"
}
```

**Example:**
```json
{
  "name": "Outdoor Gear"
}
```

### Request Parameters

**Required:**
- `name` (string): Category name
  - Minimum length: 1 character (after trimming)
  - Maximum length: 255 characters
  - Must contain at least one non-whitespace character
  - Case-insensitive uniqueness per user

**Optional:**
- None

## 3. Used Types

### Input Types

**CreateCategoryCommand** (`src/types.ts`)
```typescript
type CreateCategoryCommand = Pick<TablesInsert<"categories">, "name">;

// Expands to:
interface CreateCategoryCommand {
  name: string;
}
```

### Output Types

**CategoryListItemDTO** (`src/types.ts`)
```typescript
interface CategoryListItemDTO {
  id: string;           // UUID
  name: string;         // Category name
  itemCount: number;    // Will be 0 for newly created categories
  createdAt: string;    // ISO 8601 timestamp
  updatedAt: string;    // ISO 8601 timestamp
}
```

### Error Types

**ErrorResponseDTO** (`src/types.ts`)
```typescript
interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: {
      field: string;
      message: string;
    }[];
  };
}
```

### Internal Types

**Database Table** (from migration)
```typescript
interface categories {
  id: UUID;                // PRIMARY KEY, auto-generated
  user_id: UUID;           // NOT NULL, from auth.uid()
  name: VARCHAR(255);      // NOT NULL, CHECK constraint
  created_at: TIMESTAMPTZ; // NOT NULL, DEFAULT NOW()
  updated_at: TIMESTAMPTZ; // NOT NULL, DEFAULT NOW()
}
```

## 4. Response Details

### Success Response (201 Created)

**Status Code:** `201 Created`

**Response Body:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Outdoor Gear",
  "itemCount": 0,
  "createdAt": "2026-01-20T10:30:00Z",
  "updatedAt": "2026-01-20T10:30:00Z"
}
```

**Notes:**
- `itemCount` is always `0` for newly created categories
- `id` is auto-generated UUID by database
- Timestamps are in ISO 8601 format with timezone

### Error Responses

#### 401 Unauthorized
**Condition:** User is not authenticated or session is invalid

**Response Body:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 400 Bad Request
**Condition:** Invalid input data

**Response Body (Missing Name):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "name",
        "message": "Name is required"
      }
    ]
  }
}
```

**Response Body (Empty Name):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "name",
        "message": "Name cannot be only whitespace"
      }
    ]
  }
}
```

**Response Body (Name Too Long):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "name",
        "message": "Name must be between 1 and 255 characters"
      }
    ]
  }
}
```

#### 409 Conflict
**Condition:** Category with same name already exists for this user (case-insensitive)

**Response Body:**
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "A category with this name already exists"
  }
}
```

#### 500 Internal Server Error
**Condition:** Unexpected server or database error

**Response Body:**
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## 5. Data Flow

### Overview
1. Request received → Authentication check → Input validation → Service layer → Database insertion → Response formatting

### Detailed Flow

#### Step 1: Request Reception
- Astro API route handler receives POST request
- Parse JSON request body
- Extract Supabase client from `context.locals.supabase`

#### Step 2: Authentication
- Check if user session exists via `supabase.auth.getUser()`
- If no session or invalid: Return 401 Unauthorized
- Extract `user.id` for use in service layer

#### Step 3: Input Validation (Zod Schema)
- Validate request body structure
- Check `name` field exists
- Check `name` is string type
- Check `name` length (1-255 characters)
- Trim whitespace and validate non-empty
- If validation fails: Return 400 Bad Request with detailed errors

#### Step 4: Service Layer Execution
- Call `CategoryService.createCategory(supabase, userId, command)`
- Service transforms `CreateCategoryCommand` to database insert payload
- Service adds `user_id` from authenticated user

#### Step 5: Database Insertion
- Execute INSERT query via Supabase client:
  ```sql
  INSERT INTO categories (user_id, name)
  VALUES (auth.uid(), $name)
  RETURNING *
  ```
- Database enforces:
  - CHECK constraint: `length(trim(name)) >= 1 AND length(name) <= 255`
  - UNIQUE constraint: `(user_id, LOWER(name))` via unique index
  - Foreign key: `user_id` references `profiles(id)`
  - RLS policy: `auth.uid() = user_id`

#### Step 6: Error Handling
- If unique constraint violation (PostgreSQL error code '23505'):
  - Return 409 Conflict
- If other database error:
  - Log error details
  - Return 500 Internal Server Error

#### Step 7: Response Formatting
- Transform database row to `CategoryListItemDTO`
- Set `itemCount` to `0` (new category has no items)
- Format timestamps to ISO 8601
- Return 201 Created with formatted data

### Database Interaction Details

**Query:**
```typescript
const { data, error } = await supabase
  .from('categories')
  .insert({
    user_id: userId,
    name: command.name.trim()
  })
  .select()
  .single();
```

**RLS Policy Applied:**
- `"Users can insert own categories"` policy validates `auth.uid() = user_id`

**Constraints Enforced:**
- Primary key auto-generates UUID for `id`
- `created_at` and `updated_at` set to NOW() by database
- Unique index prevents duplicate names (case-insensitive)

### External Service Dependencies
- **Supabase PostgreSQL:** Category storage and RLS enforcement
- **Supabase Auth:** User session validation and `auth.uid()` function

## 6. Security Considerations

### Authentication
**Requirement:** User must have valid Supabase session  
**Implementation:**
- Verify session via `supabase.auth.getUser()`
- Return 401 if session is missing, expired, or invalid
- Extract `user.id` from authenticated session

**Threats Mitigated:**
- Unauthenticated access to category creation
- Session hijacking (handled by Supabase)

### Authorization
**Requirement:** Users can only create categories for themselves  
**Implementation:**
- Database RLS policy: `WITH CHECK (auth.uid() = user_id)`
- Service layer always uses authenticated `user.id`
- No user-provided `user_id` accepted in request

**Threats Mitigated:**
- Privilege escalation (creating categories for other users)
- Unauthorized data access

### Input Validation
**Requirements:**
- Validate all input fields before database interaction
- Prevent SQL injection
- Sanitize string inputs

**Implementation:**
- Zod schema validation before service call
- Trim whitespace from name input
- Use parameterized queries via Supabase client (automatic)
- Database-level CHECK constraints as secondary validation

**Threats Mitigated:**
- SQL injection (parameterized queries)
- XSS attacks (input sanitization)
- Invalid data bypassing application logic

### Data Integrity
**Requirements:**
- Ensure unique category names per user (case-insensitive)
- Prevent orphaned data
- Maintain referential integrity

**Implementation:**
- Unique index: `idx_categories_user_name_unique ON categories(user_id, LOWER(name))`
- Foreign key: `user_id` references `profiles(id)` with CASCADE
- ON DELETE RESTRICT from items table protects categories in use

**Threats Mitigated:**
- Duplicate data creation
- Data inconsistency
- Referential integrity violations

### Rate Limiting
**Recommendation:** Implement rate limiting to prevent abuse
- Suggested limit: 100 category creations per user per hour
- Can be implemented via Astro middleware
- Not critical for MVP but recommended for production

### CSRF Protection
**Requirement:** Protect against cross-site request forgery  
**Implementation:**
- Handled by Astro middleware (if configured)
- Supabase session cookies are httpOnly and secure
- Origin header validation recommended

## 7. Error Handling

### Error Handling Strategy
1. **Early validation** - Check input before database interaction
2. **Graceful degradation** - Return user-friendly error messages
3. **Proper logging** - Log errors for debugging without exposing internals
4. **Consistent format** - Use ErrorResponseDTO for all errors

### Error Categories and Responses

#### 1. Authentication Errors (401)

**Scenario:** No session found
```typescript
if (!user) {
  return new Response(
    JSON.stringify({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required"
      }
    }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}
```

**Logging:** Debug level (expected behavior)

#### 2. Validation Errors (400)

**Scenario A:** Missing name field
```typescript
{
  error: {
    code: "VALIDATION_ERROR",
    message: "Validation failed",
    details: [{ field: "name", message: "Name is required" }]
  }
}
```

**Scenario B:** Name too long
```typescript
{
  error: {
    code: "VALIDATION_ERROR",
    message: "Validation failed",
    details: [{ field: "name", message: "Name must be between 1 and 255 characters" }]
  }
}
```

**Scenario C:** Whitespace-only name
```typescript
{
  error: {
    code: "VALIDATION_ERROR",
    message: "Validation failed",
    details: [{ field: "name", message: "Name cannot be only whitespace" }]
  }
}
```

**Logging:** Debug level (expected validation failure)

#### 3. Business Logic Errors (409)

**Scenario:** Duplicate category name (case-insensitive)

**Detection:**
```typescript
// PostgreSQL error code for unique constraint violation
if (error.code === '23505') {
  return new Response(
    JSON.stringify({
      error: {
        code: "CONFLICT",
        message: "A category with this name already exists"
      }
    }),
    { status: 409, headers: { "Content-Type": "application/json" } }
  );
}
```

**Logging:** Info level (business rule enforcement)

#### 4. Database Errors (500)

**Scenario:** Connection failure, timeout, or unexpected error

**Response:**
```typescript
{
  error: {
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred"
  }
}
```

**Logging:** Error level with full details
```typescript
console.error('[CreateCategory] Database error:', {
  userId: user.id,
  command: command,
  error: error.message,
  code: error.code,
  timestamp: new Date().toISOString()
});
```

**Note:** Never expose internal error details to client

### Error Response Format

All errors follow `ErrorResponseDTO` structure:
```typescript
interface ErrorResponseDTO {
  error: {
    code: string;        // Machine-readable error code
    message: string;     // Human-readable error message
    details?: Array<{    // Optional validation details
      field: string;
      message: string;
    }>;
  };
}
```

### Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `CONFLICT` | 409 | Category name already exists |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Error Handling Best Practices

1. **Never expose stack traces** to clients in production
2. **Log all errors** with sufficient context for debugging
3. **Return consistent error format** across all endpoints
4. **Provide actionable error messages** to help users correct input
5. **Use appropriate HTTP status codes** following REST conventions
6. **Handle database errors gracefully** without leaking schema details

## 8. Performance Considerations

### Database Performance

#### Index Utilization
- **Primary key index:** `categories_pkey ON categories(id)` - Auto-generated, O(log n) lookups
- **User index:** `categories_user_id_idx ON categories(user_id)` - Foreign key index
- **Unique constraint index:** `idx_categories_user_name_unique ON categories(user_id, LOWER(name))` - Ensures fast duplicate detection

**Impact:** INSERT operations benefit from unique index for conflict detection. Index overhead is minimal for insert operations.

#### Query Optimization
- Single INSERT statement with RETURNING clause
- No JOINs required for creation
- RLS policies add minimal overhead (single auth.uid() check)

**Expected Performance:** < 50ms for category creation under normal load

### Application Performance

#### Request Processing
- Zod validation: O(1) for simple string validation
- JSON parsing: Native, optimized by Node.js
- Service layer overhead: Minimal (single function call)

#### Response Serialization
- Small payload (~200 bytes JSON)
- No image URLs or complex objects
- Fast JSON.stringify for response

### Potential Bottlenecks

#### 1. Database Connection Pool
**Issue:** Connection exhaustion under high load  
**Mitigation:**
- Supabase handles connection pooling automatically
- Use connection pooling settings in Supabase client
- Monitor connection usage in production

#### 2. Unique Constraint Check
**Issue:** Index lookup on every insert  
**Impact:** Minimal - O(log n) lookup  
**Mitigation:** Already optimal with B-tree index

#### 3. RLS Policy Evaluation
**Issue:** Policy evaluation on every query  
**Impact:** Minimal - simple equality check on auth.uid()  
**Mitigation:** Database optimizes RLS checks automatically

### Optimization Strategies

#### For MVP
- No caching needed (categories don't change frequently)
- No pagination needed (creation is single-record)
- No batching needed (single insert operation)

#### For Future Scaling
- If create rate exceeds 100/sec per user:
  - Implement rate limiting
  - Add request queuing
- If database becomes bottleneck:
  - Add read replicas (doesn't help with inserts)
  - Optimize connection pooling
  - Consider horizontal sharding (unlikely needed)

### Resource Usage Estimates

**Per Request:**
- Memory: ~1KB (request + response payload)
- CPU: < 1ms (validation + serialization)
- Database: 1 connection, < 50ms query time
- Network: ~500 bytes (request + response)

**Scalability:**
- Should handle 1000+ concurrent requests with proper connection pooling
- No memory leaks expected (stateless operation)
- Linear scaling with database capacity

## 9. Implementation Steps

### Step 1: Create Zod Validation Schema

**File:** `src/lib/validation/category.schema.ts` (create if doesn't exist)

```typescript
import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z
    .string({
      required_error: 'Name is required',
      invalid_type_error: 'Name must be a string',
    })
    .min(1, 'Name must be between 1 and 255 characters')
    .max(255, 'Name must be between 1 and 255 characters')
    .refine(
      (val) => val.trim().length > 0,
      'Name cannot be only whitespace'
    )
    .transform((val) => val.trim()),
});

export type CreateCategorySchema = z.infer<typeof createCategorySchema>;
```

**Notes:**
- Use `.transform()` to automatically trim whitespace
- Use `.refine()` for custom whitespace validation
- Error messages match API specification exactly

### Step 2: Create or Update Category Service

**File:** `src/lib/services/category.service.ts` (create if doesn't exist)

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CreateCategoryCommand, CategoryListItemDTO } from '../../types';

export class CategoryService {
  /**
   * Creates a new category for the authenticated user
   * 
   * @throws {Error} If category name already exists (code: '23505')
   * @throws {Error} If database operation fails
   */
  static async createCategory(
    supabase: SupabaseClient,
    userId: string,
    command: CreateCategoryCommand
  ): Promise<CategoryListItemDTO> {
    // Insert category into database
    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: userId,
        name: command.name, // Already trimmed by Zod transform
      })
      .select()
      .single();

    // Handle database errors
    if (error) {
      throw error; // Let route handler determine response code
    }

    // Transform database row to DTO
    return {
      id: data.id,
      name: data.name,
      itemCount: 0, // New categories always have 0 items
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}
```

**Notes:**
- Service throws errors to be handled by route handler
- RLS policy automatically enforces user_id = auth.uid()
- Service doesn't need to query for itemCount (always 0 for new categories)

### Step 3: Create API Route Handler

**File:** `src/pages/api/categories/index.ts` (or `.astro` depending on setup)

```typescript
import type { APIRoute } from 'astro';
import { createCategorySchema } from '../../../lib/validation/category.schema';
import { CategoryService } from '../../../lib/services/category.service';
import type { CreateCategoryCommand, ErrorResponseDTO } from '../../../types';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Authentication check
    const supabase = locals.supabase;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        } satisfies ErrorResponseDTO),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 2: Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid JSON payload',
          },
        } satisfies ErrorResponseDTO),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 3: Validate with Zod schema
    const validation = createCategorySchema.safeParse(body);
    
    if (!validation.success) {
      const details = validation.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details,
          },
        } satisfies ErrorResponseDTO),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 4: Create command object
    const command: CreateCategoryCommand = {
      name: validation.data.name, // Already trimmed by Zod
    };

    // Step 5: Call service layer
    const category = await CategoryService.createCategory(
      supabase,
      user.id,
      command
    );

    // Step 6: Return success response
    return new Response(
      JSON.stringify(category),
      { 
        status: 201, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    // Handle unique constraint violation (duplicate category name)
    if (error.code === '23505') {
      return new Response(
        JSON.stringify({
          error: {
            code: 'CONFLICT',
            message: 'A category with this name already exists',
          },
        } satisfies ErrorResponseDTO),
        { 
          status: 409, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Log unexpected errors
    console.error('[POST /api/categories] Unexpected error:', {
      userId: locals.supabase ? 'authenticated' : 'unauthenticated',
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
    });

    // Return generic error response
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      } satisfies ErrorResponseDTO),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};
```

**Notes:**
- Use `export const prerender = false` for dynamic route
- Use `locals.supabase` from Astro middleware
- Handle JSON parsing errors separately from validation errors
- Use `satisfies ErrorResponseDTO` for type safety
- Log errors with sufficient context for debugging

### Step 4: Verify Middleware Configuration

**File:** `src/middleware/index.ts`

Ensure Supabase client is attached to `context.locals`:

```typescript
import { defineMiddleware } from 'astro:middleware';
import { createServerClient } from '@supabase/ssr';

export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase client and attach to locals
  context.locals.supabase = createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (key) => context.cookies.get(key)?.value,
        set: (key, value, options) => context.cookies.set(key, value, options),
        remove: (key, options) => context.cookies.delete(key, options),
      },
    }
  );

  return next();
});
```

**Note:** Verify this middleware runs before API routes

### Step 5: Update Type Definitions (if needed)

**File:** `src/env.d.ts`

Add SupabaseClient to locals type:

```typescript
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    supabase: import('@supabase/supabase-js').SupabaseClient;
  }
}
```

### Step 6: Test the Endpoint

#### Manual Testing with curl

**Test 1: Successful creation**
```bash
curl -X POST http://localhost:4321/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"name":"Outdoor Gear"}'
```

Expected: 201 Created with category object

**Test 2: Missing authentication**
```bash
curl -X POST http://localhost:4321/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"Outdoor Gear"}'
```

Expected: 401 Unauthorized

**Test 3: Missing name field**
```bash
curl -X POST http://localhost:4321/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{}'
```

Expected: 400 Bad Request with validation error

**Test 4: Whitespace-only name**
```bash
curl -X POST http://localhost:4321/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"name":"   "}'
```

Expected: 400 Bad Request with validation error

**Test 5: Name too long**
```bash
curl -X POST http://localhost:4321/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"name":"'$(python3 -c 'print("A" * 256)')'"}'
```

Expected: 400 Bad Request with validation error

**Test 6: Duplicate name**
```bash
# Create first category
curl -X POST http://localhost:4321/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"name":"Tools"}'

# Try to create duplicate
curl -X POST http://localhost:4321/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"name":"tools"}' # Case-insensitive
```

Expected: First succeeds (201), second fails (409)

### Step 7: Verify Database State

After successful creation, verify in Supabase dashboard:

```sql
SELECT * FROM categories WHERE user_id = 'YOUR_USER_ID';
```

Expected:
- `id` is valid UUID
- `user_id` matches authenticated user
- `name` is stored correctly
- `created_at` and `updated_at` are set
- No duplicate names for same user

### Step 8: Check RLS Policies

Verify RLS policies are enforced:

```sql
-- Try to insert category for different user (should fail)
INSERT INTO categories (user_id, name) 
VALUES ('different-user-id', 'Test');
```

Expected: RLS policy violation error

### Step 9: Integration Testing Checklist

- [ ] Authenticated user can create category
- [ ] Unauthenticated request returns 401
- [ ] Invalid JSON returns 400
- [ ] Missing name field returns 400
- [ ] Empty name returns 400
- [ ] Whitespace-only name returns 400
- [ ] Name > 255 characters returns 400
- [ ] Duplicate name (case-insensitive) returns 409
- [ ] Created category has itemCount = 0
- [ ] Timestamps are set correctly
- [ ] Response format matches CategoryListItemDTO
- [ ] RLS prevents creating categories for other users
- [ ] Database constraints are enforced

### Step 10: Error Monitoring Setup

Add monitoring for production:

1. **Log all errors** to centralized logging service
2. **Monitor error rates** for 401, 400, 409, 500 responses
3. **Set up alerts** for elevated 500 error rates
4. **Track response times** (target < 100ms)

### Step 11: Documentation Updates

Update API documentation:
- Add endpoint to API documentation site
- Include example requests and responses
- Document error scenarios
- Add authentication requirements

### Implementation Checklist Summary

- [ ] Create Zod validation schema
- [ ] Implement CategoryService.createCategory()
- [ ] Create POST /api/categories route handler
- [ ] Verify middleware configuration
- [ ] Update TypeScript type definitions
- [ ] Manual testing with curl (all scenarios)
- [ ] Verify database state and RLS
- [ ] Integration testing
- [ ] Set up error monitoring
- [ ] Update documentation

---

## Additional Notes

### Related Endpoints

This endpoint is part of the Categories resource. Related endpoints:

- `GET /api/categories` - List all categories
- `GET /api/categories/:id` - Get single category
- `PATCH /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category (if no items)

Ensure consistent error handling and authentication patterns across all category endpoints.
