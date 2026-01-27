# View Implementation Plan: Categories List/Management Page

## 1. Overview

The Categories List/Management Page is a simple, lightweight interface for managing category entities in the Home Storage System. This view provides CRUD operations through an inline editing approach, allowing users to view, create, edit, and delete categories without navigating to separate pages. The view displays categories in alphabetical order with item counts, enforces unique category names, and prevents deletion of categories that have assigned items.

**Key Features:**
- Alphabetically sorted category list with item counts
- Inline category creation with toggle form
- Inline editing (row transforms to edit mode)
- Delete confirmation with item count validation
- Real-time validation feedback
- Empty state for first-time users
- Mobile-responsive design

## 2. View Routing

**Path:** `/categories`

**File Location:** `src/pages/categories.astro`

**Access Control:** Requires authenticated user session

**Navigation:** Accessible from main navigation menu

## 3. Component Structure

### High-Level Component Hierarchy

```
categories.astro (Astro page)
└── CategoriesList.tsx (Main React component)
    ├── PageHeader
    │   ├── Title
    │   └── AddCategoryButton
    ├── CategoryCreateForm (conditional render)
    │   ├── NameInput
    │   ├── ErrorMessage
    │   ├── SaveButton
    │   └── CancelButton
    ├── CategoryTable (or List)
    │   └── For each category:
    │       ├── CategoryRow (normal mode)
    │       │   ├── NameCell
    │       │   ├── ItemCountBadge
    │       │   ├── EditButton
    │       │   └── DeleteButton
    │       OR
    │       └── CategoryEditRow (edit mode)
    │           ├── NameInput
    │           ├── ErrorMessage
    │           ├── SaveButton
    │           └── CancelButton
    ├── EmptyState (conditional render)
    │   ├── Message
    │   └── AddFirstCategoryButton
    └── DeleteConfirmationModal (conditional render)
        ├── DialogHeader
        ├── WarningMessage
        ├── CategoryInfo (name + item count)
        ├── CancelButton
        └── ConfirmDeleteButton
```

### Component Relationships

- **categories.astro** serves as the page container and handles initial server-side rendering
- **CategoriesList** is the main client-side component that orchestrates all interactions
- **CategoryRow** and **CategoryEditRow** are mutually exclusive per category (controlled by editing state)
- **CategoryCreateForm** toggles visibility based on user interaction
- **DeleteConfirmationModal** displays as an overlay when delete action is triggered
- **EmptyState** displays only when no categories exist

## 4. Component Details

### 4.1 categories.astro (Astro Page Component)

**Description:**  
Server-rendered page component that serves as the entry point for the Categories view. Handles initial data loading, authentication check, and renders the client-side CategoriesList component.

**Main Elements:**
- `<Layout>` wrapper with page metadata
- `<CategoriesList client:load>` React component with hydration directive
- Authentication check via Astro middleware
- Initial data fetch from `/api/categories?sort=name&order=asc`

**Handled Interactions:**
- None (static page container)

**Validation:**
- Server-side authentication check

**Types:**
- `CategoryListResponseDTO` for initial data

**Props:**
- None (page component)

**Implementation Notes:**
- Use `client:load` directive for CategoriesList to ensure immediate interactivity
- Pass initial categories data as props to avoid client-side loading flash
- Handle authentication redirects server-side

---

### 4.2 CategoriesList.tsx (Main React Component)

**Description:**  
Primary interactive component managing the entire categories view. Orchestrates state management, API calls, and child component rendering. Controls which UI mode is active (normal, create, edit, delete confirmation).

**Main Elements:**
- Page header with title and "Add Category" button
- Conditional CategoryCreateForm component
- List/table of CategoryRow or CategoryEditRow components
- Conditional EmptyState component
- Conditional DeleteConfirmationModal component
- Toast notifications for success/error messages

**Handled Interactions:**
- Click "Add Category" button → Show create form, hide button
- Successful create/update/delete → Refresh category list, show success toast
- Failed API call → Display error toast or inline error
- Cancel create/edit → Reset form state, return to normal view

**Validation:**
- None directly (delegated to child components)

**Types:**
```typescript
interface CategoriesListProps {
  initialCategories?: CategoryListItemDTO[];
}

interface CategoriesListState {
  categories: CategoryListItemDTO[];
  isLoading: boolean;
  error: string | null;
  createFormVisible: boolean;
  editingCategoryId: string | null;
  deleteModalState: {
    isOpen: boolean;
    category: CategoryListItemDTO | null;
  };
}
```

**Props:**
- `initialCategories?: CategoryListItemDTO[]` - Server-rendered initial data (optional)

**Implementation Notes:**
- Use custom `useCategories` hook for API operations
- Maintain single source of truth for categories array
- Ensure only one category can be in edit mode at a time
- Sort categories alphabetically after mutations

---

### 4.3 CategoryRow.tsx (Display Mode Component)

**Description:**  
Displays a single category in its normal (non-editing) state. Shows category name, item count badge, and action buttons (edit, delete). Provides hover effects for better UX.

**Main Elements:**
- `<tr>` or `<li>` element with alternating background
- Category name text (left-aligned)
- Item count badge (e.g., "25 items")
- Edit button (icon with aria-label)
- Delete button (icon with aria-label)

**Handled Interactions:**
- Click edit button → Trigger parent's `onEdit(categoryId)` callback
- Click delete button → Trigger parent's `onDelete(category)` callback
- Hover → Show background color change

**Validation:**
- None

**Types:**
```typescript
interface CategoryRowProps {
  category: CategoryListItemDTO;
  onEdit: (categoryId: string) => void;
  onDelete: (category: CategoryListItemDTO) => void;
}
```

**Props:**
- `category: CategoryListItemDTO` - Category data to display
- `onEdit: (categoryId: string) => void` - Callback when edit button clicked
- `onDelete: (category: CategoryListItemDTO) => void` - Callback when delete button clicked

**Implementation Notes:**
- Use semantic table structure (`<tr><td>`) or list item (`<li>`)
- Ensure edit/delete buttons have minimum 44x44px touch targets for mobile
- Use Shadcn/ui Badge component for item count
- Use Shadcn/ui Button component with icon variants for actions

---

### 4.4 CategoryEditRow.tsx (Edit Mode Component)

**Description:**  
Inline editing interface that replaces CategoryRow when a category is being edited. Provides input field for name modification, real-time validation, and save/cancel actions.

**Main Elements:**
- `<tr>` or `<li>` element (matches CategoryRow structure)
- Text input for category name (auto-focused)
- Inline error message display
- Save button (icon or text)
- Cancel button (icon or text)

**Handled Interactions:**
- Input change → Update local state, trigger validation on blur
- Click Save → Validate and trigger parent's `onSave(categoryId, newName)` callback
- Click Cancel → Trigger parent's `onCancel()` callback
- Press Enter → Trigger save
- Press Escape → Trigger cancel
- Input blur → Validate and show errors

**Validation:**
- **Name is required:** Cannot be empty or only whitespace
- **Name length:** Must be 1-255 characters
- **Name uniqueness:** Must not match existing category names (case-insensitive)
- Display validation errors inline below input
- Disable Save button when validation fails

**Types:**
```typescript
interface CategoryEditRowProps {
  category: CategoryListItemDTO;
  onSave: (categoryId: string, newName: string) => Promise<void>;
  onCancel: () => void;
  existingNames: string[];
  isSaving?: boolean;
}

interface CategoryEditRowState {
  name: string;
  errors: string[];
  isDirty: boolean;
}
```

**Props:**
- `category: CategoryListItemDTO` - Category being edited
- `onSave: (categoryId: string, newName: string) => Promise<void>` - Async callback to save changes
- `onCancel: () => void` - Callback to cancel editing
- `existingNames: string[]` - List of existing category names for uniqueness check
- `isSaving?: boolean` - Loading state during save operation

