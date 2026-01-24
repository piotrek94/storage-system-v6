# UI Architecture for Home Storage System

## 1. UI Structure Overview

The Home Storage System is a mobile-responsive web application built with Astro 5 for static page rendering and React 19 for interactive components. The architecture follows a mobile-first progressive enhancement approach, utilizing TypeScript 5 for type safety, Tailwind 4 for styling, and Shadcn/ui for UI components.

### Core Architectural Principles

- **Rendering Strategy**: Server-side rendering with Astro for static content, React components for interactive features
- **State Management**: React state for component interactions, localStorage for user preferences, URL parameters for shareable filters
- **Routing**: File-based routing via Astro pages with dedicated routes for list views, detail views, and forms
- **Authentication**: Supabase Auth with JWT tokens, validated via Astro middleware on all protected routes
- **API Integration**: RESTful API endpoints consumed from both server-side (Astro) and client-side (React) components

### Responsive Design Strategy

The application implements three breakpoints:
- **Mobile** (< 768px): Single column layouts, bottom navigation, collapsible filters, touch-optimized interactions
- **Tablet** (768px - 1024px): Adaptive 2-column grids, emerging top navigation, side-by-side form fields
- **Desktop** (> 1024px): Multi-column grids (3-4 columns), persistent filters, hover states, drag-and-drop optimizations

### Navigation Structure

**Desktop Navigation:**
- Top horizontal bar with logo, main navigation (Dashboard, Items, Containers, Categories), user menu
- Collapses to hamburger menu on mobile

**Mobile Navigation:**
- Bottom tab bar with 4 primary sections: Dashboard, Items, Containers, Categories (icons + labels)
- Hamburger menu in header for secondary actions (profile, logout)

## 2. View List

### 2.1 Authentication Views

#### Login Page

**View Path:** `/login`

**Main Purpose:** Allow registered users to authenticate and access their storage data

**Key Information to Display:**
- Login form with email and password fields
- "Forgot Password?" link
- "Create Account" link to registration page
- Supabase authentication error messages

**Key View Components:**
- Login form (email input, password input)
- Submit button with loading state
- Link to password reset flow
- Link to registration page
- Error message display area

**UX Considerations:**
- Auto-focus email field on page load
- Enter key submits form
- Clear error messages for invalid credentials
- Loading spinner on submit button during authentication
- Remember me functionality via Supabase session persistence

**Accessibility Considerations:**
- Proper form labels associated with inputs
- Focus management for error states
- Keyboard navigation support

**Security Considerations:**
- Password field masked by default
- HTTPS enforcement for credential transmission
- Rate limiting on authentication attempts (future consideration)
- No credential storage in browser except secure session tokens

---

#### Registration Page

**View Path:** `/register`

**Main Purpose:** Enable new users to create an account

**Key Information to Display:**
- Registration form with email and password fields
- Password requirements (minimum 8 characters)
- Terms of service (if applicable)
- Success confirmation and redirect to dashboard

**Key View Components:**
- Registration form (email, password, confirm password)
- Password strength indicator
- Submit button with loading state
- "Already have an account?" link to login page
- Error message display area

**UX Considerations:**
- Real-time password validation (minimum length, match confirmation)
- Inline error messages for validation failures
- Clear success message on registration
- Automatic redirect to dashboard on success

**Accessibility Considerations:**
- Form labels for all inputs
- Error announcements for screen readers
- Keyboard navigation

**Security Considerations:**
- Client-side password validation (minimum 8 characters)
- Server-side validation via Supabase Auth
- Email format validation
- Password confirmation matching

---

#### Password Reset Page

**View Path:** `/reset-password`

**Main Purpose:** Allow users who forgot their password to reset it

**Key Information to Display:**
- Email input for reset link request
- Success message confirming email sent
- Link expiration information (24 hours)
- New password form (when accessed via reset link)

**Key View Components:**
- Email request form
- Success confirmation message
- New password form (on reset link page)
- Submit buttons with loading states
- Link back to login page

**UX Considerations:**
- Clear instructions on each step
- Success message even if email not found (security best practice)
- Password requirements displayed
- Automatic redirect to login after successful reset

**Accessibility Considerations:**
- Clear form labels
- Focus management between form steps
- Keyboard navigation

**Security Considerations:**
- Token-based reset link with 24-hour expiration
- Secure token validation via Supabase Auth
- No indication whether email exists in system

---

### 2.2 Dashboard View

#### Dashboard Page

**View Path:** `/` (default landing page after login)

**Main Purpose:** Provide overview of storage system and quick access to main functions

**Key Information to Display:**
- Summary statistics: Total Items, Total Containers, Total Categories, Items Out
- Recent Items section (5 most recently created items)
- Quick action buttons for creating new items, containers, and categories
- Badge on navigation showing count of items currently out (when > 0)

**Key View Components:**
- **Summary Statistics Cards** (4 cards in grid layout):
  - Total Items card (clickable, navigates to items list)
  - Total Containers card (clickable, navigates to containers list)
  - Total Categories card (clickable, navigates to categories list)
  - Items Out card (clickable, navigates to filtered items list showing only out items)
  - Each card displays icon, number, and label
  
- **Recent Items Section**:
  - Heading: "Recently Added Items"
  - 5 item cards showing thumbnail, name, category badge, container badge
  - Each card clickable to navigate to item detail
  - Empty state if no items exist
  
- **Quick Action Buttons**:
  - "Add New Item" button (primary action)
  - "Add Container" button
  - "Add Category" button

**UX Considerations:**
- Statistics cards are interactive (cursor pointer on hover, click navigates)
- Recent items provide quick access to recent additions
- Empty state prominently displays "Get Started" messaging with action buttons
- Quick actions always visible and accessible
- Loading skeletons while fetching dashboard data
- Responsive grid layout (1 column mobile, 2x2 tablet/desktop)

