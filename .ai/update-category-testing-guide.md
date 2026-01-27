# Update Category API - Testing Guide

## Implementation Status ✅

### Completed Steps (6/8)

#### ✅ Step 1: Validation Schemas Created
**File:** `src/lib/validation/category.schema.ts`

Added two new validation schemas:
- `categoryIdParamSchema`: Validates UUID format for route parameter
- `updateCategorySchema`: Validates category name (1-255 chars, trimmed, non-whitespace)

#### ✅ Step 2: Service Layer Extended
**File:** `src/lib/services/category.service.ts`

Added `updateCategory` method that:
- Updates category name in database
- Fetches updated category with item count in single query
- Returns `null` if category not found
- Throws error for duplicate names (PostgreSQL error code: 23505)

#### ✅ Step 3: API Route Handler Created
**File:** `src/pages/api/categories/[id].ts`

Implements PATCH endpoint with:
- Authentication check (guard clause)
- Route parameter validation (UUID format)
- Request body parsing and validation
- Service layer integration
- Comprehensive error handling (401, 400, 404, 409, 500)

#### ✅ Step 4: Testing Ready
Manual testing can be performed using the web interface or browser tools.

#### ✅ Step 5: Database Constraints Verified
**File:** `supabase/migrations/20260119140000_initial_schema.sql`

Confirmed constraints in place:
- **Line 187**: Unique index `idx_categories_user_name_unique` on `(user_id, LOWER(name))`
  - Enforces case-insensitive unique category names per user
- **Lines 278-281**: Trigger `update_categories_updated_at`
  - Automatically updates `updated_at` timestamp on modifications
- **Lines 385-389**: RLS Policy "Users can update own categories"
  - Enforces user ownership at database level

#### ✅ Step 6: Frontend Integration Complete
**Files:**
- `src/hooks/useCategories.ts` (lines 133-173)
- `src/components/categories/CategoriesList.tsx` (lines 86-103)

Frontend already has full integration:
- `updateCategory` hook function makes PATCH request to `/api/categories/${id}`
- `CategoriesList` component has edit functionality
- Error handling for 404, 409, and network errors
- Success/error toast notifications
- Automatic list refresh after update

---

## Manual Testing Guide

### Prerequisites

1. **Start Development Server**
   ```bash
   npm run dev
   ```
   Server will be available at `http://localhost:4321` (or 4322 if port in use)

2. **Start Supabase (if testing locally)**
   ```bash
   npx supabase start
   ```

3. **Login to Application**
   Navigate to the application and login with test credentials or your user account.

### Test Cases

#### Test 1: Successful Category Update ✓
**Steps:**
1. Navigate to Categories page (`/categories`)
2. Click "Edit" button on any existing category
3. Change the name to a new, valid name (e.g., "Updated Category Name")
4. Click "Save" button

**Expected Result:**
- Category name updates successfully
- Success toast notification appears: "Category updated successfully"
- Category list refreshes with new name
- Updated `updated_at` timestamp visible
- Item count remains accurate

---

#### Test 2: Duplicate Name (Exact Match) ✗
**Steps:**
1. Ensure you have at least 2 categories (e.g., "Tools" and "Electronics")
2. Edit "Electronics" category
3. Try to rename it to "Tools" (exact match)
4. Click "Save"

**Expected Result:**
- Error toast notification: "A category with this name already exists"
- Edit form remains open with error message
- Category name NOT updated in database
- Original name preserved

---

#### Test 3: Duplicate Name (Case-Insensitive) ✗
**Steps:**
1. Ensure you have a category named "tools" (lowercase)
2. Edit another category
3. Try to rename it to "TOOLS" (uppercase)
4. Click "Save"

**Expected Result:**
- Error toast notification: "A category with this name already exists"
- Database unique constraint enforces case-insensitive comparison
- Edit form remains open
- Original name preserved

---

#### Test 4: Empty Name Validation ✗
**Steps:**
1. Edit any category
2. Clear the name field (leave it empty)
3. Try to save

**Expected Result:**
- Client-side validation prevents submission
- Error message: "Name is required"
- Save button disabled or inline error displayed
- No API request made

---

