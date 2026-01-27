# API Endpoint Implementation Plan: Delete Category

## 1. Endpoint Overview

The Delete Category endpoint allows authenticated users to delete a category from their storage system. The endpoint enforces referential integrity by preventing deletion of categories that contain items, ensuring data consistency across the application.

**Key Characteristics:**
- **Purpose:** Remove an unused category from the user's account
- **Business Rule:** Categories with associated items cannot be deleted (returns 409 Conflict)
- **Security:** Users can only delete their own categories (enforced by RLS and application logic)
- **Atomicity:** Single database operation with automatic rollback on failure

## 2. Request Details

### HTTP Method
`DELETE`

### URL Structure
```
/api/categories/:id
```

### URL Parameters

| Parameter | Type | Required | Validation | Description |
|-----------|------|----------|------------|-------------|
| `id` | UUID | Yes | Valid UUID format | Unique identifier of the category to delete |

### Query Parameters
None

### Request Headers
- `Cookie` or `Authorization`: Contains Supabase session token (managed by middleware)

### Request Body
None

## 3. Used Types

### Response Types

**Success Response:**
```typescript
DeleteResponseDTO {
  message: string;  // "Category deleted successfully"
  id: string;       // UUID of deleted category
}
```

**Error Response:**
```typescript
ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: {
      field: string;
      message: string;
    }[];
  }
}
```

### Validation Schema

```typescript
// URL parameter validation
const DeleteCategoryParamsSchema = z.object({
  id: z.string().uuid({ message: "Invalid category ID format" })
});
```

### Internal Types

```typescript
// Category entity (from src/types.ts)
type Category = Tables<"categories"> {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}
```

## 4. Response Details

### Success Response (200 OK)

**Status Code:** `200 OK`

**Content-Type:** `application/json`

**Body:**
```json
{
  "message": "Category deleted successfully",
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Error Responses

#### 401 Unauthorized

**Scenario:** User is not authenticated

**Body:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 404 Not Found

**Scenario:** Category does not exist or does not belong to the authenticated user

**Body:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Category not found"
  }
}
```

#### 409 Conflict

**Scenario:** Category contains items and cannot be deleted

**Body:**
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Cannot delete Electronics because it contains 25 items"
  }
}
```

**Note:** The message includes the category name and exact item count for user clarity.

#### 500 Internal Server Error

**Scenario:** Unexpected database or server error

**Body:**
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred while deleting the category"
  }
}
```

## 5. Data Flow

### High-Level Flow

```
Client Request
    ↓
Astro Middleware (Authentication Check)
    ↓
API Route Handler (/api/categories/[id].ts)
    ↓
Input Validation (Zod)
    ↓
Category Service (deleteCategory)
    ↓
┌─────────────────────────────────┐
│ 1. Fetch category by ID         │
│ 2. Verify user ownership         │
│ 3. Count associated items        │
│ 4. Delete category (if count=0) │
└─────────────────────────────────┘
    ↓
Response (200/404/409/500)
    ↓
Client
```

### Detailed Service Layer Logic

**File:** `src/lib/services/category.service.ts`

**Function:** `deleteCategory(supabase: SupabaseClient, userId: string, categoryId: string)`

**Steps:**

1. **Fetch Category**
   ```typescript
   const { data: category, error } = await supabase
     .from("categories")
     .select("id, name, user_id")
     .eq("id", categoryId)
     .eq("user_id", userId)
     .single();
   ```
   - Uses RLS policies to enforce user ownership
   - Returns 404 if not found or user mismatch

2. **Count Associated Items**
   ```typescript
   const { count, error: countError } = await supabase
     .from("items")
     .select("id", { count: "exact", head: true })
     .eq("category_id", categoryId)
     .eq("user_id", userId);
   ```
   - Checks if category has any items
   - Returns 409 if count > 0 with descriptive message

3. **Delete Category**
   ```typescript
   const { error: deleteError } = await supabase
     .from("categories")
     .delete()
     .eq("id", categoryId)
     .eq("user_id", userId);
   ```
   - Database constraint (ON DELETE RESTRICT) provides additional safety
   - RLS policies ensure user can only delete their own categories

4. **Return Result**
   - Success: Return category ID and success message
   - Error: Throw appropriate error with status code

### Database Interactions

1. **Query 1:** Fetch category with ownership verification
   - Table: `categories`
   - Index Used: Primary key on `id`, foreign key on `user_id`
   - RLS Policy: "Users can view own categories"

2. **Query 2:** Count items associated with category
   - Table: `items`
   - Index Used: `idx_items_user_category` composite index
   - RLS Policy: "Users can view own items"