**Implementation Notes:**
- Use `useRef` to auto-focus input on mount
- Use `useCategoryForm` custom hook for form state and validation
- Implement keyboard handlers for Enter (save) and Escape (cancel)
- Show loading spinner on Save button during API call
- Prevent duplicate saves with disabled state during `isSaving`

---

### 4.5 CategoryCreateForm.tsx (Create Mode Component)

**Description:**  
Inline form appearing at the top of the category list when "Add Category" is clicked. Allows users to create new categories with validation feedback. Auto-focuses the input field for immediate typing.

**Main Elements:**
- Container div or table row positioned at top of list
- Text input for category name (auto-focused)
- Inline error message display
- Save button
- Cancel button

**Handled Interactions:**
- Input change → Update local state, trigger validation on blur
- Click Save → Validate and trigger parent's `onSave(newName)` callback
- Click Cancel → Trigger parent's `onCancel()` callback, hide form
- Press Enter → Trigger save
- Press Escape → Trigger cancel
- Input blur → Validate and show errors

**Validation:**
- **Name is required:** Cannot be empty or only whitespace
- **Name length:** Must be 1-255 characters
- **Name uniqueness:** Must not match existing category names (case-insensitive)
- Display validation errors inline below input
- Disable Save button when validation fails

**Types:**
```typescript
interface CategoryCreateFormProps {
  onSave: (name: string) => Promise<void>;
  onCancel: () => void;
  existingNames: string[];
  isSaving?: boolean;
}

interface CategoryCreateFormState {
  name: string;
  errors: string[];
  isDirty: boolean;
}
```

**Props:**
- `onSave: (name: string) => Promise<void>` - Async callback to create category
- `onCancel: () => void` - Callback to cancel and hide form
- `existingNames: string[]` - List of existing category names for uniqueness check
- `isSaving?: boolean` - Loading state during save operation

**Implementation Notes:**
- Use `useRef` to auto-focus input on mount
- Use `useCategoryForm` custom hook for form state and validation
- Implement keyboard handlers for Enter (save) and Escape (cancel)
- Show loading spinner on Save button during API call
- Reset form state after successful save
- Prevent duplicate saves with disabled state during `isSaving`

---

### 4.6 DeleteConfirmationModal.tsx (Delete Confirmation Component)

**Description:**  
Modal dialog that appears when user attempts to delete a category. Displays category information, item count, and appropriate warning message. Prevents deletion if category has assigned items, showing error message instead.

**Main Elements:**
- Shadcn/ui Dialog/Modal component
- Dialog header with "Delete Category" title
- Warning icon
- Dynamic message based on item count:
  - If itemCount > 0: "Cannot delete [Category Name] because it contains X items"
  - If itemCount === 0: "Are you sure you want to delete [Category Name]?"
- Category name display
- Item count display (if > 0)
- Cancel button (always enabled)
- Confirm Delete button (disabled if itemCount > 0)

**Handled Interactions:**
- Click Cancel → Close modal, trigger `onCancel()` callback
- Click Confirm Delete (if enabled) → Trigger `onConfirm(categoryId)` callback
- Press Escape → Close modal
- Click overlay → Close modal

**Validation:**
- Check if category has items (itemCount > 0)
- Disable/hide Confirm Delete button if itemCount > 0
- Show appropriate warning message based on validation

**Types:**
```typescript
interface DeleteConfirmationModalProps {
  isOpen: boolean;
  category: CategoryListItemDTO | null;
  onConfirm: (categoryId: string) => Promise<void>;
  onCancel: () => void;
  isDeleting?: boolean;
}
```

**Props:**
- `isOpen: boolean` - Controls modal visibility
- `category: CategoryListItemDTO | null` - Category to be deleted
- `onConfirm: (categoryId: string) => Promise<void>` - Async callback to delete category
- `onCancel: () => void` - Callback to cancel and close modal
- `isDeleting?: boolean` - Loading state during delete operation

**Implementation Notes:**
- Use Shadcn/ui Dialog component
- Show loading spinner on Confirm button during API call
- Display item count in red/warning color if > 0
- Use destructive button variant for Confirm Delete
- Handle API errors by displaying toast and closing modal
- Close modal after successful deletion

---

### 4.7 EmptyState.tsx (No Categories Component)

**Description:**  
Friendly empty state displayed when no categories exist in the system. Encourages users to create their first category with a clear call-to-action.

**Main Elements:**
- Container with centered content
- Empty state icon or illustration
- Message text: "You haven't added any categories yet"
- "Add Your First Category" button (primary CTA)

**Handled Interactions:**
- Click "Add Your First Category" → Trigger parent's `onAddFirstCategory()` callback, show create form

**Validation:**
- None

**Types:**
```typescript
interface EmptyStateProps {
  onAddFirstCategory: () => void;
}
```

**Props:**
- `onAddFirstCategory: () => void` - Callback to show create form

**Implementation Notes:**
- Use Shadcn/ui Card or custom styled container
- Center content vertically and horizontally
- Use appropriate empty state icon from Lucide React
- Make button prominent with primary styling
- Ensure responsive design for mobile

## 5. Types

### 5.1 DTO Types (From Backend API)

These types are defined in `src/types.ts` and used for API communication:

**CategoryListItemDTO**
```typescript
interface CategoryListItemDTO {
  id: string;           // UUID from database
  name: string;         // Category name (1-255 chars)
  itemCount: number;    // Count of items assigned to this category
  createdAt: string;    // ISO 8601 timestamp
  updatedAt: string;    // ISO 8601 timestamp
}
```

**CategoryListResponseDTO**
```typescript
interface CategoryListResponseDTO {
  data: CategoryListItemDTO[];  // Array of categories
}
```

**CreateCategoryCommand**
```typescript
interface CreateCategoryCommand {
  name: string;  // Category name (required, 1-255 chars, trimmed)
}
```

**UpdateCategoryCommand**
```typescript
interface UpdateCategoryCommand {
  name: string;  // New category name (required, 1-255 chars, trimmed)
}
```

**DeleteResponseDTO**
```typescript
interface DeleteResponseDTO {
  message: string;  // Success message
  id: string;       // ID of deleted category
}
```

**ErrorResponseDTO**
```typescript
interface ErrorResponseDTO {
  error: {
    code: string;        // Error code (UNAUTHORIZED, VALIDATION_ERROR, CONFLICT, etc.)
    message: string;     // Human-readable error message
    details?: {          // Optional validation details
      field: string;
      message: string;
    }[];
  };
}
```

### 5.2 ViewModel Types (Frontend State Management)

These types are specific to the frontend and handle UI state:

**CategoryFormState**
```typescript
interface CategoryFormState {
  name: string;                      // Current input value
  isValid: boolean;                  // Overall form validity
  errors: string[];                  // Array of validation error messages
  isDirty: boolean;                  // Whether user has modified the input
}
```
*Purpose:* Manages form state for both create and edit operations. Tracks input value, validation status, error messages, and whether the form has been modified.

**CategoriesViewState**
```typescript
interface CategoriesViewState {
  categories: CategoryListItemDTO[]; // All categories (sorted alphabetically)
  isLoading: boolean;                // Global loading state for initial fetch
  error: string | null;              // Global error message
  createFormVisible: boolean;        // Whether create form is displayed
  editingCategoryId: string | null;  // ID of category being edited (null = none)
  deleteModalOpen: boolean;          // Whether delete modal is open
  deletingCategory: CategoryListItemDTO | null;  // Category pending deletion
}
```
*Purpose:* Central state for the CategoriesList component. Controls which UI mode is active and maintains the authoritative list of categories.