#### Test 5: Whitespace-Only Name ✗
**Steps:**
1. Edit any category
2. Enter only spaces: "     "
3. Try to save

**Expected Result:**
- Client-side validation prevents submission
- Error message: "Name cannot be only whitespace"
- No API request made

---

#### Test 6: Name Too Long (>255 characters) ✗
**Steps:**
1. Edit any category
2. Enter a name with 256+ characters
3. Try to save

**Expected Result:**
- Client-side validation prevents submission
- Error message: "Name must be between 1 and 255 characters"
- No API request made

---

#### Test 7: Whitespace Trimming ✓
**Steps:**
1. Edit any category
2. Enter name with leading/trailing spaces: "  Camping Gear  "
3. Save

**Expected Result:**
- Name saved as "Camping Gear" (spaces trimmed)
- Success notification appears
- Category displays without extra spaces

---

#### Test 8: Special Characters in Name ✓
**Steps:**
1. Edit any category
2. Enter name with special characters: "Tools & Hardware (Home)"
3. Save

**Expected Result:**
- Name saved successfully with special characters
- Success notification appears
- Special characters display correctly

---

#### Test 9: Update Non-Existent Category ✗
**Steps:**
1. Open browser DevTools > Network tab
2. Edit any category
3. Before saving, delete the category using another browser tab/window
4. Return to edit form and try to save

**Expected Result:**
- Error toast notification: "Category not found. It may have been deleted."
- Edit form closes automatically
- Category list refreshes (deleted category removed)

---

#### Test 10: Update Another User's Category ✗
**Note:** This requires 2 user accounts

**Steps:**
1. Login as User A
2. Create a category and note its UUID
3. Logout and login as User B
4. Try to update User A's category via API or URL manipulation

**Expected Result:**
- Response: 404 Not Found (not 403 to avoid information leakage)
- Error message: "Category not found"
- RLS policy blocks the update at database level

---

#### Test 11: Cancel Edit ✓
**Steps:**
1. Edit any category
2. Change the name
3. Click "Cancel" button (do not save)

**Expected Result:**
- Edit form closes
- Original name preserved (no changes saved)
- Category list shows original name

---

#### Test 12: Updated Timestamp ✓
**Steps:**
1. Note the current `updated_at` timestamp for a category
2. Edit and save the category
3. Check the new `updated_at` timestamp

**Expected Result:**
- `updated_at` timestamp automatically updated to current time
- Database trigger handles this automatically
- Frontend displays new timestamp

---

#### Test 13: Item Count Preservation ✓
**Steps:**
1. Note the item count for a category with items
2. Edit and update the category name
3. Verify item count after update

**Expected Result:**
- Item count remains unchanged
- All items still associated with category
- No data loss or corruption

---

#### Test 14: Concurrent Updates ✓
**Steps:**
1. Open category edit in two browser tabs
2. Tab 1: Change name to "Version A" and save
3. Tab 2: Change name to "Version B" and save

**Expected Result:**
- Last write wins (optimistic concurrency)
- Final name is "Version B"
- Both operations succeed (no locking)
- No data corruption

---

#### Test 15: Network Error Handling ✗
**Steps:**
1. Open browser DevTools > Network tab
2. Throttle network to "Offline"
3. Edit and try to save a category

**Expected Result:**
- Error toast: "Network error. Please check your connection and try again."
- Edit form remains open
- No changes saved
- User can retry after network restored

---

### API Testing (Alternative Method)

If you prefer testing directly via API:

#### Setup Authentication
1. Login to the application
2. Open DevTools > Application > Cookies
3. Copy the `sb-access-token` cookie value

#### Example API Calls

**Valid Update Request:**
```bash
curl -X PATCH http://localhost:4321/api/categories/{category-id} \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token={your-token}" \
  -d '{"name": "Updated Category Name"}'
```

**Expected Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Updated Category Name",
  "itemCount": 25,
  "createdAt": "2026-01-05T12:00:00Z",
  "updatedAt": "2026-01-27T17:30:00Z"
}
```

**Invalid UUID:**
```bash
curl -X PATCH http://localhost:4321/api/categories/invalid-id \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token={your-token}" \
  -d '{"name": "Test"}'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid category ID format"
  }
}
```

**Duplicate Name:**
```bash
curl -X PATCH http://localhost:4321/api/categories/{category-id} \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token={your-token}" \
  -d '{"name": "Existing Category"}'
