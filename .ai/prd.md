# Product Requirements Document (PRD) - Home Storage System

## 1. Product Overview

### 1.1 Purpose

The Home Storage System is a web-based application designed to solve the common problem of organizing and locating items in homes and small offices. The application enables users to maintain a digital inventory of their physical items, track their storage locations, and quickly find items when needed.

### 1.2 Target Users

Phase 1 focuses on single users managing their personal storage systems, including:

- Busy parents organizing family items across multiple storage locations
- Small office owners tracking equipment and supplies
- Hobbyists managing specialized equipment collections (sports gear, craft supplies, tools)
- Individuals who frequently misplace items and want a systematic organization method

### 1.3 Platform

- Web-based application accessible via desktop and mobile browsers
- Mobile-responsive design using Astro + React tech stack
- Single codebase supporting all platforms
- No native mobile app required

### 1.4 Technology Stack

- Frontend: Astro 5, React 19, TypeScript 5
- Styling: Tailwind 4, Shadcn/ui
- Backend: Supabase (PostgreSQL database + Storage)

## 2. User Problem

### 2.1 Problem Statement

Users frequently struggle to remember where specific items (sports gear, tools, batteries, hobby equipment, office supplies) are stored in their homes or small offices. This leads to:

- Wasted time searching for items
- Frustration when unable to locate needed items
- Duplicate purchases of items they already own but cannot find
- Inefficient use of storage space
- Difficulty maintaining organized storage systems over time

### 2.2 Current Solutions and Limitations

Users currently rely on:

- Mental memory, which fades over time
- Handwritten lists or spreadsheets, which lack visual references and are difficult to maintain
- Generic note-taking apps, which are not designed for physical item organization
- Physical labels on containers, which do not provide searchability or quick lookups

### 2.3 Proposed Solution

The Home Storage System provides:

- Digital inventory of all items with visual references (photos)
- Organized container-based storage hierarchy
- Category-based classification for logical grouping
- Quick search and filtering capabilities
- In/out status tracking for borrowed or temporarily removed items
- Mobile-accessible interface for on-the-go lookups

## 3. Functional Requirements

### 3.1 Container Management

- Users can create, edit, view, and delete containers
- Each container includes:
  - Name (required)
  - Description field for additional context such as location details (optional)
  - Up to 5 images (optional)
- Containers cannot be deleted if they have items assigned to them
- All containers display in the system regardless of whether they contain items
- First image serves as thumbnail in list views
- Images automatically resized for optimal display and performance

### 3.2 Item Management

- Users can create, edit, view, and delete items
- Each item includes:
  - Name (required)
  - Category assignment (required)
  - Container assignment (required)
  - In/out status flag (required)
  - Description/notes (optional)
  - Quantity (optional)
  - Up to 5 images (optional)
- Items must be assigned to pre-existing containers and categories
- Image #1 serves as the thumbnail in list views
- Images numbered for ordering with automatic thumbnail generation

### 3.3 Category Management

- Separate editable list interface for managing categories
- Users can add new categories
- Users can delete unused categories
- Categories cannot be deleted if assigned to any items
- Category names must be unique

### 3.4 Search and Filtering

- Real-time filtering with 300ms debounce delay
- Filter options:
  - Item name (text search)
  - Category (dropdown/multi-select)
  - Container (dropdown/multi-select)
  - In/out status (toggle/checkbox)
- All filters combine with AND logic
- Instant visual feedback as users type or adjust filters
- Filter state persists during session

### 3.5 Image Management

- Support for JPEG, PNG, and WebP formats
- Maximum 5MB per image file
- Maximum 5 images per item or container
- Automatic thumbnail generation and resizing
- Images stored in Supabase Storage
- Image ordering maintained by numbering

### 3.6 Data Integrity

- Prevent deletion of categories with assigned items
- Prevent deletion of containers with assigned items
- Display clear error message: "Cannot delete [name] because it contains X items"
- Validate required fields before saving
- Enforce unique names for categories