**DeleteModalState**
```typescript
interface DeleteModalState {
  isOpen: boolean;                   // Modal visibility
  category: CategoryListItemDTO | null;  // Category to delete (null when closed)
}
```
*Purpose:* Manages state for the delete confirmation modal, including which category is being targeted.

**CategoryOperation**
```typescript
type CategoryOperation = 'create' | 'update' | 'delete';

interface CategoryOperationState {
  operation: CategoryOperation;
  categoryId?: string;
  isInProgress: boolean;
  error: string | null;
}
```
*Purpose:* Tracks ongoing operations for loading states and error handling. Helps prevent duplicate requests and provides user feedback.

## 6. State Management

### 6.1 State Architecture

The Categories view uses **React hooks** for state management. State is organized hierarchically:

- **Page-level state** (CategoriesList component)
  - Categories array
  - UI mode (normal/create/edit/delete)
  - Global loading and error states
  
- **Component-level state** (CategoryCreateForm, CategoryEditRow)
  - Form input values
  - Validation errors
  - Local loading states

### 6.2 Custom Hook: useCategories

**Purpose:** Encapsulates all API operations for categories (fetch, create, update, delete) with loading and error handling.

**Location:** `src/hooks/useCategories.ts`

**Interface:**
```typescript
interface UseCategoriesReturn {
  categories: CategoryListItemDTO[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  createCategory: (command: CreateCategoryCommand) => Promise<CategoryListItemDTO>;
  updateCategory: (id: string, command: UpdateCategoryCommand) => Promise<CategoryListItemDTO>;
  deleteCategory: (id: string) => Promise<void>;
  refreshCategories: () => Promise<void>;
}

function useCategories(initialCategories?: CategoryListItemDTO[]): UseCategoriesReturn;
```

**Internal State:**
- `categories: CategoryListItemDTO[]` - Current list of categories
- `isLoading: boolean` - Whether any API operation is in progress
- `error: string | null` - Current error message (if any)

**Operations:**

1. **fetchCategories()**
   - Calls `GET /api/categories?sort=name&order=asc`
   - Updates categories state on success
   - Sets error state on failure
   - Sets isLoading during request

2. **createCategory(command: CreateCategoryCommand)**
   - Calls `POST /api/categories` with command payload
   - Returns created CategoryListItemDTO
   - Automatically refreshes categories list on success
   - Throws error on failure (caught by component)

3. **updateCategory(id: string, command: UpdateCategoryCommand)**
   - Calls `PATCH /api/categories/:id` with command payload
   - Returns updated CategoryListItemDTO
   - Automatically refreshes categories list on success
   - Throws error on failure (caught by component)

4. **deleteCategory(id: string)**
   - Calls `DELETE /api/categories/:id`
   - Automatically refreshes categories list on success
   - Throws error on failure (caught by component)

5. **refreshCategories()**
   - Alias for fetchCategories()
   - Used to manually refresh the list

**Error Handling:**
- Network errors: Sets error state with user-friendly message
- API errors: Throws error to be handled by component (for inline/modal display)
- Automatically clears error state before new operations

### 6.3 Custom Hook: useCategoryForm

**Purpose:** Manages form state and validation logic for create/edit forms, providing reusable form handling.

**Location:** `src/hooks/useCategoryForm.ts`

**Interface:**
```typescript
interface UseCategoryFormReturn {
  formState: CategoryFormState;
  setName: (name: string) => void;
  validate: () => boolean;
  reset: () => void;
  handleBlur: () => void;
}

function useCategoryForm(
  initialName: string = '',
  existingNames: string[] = []
): UseCategoryFormReturn;
```

**Internal State:**
- `formState: CategoryFormState` - Complete form state object

**Operations:**

1. **setName(name: string)**
   - Updates name in formState
   - Sets isDirty to true
   - Does NOT validate immediately (validation happens on blur or submit)

2. **validate()**
   - Runs all validation rules
   - Updates formState.errors array
   - Updates formState.isValid boolean
   - Returns boolean indicating validity
   
   Validation Rules:
   - Name cannot be empty or whitespace-only
   - Name must be 1-255 characters
   - Name must be unique (case-insensitive comparison with existingNames)

3. **handleBlur()**
   - Triggers validation if isDirty is true
   - Updates error state for real-time feedback

4. **reset()**
   - Clears all form state
   - Resets to initial values
   - Clears errors and isDirty flag

**Validation Messages:**
- Empty: "Category name is required"
- Too long: "Category name must be 255 characters or less"
- Duplicate: "A category with this name already exists"

### 6.4 State Flow Examples

**Creating a Category:**
1. User clicks "Add Category" → `setCreateFormVisible(true)`
2. User types name → `useCategoryForm.setName(value)`
3. User blurs input → `useCategoryForm.handleBlur()` validates
4. User clicks Save → Component validates, calls `useCategories.createCategory()`
5. API succeeds → `useCategories` refreshes list, component calls `setCreateFormVisible(false)`, shows success toast
6. API fails (409) → Component catches error, displays inline error message

**Editing a Category:**
1. User clicks Edit → `setEditingCategoryId(categoryId)`
2. CategoryEditRow mounts, auto-focuses input
3. User modifies name → `useCategoryForm.setName(value)`
4. User clicks Save → Component validates, calls `useCategories.updateCategory(id, command)`
5. API succeeds → `useCategories` refreshes list, component calls `setEditingCategoryId(null)`, shows success toast
6. API fails (409) → Component catches error, displays inline error message

**Deleting a Category:**
1. User clicks Delete → `setDeleteModalState({ isOpen: true, category })`
2. Modal displays, checks category.itemCount
3. If itemCount > 0 → Show blocking message, disable Confirm button
4. If itemCount === 0 → Enable Confirm button
5. User clicks Confirm → Component calls `useCategories.deleteCategory(id)`
6. API succeeds → `useCategories` refreshes list, component closes modal, shows success toast
7. API fails (409) → Component displays error toast, closes modal

## 7. API Integration

### 7.1 Base Configuration

**Base URL:** `/api/categories`

**Headers:**
- `Content-Type: application/json`
- Authentication handled automatically by Supabase client (session cookies)

**Error Handling Strategy:**
- Catch all errors in try-catch blocks
- Parse ErrorResponseDTO for structured errors
- Display user-friendly messages (never expose technical details)
- Log errors to console for debugging

### 7.2 API Endpoints Integration

#### 7.2.1 List Categories

**Endpoint:** `GET /api/categories?sort=name&order=asc`

**When to Call:**
- On component mount (if initialCategories not provided)
- After successful create/update/delete operations
- When user manually triggers refresh

**Request:**
```typescript
// No request body
// Query parameters:
const params = new URLSearchParams({
  sort: 'name',
  order: 'asc'
});

const response = await fetch(`/api/categories?${params}`, {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
});
```

**Response Types:**
- Success (200): `CategoryListResponseDTO`
- Error (401): `ErrorResponseDTO` with code "UNAUTHORIZED"
- Error (400): `ErrorResponseDTO` with code "VALIDATION_ERROR"
- Error (500): `ErrorResponseDTO` with code "INTERNAL_ERROR"

**Success Handler:**
```typescript
if (response.ok) {
  const data: CategoryListResponseDTO = await response.json();
  setCategories(data.data.sort((a, b) => a.name.localeCompare(b.name)));
}
```

**Error Handler:**
```typescript
if (!response.ok) {
  if (response.status === 401) {
    // Redirect to login
    window.location.href = '/login';
    return;
  }
  const error: ErrorResponseDTO = await response.json();
  setError(error.error.message);
}
```

---

#### 7.2.2 Create Category

**Endpoint:** `POST /api/categories`

**When to Call:**
- When user clicks Save in CategoryCreateForm
- After client-side validation passes

