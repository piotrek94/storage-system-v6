# API Endpoint Implementation Plan: List All Categories

## 1. Endpoint Overview

This endpoint retrieves all categories belonging to the authenticated user with optional sorting capabilities. Categories are returned with computed item counts, allowing users to see how many items are assigned to each category. This is a read-only operation that supports sorting by name or creation date in ascending or descending order.

**Key Features:**
- Returns all user's categories (no pagination needed for MVP)
- Includes item count per category (computed via aggregation)
- Supports flexible sorting (name, created_at)
- Respects Row-Level Security policies
- Returns 401 for unauthenticated requests

## 2. Request Details

**HTTP Method:** `GET`

**URL Structure:** `/api/categories`

**Parameters:**

*Required:* None (authentication required via session)

*Optional Query Parameters:*
- `sort` (string, default: "name") - Field to sort by
  - Allowed values: "name", "created_at"
  - Case-sensitive parameter name, case-insensitive values
- `order` (string, default: "asc") - Sort direction
  - Allowed values: "asc", "desc"
  - Case-insensitive

**Request Headers:**
- `Cookie` - Session cookie (handled by Astro middleware)

**Request Body:** None (GET request)

**Example Requests:**
```
GET /api/categories
GET /api/categories?sort=name&order=asc
GET /api/categories?sort=created_at&order=desc
```

## 3. Used Types

### Response DTOs

**CategoryListItemDTO** (from `src/types.ts`)
```typescript
interface CategoryListItemDTO {
  id: string;              // UUID
  name: string;            // 1-255 characters
  itemCount: number;       // Computed count of items in category
  createdAt: string;       // ISO 8601 timestamp
  updatedAt: string;       // ISO 8601 timestamp
}
```

**CategoryListResponseDTO** (from `src/types.ts`)
```typescript
interface CategoryListResponseDTO {
  data: CategoryListItemDTO[];
}
```

### Error DTOs

**ErrorResponseDTO** (from `src/types.ts`)
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

### Validation Schema

**Query Parameters Validation** (Zod schema)
```typescript
const QueryParamsSchema = z.object({
  sort: z.enum(["name", "created_at"]).default("name"),
  order: z.enum(["asc", "desc"]).default("asc")
});
```

## 4. Response Details

### Success Response (200 OK)

**Status Code:** `200 OK`

**Response Body:**
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Outdoor Gear",
      "itemCount": 25,
      "createdAt": "2026-01-05T12:00:00Z",
      "updatedAt": "2026-01-05T12:00:00Z"
    },
    {
      "id": "223e4567-e89b-12d3-a456-426614174001",
      "name": "Electronics",
      "itemCount": 12,
      "createdAt": "2026-01-04T10:30:00Z",
      "updatedAt": "2026-01-10T14:20:00Z"
    }
  ]
}
```

**Response Headers:**
```
Content-Type: application/json
```

### Error Responses

**401 Unauthorized**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**400 Bad Request** (Invalid query parameters)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": [
      {
        "field": "sort",
        "message": "Invalid enum value. Expected 'name' | 'created_at', received 'invalid'"
      }
    ]
  }
}
```

**500 Internal Server Error**
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## 5. Data Flow

### High-Level Flow

```
Client Request
    ↓
Astro Middleware (Authentication)
    ↓
API Route Handler (/api/categories/index.ts)
    ↓
Query Parameter Validation (Zod)
    ↓
Category Service (category.service.ts)
    ↓
Supabase Query (with RLS)
    ├─ SELECT categories
    ├─ LEFT JOIN items for count
    ├─ WHERE user_id = authenticated_user
    ├─ GROUP BY category.id
    └─ ORDER BY [sort] [order]
    ↓
Transform to DTOs
    ↓
Return JSON Response (200)
```

### Detailed Steps

1. **Request Reception**
   - Client sends GET request to `/api/categories`
   - Optional query parameters: `?sort=name&order=asc`