3. **Query 3:** Delete category
   - Table: `categories`
   - Constraint: Foreign key from `items.category_id` with ON DELETE RESTRICT
   - RLS Policy: "Users can delete own categories"

## 6. Security Considerations

### Authentication
- **Mechanism:** Supabase session-based authentication via middleware
- **Validation:** Middleware checks for valid session before route handler execution
- **Flow:** `context.locals.supabase.auth.getUser()` retrieves authenticated user
- **Failure:** Return 401 Unauthorized if no valid session

### Authorization
- **User Ownership:** All queries filter by `user_id` to ensure users can only delete their own categories
- **RLS Enforcement:** Row-Level Security policies provide database-level isolation
- **Double Check:** Both application logic and database policies verify ownership

### Input Validation
- **UUID Format:** Validate `id` parameter is valid UUID using Zod
- **SQL Injection:** Prevented by using Supabase client with parameterized queries
- **XSS Prevention:** No user input reflected in response (only category name from database)

### Data Integrity
- **Foreign Key Constraint:** ON DELETE RESTRICT prevents deletion if items reference the category
- **Application Check:** Pre-deletion count check provides user-friendly error message
- **Atomic Operation:** Single transaction ensures consistency

### Error Information Disclosure
- **Generic Errors:** Don't expose internal database errors to client
- **Safe Messages:** Return user-friendly error messages without sensitive details
- **Logging:** Log detailed errors server-side for debugging

## 7. Error Handling

### Validation Errors

**Trigger:** Invalid UUID format in `id` parameter

**Handler:**
```typescript
const validationResult = DeleteCategoryParamsSchema.safeParse({ id });
if (!validationResult.success) {
  return new Response(
    JSON.stringify({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid category ID format",
        details: validationResult.error.issues.map(issue => ({
          field: issue.path.join("."),
          message: issue.message
        }))
      }
    }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
}
```

**Status Code:** `400 Bad Request`

### Authentication Errors

**Trigger:** No valid Supabase session