**Request:**
```typescript
const command: CreateCategoryCommand = {
  name: formState.name.trim()
};

const response = await fetch('/api/categories', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(command)
});
```

**Response Types:**
- Success (201): `CategoryListItemDTO`
- Error (401): `ErrorResponseDTO` with code "UNAUTHORIZED"
- Error (400): `ErrorResponseDTO` with code "VALIDATION_ERROR"
- Error (409): `ErrorResponseDTO` with code "CONFLICT"
- Error (500): `ErrorResponseDTO` with code "INTERNAL_ERROR"

**Success Handler:**
```typescript
if (response.status === 201) {
  const newCategory: CategoryListItemDTO = await response.json();
  await refreshCategories(); // Refresh entire list
  setCreateFormVisible(false);
  showToast('Category created successfully', 'success');
}
```

**Error Handler:**
```typescript
if (!response.ok) {
  const error: ErrorResponseDTO = await response.json();
  
  if (error.error.code === 'CONFLICT') {
    // Show inline error in form
    setFormErrors(['A category with this name already exists']);
  } else if (error.error.code === 'VALIDATION_ERROR') {
    // Extract validation errors
    const messages = error.error.details?.map(d => d.message) || [error.error.message];
    setFormErrors(messages);
  } else {
    // Show toast for other errors
    showToast(error.error.message, 'error');
  }
}
```

---

#### 7.2.3 Update Category

**Endpoint:** `PATCH /api/categories/:id`

**When to Call:**
- When user clicks Save in CategoryEditRow
- After client-side validation passes

**Request:**
```typescript
const command: UpdateCategoryCommand = {
  name: formState.name.trim()
};

const response = await fetch(`/api/categories/${categoryId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(command)
});
```

**Response Types:**
- Success (200): `CategoryListItemDTO`
- Error (401): `ErrorResponseDTO` with code "UNAUTHORIZED"
- Error (404): `ErrorResponseDTO` with code "NOT_FOUND"
- Error (400): `ErrorResponseDTO` with code "VALIDATION_ERROR"
- Error (409): `ErrorResponseDTO` with code "CONFLICT"
- Error (500): `ErrorResponseDTO` with code "INTERNAL_ERROR"

**Success Handler:**
```typescript
if (response.ok) {
  const updatedCategory: CategoryListItemDTO = await response.json();
  await refreshCategories(); // Refresh entire list
  setEditingCategoryId(null);
  showToast('Category updated successfully', 'success');
}
```

**Error Handler:**
```typescript
if (!response.ok) {
  const error: ErrorResponseDTO = await response.json();
  
  if (error.error.code === 'CONFLICT') {
    setFormErrors(['A category with this name already exists']);
  } else if (error.error.code === 'VALIDATION_ERROR') {
    const messages = error.error.details?.map(d => d.message) || [error.error.message];
    setFormErrors(messages);
  } else if (error.error.code === 'NOT_FOUND') {
    showToast('Category not found. It may have been deleted.', 'error');
    await refreshCategories();
    setEditingCategoryId(null);
  } else {
    showToast(error.error.message, 'error');
  }
}
```

---

#### 7.2.4 Delete Category

**Endpoint:** `DELETE /api/categories/:id`

**When to Call:**
- When user clicks Confirm in DeleteConfirmationModal
- Only if category.itemCount === 0 (checked client-side)

**Request:**
```typescript
const response = await fetch(`/api/categories/${categoryId}`, {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' }
});
```

**Response Types:**
- Success (200): `DeleteResponseDTO`
- Error (401): `ErrorResponseDTO` with code "UNAUTHORIZED"
- Error (404): `ErrorResponseDTO` with code "NOT_FOUND"
- Error (409): `ErrorResponseDTO` with code "CONFLICT" (category has items)
- Error (500): `ErrorResponseDTO` with code "INTERNAL_ERROR"

**Success Handler:**
```typescript
if (response.ok) {
  const result: DeleteResponseDTO = await response.json();
  await refreshCategories(); // Refresh entire list
  setDeleteModalOpen(false);
  setDeletingCategory(null);
  showToast('Category deleted successfully', 'success');
}
```

**Error Handler:**
```typescript
if (!response.ok) {
  const error: ErrorResponseDTO = await response.json();
  
  if (error.error.code === 'CONFLICT') {
    // This should be prevented by UI, but handle gracefully
    showToast(error.error.message, 'error'); // "Cannot delete [name] because it contains X items"
    setDeleteModalOpen(false);
  } else if (error.error.code === 'NOT_FOUND') {
    showToast('Category not found. It may have already been deleted.', 'error');
    await refreshCategories();
    setDeleteModalOpen(false);
  } else {
    showToast(error.error.message, 'error');
    setDeleteModalOpen(false);
  }
}
```

### 7.3 Loading States

**During API Calls:**
- Show loading spinner on Save/Delete buttons
- Disable buttons to prevent duplicate requests
- Maintain form values during loading
- Show global loading state for initial fetch

**Example:**
```typescript
const [isSaving, setIsSaving] = useState(false);