**Accessibility Considerations:**
- Semantic HTML structure (main, section, article)
- Proper heading hierarchy (h1 for page title, h2 for sections)
- Cards are keyboard accessible (focusable, Enter activates)
- Clear labels on all interactive elements

**Security Considerations:**
- Dashboard data scoped to authenticated user only
- Statistics fetched server-side with user context
- Recent items respect Row-Level Security

**API Integration:**
- GET `/api/dashboard/stats` on page load
- Response includes all statistics and recent items array
- Display loading state while fetching
- Error handling for network failures

---

### 2.3 Items Views

#### Items List Page

**View Path:** `/items`

**Main Purpose:** Display all items with search and filtering capabilities

**Key Information to Display:**
- Filterable and searchable list of all user's items
- Each item shows: thumbnail, name, category badge, container badge, in/out status icon
- Filter controls: search input, category dropdown, container dropdown, status toggle
- View mode toggle (grid/list)
- Pagination controls
- Item count and applied filters summary

**Key View Components:**
- **Filter Bar** (persistent on desktop, collapsible on mobile):
  - Search input (debounced 300ms)
  - Category multi-select dropdown (searchable combobox with item counts)
  - Container multi-select dropdown (searchable combobox with item counts)
  - Status filter (toggle: All/In/Out)
  - Clear Filters button
  - Active filter chips/badges showing current selections
  
- **View Controls**:
  - Grid/List view toggle button (saves preference to localStorage)
  - Sort dropdown (Name, Created Date, Updated Date)
  - Sort order toggle (Ascending/Descending)
  
- **Items Grid/List**:
  - **Grid Mode**: Cards with large thumbnails (fixed aspect ratio 1:1 or 16:9), item name, category badge, container badge, in/out icon
  - **List Mode**: Rows with small thumbnail, name, category, container, status icon, created date
  - Each item clickable to navigate to detail view
  - Responsive columns (1 mobile, 2 tablet, 3-4 desktop in grid mode)
  
- **Pagination**:
  - Page number indicator
  - Previous/Next buttons
  - Optional: Jump to page input
  
- **Empty State**:
  - Illustration/icon
  - Message: "No items found" or "You haven't added any items yet"
  - "Create Your First Item" button
  - Link to create containers/categories if those don't exist

**UX Considerations:**
- Filters persist in localStorage and URL query parameters
- Search debounced at 300ms to reduce API calls
- Loading skeletons match grid/list layout during filtering
- View mode preference persists in localStorage
- Filter state syncs between URL and localStorage for shareability
- Clear visual feedback for active filters
- Smooth transitions between grid and list modes
- "No results" message when filters yield empty results
- Result count displayed: "Showing X items" or "X results for [search term]"

**Accessibility Considerations:**
- Filter controls keyboard accessible
- Focus management when toggling mobile filter panel
- Semantic list markup (ul/li or table for list view)
- Alt text for item thumbnails (item name)
- Clear focus indicators on cards/rows

**Security Considerations:**
- Items list scoped to authenticated user via RLS
- Filter parameters validated server-side
- No exposure of other users' data

**API Integration:**
- GET `/api/items?page=1&limit=20&search=tent&category=uuid1,uuid2&status=in&sort=created_at&order=desc`
- Query parameters constructed from filter state
- Debounced search input (300ms)
- Update URL on filter changes
- Display loading skeletons during fetch
- Error handling for network failures

---

#### Item Detail Page

**View Path:** `/items/[id]`

**Main Purpose:** Display complete information for a single item with options to edit or delete

**Key Information to Display:**
- All item images in gallery format (up to 5)
- Item name (large heading)
- Category (displayed as badge, clickable to filter by category)
- Container (displayed as badge, clickable to filter by container)
- In/Out status with visual indicator
- Description (full text)
- Quantity
- Created timestamp
- Last updated timestamp
- Edit and Delete action buttons

**Key View Components:**
- **Image Gallery**:
  - All images displayed in gallery format
  - Primary image large with thumbnails below (or carousel)
  - Click image to open lightbox/modal for full-size view
  - Image counter (e.g., "2 of 5")
  - Swipe navigation on mobile, arrow buttons on desktop
  - Keyboard navigation in lightbox (arrow keys, Escape to close)
  
- **Item Details Section**:
  - Item name as h1
  - Category badge (clickable chip)
  - Container badge (clickable chip)
  - Status indicator (icon + text: "In Storage" or "Out")
  - Description paragraph (if provided)
  - Quantity display (if provided): "Quantity: 2"
  - Metadata: "Added on Jan 20, 2026" and "Last updated Jan 22, 2026"
  
- **Action Buttons**:
  - Edit button (navigates to edit page)
  - Delete button (opens confirmation modal)

**UX Considerations:**
- Clicking category/container badge navigates to items list with that filter applied
- Image lightbox provides immersive viewing experience
- Delete confirmation modal prevents accidental deletion
- Breadcrumb navigation: "Items > [Item Name]"
- Loading state while fetching item data
- 404 page if item not found or doesn't belong to user
- Back button or link to return to items list

**Accessibility Considerations:**
- Semantic heading hierarchy
- Alt text for all images
- Focus trap in lightbox modal
- Keyboard navigation for image gallery
- Focus return to trigger element when closing lightbox
- Touch targets sized appropriately on mobile

**Security Considerations:**
- Item detail fetched with user authentication
- RLS ensures users can only view their own items
- Delete action requires confirmation

**API Integration:**
- GET `/api/items/:id` on page load
- Display loading skeleton while fetching
- 404 error handling if item not found
- DELETE `/api/items/:id` when user confirms deletion
- Success: redirect to items list with confirmation toast
- Error: display error message, stay on page

---

#### Item Create/Edit Page

**View Path:** `/items/new` (create) or `/items/[id]/edit` (edit)

**Main Purpose:** Create new items or edit existing items with comprehensive form and image management

**Key Information to Display:**
- Form title: "Add New Item" or "Edit Item"
- All item fields with validation feedback
- Image upload/management area
- Save and Cancel buttons
- Unsaved changes warning when navigating away