### 3.7 User Interface Views

List View displays:
- Thumbnail image
- Item name
- Category badge
- Container name
- In/out status icon

Detail View displays:
- Image gallery (all images)
- Full description
- Quantity
- Category
- Container
- In/out status
- Edit and delete actions

## 4. Product Boundaries

### 4.1 In Scope for Phase 1 (MVP)

- Basic CRUD operations for items, containers, and categories
- Multi-image support with automatic thumbnail generation
- Real-time search and filtering with AND logic
- In/out status tracking
- Mobile-responsive web interface
- Single-user accounts
- Pre-creation workflow (containers and categories must exist before adding items)
- Single-item operations only

### 4.2 Out of Scope for Phase 1

The following features are explicitly excluded from Phase 1 and deferred to future phases:

- Multi-user accounts or shared storage spaces
- Location hierarchy beyond container level (rooms, buildings, storage areas)
- Item movement history tracking
- Bulk operations (bulk delete, bulk edit, bulk move)
- Favorites or priority marking
- Public metrics or analytics
- Advanced features:
  - Barcode scanning
  - Smart home integration
  - Lending tracking with due dates
  - Public template libraries
  - Item value tracking
  - Purchase date tracking
  - Expiration date tracking
- Inline creation of containers/categories during item addition flow
- Data export or backup functionality
- Container capacity tracking
- Item archiving functionality
- User onboarding tutorial
- Accessibility compliance (WCAG, screen reader support)
- Offline mode
- Native mobile applications

### 4.3 Technical Constraints

- No native mobile app development
- Single codebase for all platforms
- Single-user architecture only
- No accessibility requirements for phase 1
- No specific timeline or deadline
- Phase 1 is for testing purposes with no public metrics measurement

### 4.4 Data Constraints

- Maximum 5 images per item or container
- 5MB maximum file size per image
- Supported formats: JPEG, PNG, WebP only
- Real-time filtering debounce: 300ms

## 5. User Stories

### 5.1 Authentication and Access

US-001
Title: User Registration
Description: As a new user, I want to create an account so that I can start using the storage system.
Acceptance Criteria:
- User can access a registration form
- User provides email address and password
- Password must meet minimum security requirements (at least 8 characters)
- System validates email format
- System creates user account upon successful validation
- User receives confirmation of successful registration
- User is redirected to dashboard after registration

US-002
Title: User Login
Description: As a registered user, I want to log in to my account so that I can access my storage data.
Acceptance Criteria:
- User can access login form
- User provides email and password
- System authenticates credentials
- Successful login redirects user to dashboard
- Failed login displays error message
- User remains logged in across browser sessions until explicit logout

US-003
Title: User Logout
Description: As a logged-in user, I want to log out of my account so that my data remains secure.
Acceptance Criteria:
- Logout option is visible in navigation menu
- Clicking logout clears user session
- User is redirected to login page after logout
- User must log in again to access the application

US-004
Title: Password Reset
Description: As a user who forgot my password, I want to reset it so that I can regain access to my account.
Acceptance Criteria:
- User can access password reset link from login page
- User provides email address
- System sends password reset link to email
- Link expires after 24 hours
- User can set new password through reset link
- User can log in with new password

### 5.2 Container Management

US-005
Title: Create Container
Description: As a user, I want to create a new container so that I can organize my items.
Acceptance Criteria:
- User can access container creation form
- User provides container name (required)
- User can optionally provide description
- User can optionally upload up to 5 images
- System validates name is not empty
- System saves container to database
- User sees confirmation message
- New container appears in container list

US-006
Title: View Container List
Description: As a user, I want to view all my containers so that I can see my storage organization.
Acceptance Criteria:
- User can access container list page
- List displays all containers including empty ones
- Each container shows thumbnail (if image exists), name, and item count
- Containers are displayed in creation order (newest first) or alphabetical order
- Empty state message displays when no containers exist

