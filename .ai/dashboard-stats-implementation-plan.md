# API Endpoint Implementation Plan: Get Dashboard Statistics

## 1. Endpoint Overview

This endpoint provides aggregated statistics for the dashboard view, including total counts of items, containers, categories, items currently checked out, and a list of recently created items with their associated metadata (thumbnail, category, container).

**Purpose:** Display a comprehensive overview of the user's storage system on the dashboard.

**Authentication Required:** Yes (user must be authenticated via Supabase Auth)

**Data Scope:** User-scoped (only returns data belonging to the authenticated user, enforced by RLS policies)

## 2. Request Details

- **HTTP Method:** `GET`
- **URL Structure:** `/api/dashboard/stats`
- **Parameters:**
  - **Required:** None
  - **Optional:** None
- **Request Body:** None
- **Headers:**
  - Authentication handled automatically via Astro middleware and Supabase session cookies

## 3. Used Types

### Response DTOs

From `src/types.ts`:

```typescript
/**
 * Dashboard statistics response
 * Used for: GET /api/dashboard/stats
 */
export interface DashboardStatsDTO {
  totalItems: number;
  totalContainers: number;
  totalCategories: number;
  itemsOut: number;
  recentItems: RecentItemDTO[];
}

/**
 * Recent item summary for dashboard
 */
export interface RecentItemDTO {
  id: Item["id"];
  name: Item["name"];
  thumbnail: string | null;
  category: CategoryRefDTO["name"];
  container: ContainerRefDTO["name"];
  isIn: Item["is_in"];
  createdAt: Item["created_at"];
}
```

### Error Response DTO

From `src/types.ts`:

```typescript
export interface ErrorResponseDTO {
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

### Command Models

Not applicable - this is a read-only endpoint with no input parameters.

## 4. Response Details

### Success Response (200 OK)

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
      "thumbnail": "https://storage.supabase.co/...",
      "category": "Outdoor Gear",
      "container": "Garage Box A",
      "isIn": true,
      "createdAt": "2026-01-15T10:30:00Z"
    }
  ]
}
```

**Status Code:** `200 OK`

**Content-Type:** `application/json`

### Error Responses

#### 401 Unauthorized

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**Status Code:** `401 Unauthorized`

**Scenario:** User is not authenticated or session has expired

#### 500 Internal Server Error

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred while fetching dashboard statistics"
  }
}
```

**Status Code:** `500 Internal Server Error`

**Scenario:** Database query failure, unexpected server error

## 5. Data Flow

### High-Level Flow

```
1. Client Request
   ↓
2. Astro Middleware (Authentication Check)
   ↓
3. API Endpoint Handler (/api/dashboard/stats)
   ↓
4. DashboardService.getStatistics()
   ↓
5. Parallel Database Queries (via Supabase Client)
   ├─ Count total items
   ├─ Count total containers
   ├─ Count total categories
   ├─ Count items where is_in = false
   └─ Fetch recent 5 items with joins
   ↓
6. Transform Data to DTOs
   ↓