**Key View Components:**
- **Item Form**:
  - **Name Input** (text, required):
    - Label: "Item Name"
    - Placeholder: "e.g., Camping Tent"
    - Character limit: 255
    - Inline validation on blur
    
  - **Category Selector** (searchable dropdown, required):
    - Label: "Category"
    - Combobox with search/filter capability
    - Displays categories with item counts: "Outdoor Gear (25)"
    - "No categories found" state
    - Link to create category if list is empty
    
  - **Container Selector** (searchable dropdown, required):
    - Label: "Container"
    - Combobox with search/filter capability
    - Displays containers with item counts: "Garage Box A (15)"
    - "No containers found" state
    - Link to create container if list is empty
    
  - **Status Toggle** (toggle switch, required, defaults to "In"):
    - Label: "Status"
    - Toggle options: "In Storage" / "Out"
    - Clear visual differentiation
    
  - **Description Textarea** (optional):
    - Label: "Description"
    - Placeholder: "Add notes or details about this item..."
    - Character limit: 10,000
    - Character count displayed
    
  - **Quantity Input** (number, optional):
    - Label: "Quantity"
    - Type: number
    - Min: 1
    - Placeholder: "1"
    
- **Image Management Section**:
  - **Upload Zone** (if < 5 images):
    - Drag-and-drop area (desktop)
    - "Click to browse" button
    - Accepted formats displayed: "JPEG, PNG, WebP (max 5MB each)"
    - Visual feedback during drag (border highlight)
    - Multiple file selection (up to 5 total)
    - Individual progress bars for each uploading image
    
  - **Image Gallery Editor**:
    - Thumbnails of uploaded images
    - Drag-to-reorder functionality (desktop mouse, mobile touch)
    - Delete button on each image (confirmation prompt)
    - Display order indicators (1, 2, 3, 4, 5)
    - "Thumbnail" label on first image
    - Maximum 5 images enforced
    
- **Form Actions**:
  - Save button (primary, enabled always, shows validation on click)
  - Cancel button (secondary, warns if unsaved changes)
  - Loading spinner on Save button during submission

- **Validation Feedback**:
  - Inline error messages next to invalid fields (real-time on blur)
  - Summary error banner at top if submit attempted with errors
  - Field-level error icons
  - Focus on first invalid field after failed submit

**UX Considerations:**
- Form pre-populates with existing data in edit mode
- Real-time inline validation as users interact
- Required fields marked with asterisks
- Unsaved changes warning when navigating away (browser confirm dialog)
- Submit button remains enabled but shows errors on click
- Optimistic UI for image reordering (instant visual feedback)
- Wait for server confirmation on image uploads (progress bars)
- Successful save redirects to item detail view with success toast
- Error handling preserves form data (no data loss)
- Mobile: native file picker integrates with camera/photo library
- Desktop: drag-and-drop visual feedback (border color change, overlay)

**Accessibility Considerations:**
- All form fields have associated labels
- Error messages announced to screen readers
- Focus management for validation errors
- Keyboard navigation through form fields
- Touch targets sized for mobile (44x44px minimum)
- Drag-drop has keyboard alternative (future consideration: reorder buttons)

**Security Considerations:**
- Client-side validation (UX)
- Server-side validation (security boundary)
- Image format and size validation both client and server
- File sanitization and storage in user-scoped paths
- Category/container validation: must exist and belong to user
- Generated UUIDs for image filenames (not user-provided names)

**API Integration:**
- **Create Flow**:
  1. GET `/api/categories` and `/api/containers` to populate dropdowns
  2. User fills form and uploads images
  3. POST `/api/items` with item data (name, categoryId, containerId, isIn, description, quantity)
  4. Receive item ID in response
  5. POST `/api/items/:id/images` for each image (parallel uploads with progress)
  6. On success: redirect to `/items/:id` with success message
  7. On error: display error, preserve form data, offer retry
  
- **Edit Flow**:
  1. GET `/api/items/:id` to fetch existing data
  2. Pre-populate form fields
  3. Display existing images with delete/reorder controls
  4. User modifies fields or images
  5. PATCH `/api/items/:id` with updated data
  6. POST `/api/items/:id/images` for new images
  7. DELETE `/api/items/:itemId/images/:imageId` for removed images
  8. PATCH `/api/items/:itemId/images/:imageId` for reordered images
  9. On success: redirect to detail view
  10. On error: display error, preserve changes

---

### 2.4 Containers Views

#### Containers List Page

**View Path:** `/containers`

**Main Purpose:** Display all containers with their item counts and thumbnails

**Key Information to Display:**
- All user's containers in grid or list format
- Each container shows: thumbnail (if available), name, item count
- View mode toggle (grid/list)
- Sort options (name, created date)
- Empty state if no containers exist

**Key View Components:**
- **View Controls**:
  - Grid/List view toggle (saves preference to localStorage)
  - Sort dropdown (Name, Created Date)
  - Sort order toggle
  - "Add Container" button (primary action)
  
- **Containers Grid/List**:
  - **Grid Mode**: Cards with container thumbnail, name, item count badge
  - **List Mode**: Rows with thumbnail, name, description preview, item count
  - Each container clickable to navigate to detail page
  - Responsive columns (1 mobile, 2 tablet, 3-4 desktop)
  
- **Empty State**:
  - Icon/illustration
  - Message: "You haven't added any containers yet"
  - "Add Your First Container" button
  - Brief explanation of containers

**UX Considerations:**
- View mode preference persists in localStorage
- Loading skeletons while fetching
- Item count displayed as badge: "15 items"
- Empty containers shown with "0 items" badge
- Hover states on desktop
- Touch-friendly cards on mobile

**Accessibility Considerations:**
- Semantic list/grid markup
- Alt text for container thumbnails
- Clear focus indicators
- Keyboard navigation

**Security Considerations:**
- Containers scoped to authenticated user via RLS
- No exposure of other users' containers