US-007
Title: View Container Details
Description: As a user, I want to view details of a specific container so that I can see all information about it.
Acceptance Criteria:
- User can click on container from list to view details
- Detail view displays all container images in gallery format
- Detail view displays container name
- Detail view displays container description
- Detail view displays count of items in container
- Detail view displays list of items assigned to container
- Edit and delete buttons are visible

US-008
Title: Edit Container
Description: As a user, I want to edit a container's information so that I can keep it accurate.
Acceptance Criteria:
- User can access edit form from container detail view
- Form pre-populates with existing container data
- User can modify name
- User can modify description
- User can add, remove, or reorder images
- System validates name is not empty
- System saves changes to database
- User sees confirmation message
- Changes reflect immediately in all views

US-009
Title: Delete Empty Container
Description: As a user, I want to delete an empty container so that I can remove unused storage locations.
Acceptance Criteria:
- Delete button is available in container detail view
- System checks if container has assigned items
- If container is empty, system prompts for confirmation
- User confirms deletion
- System removes container from database
- User is redirected to container list
- Confirmation message displays
- Deleted container no longer appears in lists

US-010
Title: Prevent Deletion of Container with Items
Description: As a user, I cannot delete a container that has items assigned to it so that I maintain data integrity.
Acceptance Criteria:
- System prevents deletion of containers with assigned items
- Error message displays: "Cannot delete [container name] because it contains X items"
- User remains on container detail page
- Container is not deleted
- User is informed to remove or reassign items first

US-011
Title: Upload Container Images
Description: As a user, I want to add photos to my containers so that I can visually identify them.
Acceptance Criteria:
- User can upload up to 5 images per container
- System accepts JPEG, PNG, and WebP formats
- Each image must be 5MB or smaller
- System rejects files exceeding size limit with error message
- System rejects unsupported file formats with error message
- First uploaded image becomes thumbnail
- Images are numbered 1-5 based on upload order
- User can reorder images after upload
- Thumbnails are automatically generated and resized

### 5.3 Category Management

US-012
Title: View Category List
Description: As a user, I want to view all my categories so that I can manage my classification system.
Acceptance Criteria:
- User can access category management page
- List displays all categories
- Each category shows name and item count
- Categories are displayed in alphabetical order
- Empty state message displays when no categories exist
- Add new category button is visible

US-013
Title: Create Category
Description: As a user, I want to create a new category so that I can classify my items.
Acceptance Criteria:
- User can access category creation form
- User provides category name (required)
- System validates name is not empty
- System validates name is unique
- System saves category to database
- User sees confirmation message
- New category appears in category list
- New category is available in item creation/edit dropdowns

US-014
Title: Edit Category
Description: As a user, I want to edit a category name so that I can keep it accurate.
Acceptance Criteria:
- User can access edit function from category list
- User can modify category name
- System validates name is not empty
- System validates name is unique
- System saves changes to database
- User sees confirmation message
- Updated name reflects immediately in all views
- Items assigned to category show updated name

US-015
Title: Delete Unused Category
Description: As a user, I want to delete an unused category so that I can keep my category list clean.
Acceptance Criteria:
- Delete option is available in category list
- System checks if category has assigned items
- If category is unused, system prompts for confirmation
- User confirms deletion
- System removes category from database
- Confirmation message displays
- Deleted category no longer appears in lists or dropdowns

US-016
Title: Prevent Deletion of Category with Items
Description: As a user, I cannot delete a category that has items assigned to it so that I maintain data integrity.
Acceptance Criteria:
- System prevents deletion of categories with assigned items
- Error message displays: "Cannot delete [category name] because it contains X items"
- Category is not deleted
- User remains on category list page
- User is informed to remove or reassign items first

### 5.4 Item Management

US-017
Title: Create Item
Description: As a user, I want to add a new item to my storage system so that I can track its location.
Acceptance Criteria:
- User can access item creation form
- User provides item name (required)
- User selects category from dropdown (required)
- User selects container from dropdown (required)
- User selects in/out status (required, defaults to "in")
- User can optionally provide description/notes
- User can optionally provide quantity
- User can optionally upload up to 5 images
- System validates all required fields
- System saves item to database
- User sees confirmation message
- New item appears in item list