const handleSave = async () => {
  setIsSaving(true);
  try {
    await createCategory({ name });
  } catch (error) {
    // Handle error
  } finally {
    setIsSaving(false);
  }
};
```

### 7.4 Request Debouncing

**Not Required:** Validation happens on blur and submit, not on every keystroke, so debouncing is unnecessary for this view.

## 8. User Interactions

### 8.1 Adding a New Category

**Flow:**
1. User clicks "Add Category" button in page header
2. System hides "Add Category" button
3. System displays CategoryCreateForm at top of list
4. System auto-focuses the name input field
5. User types category name
6. (Optional) User clicks/tabs away from input → System validates on blur, shows errors if invalid
7. User clicks "Save" button
8. System validates form:
   - If invalid: Display inline error messages, keep form open
   - If valid: Proceed to step 9
9. System disables Save button, shows loading spinner
10. System sends POST request to `/api/categories`
11. **Success path:**
    - System refreshes category list
    - System hides create form
    - System shows "Add Category" button again
    - System displays success toast: "Category created successfully"
12. **Error path (duplicate name):**
    - System displays inline error: "A category with this name already exists"
    - System re-enables Save button
    - System keeps form open with current input value
13. **Error path (other errors):**
    - System displays error toast with message
    - System re-enables Save button
    - System keeps form open with current input value

**Keyboard Shortcuts:**
- **Enter** in name input: Trigger save action
- **Escape** in name input: Trigger cancel action

**Cancel Action:**
- User clicks "Cancel" button
- System clears form input
- System hides create form
- System shows "Add Category" button again

---

### 8.2 Editing a Category

**Flow:**
1. User clicks "Edit" icon/button on a CategoryRow
2. System replaces CategoryRow with CategoryEditRow for that category only
3. System auto-focuses the name input field
4. System pre-populates input with current category name
5. User modifies category name
6. (Optional) User clicks/tabs away from input → System validates on blur, shows errors if invalid
7. User clicks "Save" button
8. System validates form:
   - If invalid: Display inline error messages, keep edit mode active
   - If valid: Proceed to step 9
9. System disables Save button, shows loading spinner
10. System sends PATCH request to `/api/categories/:id`
11. **Success path:**
    - System refreshes category list
    - System exits edit mode, shows normal CategoryRow
    - System displays success toast: "Category updated successfully"
12. **Error path (duplicate name):**
    - System displays inline error: "A category with this name already exists"
    - System re-enables Save button
    - System keeps edit mode active with current input value
13. **Error path (category not found):**
    - System displays error toast: "Category not found. It may have been deleted."
    - System refreshes category list
    - System exits edit mode
14. **Error path (other errors):**
    - System displays error toast with message
    - System re-enables Save button
    - System keeps edit mode active with current input value

**Keyboard Shortcuts:**
- **Enter** in name input: Trigger save action
- **Escape** in name input: Trigger cancel action

**Cancel Action:**
- User clicks "Cancel" button
- System discards changes
- System exits edit mode
- System shows normal CategoryRow with original data

---

### 8.3 Deleting a Category

**Flow:**
1. User clicks "Delete" icon/button on a CategoryRow
2. System opens DeleteConfirmationModal
3. System displays category name in modal
4. System displays item count
5. **If category has items (itemCount > 0):**
   - System displays warning: "Cannot delete [Category Name] because it contains X items"
   - System disables "Confirm Delete" button (or shows only "Close" button)
   - User can only close modal
6. **If category is empty (itemCount === 0):**
   - System displays confirmation: "Are you sure you want to delete [Category Name]?"
   - System enables "Confirm Delete" button
   - User clicks "Confirm Delete"
   - System disables Confirm button, shows loading spinner
   - System sends DELETE request to `/api/categories/:id`
7. **Success path:**
   - System refreshes category list
   - System closes modal
   - System displays success toast: "Category deleted successfully"
8. **Error path (409 conflict - has items):**
   - System displays error toast: "Cannot delete [name] because it contains X items"
   - System closes modal
9. **Error path (404 not found):**
   - System displays error toast: "Category not found. It may have already been deleted."
   - System refreshes category list
   - System closes modal
10. **Error path (other errors):**
    - System displays error toast with message
    - System closes modal

**Cancel Action:**
- User clicks "Cancel" button or overlay or presses Escape
- System closes modal
- No changes made

---

### 8.4 Empty State Interaction

**Flow:**
1. System detects categories array is empty
2. System displays EmptyState component instead of category list
3. EmptyState shows message: "You haven't added any categories yet"
4. EmptyState shows "Add Your First Category" button
5. User clicks button
6. System shows CategoryCreateForm (same as "Add Category" action)

---

### 8.5 Real-time Validation Feedback

**Validation Triggers:**
- **On blur:** When user clicks/tabs away from name input
- **On submit:** When user clicks Save button

**Validation Display:**
- Show error messages inline below input field
- Use red text and/or red border for invalid inputs
- Show specific error message (not generic "Invalid")
- Clear errors when user starts typing again (on next blur, re-validate)

**Validation Rules:**
1. **Empty check:** Show "Category name is required" if empty/whitespace
2. **Length check:** Show "Category name must be 255 characters or less" if > 255
3. **Uniqueness check:** Show "A category with this name already exists" if duplicate (case-insensitive)

**Button State:**
- Disable Save button if validation fails
- Enable Save button only when form is valid and not saving

## 9. Conditions and Validation

### 9.1 Client-Side Validation Rules

#### 9.1.1 Name Field Validation

**Required Validation:**
- **Condition:** Name is empty, null, undefined, or contains only whitespace
- **Error Message:** "Category name is required"
- **Affected Components:** CategoryCreateForm, CategoryEditRow
- **Validation Timing:** On blur, on submit
- **Implementation:**
  ```typescript
  const isNameEmpty = !name || name.trim().length === 0;
  if (isNameEmpty) {
    errors.push("Category name is required");
  }
  ```

**Length Validation:**
- **Condition:** Name length (after trimming) is greater than 255 characters
- **Error Message:** "Category name must be 255 characters or less"
- **Affected Components:** CategoryCreateForm, CategoryEditRow
- **Validation Timing:** On blur, on submit
- **Implementation:**
  ```typescript
  const trimmedName = name.trim();
  if (trimmedName.length > 255) {
    errors.push("Category name must be 255 characters or less");
  }
  ```

**Uniqueness Validation:**
- **Condition:** Name (case-insensitive) matches an existing category name
- **Error Message:** "A category with this name already exists"
- **Affected Components:** CategoryCreateForm, CategoryEditRow
- **Validation Timing:** On blur, on submit
- **Implementation:**
  ```typescript
  const isDuplicate = existingNames.some(
    existingName => existingName.toLowerCase() === name.trim().toLowerCase()
  );
  if (isDuplicate) {
    errors.push("A category with this name already exists");
  }
  ```
- **Special Case for Edit:** When editing, exclude the current category name from uniqueness check:
  ```typescript
  const otherNames = existingNames.filter(n => n !== category.name);
  const isDuplicate = otherNames.some(
    existingName => existingName.toLowerCase() === name.trim().toLowerCase()
  );
  ```

### 9.2 UI Condition Rules

#### 9.2.1 Display Conditions

**Show Create Form:**
- **Condition:** `createFormVisible === true`
- **Affected Component:** CategoryCreateForm
- **Trigger:** User clicks "Add Category" button
- **Reset:** After successful save or cancel

**Hide "Add Category" Button:**
- **Condition:** `createFormVisible === true`
- **Affected Component:** Page header button
- **Purpose:** Prevent multiple create forms from opening

**Show Edit Row:**
- **Condition:** `editingCategoryId === category.id` for a specific category
- **Affected Component:** CategoryEditRow (replaces CategoryRow)
- **Trigger:** User clicks Edit button on CategoryRow
- **Reset:** After successful save, cancel, or error

**Show Delete Modal:**
- **Condition:** `deleteModalState.isOpen === true`
- **Affected Component:** DeleteConfirmationModal
- **Trigger:** User clicks Delete button on CategoryRow
- **Reset:** After successful delete, cancel, or error

**Show Empty State:**
- **Condition:** `categories.length === 0 && !isLoading`
- **Affected Component:** EmptyState (replaces category list)
- **Purpose:** Guide first-time users

**Show Category List:**
- **Condition:** `categories.length > 0`
- **Affected Component:** Category table/list container
- **Purpose:** Display categories when they exist

#### 9.2.2 Button State Conditions

**Disable Save Button (Create/Edit):**
- **Conditions:**
  - `!formState.isValid` (validation failed)
  - OR `isSaving === true` (save operation in progress)
- **Affected Components:** CategoryCreateForm, CategoryEditRow
- **Purpose:** Prevent invalid or duplicate submissions

**Disable Confirm Delete Button:**
- **Conditions:**
  - `category.itemCount > 0` (category has assigned items)
  - OR `isDeleting === true` (delete operation in progress)
- **Affected Component:** DeleteConfirmationModal
- **Purpose:** Prevent deletion of categories with items

**Show Loading Spinner:**
- **Condition:** `isSaving === true` OR `isDeleting === true`
- **Affected Components:** Save buttons, Delete button
- **Purpose:** Provide visual feedback during API operations

#### 9.2.3 Edit Mode Exclusivity

**Only One Category in Edit Mode:**
- **Condition:** Only one `editingCategoryId` can be set at a time
- **Implementation:** Setting a new `editingCategoryId` automatically closes any previously editing row
- **Purpose:** Simplify UI state management and prevent confusion

**Create Form and Edit Mode Mutual Exclusion:**
- **Condition:** If `createFormVisible === true`, cannot enter edit mode (and vice versa)
- **Implementation:** Opening create form clears `editingCategoryId`; entering edit mode sets `createFormVisible = false`
- **Purpose:** Keep UI focused and prevent conflicting states

### 9.3 Server-Side Validation (API Enforced)

These validations are enforced by the API and handled as errors in the frontend:

**Unique Name Constraint:**
- **API Response:** 409 Conflict
- **Message:** "A category with this name already exists"
- **Handling:** Display inline error in form, allow user to modify and retry

**Required Name:**
- **API Response:** 400 Bad Request
- **Message:** "Validation failed: Name is required"
- **Handling:** Display inline error in form (should be caught by client-side validation)

**Name Length:**
- **API Response:** 400 Bad Request
- **Message:** "Validation failed: Name must be 1-255 characters"
- **Handling:** Display inline error in form (should be caught by client-side validation)

**Category Has Items (Delete Prevention):**
- **API Response:** 409 Conflict
- **Message:** "Cannot delete [Category Name] because it contains X items"
- **Handling:** Display error in modal or toast (should be prevented by client-side check)

**Category Not Found:**
- **API Response:** 404 Not Found
- **Message:** "Category not found"
- **Handling:** Display error toast, refresh category list, exit edit mode

### 9.4 Data Integrity Conditions

**Alphabetical Sorting:**
- **Condition:** Always sort categories by name (case-insensitive) in ascending order
- **Timing:** After fetching, creating, or updating categories
- **Implementation:**
  ```typescript
  categories.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  ```

**Item Count Display:**
- **Condition:** Always show current itemCount from API response
- **Purpose:** Help users understand which categories can be deleted
- **Format:** "X items" (e.g., "25 items", "1 item", "0 items")

**Auto-Focus Management:**
- **Condition:** When create form or edit row appears, auto-focus the name input
- **Implementation:** Use `useRef` and `useEffect` to focus input on mount
- **Purpose:** Improve UX by allowing immediate typing

## 10. Error Handling

### 10.1 Network Errors

**Scenario:** User's network connection fails or API is unreachable

**Detection:**
- Fetch throws exception
- `error.name === 'TypeError'` and message contains "fetch" or "network"

**Handling:**
```typescript
try {
  const response = await fetch('/api/categories', ...);
} catch (error) {
  if (error instanceof TypeError) {
    showToast('Network error. Please check your connection and try again.', 'error');
    // Keep form data intact
    // Provide retry option (manual button click)
  }
}
```

**User Impact:**
- Error toast displays: "Network error. Please check your connection and try again."
- Form data is preserved
- User can retry by clicking Save again

---

### 10.2 Authentication Errors (401 Unauthorized)

**Scenario:** User's session has expired or they are not authenticated

**Detection:**
- API returns 401 status code
- ErrorResponseDTO with code "UNAUTHORIZED"

**Handling:**
```typescript
if (response.status === 401) {
  // Redirect to login page
  window.location.href = '/login';
  return;
}
```

**User Impact:**
- Automatic redirect to login page
- No error message shown (redirect is self-explanatory)

---

### 10.3 Validation Errors (400 Bad Request)

**Scenario:** Server-side validation fails (e.g., invalid input format)

**Detection:**
- API returns 400 status code
- ErrorResponseDTO with code "VALIDATION_ERROR"

**Handling:**
```typescript
if (response.status === 400) {
  const error: ErrorResponseDTO = await response.json();
  const errorMessages = error.error.details?.map(d => d.message) || [error.error.message];
  setFormErrors(errorMessages);
  // Display inline in form
}
```

**User Impact:**
- Inline error messages display below input field
- Form remains open with current values
- Save button re-enabled for retry
- User can modify input and attempt save again

**Example Messages:**
- "Name is required"
- "Name must be 1-255 characters"
- "Name cannot be only whitespace"

---

### 10.4 Conflict Errors (409 Conflict)

#### 10.4.1 Duplicate Category Name

**Scenario:** User attempts to create/update category with a name that already exists

**Detection:**
- API returns 409 status code for POST /api/categories or PATCH /api/categories/:id
- ErrorResponseDTO with code "CONFLICT"
- Message: "A category with this name already exists"

**Handling:**
```typescript
if (response.status === 409 && (method === 'POST' || method === 'PATCH')) {
  const error: ErrorResponseDTO = await response.json();
  setFormErrors([error.error.message]);
  // Display inline in form
}
```

**User Impact:**
- Inline error displays: "A category with this name already exists"
- Form remains open with current values
- Save button re-enabled for retry
- User can modify name and attempt save again

#### 10.4.2 Category Has Items (Delete)

**Scenario:** User attempts to delete category that has assigned items

**Detection:**
- API returns 409 status code for DELETE /api/categories/:id
- ErrorResponseDTO with code "CONFLICT"
- Message: "Cannot delete [Category Name] because it contains X items"

**Handling:**
```typescript
if (response.status === 409 && method === 'DELETE') {
  const error: ErrorResponseDTO = await response.json();
  showToast(error.error.message, 'error');
  setDeleteModalOpen(false);
}
```

**User Impact:**
- Error toast displays: "Cannot delete [Category Name] because it contains X items"
- Modal closes
- Category remains in list
- **Note:** This should be prevented by client-side check (disable button if itemCount > 0)

---

### 10.5 Not Found Errors (404 Not Found)

**Scenario:** User attempts to update/delete category that no longer exists (e.g., deleted by another process)

**Detection:**
- API returns 404 status code for GET /api/categories/:id, PATCH /api/categories/:id, or DELETE /api/categories/:id
- ErrorResponseDTO with code "NOT_FOUND"
- Message: "Category not found"

**Handling:**
```typescript
if (response.status === 404) {
  showToast('Category not found. It may have been deleted.', 'error');
  await refreshCategories(); // Refresh list to get current state
  setEditingCategoryId(null); // Exit edit mode
  setDeleteModalOpen(false); // Close modal
}
```

**User Impact:**
- Error toast displays: "Category not found. It may have been deleted."
- Category list refreshes to show current state
- Edit mode exits (if in edit mode)
- Delete modal closes (if open)

---

### 10.6 Server Errors (500 Internal Server Error)

**Scenario:** Unexpected error on server

**Detection:**
- API returns 500 status code
- ErrorResponseDTO with code "INTERNAL_ERROR"
- Message: "An unexpected error occurred"

**Handling:**
```typescript
if (response.status === 500) {
  const error: ErrorResponseDTO = await response.json();
  showToast(error.error.message || 'An unexpected error occurred. Please try again later.', 'error');
  console.error('Server error:', error);
}
```

**User Impact:**
- Error toast displays: "An unexpected error occurred. Please try again later."
- Form data preserved
- User can retry operation
- Error logged to console for debugging

---

### 10.7 Unexpected Errors

**Scenario:** Any error not covered by above cases (e.g., malformed response, parsing error)

**Detection:**
- Exception thrown during response parsing
- Unknown status code

**Handling:**
```typescript
try {
  const response = await fetch(...);
  if (!response.ok) {
    // Try to parse error
    const error: ErrorResponseDTO = await response.json();
    // Handle based on status code
  }
} catch (error) {
  console.error('Unexpected error:', error);
  showToast('Something went wrong. Please try again.', 'error');
  // Keep form data intact
}
```

**User Impact:**
- Generic error toast: "Something went wrong. Please try again."
- Form data preserved
- Error logged to console
- User can retry operation

---

### 10.8 Error Display Patterns

**Toast Notifications (Global Errors):**
- Network errors
- Server errors (500)
- Not Found errors (404)
- Unexpected errors
- Success messages
- Use Shadcn/ui Toast component
- Auto-dismiss after 5 seconds
- Position: top-right corner

**Inline Errors (Form Validation):**
- Required field errors
- Length validation errors
- Duplicate name errors (409 on create/update)
- Display below input field
- Red text color
- Show validation icon (X or warning)
- Persist until user modifies input or closes form

**Modal Errors (Contextual):**
- Delete prevention message (itemCount > 0)
- Display within DeleteConfirmationModal
- Red/warning text color
- Disable action button
- Keep modal open for user to acknowledge

---

### 10.9 Error Recovery Strategies

**Retry Strategy:**
- For network errors: User manually retries by clicking Save again
- For transient server errors: User manually retries
- No automatic retry logic (avoid overwhelming server)

**Data Preservation:**
- Always preserve form input values after errors
- Never clear form data on error
- Allow user to modify and retry

**State Consistency:**
- Refresh category list after 404 errors to ensure UI matches server state
- Exit edit mode if category no longer exists
- Close modals after errors (except validation errors in forms)

**User Feedback:**
- Always show user-friendly error messages
- Never display technical error details (stack traces, database errors)
- Provide actionable guidance ("check your connection", "try again later")

## 11. Implementation Steps

### Step 1: Set Up Project Structure

**Tasks:**
1. Create file `src/pages/categories.astro` for the page component
2. Create directory `src/components/categories/` for React components
3. Create directory `src/hooks/` if it doesn't exist
4. Create file `src/hooks/useCategories.ts` for API operations hook
5. Create file `src/hooks/useCategoryForm.ts` for form validation hook

**Files to Create:**
```
src/
├── pages/
│   └── categories.astro
├── components/
│   └── categories/
│       ├── CategoriesList.tsx
│       ├── CategoryRow.tsx
│       ├── CategoryEditRow.tsx
│       ├── CategoryCreateForm.tsx
│       ├── DeleteConfirmationModal.tsx
│       └── EmptyState.tsx
└── hooks/
    ├── useCategories.ts
    └── useCategoryForm.ts