**API Integration:**
- GET `/api/containers?page=1&limit=20&sort=created_at&order=desc`
- Display loading skeletons during fetch
- Pagination if needed (future consideration)
- Error handling for network failures

---

#### Container Detail/Edit Page

**View Path:** `/containers/[id]`

**Main Purpose:** View and edit container information, manage images, view items in container

**Key Information to Display:**
- Container images (up to 5) in gallery format
- Container name
- Description
- Item count
- List of items assigned to this container (clickable)
- Edit and Delete buttons
- Inline edit mode toggle

**Key View Components:**
- **View Mode**:
  - **Image Gallery**: All container images, clickable to open lightbox
  - **Container Info**:
    - Container name as h1
    - Description paragraph
    - Item count: "Contains 15 items"
  - **Items List**:
    - Heading: "Items in this container"
    - List of item cards (thumbnail, name, category)
    - Each item clickable to navigate to item detail
    - Empty state if no items: "No items in this container yet"
  - **Action Buttons**:
    - Edit button (toggles to edit mode)
    - Delete button (opens confirmation modal)
  
- **Edit Mode** (inline toggle):
  - **Name Input** (text, required)
  - **Description Textarea** (optional, max 10,000 chars)
  - **Image Management**:
    - Upload zone (if < 5 images)
    - Existing images with reorder/delete controls
    - Same functionality as item image management
  - **Form Actions**:
    - Save button
    - Cancel button (reverts to view mode)

**UX Considerations:**
- Inline edit mode (same page) for simpler container forms
- Click "Edit" button to enable form fields
- Click "Save" to submit changes and return to view mode
- Click "Cancel" to discard changes and return to view mode
- Delete confirmation modal with item count warning
- If container has items: error message "Cannot delete [name] because it contains X items"
- Loading state on Save button during submission
- Image lightbox for full-size viewing
- Items list provides quick navigation to items

**Accessibility Considerations:**
- Focus management when toggling edit mode
- Form labels in edit mode
- Keyboard navigation for image gallery
- Semantic HTML structure

**Security Considerations:**
- Container data scoped to authenticated user
- Deletion blocked if items exist (server-side enforcement)
- Image uploads validated and stored in user-scoped paths

**API Integration:**
- GET `/api/containers/:id` on page load
- Display loading skeleton while fetching
- PATCH `/api/containers/:id` on save (name, description)
- POST `/api/containers/:id/images` for new images
- DELETE `/api/containers/:containerId/images/:imageId` for removed images
- DELETE `/api/containers/:id` for deletion (fails with 409 if has items)
- Error handling: display messages in edit mode, stay on page

---

### 2.5 Categories Views

#### Categories List/Management Page

**View Path:** `/categories`

**Main Purpose:** View, create, edit, and delete categories in a simple list interface

**Key Information to Display:**
- Alphabetically sorted list of all categories
- Each category shows: name, item count
- Inline create form
- Inline edit capability
- Delete buttons with confirmation
- Empty state if no categories exist

**Key View Components:**
- **Page Header**:
  - Page title: "Categories"
  - "Add Category" button (toggles inline create form)
  
- **Category List**:
  - Simple list (not cards) in alphabetical order
  - Each row displays:
    - Category name (left-aligned)
    - Item count badge (e.g., "25 items")
    - Edit icon/button
    - Delete icon/button
  - Alternating row backgrounds for readability
  
- **Inline Create Form** (appears at top when "Add Category" clicked):
  - **Name Input** (text, required, auto-focused)
  - **Save** button
  - **Cancel** button
  - Inline validation: required, unique, max 255 chars
  - Error message display below input
  
- **Inline Edit** (row transforms to edit mode on click):
  - Name input field replaces name text
  - Save and Cancel buttons replace edit/delete buttons
  - Real-time validation
  - Error messages inline
  
- **Delete Confirmation Modal**:
  - Warning message
  - Category name
  - Item count if > 0 (blocks deletion): "Cannot delete [name] because it contains X items"
  - If empty: "Are you sure you want to delete [name]?"
  - Cancel and Confirm Delete buttons
  
- **Empty State**:
  - Message: "You haven't added any categories yet"
  - "Add Your First Category" button

**UX Considerations:**
- Simple, lightweight interface for quick category management
- Inline editing avoids navigation to separate pages
- Alphabetical sorting makes categories easy to find
- Item count provides context for deletion decisions
- Clear error messages for unique name validation
- Deletion blocked with helpful error when category has items
- Auto-focus on name input when creating/editing
- Instant validation feedback on blur
- Success messages on create/edit/delete (toast or banner)

**Accessibility Considerations:**
- Semantic table or list markup
- Focus management when toggling inline forms
- Keyboard navigation (Enter to save, Escape to cancel)
- Clear labels for edit/delete buttons (text or aria-label)
- Error announcements for screen readers

**Security Considerations:**
- Categories scoped to authenticated user
- Uniqueness validation (case-insensitive) both client and server
- Deletion blocked if items exist (server-side enforcement)

**API Integration:**
- GET `/api/categories?sort=name&order=asc` on page load
- POST `/api/categories` to create (name)
- PATCH `/api/categories/:id` to update (name)
- DELETE `/api/categories/:id` to delete (fails with 409 if has items)
- Error handling: display inline errors, preserve form data
- Optimistic update for simple edits (revert on error)

---

### 2.6 Profile/Settings View (Minimal)

#### Profile Page

**View Path:** `/profile`

**Main Purpose:** Display user profile information and provide logout option

**Key Information to Display:**
- User email (from Supabase Auth)
- Account creation date
- Logout button
- Link to password change (Supabase Auth flow)

**Key View Components:**
- User email display
- "Change Password" button (triggers Supabase password reset email)
- "Logout" button
- Future: user preferences (theme, default view mode, etc.)

**UX Considerations:**
- Minimal MVP version (Phase 1)
- Clear logout action
- Password change uses Supabase Auth flow (email with reset link)