```

**Expected Response (409 Conflict):**
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "A category with this name already exists"
  }
}
```

---

## Security Testing

### Authentication Tests
- ✓ Requests without auth token receive 401 Unauthorized
- ✓ Expired tokens receive 401 Unauthorized
- ✓ Users can only update their own categories (RLS enforcement)

### Authorization Tests
- ✓ User A cannot update User B's category (404 response, not 403)
- ✓ RLS policies enforce user_id = auth.uid()
- ✓ No information leakage about other users' categories

### Input Validation Tests
- ✓ SQL injection attempts blocked by parameterized queries
- ✓ XSS attempts in category names auto-escaped by React
- ✓ Unicode and emoji characters handled correctly
- ✓ All validation happens before database operations

---

## Performance Testing

### Response Time Benchmarks

Expected response times (happy path):
- Authentication check: < 50ms
- Input validation: < 5ms
- Database UPDATE: < 20ms
- Item count query: < 30ms
- **Total: < 105ms**

### Load Testing Recommendations

Test with multiple concurrent requests:
```bash
# Using Apache Bench
ab -n 100 -c 10 -H "Cookie: sb-access-token={token}" \
   -p update.json -T application/json \
   http://localhost:4321/api/categories/{id}
```

Expected behavior:
- All requests complete successfully
- No race conditions
- Unique constraint prevents duplicates even under load
- Last write wins for concurrent updates to same category

---

## Regression Testing Checklist

Before deploying to production:

- [ ] All 15 manual test cases pass
- [ ] Database constraints verified (unique index, trigger, RLS)
- [ ] Frontend integration works (edit, save, cancel)
- [ ] Error messages user-friendly and accurate
- [ ] Success/error toasts display correctly
- [ ] Category list refreshes after update
- [ ] Item counts remain accurate
- [ ] Timestamps update automatically
- [ ] Authentication required and enforced
- [ ] RLS policies block unauthorized access
- [ ] Case-insensitive uniqueness enforced
- [ ] Whitespace trimmed automatically
- [ ] Special characters handled correctly
- [ ] Network errors handled gracefully
- [ ] Concurrent updates don't corrupt data

---

## Known Limitations (By Design)

1. **Optimistic Concurrency**: Last write wins. No version conflict detection in MVP.
2. **No Audit Trail**: Previous category names not tracked.
3. **No Bulk Updates**: Can only update one category at a time.
4. **No Undo**: Changes are immediate and permanent.

---

## Troubleshooting

### Issue: "Category not found" when it exists
**Possible Causes:**
- Category belongs to different user (RLS blocking)
- Category was deleted by another session
- Invalid UUID format in request

**Solution:**
- Verify user owns the category
- Refresh category list
- Check UUID format

### Issue: "A category with this name already exists" unexpectedly
**Possible Causes:**
- Another category with same name (case-insensitive) exists
- Special characters or whitespace differences

**Solution:**
- List all categories to find duplicate
- Remember comparison is case-insensitive
- Check for hidden whitespace

### Issue: Changes not appearing
**Possible Causes:**
- Client-side cache not refreshed
- Browser cached old data
- Network error occurred silently

**Solution:**
- Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
- Check browser console for errors
- Verify API response in Network tab

---

## Next Steps (Steps 7-8)

### Step 7: Documentation ✅
This testing guide serves as implementation documentation.

### Step 8: Monitoring (Optional)
Consider adding:
- Error rate tracking (4xx/5xx responses)
- Response time monitoring
- Usage analytics (update frequency)
- Alert on high error rates

---

## Summary

The Update Category API endpoint is **fully implemented and ready for testing**. The implementation includes:

✅ Complete backend implementation (validation, service, route handler)
✅ Database constraints and triggers verified
✅ Full frontend integration
✅ Comprehensive error handling
✅ Security measures (auth, RLS, input validation)
✅ Type safety throughout the stack

**Next Action:** Perform manual testing using the test cases above to verify all functionality works as expected.