7. Return JSON Response
```

### Detailed Data Flow

1. **Authentication Layer:**
   - Astro middleware validates user session via `context.locals.supabase`
   - If no valid session, return 401 Unauthorized
   - User ID extracted from `context.locals.user.id`

2. **Service Layer:**
   - Create/use `DashboardService` in `src/lib/services/dashboard.service.ts`
   - Service receives authenticated Supabase client and user ID
   - Executes parallel database queries for optimal performance

3. **Database Queries:**

   **Query 1: Total Items Count**
   ```sql
   SELECT COUNT(*) FROM items WHERE user_id = $1
   ```
   - Uses `idx_items_user_id_idx` index
   - RLS policy ensures user isolation

   **Query 2: Total Containers Count**
   ```sql
   SELECT COUNT(*) FROM containers WHERE user_id = $1
   ```
   - Uses `containers_user_id_idx` index
   - RLS policy ensures user isolation

   **Query 3: Total Categories Count**
   ```sql
   SELECT COUNT(*) FROM categories WHERE user_id = $1
   ```
   - Uses `categories_user_id_idx` index
   - RLS policy ensures user isolation

   **Query 4: Items Out Count**
   ```sql
   SELECT COUNT(*) FROM items WHERE user_id = $1 AND is_in = false
   ```
   - Uses `idx_items_user_status` composite index
   - Efficiently filters by user and status

   **Query 5: Recent Items with Relations**
   ```sql
   SELECT 
     items.id,
     items.name,
     items.is_in,
     items.created_at,
     categories.name as category_name,
     containers.name as container_name,
     images.storage_path
   FROM items
   LEFT JOIN categories ON items.category_id = categories.id
   LEFT JOIN containers ON items.container_id = containers.id
   LEFT JOIN images ON images.entity_type = 'item' 
     AND images.entity_id = items.id 
     AND images.display_order = 1
   WHERE items.user_id = $1
   ORDER BY items.created_at DESC
   LIMIT 5
   ```
   - Uses `idx_items_user_id_idx` for user filtering
   - Uses `idx_images_items` partial index for thumbnail lookup
   - Left joins ensure items without images are still returned
   - Limits to 5 most recent items

4. **Data Transformation:**
   - Convert storage_path to public URL using Supabase Storage
   - Format: `supabase.storage.from('bucket-name').getPublicUrl(storage_path)`
   - Map database rows to `RecentItemDTO` structure
   - Aggregate counts into `DashboardStatsDTO`

5. **Response:**
   - Return 200 with JSON body conforming to `DashboardStatsDTO`

### Database Interactions

- **Tables Accessed:** items, containers, categories, images
- **RLS Policies Applied:** All queries filtered by `user_id = auth.uid()`
- **Indexes Used:**
  - `idx_items_user_id_idx` (items by user)
  - `idx_items_user_status` (items by user and status)
  - `idx_images_items` (partial index for item images)
  - `containers_user_id_idx` (containers by user)
  - `categories_user_id_idx` (categories by user)

### External Services

- **Supabase Database:** PostgreSQL queries for data retrieval
- **Supabase Storage:** Generate public URLs for image thumbnails

## 6. Security Considerations

### Authentication

- **Mechanism:** Supabase Auth session cookies
- **Validation:** Handled by Astro middleware in `src/middleware/index.ts`
- **Session Management:** Supabase automatically manages session refresh
- **Enforcement:** Check `context.locals.user` existence before proceeding

### Authorization

- **User Isolation:** Enforced at multiple levels:
  1. RLS policies on all tables ensure `user_id = auth.uid()`
  2. Service layer passes authenticated user ID to all queries
  3. No manual user ID filtering needed (handled by RLS)

### Data Validation

- **Input Validation:** Not applicable (no user input)
- **Output Sanitization:** 
  - Ensure all data is properly typed
  - Storage URLs are generated via Supabase SDK (safe)

### Potential Security Threats

1. **Session Hijacking:**
   - Mitigated by Supabase's secure session management
   - Use HTTPS in production
   - Short session expiration times

2. **Information Disclosure:**
   - RLS policies prevent cross-user data leakage
   - No sensitive data exposed in response
   - Image URLs use Supabase's signed URL mechanism

3. **SQL Injection:**
   - Mitigated by using Supabase client parameterized queries
   - Never construct raw SQL with user input

4. **Unauthorized Access:**
   - Middleware checks authentication before endpoint execution
   - Return 401 immediately if not authenticated

### Security Best Practices

- Use `context.locals.supabase` for database access (includes auth context)
- Never bypass RLS policies
- Log security-related errors for monitoring
- Implement rate limiting at infrastructure level (future consideration)

## 7. Error Handling

### Error Scenarios and Status Codes

| Scenario | Status Code | Error Code | Message | Handling |
|----------|-------------|------------|---------|----------|
| User not authenticated | 401 | UNAUTHORIZED | "Authentication required" | Check `context.locals.user` existence |
| Database connection failure | 500 | INTERNAL_ERROR | "An unexpected error occurred while fetching dashboard statistics" | Log error, return generic message |
| Query execution error | 500 | INTERNAL_ERROR | "An unexpected error occurred while fetching dashboard statistics" | Log error details, return generic message |
| Supabase client error | 500 | INTERNAL_ERROR | "An unexpected error occurred while fetching dashboard statistics" | Log error, return generic message |
| Storage URL generation failure | 500 | INTERNAL_ERROR | "An unexpected error occurred while fetching dashboard statistics" | Log error, fallback to null thumbnail |

### Error Handling Strategy

1. **Authentication Errors (401):**
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

2. **Service Layer Errors (500):**
   ```typescript
   try {
     const stats = await dashboardService.getStatistics(userId);
     return new Response(JSON.stringify(stats), {
       status: 200,
       headers: { "Content-Type": "application/json" }
     });
   } catch (error) {
     console.error("Dashboard stats error:", error);
     return new Response(
       JSON.stringify({
         error: {
           code: "INTERNAL_ERROR",
           message: "An unexpected error occurred while fetching dashboard statistics"
         }
       }),
       { status: 500, headers: { "Content-Type": "application/json" } }
     );
   }
   ```

3. **Partial Data Failures:**
   - If thumbnail URL generation fails, set `thumbnail: null`
   - If recent items query fails, return empty array `recentItems: []`
   - Continue processing other statistics

4. **Logging:**
   - Log all errors with context (user ID, query details)
   - Use structured logging for easier debugging
   - Never log sensitive user data

### Error Response Format

All errors follow the `ErrorResponseDTO` structure:

```typescript
{
  error: {
    code: string;      // Machine-readable error code
    message: string;   // Human-readable error message
    details?: Array<{  // Optional field-specific errors
      field: string;
      message: string;
    }>;
  }
}
```

## 8. Performance Considerations

### Potential Bottlenecks

1. **Sequential Database Queries:**
   - Running 5 queries sequentially would be slow
   - **Mitigation:** Use `Promise.all()` to parallelize count queries and recent items query

2. **Image URL Generation:**
   - Generating URLs for each thumbnail in a loop is inefficient
   - **Mitigation:** Batch process or use memoization if same URLs are generated

3. **Large Datasets:**
   - As user's item count grows, queries may slow down
   - **Mitigation:** Indexes are already optimized (see DB plan)
   - Recent items limited to 5, no pagination needed

4. **Join Heavy Query:**
   - Recent items query joins 4 tables
   - **Mitigation:** Proper indexes on foreign keys (already present)
   - Consider denormalization in future if performance degrades

### Optimization Strategies

1. **Parallel Query Execution:**
   ```typescript
   const [totalItems, totalContainers, totalCategories, itemsOut, recentItems] = 
     await Promise.all([
       countItems(userId),
       countContainers(userId),
       countCategories(userId),
       countItemsOut(userId),
       fetchRecentItems(userId)
     ]);
   ```

2. **Efficient Image Thumbnail Lookup:**
   - Only fetch `display_order = 1` images (thumbnails)
   - Use LEFT JOIN to avoid separate queries per item
   - Partial index `idx_images_items` optimizes this lookup

3. **Query Result Caching (Future):**
   - Consider caching dashboard stats for 30-60 seconds
   - Use Redis or in-memory cache
   - Invalidate on user actions (create item, etc.)

4. **Database Connection Pooling:**
   - Supabase client handles connection pooling automatically
   - No additional configuration needed

5. **Response Compression:**
   - Enable gzip/brotli compression at Astro/server level
   - Reduces payload size for dashboard stats

### Expected Performance

- **Query Time:** < 100ms for typical datasets (< 1000 items)
- **Total Response Time:** < 200ms including network latency
- **Concurrent Users:** RLS policies and indexes support hundreds of concurrent users
- **Scalability:** Linear performance degradation as user data grows

### Monitoring Recommendations

- Track endpoint response time (p50, p95, p99)
- Monitor database query execution time
- Alert on response times > 500ms
- Track error rates and types

## 9. Implementation Steps

### Step 1: Create Dashboard Service

**File:** `src/lib/services/dashboard.service.ts`

**Tasks:**
- Create `DashboardService` class or module with `getStatistics()` function
- Accept `SupabaseClient` and `userId` as parameters
- Implement parallel query execution using `Promise.all()`
- Handle errors gracefully with try-catch blocks
- Transform database results to `DashboardStatsDTO` format
- Generate thumbnail URLs using Supabase Storage SDK

**Pseudocode:**
```typescript
export async function getStatistics(
  supabase: SupabaseClient,
  userId: string
): Promise<DashboardStatsDTO> {
  // Execute parallel queries
  const [itemsCount, containersCount, categoriesCount, itemsOutCount, recentItemsData] = 
    await Promise.all([
      // Count queries
      supabase.from('items').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('containers').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('categories').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('items').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_in', false),
      
      // Recent items with joins
      supabase
        .from('items')
        .select(`
          id,
          name,
          is_in,
          created_at,
          categories(name),
          containers(name),
          images!left(storage_path)
        `)
        .eq('user_id', userId)
        .eq('images.display_order', 1)
        .eq('images.entity_type', 'item')
        .order('created_at', { ascending: false })
        .limit(5)
    ]);
  
  // Transform and return
  return {
    totalItems: itemsCount.count ?? 0,
    totalContainers: containersCount.count ?? 0,
    totalCategories: categoriesCount.count ?? 0,
    itemsOut: itemsOutCount.count ?? 0,
    recentItems: recentItemsData.data?.map(transformToRecentItemDTO) ?? []
  };
}
```

### Step 2: Create API Endpoint Handler

**File:** `src/pages/api/dashboard/stats.ts`

**Tasks:**
- Create Astro API endpoint file
- Export `const prerender = false` to enable SSR
- Export `GET` handler function
- Extract authenticated user from `context.locals.user`
- Return 401 if user not authenticated
- Call `DashboardService.getStatistics()` with Supabase client and user ID
- Handle errors with try-catch and return appropriate error responses
- Return 200 with `DashboardStatsDTO` JSON on success

**Pseudocode:**
```typescript
import type { APIContext } from 'astro';
import { getStatistics } from '../../../lib/services/dashboard.service';
import type { DashboardStatsDTO, ErrorResponseDTO } from '../../../types';