**Accessibility Considerations:**
- Clear button labels
- Keyboard accessible

**Security Considerations:**
- Display only non-sensitive user info
- Logout clears session token
- Password change requires email verification

**API Integration:**
- User data from Supabase Auth context
- Logout via Supabase Auth client
- Password reset via Supabase Auth flow

---

### 2.7 Error and Loading States

#### 404 Not Found Page

**View Path:** `*` (catch-all)

**Main Purpose:** Handle invalid routes gracefully

**Key Information to Display:**
- Clear "Page Not Found" message
- Navigation options to return to valid pages

**Key View Components:**
- 404 heading
- Friendly message
- Links to Dashboard, Items, Containers, Categories
- Optional: search bar to find items

---

#### Loading States

**Implementation:** Component-level, not dedicated pages

**Loading Skeletons** (used for list and detail views):
- Match layout of content being loaded
- Skeleton cards for item/container lists
- Skeleton rows for category list
- Skeleton layout for detail pages
- Shimmer animation for polish

**Progress Bar** (used for page navigation):
- Thin progress bar at very top of viewport
- Appears during page transitions and data fetching
- Fills from left to right
- Disappears on completion

**Button Spinners** (used during form submissions):
- Replace button text with spinner during action
- "Saving..." or just spinner icon
- Button remains disabled during submission

---

#### Error States

**Implementation:** Inline error displays, modals, and toast notifications

**Network Error Modal**:
- Title: "Connection Error"
- Message: "Unable to connect. Check your internet connection."
- "Retry" button
- "Dismiss" button

**Validation Error Display**:
- Inline error messages next to invalid fields
- Summary banner at top of form
- Red color for error state
- Icon indicating error

**Business Logic Error Modal** (e.g., delete with dependencies):
- Title: "Cannot Delete [Name]"
- Message: Clear explanation with item count
- "OK" button to dismiss

**Empty States** (no data):
- Illustration or icon
- Friendly message
- Call-to-action button

---

## 3. User Journey Map

### 3.1 First-Time User Onboarding Flow

**Goal:** Guide new user to add their first item

1. User arrives at landing page (public marketing page or login)
2. User clicks "Create Account"
3. User registers with email and password
4. User automatically logged in and redirected to Dashboard
5. **Dashboard displays empty state**:
   - "Welcome! Get started by adding your first item"
   - Quick action buttons prominently displayed
6. User clicks "Add Container"
7. **Container creation page**:
   - User fills name and description
   - User optionally uploads image
   - User clicks Save
8. User redirected to container detail (shows empty items list)
9. User navigates back to Dashboard
10. User clicks "Add Category"
11. **Category creation** (inline form):
    - User enters category name
    - User clicks Save
12. User navigates to Items via bottom/top navigation
13. User clicks "Add New Item"
14. **Item creation page**:
    - User fills name
    - User selects category from dropdown (now populated)
    - User selects container from dropdown (now populated)
    - User sets status (defaults to "In")
    - User optionally adds description, quantity, images
    - User clicks Save
15. User redirected to item detail page (success!)
16. User navigates to Dashboard to see statistics updated

**Key UX Optimizations:**
- Empty states provide clear next steps
- Quick action buttons always visible
- Success messages after each creation
- Dashboard statistics update immediately
- Smooth flow from dashboard to creation forms

---

### 3.2 Finding an Item (Primary Use Case)

**Goal:** User wants to quickly locate a specific item

**Scenario A: Search by Name**

1. User opens app (mobile or desktop)
2. User navigates to Items section (bottom tab on mobile, top nav on desktop)
3. Items list loads (all items displayed)
4. User focuses search field
5. User types item name or partial name (e.g., "tent")
6. Search debounces 300ms
7. List updates in real-time to show matching results
8. User sees filtered results (e.g., "Camping Tent")
9. User clicks on item card
10. Item detail page displays with all information
11. User sees container location: "Garage Box A"
12. User retrieves physical item

**Scenario B: Filter by Location (Container)**

1. User navigates to Items section
2. User clicks Container filter dropdown
3. User selects "Garage Box A" from list
4. List filters to show only items in that container
5. User scans results to find desired item
6. User clicks item to view details

**Scenario C: Browse and Filter**

1. User navigates to Items section
2. User clicks Category filter dropdown
3. User selects "Outdoor Gear"
4. User applies Status filter: "In Storage" only
5. List shows items matching both filters (AND logic)
6. User scans filtered results
7. User clicks item to view details

**Key UX Features:**
- Fast, responsive search (300ms debounce)
- Real-time filter updates
- Multiple filters combine (AND logic)
- Filter state persists in URL (shareable)
- Clear indication of active filters
- Easy to clear filters and start over

---

### 3.3 Adding an Item (Core Workflow)

**Goal:** User wants to add a new item they just stored

1. User physically places item in container
2. User opens app on mobile device
3. User navigates to Items section
4. User clicks "Add Item" button
5. **Item creation form loads**
6. User enters item name (required)
7. User selects category from dropdown (required)
   - Dropdown is searchable
   - Shows existing categories
8. User selects container from dropdown (required)
   - Dropdown is searchable
   - Shows existing containers
9. User sets status: "In Storage" (default, already selected)
10. User optionally adds description
11. User optionally adds quantity
12. **User adds photo(s)**:
    - User clicks "Add Photo" button
    - Mobile device prompts: Camera or Photo Library
    - User selects Camera
    - User takes photo of item in container
    - Photo uploads with progress indicator
    - User optionally takes more photos (up to 5 total)
13. User reviews form (all required fields filled)
14. User clicks "Save"
15. Form validates (success)
16. Loading spinner appears on Save button
17. API request completes
18. User redirected to item detail page
19. Success message displays: "Item added successfully"
20. User can immediately view item details

**Key UX Features:**
- Mobile-optimized for in-the-moment use
- Native camera integration
- Progress indicators for image uploads
- Real-time validation feedback
- Defaults reduce friction (status defaults to "In")
- Smooth transition to detail view on success