**Handler:**
```typescript
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
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

**Status Code:** `401 Unauthorized`

### Category Not Found

**Trigger:** Category doesn't exist or doesn't belong to user

**Handler:**
```typescript
if (!category) {
  return new Response(
    JSON.stringify({
      error: {
        code: "NOT_FOUND",
        message: "Category not found"
      }
    }),
    { status: 404, headers: { "Content-Type": "application/json" } }
  );
}
```

**Status Code:** `404 Not Found`

**Note:** Return same error whether category doesn't exist or belongs to another user (prevent information disclosure)

### Category Has Items (Conflict)

**Trigger:** Category has associated items (count > 0)

**Handler:**
```typescript
if (itemCount > 0) {
  return new Response(
    JSON.stringify({
      error: {
        code: "CONFLICT",
        message: `Cannot delete ${category.name} because it contains ${itemCount} item${itemCount === 1 ? '' : 's'}`
      }
    }),
    { status: 409, headers: { "Content-Type": "application/json" } }
  );
}
```

**Status Code:** `409 Conflict`

**Message Format:** `"Cannot delete [Category Name] because it contains [N] item(s)"`

### Database Errors

**Trigger:** Unexpected database errors (connection issues, constraint violations)

**Handler:**
```typescript
try {
  // ... deletion logic
} catch (error) {
  console.error("Error deleting category:", error);
  return new Response(
    JSON.stringify({
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred while deleting the category"
      }
    }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

**Status Code:** `500 Internal Server Error`

**Logging:** Log full error details server-side for debugging

### Error Logging Strategy

1. **Client Errors (4xx):** Log at INFO level with request context
2. **Server Errors (5xx):** Log at ERROR level with full stack trace
3. **Security Events:** Log authentication/authorization failures
4. **Performance:** Log slow queries (> 1 second)

## 8. Performance Considerations

### Database Query Optimization

**Indexed Queries:**
- Category lookup by `id`: Uses primary key index (O(log n))
- Category lookup by `user_id`: Uses foreign key index
- Item count by `category_id` and `user_id`: Uses composite index `idx_items_user_category`

**Query Count:**
- Minimum: 3 queries (fetch category, count items, delete)
- No N+1 query problems
- All queries are indexed and efficient

**Expected Performance:**
- Category fetch: < 5ms
- Item count: < 10ms
- Delete operation: < 5ms
- Total: < 20ms for complete operation

### Bottleneck Analysis

**Potential Issues:**
1. Item count query on categories with many items
   - **Mitigation:** Use `{ count: "exact", head: true }` for efficient counting
   - **Index:** Composite index on `(user_id, category_id)` ensures fast lookup

2. Network latency to Supabase
   - **Mitigation:** Use connection pooling (handled by Supabase client)
   - **Note:** For MVP, acceptable as operations are infrequent

3. RLS policy evaluation overhead
   - **Mitigation:** Policies are simple equality checks, minimal overhead
   - **Note:** Security benefit outweighs minimal performance cost

### Caching Strategy

**Not Applicable:**
- DELETE operations should not be cached
- Always perform live database check for data integrity
- Category list cache invalidation handled separately

### Concurrent Request Handling

**Race Condition Prevention:**
- Database-level constraint (ON DELETE RESTRICT) provides atomic protection
- If multiple delete requests for same category: first succeeds, others get 404
- If items added during deletion: constraint prevents deletion

**Idempotency:**
- Second delete request for same category returns 404 (safe)
- No unintended side effects

## 9. Implementation Steps

### Step 1: Create Category Service (if not exists)

**File:** `src/lib/services/category.service.ts`

**Tasks:**
1. Create service file with Supabase client import
2. Implement `deleteCategory` function with signature:
   ```typescript
   export async function deleteCategory(
     supabase: SupabaseClient,
     userId: string,
     categoryId: string
   ): Promise<{ id: string; name: string } | null>
   ```
3. Implement category existence and ownership check
4. Implement item count check
5. Implement delete operation
6. Add error handling and type safety

**Acceptance Criteria:**
- Function returns category ID and name on success
- Function returns null if category not found
- Function throws error with item count if category has items
- All queries filter by `user_id` for security

### Step 2: Create Validation Schema

**File:** `src/lib/validation/category.validation.ts` (or in API route)

**Tasks:**
1. Import Zod
2. Define `DeleteCategoryParamsSchema`:
   ```typescript
   export const DeleteCategoryParamsSchema = z.object({
     id: z.string().uuid({ message: "Invalid category ID format" })
   });
   ```

**Acceptance Criteria:**
- Schema validates UUID format
- Schema provides clear error messages
- Schema is reusable across endpoints

### Step 3: Implement API Route Handler

**File:** `src/pages/api/categories/[id].ts`

**Tasks:**
1. Add `export const prerender = false` for SSR
2. Implement `DELETE` function handler:
   ```typescript
   export async function DELETE(context: APIContext) {
     // Implementation
   }
   ```
3. Extract `id` from `context.params`
4. Get authenticated user from `context.locals.supabase`
5. Validate `id` parameter using Zod schema
6. Call `categoryService.deleteCategory()`
7. Handle success and error cases
8. Return appropriate JSON responses

**Code Structure:**
```typescript
import type { APIContext } from "astro";
import { DeleteCategoryParamsSchema } from "../../lib/validation/category.validation";
import { deleteCategory } from "../../lib/services/category.service";

export const prerender = false;

export async function DELETE(context: APIContext) {
  const supabase = context.locals.supabase;
  const { id } = context.params;

  // 1. Authentication check
  // 2. Input validation
  // 3. Service call
  // 4. Response handling
}
```

**Acceptance Criteria:**
- Returns 401 if not authenticated
- Returns 400 if invalid UUID
- Returns 404 if category not found
- Returns 409 if category has items
- Returns 200 with success message on deletion
- Returns 500 on unexpected errors

### Step 4: Implement Error Handling

**Tasks:**
1. Add try-catch block for unexpected errors
2. Implement specific error responses for each case
3. Add server-side error logging
4. Ensure consistent error response format

**Error Response Helper (Optional):**
```typescript
function errorResponse(code: string, message: string, status: number) {
  return new Response(
    JSON.stringify({
      error: { code, message }
    }),
    { 
      status,
      headers: { "Content-Type": "application/json" }
    }
  );
}
```

**Acceptance Criteria:**
- All error paths return proper status codes
- Error messages are user-friendly
- Sensitive information is not leaked
- Errors are logged server-side

### Step 5: Add Service Layer Logic

**File:** `src/lib/services/category.service.ts`

**Implementation:**

```typescript
export async function deleteCategory(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string
) {
  // Step 1: Fetch category and verify ownership
  const { data: category, error: fetchError } = await supabase
    .from("categories")
    .select("id, name, user_id")
    .eq("id", categoryId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !category) {
    return null; // Category not found
  }

  // Step 2: Count associated items
  const { count, error: countError } = await supabase
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId)
    .eq("user_id", userId);

  if (countError) {
    throw new Error("Failed to count category items");
  }

  if (count && count > 0) {
    throw new Error(`Cannot delete ${category.name} because it contains ${count} item${count === 1 ? '' : 's'}`);
  }

  // Step 3: Delete category
  const { error: deleteError } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("user_id", userId);

  if (deleteError) {
    throw new Error("Failed to delete category");
  }

  return { id: category.id, name: category.name };
}
```

**Acceptance Criteria:**
- Function checks category ownership
- Function counts associated items
- Function throws descriptive error if items exist
- Function returns category details on success
- All database errors are caught and handled

### Step 6: Test Error Scenarios

**Test Cases:**

1. **Successful Deletion:**
   - Given: Valid category ID with no items
   - When: DELETE request is made
   - Then: Returns 200 with success message

2. **Unauthenticated Request:**
   - Given: No valid session token
   - When: DELETE request is made
   - Then: Returns 401 Unauthorized

3. **Invalid UUID Format:**
   - Given: Malformed category ID
   - When: DELETE request is made
   - Then: Returns 400 with validation error

4. **Category Not Found:**
   - Given: Non-existent category ID
   - When: DELETE request is made
   - Then: Returns 404 Not Found

5. **Category Belongs to Another User:**
   - Given: Valid category ID owned by different user
   - When: DELETE request is made
   - Then: Returns 404 Not Found (not 403 to prevent info disclosure)

6. **Category Has Items:**
   - Given: Category with 25 items
   - When: DELETE request is made
   - Then: Returns 409 with message "Cannot delete [Name] because it contains 25 items"

7. **Database Connection Error:**
   - Given: Database is unavailable
   - When: DELETE request is made
   - Then: Returns 500 Internal Server Error

**Testing Tools:**
- Manual testing with Postman/Thunder Client
- Integration tests with test database
- E2E tests with test user accounts

### Step 7: Update Frontend (if applicable)

**Tasks:**
1. Add delete button/action to category list UI
2. Implement confirmation dialog before deletion
3. Handle 409 error with user-friendly message
4. Refresh category list on successful deletion
5. Display error toasts for failure cases

**Note:** This step depends on existing frontend implementation and may be out of scope for backend-only implementation.

### Step 8: Documentation and Review

**Tasks:**
1. Add JSDoc comments to service functions
2. Document error codes in centralized location
3. Update API documentation with endpoint details
4. Add code comments for complex logic
5. Perform code review with team

**Documentation Example:**
```typescript
/**
 * Deletes a category if it has no associated items
 * 
 * @param supabase - Authenticated Supabase client
 * @param userId - ID of the authenticated user
 * @param categoryId - UUID of the category to delete
 * @returns Category ID and name if successful, null if not found
 * @throws Error if category has associated items
 * @throws Error if database operation fails
 */
export async function deleteCategory(...)
```

**Acceptance Criteria:**
- All public functions have JSDoc comments
- Error scenarios are documented
- Code is reviewed and approved
- API documentation is updated

## 10. Summary and Checklist

### Implementation Checklist

- [ ] Create category service with deleteCategory function
- [ ] Implement category existence and ownership check
- [ ] Implement item count validation
- [ ] Implement delete operation with proper error handling
- [ ] Create Zod validation schema for UUID parameter
- [ ] Create API route handler at `/api/categories/[id].ts`
- [ ] Implement DELETE function with authentication check
- [ ] Add input validation with Zod
- [ ] Integrate service layer call
- [ ] Handle all error responses (401, 404, 409, 500)
- [ ] Add server-side error logging
- [ ] Test successful deletion
- [ ] Test authentication errors
- [ ] Test validation errors
- [ ] Test category not found errors
- [ ] Test conflict errors (category has items)
- [ ] Test database error handling
- [ ] Update frontend to handle deletion
- [ ] Add JSDoc documentation
- [ ] Update API documentation
- [ ] Code review and approval

### Key Success Metrics

1. **Functionality:** All test cases pass successfully
2. **Security:** User can only delete their own categories
3. **Data Integrity:** Categories with items cannot be deleted
4. **Performance:** Deletion completes in < 100ms (including network)
5. **Error Handling:** All error scenarios return appropriate status codes and messages
6. **Code Quality:** Code follows project conventions and is well-documented

### Post-Implementation Considerations

1. **Monitoring:** Track deletion frequency and error rates
2. **Analytics:** Log deletion events for user behavior analysis
3. **Soft Delete:** Consider implementing soft delete in future for data recovery
4. **Bulk Operations:** Consider adding bulk delete endpoint if needed
5. **Audit Trail:** Consider adding deletion audit log for compliance

---

**End of Implementation Plan**