2. **Authentication Check** (Astro Middleware)
   - Middleware validates session cookie
   - Sets `context.locals.user` and `context.locals.supabase`
   - If authentication fails, middleware may redirect or return 401

3. **Handler Entry** (`src/pages/api/categories/index.ts`)
   - Extract query parameters from `request.url`
   - Check if `context.locals.user` exists (guard clause)
   - If not authenticated, return 401 early

4. **Input Validation**
   - Parse query parameters with Zod schema
   - Apply defaults: sort="name", order="asc"
   - If validation fails, return 400 with details

5. **Service Layer Call**
   - Invoke `categoryService.listCategories(userId, sort, order)`
   - Pass authenticated user's ID from `context.locals.user.id`

6. **Database Query** (Supabase)
   - Query structure:
     ```sql
     SELECT 
       c.id,
       c.name,
       c.created_at,
       c.updated_at,
       COUNT(i.id) as item_count
     FROM categories c
     LEFT JOIN items i ON c.id = i.category_id
     WHERE c.user_id = $1
     GROUP BY c.id, c.name, c.created_at, c.updated_at
     ORDER BY [sort_field] [order]
     ```
   - RLS policies automatically enforce `user_id = auth.uid()`
   - Supabase client returns typed results

7. **Data Transformation**
   - Map database rows to `CategoryListItemDTO`
   - Convert timestamps to ISO 8601 strings
   - Ensure camelCase naming (itemCount vs item_count)

8. **Response Construction**
   - Wrap DTOs in `CategoryListResponseDTO`
   - Set Content-Type: application/json
   - Return with status 200

9. **Error Handling**
   - Catch database errors (connection, query syntax)
   - Catch unexpected exceptions
   - Return 500 with generic error message
   - Log detailed error for debugging (not exposed to client)

## 6. Security Considerations

### Authentication

- **Session-Based Authentication:** Relies on Astro middleware to validate session
- **User Context:** Authenticated user available in `context.locals.user`
- **Guard Clause:** Handler must check `context.locals.user` exists before proceeding
- **401 Response:** Return immediately if authentication missing

### Authorization

- **Row-Level Security (RLS):** Database enforces user isolation
- **RLS Policy:** `auth.uid() = user_id` on categories table
- **Automatic Enforcement:** Supabase client applies RLS automatically
- **No Cross-User Access:** Users can only see their own categories

### Input Validation

- **Query Parameter Sanitization:** Zod schema validates all inputs
- **Enum Constraints:** `sort` and `order` limited to allowed values
- **SQL Injection Prevention:** Supabase client uses parameterized queries
- **Type Safety:** TypeScript prevents type-related vulnerabilities

### Data Exposure

- **Minimal Data Returned:** Only necessary fields in DTO
- **No Sensitive Data:** Categories contain only name and timestamps
- **User-Scoped Responses:** All data filtered by authenticated user
- **No System Information:** Error messages don't expose internal details

### Rate Limiting (Future Consideration)

- **MVP:** No rate limiting implemented
- **Future:** Consider rate limiting per user/IP for production
- **DDoS Protection:** Handle at infrastructure level (DigitalOcean, CDN)

## 7. Error Handling

### Error Scenarios and Responses

| Scenario | Status Code | Error Code | Message | Details |
|----------|-------------|------------|---------|---------|
| User not authenticated | 401 | UNAUTHORIZED | "Authentication required" | None |
| Invalid `sort` parameter | 400 | VALIDATION_ERROR | "Invalid query parameters" | Field-level validation errors |
| Invalid `order` parameter | 400 | VALIDATION_ERROR | "Invalid query parameters" | Field-level validation errors |
| Database connection failure | 500 | INTERNAL_ERROR | "An unexpected error occurred" | None (logged server-side) |
| Database query error | 500 | INTERNAL_ERROR | "An unexpected error occurred" | None (logged server-side) |
| Unexpected exception | 500 | INTERNAL_ERROR | "An unexpected error occurred" | None (logged server-side) |

### Error Handling Strategy