---

### 3.4 Editing an Item

**Goal:** User wants to update item information (e.g., move to different container, add notes)

1. User navigates to Items section
2. User searches for or filters to find item
3. User clicks item card
4. Item detail page displays
5. User clicks "Edit" button
6. **Item edit form loads** (pre-populated with existing data)
7. User modifies fields:
   - Changes container (dropdown selection)
   - Adds description
   - Adds another image
8. User clicks "Save"
9. Validation passes
10. Loading spinner on Save button
11. API request updates item
12. User redirected to item detail page
13. Success message: "Item updated successfully"
14. Updated information displayed

**Alternative: Cancel without saving**
- User clicks "Cancel" button
- "Unsaved changes" warning appears (if changes made)
- User confirms
- User redirected to item detail page (no changes saved)

---

### 3.5 Toggling Item Status (Quick Action)

**Goal:** User borrowed item and wants to mark it "Out"

1. User navigates to Items section
2. User finds item (search or filter)
3. User clicks item card
4. Item detail page displays (status shows "In Storage")
5. User clicks "Edit" button
6. Edit form displays
7. User toggles status switch from "In" to "Out"
8. User clicks "Save"
9. **Optimistic update**: Status icon updates immediately in UI
10. API request sent in background
11. API confirms success (or reverts if error)
12. User redirected to detail page
13. Status shows "Out"

**Alternative: From Dashboard**
- Dashboard "Items Out" count updates immediately
- Badge appears on navigation if > 0 items out

---

### 3.6 Deleting a Container with Items (Error Flow)

**Goal:** User attempts to delete container that still has items

1. User navigates to Containers section
2. User clicks on container
3. Container detail page displays (shows 15 items in list)
4. User clicks "Delete" button
5. **Confirmation modal appears**:
   - "Are you sure you want to delete [Container Name]?"
   - Shows item count: "This container has 15 items"
6. User clicks "Confirm Delete"
7. Loading state on Confirm button
8. API request attempts deletion
9. **API returns 409 Conflict error**
10. Modal updates with error message:
    - "Cannot delete [Container Name] because it contains 15 items"
    - "Please reassign or remove items first"
11. User clicks "OK" to dismiss modal
12. User remains on container detail page
13. User must reassign items before deleting container

**Key UX Features:**
- Clear error message explains why deletion failed
- Item count provides context
- Guidance on how to resolve (reassign items)
- User not punished for attempting invalid action

---

### 3.7 Filter State Persistence and Sharing

**Goal:** User applies complex filters and wants them to persist

**Scenario A: Session Persistence**

1. User navigates to Items section
2. User applies multiple filters:
   - Search: "outdoor"
   - Category: Outdoor Gear, Sports Equipment
   - Container: Garage Box A
   - Status: In Storage
3. Filtered results display
4. **URL updates**: `/items?search=outdoor&category=uuid1,uuid2&container=uuid3&status=in`
5. **localStorage updates**: Filter state saved
6. User navigates away (to Dashboard)
7. User navigates back to Items section
8. **Filters restored from localStorage**
9. Filtered results display automatically
10. User doesn't need to re-apply filters

**Scenario B: Sharing Filters**

1. User has applied filters (see above)
2. User copies URL from browser: `/items?search=outdoor&category=uuid1,uuid2&container=uuid3&status=in`
3. User shares URL with another device or bookmark it
4. User opens URL later
5. **Filters applied from URL parameters**
6. Same filtered view displays
7. Filters are shareable across sessions and devices

**Key UX Features:**
- Filter state in URL (shareable, bookmarkable)
- Filter state in localStorage (persists across sessions)
- Seamless restoration of complex filter combinations
- No manual re-application needed

---

## 4. Layout and Navigation Structure

### 4.1 Navigation Patterns

#### Desktop Navigation (> 1024px)

**Top Navigation Bar:**
- **Left Section**:
  - App logo (clickable, navigates to Dashboard)
  - App name/title
  
- **Center Section**:
  - Navigation links: Dashboard, Items, Containers, Categories
  - Active page visually highlighted (underline, color, or background)
  - Badge on "Dashboard" or "Items" showing count of items out (when > 0)
  
- **Right Section**:
  - User profile dropdown:
    - User email
    - Profile link
    - Logout button

**Layout:**
- Fixed position at top (stays visible on scroll)
- Full-width horizontal bar
- Height: ~64px
- Background: primary color or white with shadow
- Responsive: collapses to hamburger on mobile

---

#### Mobile Navigation (< 768px)

**Top Bar (Header):**
- Logo/app name (left)
- Hamburger menu icon (right) for secondary actions:
  - Profile
  - Logout

**Bottom Navigation Bar:**
- Fixed position at bottom of viewport
- 4 primary sections with icons + labels:
  1. **Dashboard** (home icon + "Dashboard")
  2. **Items** (box icon + "Items")
  3. **Containers** (folder icon + "Containers")
  4. **Categories** (tag icon + "Categories")
- Active section highlighted (color, bold, icon fill)
- Badge on Dashboard or Items showing items out count (when > 0)
- Height: ~64px
- Background: white or primary color with shadow

**Advantages:**
- Easy thumb access on mobile
- Always visible for quick navigation
- Icons + labels for clarity
- Bottom position standard in mobile apps

---

### 4.2 Page Layout Structure

**Common Layout Elements:**

All pages follow consistent structure:

1. **Navigation** (top or bottom depending on device)
2. **Page Header**:
   - Page title (h1)
   - Action buttons (e.g., "Add Item", "Add Container")
   - Breadcrumbs (if applicable): "Items > Item Name"
3. **Main Content Area**:
   - List views, detail views, forms
   - Loading skeletons or content
4. **Footer** (minimal or none in Phase 1):
   - Optional: version number, links

**Responsive Behavior:**
- Mobile: Single column, stacked elements, bottom navigation
- Tablet: 2-column grids, top navigation appears, filters more visible
- Desktop: Multi-column grids, persistent filters, hover states