```

---

### Step 2: Implement Custom Hooks

#### 2.1 Create useCategories Hook

**File:** `src/hooks/useCategories.ts`

**Implementation:**
1. Import necessary types: `CategoryListItemDTO`, `CreateCategoryCommand`, `UpdateCategoryCommand`, `CategoryListResponseDTO`, `ErrorResponseDTO`
2. Define hook interface: `UseCategoriesReturn`
3. Create state variables:
   - `categories: CategoryListItemDTO[]`
   - `isLoading: boolean`
   - `error: string | null`
4. Implement `fetchCategories()` function:
   - Fetch from `GET /api/categories?sort=name&order=asc`
   - Parse `CategoryListResponseDTO`
   - Update categories state
   - Handle errors
5. Implement `createCategory(command)` function:
   - POST to `/api/categories` with `CreateCategoryCommand`
   - Return created `CategoryListItemDTO`
   - Refresh categories list on success
   - Throw errors for component handling
6. Implement `updateCategory(id, command)` function:
   - PATCH to `/api/categories/:id` with `UpdateCategoryCommand`
   - Return updated `CategoryListItemDTO`
   - Refresh categories list on success
   - Throw errors for component handling
7. Implement `deleteCategory(id)` function:
   - DELETE to `/api/categories/:id`
   - Refresh categories list on success
   - Throw errors for component handling
8. Implement `refreshCategories()` as alias for `fetchCategories()`
9. Call `fetchCategories()` on mount if `initialCategories` not provided
10. Return all functions and state

**Key Considerations:**
- Handle authentication errors with redirect
- Parse error responses properly
- Ensure categories are always sorted alphabetically

#### 2.2 Create useCategoryForm Hook

**File:** `src/hooks/useCategoryForm.ts`

**Implementation:**
1. Import necessary types: `CategoryFormState`
2. Define hook interface: `UseCategoryFormReturn`
3. Create state variable: `formState: CategoryFormState`
4. Implement `setName(name)` function:
   - Update formState.name
   - Set isDirty to true
5. Implement `validate()` function:
   - Check if name is empty/whitespace → Add error
   - Check if name length > 255 → Add error
   - Check if name matches existing names (case-insensitive) → Add error
   - Update formState.isValid
   - Update formState.errors
   - Return isValid boolean
6. Implement `handleBlur()` function:
   - Call validate() if isDirty
7. Implement `reset()` function:
   - Clear all formState properties
   - Reset to initial values
8. Return formState and all functions

**Key Considerations:**
- Case-insensitive comparison for uniqueness
- Trim name before validation
- For edit mode, exclude current category name from uniqueness check

---

### Step 3: Implement Astro Page Component

**File:** `src/pages/categories.astro`

**Implementation:**
1. Import Layout component
2. Import CategoriesList React component
3. Check authentication (use Astro middleware or locals.supabase)
4. If not authenticated, redirect to login page
5. Fetch initial categories data:
   - Call `GET /api/categories?sort=name&order=asc`
   - Parse response as `CategoryListResponseDTO`
   - Handle errors gracefully
6. Render Layout with:
   - Page title: "Categories"
   - Meta tags for SEO
7. Render CategoriesList component with `client:load` directive
8. Pass initial categories as prop (if fetch succeeded)

**Example Structure:**
```astro
---
import Layout from '@/layouts/Layout.astro';
import CategoriesList from '@/components/categories/CategoriesList';