US-018
Title: View Item List
Description: As a user, I want to view all my items so that I can see what I have stored.
Acceptance Criteria:
- User can access item list page
- List displays all items
- Each item shows thumbnail, name, category badge, container name, and in/out status icon
- Items are displayed in creation order (newest first) or alphabetical order
- Empty state message displays when no items exist
- Add new item button is visible
- List is scrollable if content exceeds viewport

US-019
Title: View Item Details
Description: As a user, I want to view details of a specific item so that I can see all information about it.
Acceptance Criteria:
- User can click on item from list to view details
- Detail view displays all item images in gallery format
- Detail view displays item name
- Detail view displays category
- Detail view displays container
- Detail view displays in/out status
- Detail view displays description/notes
- Detail view displays quantity
- Edit and delete buttons are visible

US-020
Title: Edit Item
Description: As a user, I want to edit an item's information so that I can keep it accurate.
Acceptance Criteria:
- User can access edit form from item detail view
- Form pre-populates with existing item data
- User can modify name
- User can change category selection
- User can change container assignment
- User can toggle in/out status
- User can modify description/notes
- User can modify quantity
- User can add, remove, or reorder images
- System validates all required fields
- System saves changes to database
- User sees confirmation message
- Changes reflect immediately in all views

US-021
Title: Delete Item
Description: As a user, I want to delete an item so that I can remove it from my storage system.
Acceptance Criteria:
- Delete button is available in item detail view
- System prompts for confirmation
- User confirms deletion
- System removes item from database
- User is redirected to item list
- Confirmation message displays
- Deleted item no longer appears in lists
- Associated images are removed from storage

US-022
Title: Upload Item Images
Description: As a user, I want to add photos to my items so that I can visually identify them.
Acceptance Criteria:
- User can upload up to 5 images per item
- System accepts JPEG, PNG, and WebP formats
- Each image must be 5MB or smaller
- System rejects files exceeding size limit with error message
- System rejects unsupported file formats with error message
- First uploaded image becomes thumbnail in list view
- Images are numbered 1-5 based on upload order
- User can reorder images after upload
- Thumbnails are automatically generated and resized

US-023
Title: Change Item Container
Description: As a user, I want to move an item to a different container so that I can reorganize my storage.
Acceptance Criteria:
- User can edit item and select different container from dropdown
- Dropdown displays all available containers
- System updates item's container assignment
- User sees confirmation message
- Updated container reflects immediately in item detail and list views
- Item no longer appears in previous container's item list
- Item appears in new container's item list

US-024
Title: Toggle Item In/Out Status
Description: As a user, I want to mark an item as in or out so that I can track whether it's currently available.
Acceptance Criteria:
- User can toggle in/out status in item edit form
- Status options are clearly labeled ("In" and "Out")
- System saves status change
- User sees confirmation message
- Updated status reflects immediately in all views
- In/out status icon updates in list view

### 5.5 Search and Filtering

US-025
Title: Search Items by Name
Description: As a user, I want to search for items by name so that I can quickly find specific items.
Acceptance Criteria:
- Search field is visible on item list page
- User types item name or partial name
- System filters results in real-time with 300ms debounce
- List updates to show only matching items
- Search is case-insensitive
- Empty state message displays when no matches found
- User can clear search to restore full list

US-026
Title: Filter Items by Category
Description: As a user, I want to filter items by category so that I can view items of a specific type.
Acceptance Criteria:
- Category filter dropdown is visible on item list page
- Dropdown displays all categories
- User selects one or more categories
- System filters list to show only items in selected categories
- Filter combines with other active filters using AND logic
- User can clear filter to restore full list
- Filter state persists during session