**Guard Clauses (Early Returns):**
```typescript
// 1. Authentication check
if (!context.locals.user) {
  return new Response(JSON.stringify({
    error: { code: "UNAUTHORIZED", message: "Authentication required" }
  }), { status: 401 });
}

// 2. Validation check
const validation = QueryParamsSchema.safeParse(params);
if (!validation.success) {
  return new Response(JSON.stringify({
    error: { 
      code: "VALIDATION_ERROR", 
      message: "Invalid query parameters",
      details: validation.error.issues.map(...)
    }
  }), { status: 400 });
}
```

**Service Layer Error Handling:**
- Catch specific Supabase errors (connection, query)
- Log detailed error information server-side
- Throw generic errors to handler
- Don't expose internal error details to client

**Handler Try-Catch:**
```typescript
try {
  const categories = await categoryService.listCategories(...);
  return new Response(JSON.stringify({ data: categories }), { status: 200 });
} catch (error) {
  console.error("Error listing categories:", error);
  return new Response(JSON.stringify({
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" }
  }), { status: 500 });
}
```

### Logging Strategy

- **Authentication Failures:** Log to console (may indicate session issues)
- **Validation Errors:** Log with request context (helps identify client issues)
- **Database Errors:** Log with full error details (critical for debugging)
- **Unexpected Errors:** Log with stack trace (indicates code bugs)
- **Success Cases:** No logging needed (reduces noise)

**Note:** For production, consider structured logging service (e.g., Sentry, LogRocket)

## 8. Performance Considerations

### Database Query Optimization

**Indexes Used:**
- Primary Key: `categories(id)` - automatic B-tree index
- Foreign Key: `categories(user_id)` - automatic index for RLS filtering
- Items Foreign Key: `items(category_id)` - for JOIN performance

**Query Performance:**
- **LEFT JOIN with COUNT:** Efficient for small-to-medium category counts
- **GROUP BY:** Required for aggregation, uses sorting
- **ORDER BY:** Uses index for `name` if case-insensitive sorting needed
- **Expected Result Size:** Typically < 100 categories per user (MVP assumption)

**Optimization Notes:**
- No N+1 query problem (single query with JOIN)
- RLS filtering uses indexed `user_id` column
- COUNT aggregation performed in database (not application)

### No Pagination Needed

**Rationale:**
- Categories are metadata (users typically have < 50)
- Full list needed for UI dropdowns and filters
- Pagination would complicate client-side logic
- Performance acceptable for expected data volumes

**Future Consideration:**
- If users create hundreds of categories, implement cursor-based pagination
- Add `limit` and `cursor` query parameters
- Modify response to include pagination metadata

### Response Size

**Typical Response:**
- 20 categories × ~150 bytes = 3KB
- 100 categories × ~150 bytes = 15KB
- Acceptable for web/mobile without compression

**Optimization Options (Future):**
- Enable gzip/brotli compression at server level
- Implement ETag/Cache-Control headers for caching
- Consider GraphQL for selective field retrieval

### Caching Strategy (Future)

**MVP:** No caching implemented

**Future Considerations:**
- **Client-Side:** Cache in React Query/SWR with 5-minute stale time
- **CDN:** Not applicable (user-specific data)
- **Database:** Supabase handles query result caching
- **Invalidation:** Trigger on category create/update/delete

### Potential Bottlenecks

1. **Database Connection Pool:** Supabase manages this
2. **RLS Policy Evaluation:** Minimal overhead for simple user_id check
3. **COUNT Aggregation:** Efficient for small item counts per category
4. **Network Latency:** Depends on client-to-server distance

**Mitigation:**
- Monitor query performance with Supabase dashboard
- Add database query timeout (Supabase default: 30s)
- Implement request timeout at application level (e.g., 10s)

## 9. Implementation Steps

### Step 1: Create Validation Schema

**File:** `src/lib/validation/category.validation.ts`

- Import Zod library
- Define `ListCategoriesQuerySchema`:
  - `sort`: z.enum(["name", "created_at"]).default("name")
  - `order`: z.enum(["asc", "desc"]).default("asc")