// Authentication check
const supabase = locals.supabase;
const { data: { user }, error: authError } = await supabase.auth.getUser();

if (authError || !user) {
  return Astro.redirect('/login');
}

// Fetch initial categories
let initialCategories = [];
try {
  const response = await fetch(`${Astro.url.origin}/api/categories?sort=name&order=asc`, {
    headers: {
      cookie: Astro.request.headers.get('cookie') || '',
    },
  });
  if (response.ok) {
    const data = await response.json();
    initialCategories = data.data;
  }
} catch (error) {
  console.error('Failed to fetch categories:', error);
}
---

<Layout title="Categories">
  <CategoriesList client:load initialCategories={initialCategories} />
</Layout>
```

---

### Step 4: Implement Main CategoriesList Component

**File:** `src/components/categories/CategoriesList.tsx`

**Implementation:**
1. Import all child components and hooks
2. Import Shadcn/ui components (Button, Toast)
3. Define props interface: `CategoriesListProps`
4. Initialize state:
   - `createFormVisible: false`
   - `editingCategoryId: null`
   - `deleteModalState: { isOpen: false, category: null }`
5. Use `useCategories` hook with `initialCategories` prop
6. Implement handler functions:
   - `handleAddClick()` → Set createFormVisible to true
   - `handleCreateSave(name)` → Call createCategory, handle errors, hide form on success
   - `handleCreateCancel()` → Set createFormVisible to false
   - `handleEditClick(id)` → Set editingCategoryId to id
   - `handleEditSave(id, name)` → Call updateCategory, handle errors, exit edit mode on success
   - `handleEditCancel()` → Set editingCategoryId to null
   - `handleDeleteClick(category)` → Open delete modal with category
   - `handleDeleteConfirm(id)` → Call deleteCategory, handle errors, close modal on success
   - `handleDeleteCancel()` → Close delete modal
7. Render structure:
   - Page header with title and "Add Category" button (conditional)
   - CategoryCreateForm (conditional based on createFormVisible)
   - Category list container:
     - If categories.length === 0: Render EmptyState
     - Else: Render table/list with CategoryRow or CategoryEditRow for each category
   - DeleteConfirmationModal (conditional based on deleteModalState.isOpen)
8. Add toast notification system for success/error messages

**Key Considerations:**
- Only one category can be in edit mode at a time
- Create form and edit mode are mutually exclusive
- Pass existingNames to create/edit components for uniqueness validation
- Sort categories alphabetically before rendering

---

### Step 5: Implement Child Components

#### 5.1 CategoryRow Component

**File:** `src/components/categories/CategoryRow.tsx`

**Implementation:**
1. Import types and Shadcn/ui components (Badge, Button)
2. Import icons from Lucide React (Edit, Trash2)
3. Define props interface: `CategoryRowProps`
4. Render table row or list item with:
   - Category name (left-aligned)
   - Item count badge (e.g., "25 items")
   - Edit button with icon and aria-label
   - Delete button with icon and aria-label
5. Add hover effect (background color change)
6. Ensure edit/delete buttons are at least 44x44px for mobile
7. Use alternating background colors for rows

#### 5.2 CategoryEditRow Component

**File:** `src/components/categories/CategoryEditRow.tsx`

**Implementation:**
1. Import types, hooks, and Shadcn/ui components (Input, Button)
2. Import icons from Lucide React (Check, X)
3. Define props interface: `CategoryEditRowProps`
4. Use `useCategoryForm` hook with initial category name
5. Use `useRef` to manage input focus
6. Use `useEffect` to auto-focus input on mount
7. Implement keyboard handlers (Enter → save, Escape → cancel)
8. Implement `handleSave()`:
   - Validate form
   - If valid, call onSave prop with categoryId and new name
   - Handle errors and display inline
9. Render table row or list item with:
   - Text input (auto-focused, pre-populated)
   - Inline error messages
   - Save button (disabled if invalid or saving)
   - Cancel button
10. Show loading spinner on Save button during save operation

#### 5.3 CategoryCreateForm Component

**File:** `src/components/categories/CategoryCreateForm.tsx`

**Implementation:**
1. Import types, hooks, and Shadcn/ui components (Input, Button, Card)
2. Define props interface: `CategoryCreateFormProps`
3. Use `useCategoryForm` hook with empty initial name
4. Use `useRef` to manage input focus
5. Use `useEffect` to auto-focus input on mount
6. Implement keyboard handlers (Enter → save, Escape → cancel)
7. Implement `handleSave()`:
   - Validate form
   - If valid, call onSave prop with new name
   - Handle errors and display inline
   - Reset form on success
8. Render container (positioned at top of list) with:
   - Text input (auto-focused, placeholder: "Enter category name")
   - Inline error messages
   - Save button (disabled if invalid or saving)
   - Cancel button
9. Show loading spinner on Save button during save operation

#### 5.4 DeleteConfirmationModal Component

**File:** `src/components/categories/DeleteConfirmationModal.tsx`

**Implementation:**
1. Import types and Shadcn/ui Dialog components
2. Import icons from Lucide React (AlertTriangle)
3. Define props interface: `DeleteConfirmationModalProps`
4. Determine if category can be deleted (itemCount === 0)
5. Render Shadcn/ui Dialog component with:
   - `open={isOpen}`
   - Dialog header: "Delete Category"
   - Dialog content:
     - Warning icon
     - Dynamic message:
       - If itemCount > 0: "Cannot delete [name] because it contains X items"
       - If itemCount === 0: "Are you sure you want to delete [name]?"
     - Category name display
     - Item count display (if > 0, highlighted in red)
   - Dialog footer:
     - Cancel button (always enabled)
     - Confirm Delete button (disabled if itemCount > 0 or isDeleting)
6. Implement `handleConfirm()`:
   - Call onConfirm prop with categoryId
   - Handle errors
7. Show loading spinner on Confirm button during delete operation

#### 5.5 EmptyState Component

**File:** `src/components/categories/EmptyState.tsx`

**Implementation:**
1. Import Shadcn/ui components (Card, Button)
2. Import icon from Lucide React (FolderOpen or similar)
3. Define props interface: `EmptyStateProps`
4. Render centered container with:
   - Empty state icon
   - Message: "You haven't added any categories yet"
   - "Add Your First Category" button (primary style)
5. Handle button click → Call onAddFirstCategory prop
6. Ensure responsive design for mobile

---

### Step 6: Add Styling and Accessibility

**Tasks:**
1. Use Tailwind classes for all styling
2. Ensure responsive design:
   - Mobile: Stack elements vertically, full-width buttons
   - Desktop: Table layout with inline actions
3. Add proper ARIA labels:
   - Edit button: `aria-label="Edit [category name]"`
   - Delete button: `aria-label="Delete [category name]"`
4. Use semantic HTML:
   - `<table>` for category list (or semantic `<ul>` with proper roles)
   - `<form>` for create/edit inputs
5. Ensure color contrast meets WCAG AA standards
6. Add focus states for keyboard navigation
7. Implement focus trapping in modal
8. Use `aria-live` regions for error announcements

---

### Step 7: Test Error Handling

**Test Scenarios:**
1. **Network Error:**
   - Disable network in browser dev tools
   - Attempt to create category
   - Verify error toast appears
   - Verify form data is preserved
2. **Duplicate Name:**
   - Create category with existing name
   - Verify inline error appears
   - Verify form stays open
3. **Delete with Items:**
   - Attempt to delete category with itemCount > 0
   - Verify delete button is disabled
   - Verify warning message displays
4. **Category Not Found:**
   - Simulate 404 by deleting category in database
   - Attempt to edit/delete
   - Verify error toast and list refresh
5. **Session Expired:**
   - Invalidate session
   - Attempt any operation
   - Verify redirect to login

---

### Step 8: Test User Interactions

**Test Scenarios:**
1. **Create Flow:**
   - Click "Add Category"
   - Verify form appears and input is focused
   - Type name and press Enter
   - Verify success and list updates
2. **Edit Flow:**
   - Click Edit on a category
   - Verify row transforms to edit mode
   - Modify name and press Enter
   - Verify success and row returns to normal
3. **Delete Flow:**
   - Click Delete on category with no items
   - Verify modal opens
   - Click Confirm
   - Verify success and category is removed
4. **Cancel Actions:**
   - Press Escape in create form → Verify form closes
   - Press Escape in edit row → Verify edit mode exits
   - Click Cancel in modal → Verify modal closes
5. **Validation:**
   - Enter empty name → Verify error on blur
   - Enter duplicate name → Verify error on save attempt
   - Enter 256+ character name → Verify error

---

### Step 9: Test Responsive Design

**Test Scenarios:**
1. Test on mobile viewport (375px width):
   - Verify layout adapts
   - Verify buttons are touch-friendly (44x44px)
   - Verify text is readable
2. Test on tablet viewport (768px width):
   - Verify layout is usable
3. Test on desktop viewport (1200px+ width):
   - Verify optimal layout
4. Test with browser zoom at 200%:
   - Verify readability and usability

---

### Step 10: Optimize and Refine

**Tasks:**
1. Review performance:
   - Ensure no unnecessary re-renders
   - Use React.memo where appropriate
   - Minimize API calls
2. Add loading states:
   - Global loading on initial fetch
   - Button spinners during save/delete
3. Review accessibility:
   - Test with screen reader
   - Test keyboard-only navigation
   - Verify all interactive elements are reachable
4. Add analytics/logging (optional):
   - Log category creation/update/delete events
   - Track error rates
5. Code review and refactoring:
   - Remove duplicate code
   - Ensure consistent naming
   - Add comments for complex logic
6. Update documentation:
   - Add JSDoc comments to functions
   - Document component props
   - Update README if needed

---

### Step 11: Integration Testing

**Tasks:**
1. Test with real Supabase backend:
   - Verify authentication flow
   - Verify all API endpoints work correctly
2. Test cross-browser compatibility:
   - Chrome
   - Firefox
   - Safari (desktop and iOS)
   - Edge
3. Test with slow network:
   - Throttle network in dev tools
   - Verify loading states appear
   - Verify timeouts are handled
4. Test concurrent operations:
   - Open in two browser tabs
   - Delete category in one tab
   - Attempt to edit same category in other tab
   - Verify 404 error is handled gracefully

---

### Step 12: Final Review and Deployment

**Tasks:**
1. Review all error messages for clarity
2. Verify all success messages are friendly
3. Test complete user journey end-to-end
4. Verify no console errors or warnings
5. Run linter and fix any issues
6. Commit code with descriptive commit message
7. Deploy to staging environment
8. Conduct UAT (User Acceptance Testing)
9. Fix any issues found in UAT
10. Deploy to production

---

## Summary

This implementation plan provides a comprehensive guide for building the Categories List/Management Page. Follow each step sequentially, ensuring proper testing at each stage. The modular component structure allows for parallel development of different components, while the custom hooks provide reusable logic that can be tested independently.

**Key Success Factors:**
- Proper error handling at every level
- Consistent validation (client and server)
- Accessibility built in from the start
- Responsive design for all screen sizes
- Clear user feedback for all actions
- Maintainable, well-documented code