US-027
Title: Filter Items by Container
Description: As a user, I want to filter items by container so that I can see what's stored in a specific location.
Acceptance Criteria:
- Container filter dropdown is visible on item list page
- Dropdown displays all containers
- User selects one or more containers
- System filters list to show only items in selected containers
- Filter combines with other active filters using AND logic
- User can clear filter to restore full list
- Filter state persists during session

US-028
Title: Filter Items by In/Out Status
Description: As a user, I want to filter items by in/out status so that I can see what's currently available or borrowed.
Acceptance Criteria:
- In/out status filter is visible on item list page (toggle or checkbox)
- User selects "In", "Out", or "All"
- System filters list to show only items matching selected status
- Filter combines with other active filters using AND logic
- User can clear filter to restore full list
- Filter state persists during session

US-029
Title: Combine Multiple Filters
Description: As a user, I want to use multiple filters simultaneously so that I can narrow down my search precisely.
Acceptance Criteria:
- User can activate multiple filters at once
- All active filters combine using AND logic
- List updates in real-time as filters are applied
- Each filter operates independently
- Clear all filters option is available
- Empty state message displays when no items match all criteria
- Filter combinations persist during session

US-030
Title: Real-Time Filter Updates
Description: As a user, I want to see filter results update in real-time so that I get immediate feedback.
Acceptance Criteria:
- List updates as user types or selects filters
- Text search uses 300ms debounce to avoid excessive updates
- Dropdown selections filter immediately
- Visual loading indicator displays during filter processing
- Filter count or result count displays
- Performance remains smooth with large item lists

### 5.6 Error Handling and Validation

US-031
Title: Handle Missing Required Fields
Description: As a user, when I try to save an item/container/category without required fields, I receive clear validation errors.
Acceptance Criteria:
- System validates required fields before saving
- Error messages display next to invalid fields
- Error messages clearly state what is required
- Form does not submit until all required fields are valid
- User can correct errors and resubmit
- Previously valid fields retain their values

US-032
Title: Handle Invalid Image Uploads
Description: As a user, when I try to upload an invalid image, I receive a clear error message.
Acceptance Criteria:
- System validates image format (JPEG, PNG, WebP only)
- System validates image size (5MB maximum)
- System validates maximum image count (5 per item/container)
- Error message displays for format violations
- Error message displays for size violations
- Error message displays when trying to exceed image limit
- Valid images upload successfully despite invalid ones being rejected

US-033
Title: Handle Network Errors
Description: As a user, when a network error occurs, I receive a clear error message and can retry.
Acceptance Criteria:
- System detects network errors during save operations
- User-friendly error message displays (not technical jargon)
- Retry option is available
- Form data is preserved during error
- User can edit and try again
- Successful retry displays confirmation message

US-034
Title: Handle Duplicate Category Names
Description: As a user, when I try to create a category with a duplicate name, I receive a clear error message.
Acceptance Criteria:
- System validates category name uniqueness
- Error message displays: "A category with this name already exists"
- Form does not submit
- User can modify name and resubmit
- Validation is case-insensitive

### 5.7 Mobile Experience

US-035
Title: Access Application on Mobile Browser
Description: As a mobile user, I want to access the application on my mobile browser so that I can manage items on the go.
Acceptance Criteria:
- Application loads correctly on mobile browsers (iOS Safari, Chrome, Firefox)
- Layout adapts to mobile screen sizes
- Touch targets are appropriately sized (minimum 44x44 pixels)
- Text is readable without zooming
- Images scale appropriately
- Navigation is accessible and functional

US-036
Title: Search Items on Mobile
Description: As a mobile user, I want to search and filter items so that I can find items while physically in my storage area.
Acceptance Criteria:
- Search field is accessible on mobile layout
- Mobile keyboard appears when search field is focused
- Filter controls are accessible and usable on mobile
- List updates in real-time on mobile devices
- Results are scrollable on mobile screen
- Touch interactions work smoothly