---

### 4.3 Modal and Overlay Patterns

**Component-State-Based Modals** (no URL changes):

Used for:
- Delete confirmations
- Image lightbox (full-size viewing)
- Error messages requiring acknowledgment
- Unsaved changes warnings

**Modal Structure:**
- Semi-transparent overlay (backdrop)
- Centered modal card
- Close button (X icon in top-right)
- Modal content (text, buttons)
- Focus trap (keyboard navigation stays in modal)
- Escape key to close
- Click outside to close (optional, disabled for confirmations)

**Accessibility:**
- Focus moves to modal on open
- Focus returns to trigger element on close
- Keyboard navigation (Tab, Escape)
- Aria attributes for screen readers

---

### 4.4 Breadcrumb Navigation

**Usage:** Primarily on detail pages

Examples:
- Item detail: "Items > Camping Tent"
- Container detail: "Containers > Garage Box A"
- Item edit: "Items > Camping Tent > Edit"

**Implementation:**
- Links in breadcrumb navigate back to previous levels
- Current page not linked (plain text)
- Separator: "/" or ">" icon
- Mobile: May abbreviate or hide on very small screens

---

## 5. Key Components

### 5.1 Reusable UI Components

The application leverages Shadcn/ui for consistent, accessible UI components. Below are key components used throughout the application.

---

#### Form Components

**TextInput:**
- Text input field with label, placeholder, error message support
- Props: label, value, onChange, error, required, placeholder, maxLength
- Displays character count if maxLength provided
- Inline error message below field
- Used for: item name, container name, category name

**Textarea:**
- Multi-line text input with label, error message support
- Props: label, value, onChange, error, placeholder, maxLength, rows
- Character count displayed
- Used for: item description, container description

**NumberInput:**
- Standard HTML5 number input
- Props: label, value, onChange, min, placeholder
- Used for: item quantity

**ComboboxSelect:**
- Searchable dropdown with filter capability
- Props: label, options (array of {id, name, count}), value, onChange, required, placeholder, emptyMessage
- Displays item counts next to option names: "Outdoor Gear (25)"
- Supports keyboard navigation (arrow keys, Enter)
- Used for: category selector, container selector in item forms

**ToggleSwitch:**
- Toggle switch with clear visual states
- Props: label, checked, onChange, onLabel, offLabel
- Options: "In Storage" / "Out"
- Used for: item status

---

#### Display Components

**ItemCard:**
- Card component for displaying item in grid or list view
- Props: item (object with id, name, thumbnail, category, container, isIn), onClick, viewMode (grid/list)
- Grid mode: Large thumbnail, name below, badges, status icon
- List mode: Small thumbnail left, name and metadata in row
- Clickable to navigate to item detail

**ContainerCard:**
- Card component for displaying container
- Props: container (object with id, name, thumbnail, itemCount), onClick
- Shows thumbnail, name, item count badge
- Clickable to navigate to container detail

**Badge:**
- Small badge for displaying category, container, item count, status
- Props: text, variant (primary, secondary, success, warning, error)
- Used throughout for: category names, container names, item counts, status

**EmptyState:**
- Component for empty data states
- Props: icon, message, actionLabel, onAction
- Displays icon/illustration, friendly message, CTA button
- Used on: empty item lists, empty container lists, empty category lists

---

#### Image Components

**ImageUploader:**
- Drag-and-drop upload zone with click-to-browse
- Props: onUpload, maxFiles, maxSizeMB, acceptedFormats, existingImageCount
- Shows visual feedback during drag
- Displays upload progress for each file
- Validation: format, size, count
- Used on: item create/edit, container create/edit

**ImageGallery:**
- Displays multiple images with drag-to-reorder and delete
- Props: images (array), onReorder, onDelete, editable
- Shows display order indicators (1, 2, 3, 4, 5)
- "Thumbnail" label on first image
- Click to open lightbox
- Used on: item detail/edit, container detail/edit

**ImageLightbox:**
- Modal overlay for full-size image viewing
- Props: images (array), currentIndex, onClose, onNavigate
- Navigation: arrow buttons (desktop), swipe (mobile), keyboard (arrow keys, Escape)
- Image counter: "2 of 5"
- Close button (X icon)
- Used when: user clicks image in detail view gallery

---

#### Loading Components

**LoadingSkeleton:**
- Placeholder loading state matching content layout
- Variants: SkeletonCard (for grid items), SkeletonRow (for list items), SkeletonDetail (for detail pages)
- Shimmer animation for polish
- Used during: data fetching, page loads

**ProgressBar:**
- Thin progress bar at top of viewport
- Props: visible, progress (0-100)
- Fills from left to right
- Auto-hides on completion
- Used during: page transitions, API calls

**Spinner:**
- Circular loading spinner
- Props: size (small, medium, large), color
- Used in: button loading states, inline loading

---

#### Navigation Components

**Tabs (Desktop):**
- Top navigation bar with links
- Props: items (array of {label, path, badge}), currentPath
- Highlights active tab
- Displays badges for items out count

**BottomNav (Mobile):**
- Bottom tab bar with icons + labels
- Props: items (array of {label, icon, path, badge}), currentPath
- Fixed position at bottom
- Highlights active tab

**Breadcrumbs:**
- Navigation breadcrumbs for detail pages
- Props: items (array of {label, path})
- Separator: ">"
- Last item not linked (current page)

---

#### Feedback Components

**Toast:**
- Temporary notification for success/error messages
- Props: message, variant (success, error, info), duration (auto-dismiss)
- Appears in top-right corner (desktop) or top (mobile)
- Auto-dismisses after 3-5 seconds
- Used for: success confirmations, error notifications

**Alert:**
- Banner for important messages or validation errors
- Props: message, variant (error, warning, info, success), dismissible
- Appears at top of page or form
- Can be persistent or dismissible
- Used for: form validation error summary, network errors