- Export schema for use in route handler
- Add JSDoc comments for documentation

### Step 2: Create Category Service

**File:** `src/lib/services/category.service.ts`

- Create `CategoryService` class or exported functions
- Implement `listCategories(supabase, userId, sort, order)` method:
  - Accept SupabaseClient instance (from context.locals)
  - Build query with Supabase query builder
  - SELECT categories with LEFT JOIN items
  - Apply WHERE filter (RLS handles this, but explicit for clarity)
  - GROUP BY category fields
  - Apply ORDER BY based on sort and order parameters
  - Handle ascending/descending with conditional logic
  - Transform database results to CategoryListItemDTO
  - Map snake_case to camelCase (created_at → createdAt)
  - Return typed array of DTOs
- Add error handling with try-catch
- Throw descriptive errors for handler to catch
- Add JSDoc comments for method signature

**Database Query Implementation:**
```typescript
const { data, error } = await supabase
  .from('categories')
  .select(`
    id,
    name,
    created_at,
    updated_at,
    items:items(count)
  `)
  .order(sort === 'created_at' ? 'created_at' : 'name', { 
    ascending: order === 'asc' 
  });
```

**Transformation Logic:**
```typescript
return data.map(category => ({
  id: category.id,
  name: category.name,
  itemCount: category.items?.[0]?.count ?? 0,
  createdAt: category.created_at,
  updatedAt: category.updated_at
}));
```

### Step 3: Create API Route Handler

**File:** `src/pages/api/categories/index.ts`