US-037
Title: Upload Images on Mobile
Description: As a mobile user, I want to upload images from my mobile device so that I can photograph items in place.
Acceptance Criteria:
- Upload button triggers mobile camera or photo library
- User can take new photo or select existing photo
- Image upload works on mobile browsers
- Upload progress indicator displays
- Successfully uploaded images display in form
- Mobile upload follows same validation rules (format, size, count)

### 5.8 Image Management

US-038
Title: View Image Gallery
Description: As a user, I want to view all images for an item or container in a gallery format so that I can see all visual information.
Acceptance Criteria:
- Detail view displays all images in gallery format
- User can navigate between images (swipe on mobile, arrows on desktop)
- User can zoom or expand images to full size
- Image navigation is intuitive and responsive
- Current image indicator displays (e.g., "2 of 5")
- Gallery works on both desktop and mobile

US-039
Title: Reorder Images
Description: As a user, I want to reorder images so that I can set the most relevant photo as the thumbnail.
Acceptance Criteria:
- User can drag and drop images to reorder (desktop)
- User can use reorder controls on mobile
- First image in order serves as thumbnail
- System saves new order
- Updated order reflects immediately in all views
- Thumbnail updates in list view

US-040
Title: Remove Image
Description: As a user, I want to remove an image from an item or container so that I can update visual information.
Acceptance Criteria:
- Remove button is available for each image in edit mode
- User clicks remove button
- System prompts for confirmation
- User confirms removal
- System deletes image from storage
- Image is removed from item/container
- If removed image was first, next image becomes thumbnail
- User sees confirmation message

### 5.9 Dashboard and Navigation

US-041
Title: View Dashboard
Description: As a user, I want to view a dashboard after login so that I can access all main features.
Acceptance Criteria:
- Dashboard displays after successful login
- Dashboard shows summary statistics (total items, total containers, items out)
- Quick action buttons are available (add item, add container, add category)
- Recent items display
- Navigation menu is visible and accessible
- Dashboard is mobile-responsive

US-042
Title: Navigate Between Sections
Description: As a user, I want to navigate between different sections of the application so that I can access all features.
Acceptance Criteria:
- Navigation menu is always accessible
- Menu includes links to: Dashboard, Items, Containers, Categories, Profile/Settings
- Current section is visually highlighted
- Navigation works on both desktop and mobile
- Mobile navigation uses hamburger menu or bottom navigation
- Navigation state persists during session

## 6. Success Metrics

### 6.1 Phase 1 Testing Goals

Phase 1 is a testing phase with qualitative evaluation rather than quantitative metrics. Success will be evaluated through:

- Completion of all core CRUD operations for items, containers, and categories
- Successful implementation of search and filtering functionality
- Proper image upload and management functionality
- Mobile-responsive design confirmed on multiple devices
- Data integrity maintained (no orphaned items or data loss)
- User feedback gathered on core functionality

### 6.2 User Satisfaction Indicators

Qualitative indicators of success:

- Users can successfully find items they are looking for
- Users report time savings compared to previous organization methods
- Users can easily add new items without confusion
- Mobile experience is functional and usable
- Search and filter performance meets user expectations
- Image quality is acceptable for identification purposes

### 6.3 Technical Performance Goals

- Page load time under 3 seconds on standard connection
- Search/filter results update within 500ms of user input
- Image upload completes within 10 seconds for 5MB files
- Application remains responsive on mobile devices
- No data loss during normal operations
- Zero critical bugs in core functionality

### 6.4 Future Phase Metrics

Metrics for future phases may include:

- Daily/monthly active users
- Average number of items per user
- Search success rate
- Time to find an item
- User retention rate
- Feature adoption rates
- Error rates
- Performance metrics

### 6.5 Definition of MVP Success

The MVP is considered successful when:

- All user stories are implemented and tested
- Core workflows (add item, search item, edit item) function correctly
- Application is accessible on desktop and mobile browsers
- Image upload and management works reliably
- Data integrity is maintained across all operations
- At least 5 test users can successfully use the application
- Critical bugs are resolved
- User feedback indicates the application solves the core problem