export const prerender = false;

export async function GET(context: APIContext): Promise<Response> {
  // Authentication check
  if (!context.locals.user) {
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Fetch statistics
  try {
    const stats: DashboardStatsDTO = await getStatistics(
      context.locals.supabase,
      context.locals.user.id
    );

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while fetching dashboard statistics'
      }
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

### Step 3: Verify Middleware Configuration

**File:** `src/middleware/index.ts`

**Tasks:**
- Ensure middleware is properly configured to:
  - Initialize Supabase client on `context.locals.supabase`
  - Extract and validate user session
  - Set `context.locals.user` with authenticated user data
- No changes needed if middleware already handles authentication

**Verification:**
- Check that `context.locals.user` contains user ID
- Check that `context.locals.supabase` contains authenticated Supabase client

### Step 4: Test Database Queries

**Tasks:**
- Manually test each query in Supabase SQL editor with sample data
- Verify RLS policies are working correctly
- Test with user who has no data (all counts should be 0, recentItems empty array)
- Test with user who has data (verify correct counts and recent items)
- Verify thumbnail URLs are generated correctly
- Test with items that have no images (thumbnail should be null)

**Test Scenarios:**
1. User with no data
2. User with data but no images
3. User with complete data (items, images, categories, containers)
4. User with more than 5 items (verify only 5 most recent returned)

### Step 5: Implement Error Handling

**Tasks:**
- Add try-catch blocks in service layer
- Handle Supabase client errors gracefully
- Return appropriate error codes and messages
- Log errors with sufficient context for debugging
- Test error scenarios (database down, network issues, etc.)

**Error Scenarios to Test:**
- Database connection failure
- Query timeout
- Invalid user ID (should return 0 counts due to RLS)
- Storage URL generation failure

### Step 6: Manual API Testing

**Tools:** Postman, cURL, or browser

**Test Cases:**

1. **Authenticated Request:**
   ```bash
   curl -X GET http://localhost:4321/api/dashboard/stats \
     -H "Cookie: sb-access-token=..." \
     -H "Cookie: sb-refresh-token=..."
   ```
   - Expected: 200 OK with DashboardStatsDTO

2. **Unauthenticated Request:**
   ```bash
   curl -X GET http://localhost:4321/api/dashboard/stats
   ```
   - Expected: 401 Unauthorized

3. **Invalid Session:**
   ```bash
   curl -X GET http://localhost:4321/api/dashboard/stats \
     -H "Cookie: sb-access-token=invalid"
   ```
   - Expected: 401 Unauthorized

### Step 7: Performance Testing

**Tasks:**
- Measure endpoint response time with realistic data volumes
- Test with varying dataset sizes (10, 100, 1000 items)
- Verify parallel queries are executing correctly (not sequential)
- Use browser DevTools Network tab to inspect response times
- Optimize if response time exceeds 200ms

**Performance Metrics:**
- Response time < 200ms for typical datasets
- Database query time < 100ms
- No N+1 query problems

### Step 8: Integration Testing

**Tasks:**
- Test endpoint from frontend dashboard component
- Verify data displays correctly in UI
- Test loading states
- Test error states (network failure, 401, 500)
- Verify thumbnail images load correctly
- Test with empty state (no data)

### Step 9: Code Review Checklist

- [ ] Service layer properly extracts business logic
- [ ] API endpoint follows Astro conventions (GET handler, prerender: false)
- [ ] Authentication check is first operation in handler
- [ ] All database queries use RLS-aware Supabase client
- [ ] Parallel query execution with Promise.all()
- [ ] Error handling with appropriate status codes
- [ ] Error logging with sufficient context
- [ ] Type safety with TypeScript (DashboardStatsDTO, ErrorResponseDTO)
- [ ] No hardcoded values or magic numbers
- [ ] Thumbnail URLs generated correctly via Supabase Storage
- [ ] Code follows project coding practices (early returns, guard clauses)

### Step 10: Documentation

**Tasks:**
- Add JSDoc comments to service functions
- Document query optimization decisions
- Add inline comments for complex logic
- Update API documentation if exists
- Document any deviations from original plan

**Documentation Locations:**
- Service: `src/lib/services/dashboard.service.ts`
- Endpoint: `src/pages/api/dashboard/stats.ts`
- Types: Already documented in `src/types.ts`

---

## Implementation Checklist Summary

- [ ] Step 1: Create Dashboard Service
- [ ] Step 2: Create API Endpoint Handler
- [ ] Step 3: Verify Middleware Configuration
- [ ] Step 4: Test Database Queries
- [ ] Step 5: Implement Error Handling
- [ ] Step 6: Manual API Testing
- [ ] Step 7: Performance Testing
- [ ] Step 8: Integration Testing
- [ ] Step 9: Code Review
- [ ] Step 10: Documentation

---

## Additional Notes

### Future Enhancements

1. **Response Caching:**
   - Cache dashboard stats for 30-60 seconds
   - Invalidate cache on user mutations (create, update, delete)

2. **Real-time Updates:**
   - Consider WebSocket/SSE for live dashboard updates
   - Use Supabase Realtime subscriptions

3. **Customizable Recent Items:**
   - Allow user to configure number of recent items
   - Add query parameter `limit` (default: 5, max: 20)

4. **Additional Statistics:**
   - Items by category breakdown
   - Container utilization percentage
   - Recently updated items (not just created)

5. **Performance Monitoring:**
   - Add APM tool integration (DataDog, New Relic)
   - Track query execution time
   - Monitor error rates

### Dependencies

- `@supabase/supabase-js` - Supabase client
- `astro` - API endpoint framework
- TypeScript types from `src/types.ts` and `src/db/database.types.ts`

### Related Endpoints

- GET `/api/items` - Full item list (more detailed than recentItems)
- GET `/api/containers` - Full container list
- GET `/api/categories` - Full category list

### Database Schema Version

This implementation assumes the database schema defined in `.ai/db-plan.md` is fully implemented with:
- All tables created
- All indexes in place
- RLS policies enabled
- Triggers configured

If schema is not complete, some queries may fail or perform poorly.