**Modal:**
- Overlay modal dialog
- Props: open, onClose, title, children, actions (buttons)
- Backdrop prevents interaction with page
- Focus trapped in modal
- Close on Escape or X button
- Used for: confirmations, errors, dialogs

---

#### Filter and Search Components

**SearchInput:**
- Text input optimized for search
- Props: value, onChange, placeholder, debounce (300ms)
- Magnifying glass icon
- Clear button (X) when text present
- Debounced onChange to reduce API calls
- Used on: items list filter bar

**FilterBar:**
- Container for multiple filter controls
- Props: children, collapsible (mobile), onClear
- Desktop: Persistent horizontal bar
- Mobile: Collapsible panel (slide up/down)
- "Clear Filters" button
- Active filter count indicator
- Used on: items list page

**MultiSelectDropdown:**
- Dropdown allowing multiple selections
- Props: options, selectedValues, onChange, label, placeholder
- Checkbox for each option
- "Select All" and "Clear" options
- Used for: category filter, container filter

---

### 5.2 Custom Hooks (React)

While implementation details are out of scope, the following custom hooks will be used:

**useDebounce:**
- Debounces value changes (300ms for search)

**useLocalStorage:**
- Syncs state with localStorage (view mode, filters)

**useFilters:**
- Manages complex filter state (search, category, container, status)
- Syncs with URL and localStorage

**useForm:**
- Form state and validation logic
- Real-time inline validation

**useUnsavedChanges:**
- Detects unsaved form changes
- Triggers browser warning before navigation

**useImageUpload:**
- Manages image upload state (progress, errors)
- Handles multiple simultaneous uploads

---

### 5.3 Layout Components

**PageLayout:**
- Wraps all pages with navigation and common structure
- Props: title, actions (buttons), breadcrumbs, children

**GridLayout:**
- Responsive grid for items/containers
- Props: children, columns (responsive: 1 mobile, 2 tablet, 3-4 desktop)

**FormLayout:**
- Standard form layout with sections and spacing
- Props: children, onSubmit

**DetailLayout:**
- Two-column layout for detail pages (desktop)
- Props: leftColumn (images), rightColumn (info, actions)
- Single column on mobile (stacked)

---

## 6. API Integration Points Summary

### 6.1 Dashboard

- GET `/api/dashboard/stats` → fetches all statistics and recent items

### 6.2 Items

- GET `/api/items?[filters]` → list items with filtering
- GET `/api/items/:id` → fetch single item
- POST `/api/items` → create item
- PATCH `/api/items/:id` → update item
- DELETE `/api/items/:id` → delete item
- POST `/api/items/:id/images` → upload image
- PATCH `/api/items/:itemId/images/:imageId` → update image order
- DELETE `/api/items/:itemId/images/:imageId` → delete image

### 6.3 Containers

- GET `/api/containers` → list containers
- GET `/api/containers/:id` → fetch single container
- POST `/api/containers` → create container
- PATCH `/api/containers/:id` → update container
- DELETE `/api/containers/:id` → delete container (fails if has items)
- POST `/api/containers/:id/images` → upload image
- DELETE `/api/containers/:containerId/images/:imageId` → delete image

### 6.4 Categories

- GET `/api/categories` → list categories
- GET `/api/categories/:id` → fetch single category
- POST `/api/categories` → create category
- PATCH `/api/categories/:id` → update category
- DELETE `/api/categories/:id` → delete category (fails if has items)

### 6.5 Authentication

- Handled by Supabase Auth SDK (client-side)
- Login, registration, logout, password reset flows
- Astro middleware validates JWT on protected routes

---

## 7. Accessibility and Security Summary

### 7.1 Accessibility (Minimal Phase 1)

**In Scope:**
- Semantic HTML (nav, main, section, article)
- Proper heading hierarchy (h1 → h2 → h3)
- Form labels associated with inputs
- Alt text for images (using item/container names)
- Focus management for modals
- Keyboard navigation for image lightbox (arrows, Escape)
- Visible focus indicators (outline/ring)
- Touch targets minimum 44x44px on mobile

**Out of Scope for Phase 1:**
- Full WCAG 2.1 AA/AAA compliance
- Screen reader optimization (ARIA labels, live regions)
- High contrast mode
- Reduced motion preferences
- Comprehensive keyboard shortcuts

---

### 7.2 Security

**Authentication & Authorization:**
- Supabase Auth with JWT tokens
- Astro middleware validates tokens on protected routes
- Row-Level Security (RLS) in PostgreSQL
- User data isolated at database level

**Input Validation:**
- Client-side validation (UX, first line of defense)
- Server-side validation (security boundary)
- Parameterized queries via Supabase client
- Sanitization of user inputs

**Image Upload Security:**
- File type validation (JPEG, PNG, WebP only)
- File size limit (5MB max)
- Count limit (5 images per entity)
- User-scoped storage paths
- Generated UUIDs for filenames

**API Security:**
- HTTPS only in production
- CORS configuration
- SQL injection prevention via parameterized queries
- XSS prevention (React escapes output by default)
- CSRF protection via token validation

---

## 8. Conclusion

This UI architecture provides a comprehensive blueprint for building the Home Storage System MVP. The design prioritizes:

1. **Mobile-first responsive design** with progressive enhancement for desktop
2. **Clear user flows** from onboarding through core tasks (finding, adding, editing items)
3. **Consistent component patterns** leveraging Shadcn/ui for maintainability
4. **Real-time search and filtering** with state persistence for excellent UX
5. **Security by default** with authentication, authorization, and data validation at multiple layers
6. **Accessibility foundations** (semantic HTML, keyboard navigation, focus management)
7. **Performance optimizations** (loading skeletons, debounced search, optimistic updates)

The architecture directly maps to all user stories in the PRD, integrates with the defined API endpoints, and incorporates decisions from the planning session. Each view is designed with specific UX, accessibility, and security considerations to ensure a robust, user-friendly application.