- Add `export const prerender = false` (required for Astro API routes)
- Import necessary types: `APIContext`, DTOs, validation schema
- Import category service
- Define `GET` handler (uppercase, per Astro conventions):

  **Authentication Check:**
  ```typescript
  if (!context.locals.user) {
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

  **Query Parameter Extraction:**
  ```typescript
  const url = new URL(request.url);
  const params = {
    sort: url.searchParams.get("sort") ?? "name",
    order: url.searchParams.get("order") ?? "asc"
  };
  ```

  **Validation:**
  ```typescript
  const validation = ListCategoriesQuerySchema.safeParse(params);
  if (!validation.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details: validation.error.issues.map(issue => ({
            field: issue.path.join("."),
            message: issue.message
          }))
        }
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  ```

  **Service Call:**
  ```typescript
  const categories = await categoryService.listCategories(
    context.locals.supabase,
    context.locals.user.id,
    validation.data.sort,
    validation.data.order
  );
  ```

  **Success Response:**
  ```typescript
  return new Response(
    JSON.stringify({ data: categories }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
  ```

  **Error Handling:**
  ```typescript
  try {
    // ... service call ...
  } catch (error) {
    console.error("Error listing categories:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred"
        }
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  ```

### Step 4: Test Authentication Flow

- Start Astro dev server
- Test without authentication:
  - `curl http://localhost:4321/api/categories`
  - Expected: 401 Unauthorized response
- Test with valid session:
  - Login through UI to get session cookie
  - `curl -b cookies.txt http://localhost:4321/api/categories`
  - Expected: 200 OK with empty array (if no categories exist)

### Step 5: Test Query Parameters

**Test Default Sorting:**
- Request: `GET /api/categories`
- Expected: Categories sorted by name ascending

**Test Sort by Name Descending:**
- Request: `GET /api/categories?sort=name&order=desc`
- Expected: Categories sorted by name descending

**Test Sort by Created Date:**
- Request: `GET /api/categories?sort=created_at&order=asc`
- Expected: Categories sorted by creation date ascending

**Test Invalid Parameters:**
- Request: `GET /api/categories?sort=invalid&order=wrong`
- Expected: 400 Bad Request with validation error details

### Step 6: Test with Sample Data

- Create sample categories via UI or API
- Assign items to categories via UI or API
- Verify itemCount is correct for each category
- Test all sorting combinations:
  - Name ascending/descending
  - Created date ascending/descending
- Verify response matches CategoryListResponseDTO schema

### Step 7: Test RLS Policies

**Create Multi-User Test Scenario:**
- Create User A with categories: "Electronics", "Books"
- Create User B with categories: "Tools", "Toys"

**Test User Isolation:**
- Login as User A
- GET /api/categories
- Expected: Only "Electronics" and "Books" returned

- Login as User B
- GET /api/categories
- Expected: Only "Tools" and "Toys" returned

**Verify No Cross-User Data Leakage**

### Step 8: Error Handling Tests

**Test Database Connection Failure:**
- Simulate by temporarily breaking Supabase connection
- Expected: 500 Internal Server Error with generic message

**Test Unexpected Exceptions:**
- Add deliberate error in service (e.g., throw new Error())
- Expected: 500 Internal Server Error
- Verify error logged to console with stack trace

### Step 9: Performance Testing

**Measure Query Performance:**
- Create 100 categories with varying item counts
- Measure response time for GET /api/categories
- Expected: < 500ms for 100 categories
- Use Supabase dashboard to inspect query execution time

**Test with No Categories:**
- Login with new user (no categories created)
- GET /api/categories
- Expected: 200 OK with empty data array `{ data: [] }`

### Step 10: Code Quality Checks

**Run Linter:**
- Execute `npm run lint` or equivalent
- Fix any TypeScript errors
- Fix any ESLint warnings

**Type Safety Verification:**
- Ensure all types properly imported from `src/types.ts`
- Verify Supabase client typed correctly
- No `any` types used

**Code Review Checklist:**
- [ ] Authentication guard clause implemented
- [ ] Input validation with Zod
- [ ] Service layer properly separated
- [ ] Error handling with early returns
- [ ] Proper status codes used
- [ ] Response matches DTO schema
- [ ] Comments and JSDoc added
- [ ] No console.log() in production code (only console.error for errors)

### Step 11: Integration Testing

**End-to-End Test Flow:**
1. User logs in
2. User navigates to categories page
3. Frontend calls GET /api/categories
4. Categories displayed with correct item counts
5. User changes sort order
6. Categories re-sorted correctly

**Edge Cases:**
- Empty category list
- Single category
- Category with 0 items
- Category with many items (100+)
- Long category names (near 255 char limit)

### Step 12: Documentation

**Update API Documentation:**
- Document endpoint in API plan if needed
- Add examples to README or API docs
- Include sample request/response payloads

**Code Documentation:**
- Ensure all functions have JSDoc comments
- Document complex logic with inline comments
- Add TODO comments for future improvements (e.g., caching, pagination)

### Step 13: Deployment Preparation

**Environment Variables:**
- Verify Supabase URL and anon key configured
- Ensure RLS policies enabled in production database

**Build Verification:**
- Run `npm run build` to ensure no build errors
- Test built application locally with `npm run preview`
- Verify endpoint works in production-like environment

**Monitoring Setup (Future):**
- Add logging for error tracking (Sentry, LogRocket)
- Set up alerts for 500 errors
- Monitor query performance metrics

## 10. Testing Checklist

- [ ] Authentication required (401 without session)
- [ ] Default sorting works (name ascending)
- [ ] All sort parameter combinations work
- [ ] All order parameter combinations work
- [ ] Invalid parameters return 400 with details
- [ ] Item counts calculated correctly
- [ ] RLS policies prevent cross-user access
- [ ] Empty category list returns 200 with empty array
- [ ] Response matches CategoryListResponseDTO schema
- [ ] Error responses match ErrorResponseDTO schema
- [ ] Database errors return 500 without exposing details
- [ ] Performance acceptable (< 500ms for 100 categories)
- [ ] TypeScript compiles without errors
- [ ] Linter passes without warnings
- [ ] Code follows project structure guidelines
- [ ] Service layer properly separated from handler
- [ ] Guard clauses handle errors early
- [ ] Happy path is last in handler function

