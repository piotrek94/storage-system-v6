# User interface architecture for MVP
_Exported on 24/01/2026 at 11:25:07 CET from Cursor (2.3.41)_

---

**User**

You are an AI assistant whose task is to help plan the user interface architecture for an MVP (Minimum Viable Product) based on the provided information. Your goal is to generate a list of questions and recommendations that will be used in subsequent prompting to create a detailed UI architecture, user journey maps, and navigation structure.

Please carefully review the following information:

<product_requirements>
@prd.md
</product_requirements>

<tech_stack>
@tech-stack.md
</tech_stack>

<api_plan>
@api-plan.md
</api_plan>

Analyze the provided information, focusing on aspects relevant to user interface design. Consider the following issues:

1. Identify key views and screens based on product requirements and available API endpoints.
2. Determine potential user flows and navigation between views, taking into account API capabilities.
3. Consider UI components and interaction patterns that may be necessary for effective API communication.
4. Think about interface responsiveness and accessibility.
5. Assess security and authentication requirements in the context of API integration.
6. Consider any specific UI libraries or frameworks that might be beneficial for the project.
7. Analyze how the API structure impacts UI design and data flows in the application.

Based on your analysis, generate a list of 10 questions and recommendations in a combined form (question + recommendation). These should address any ambiguities, potential issues, or areas where more information is needed to create an effective UI architecture. Consider questions regarding:

1. View hierarchy and organization in relation to API structure
2. User flows and navigation supported by available endpoints
3. Responsiveness and adaptation to different devices
4. Accessibility and inclusiveness
5. Security and authorization at the UI level in connection with API mechanisms
6. Design consistency and user experience
7. Application state management strategy and synchronization with API
8. Handling error states and exceptions returned by API
9. Caching strategies and performance optimization in API communication

The output should have the following structure:

<questions>
List your questions and recommendations here, numbered for clarity:

For example:
1. Should the post card component display the author's name?

Recommendation: Yes, the post card component should display the author's name.
</questions>

Remember that your goal is to provide a comprehensive list of questions and recommendations that will help create a solid UI architecture for the MVP, fully integrated with available API endpoints. Focus on clarity, relevance, and accuracy of your outputs. Do not include any additional comments or explanations beyond the specified output format.

Continue this process, generating new questions and recommendations based on the provided context and user responses, until the user explicitly requests a summary.

Remember to focus on clarity, relevance, and accuracy of outputs. Do not include any additional comments or explanations beyond the specified output format.

---

**Cursor**

I'll help you plan the user interface architecture for the MVP. Let me first read the referenced documents to understand the project context.

Based on my analysis of the Product Requirements Document, Tech Stack, and API Plan, I'll now generate questions and recommendations for the UI architecture planning.

<questions>
1. Should the dashboard be the default landing page after login, or should users land on the items list view?

Recommendation: The dashboard should be the default landing page after login, as specified in US-041. It provides an overview with summary statistics (total items, total containers, items out), quick action buttons, and recent items, giving users immediate context about their storage system.

2. Should category and container management be accessible through dedicated pages in the main navigation, or through modal dialogs/slide-overs from the items view?

Recommendation: Use dedicated pages accessible from main navigation for category and container management. This approach provides better mobile experience, clearer URL structure, and aligns with the PRD's emphasis on these as separate management interfaces (US-012 for categories, US-006 for containers). Modal dialogs could be limiting on mobile devices.

3. Should the application use a top navigation bar or a side navigation panel for desktop views?

Recommendation: Use a top navigation bar for desktop that collapses to a hamburger menu on mobile. This approach is more suitable for the relatively flat navigation structure (Dashboard, Items, Containers, Categories, Profile), provides more horizontal space for content, and is more mobile-friendly than a side panel.

4. Should item, container, and category detail views open as separate pages or as modal overlays/slide-overs?

Recommendation: Use separate pages for detail views rather than modals. This provides better URL structure for bookmarking, easier navigation history management, better mobile experience (especially for image galleries), and more screen space for displaying multiple images and full content as specified in US-019 and US-007.

5. Should the search and filter controls be persistent at the top of the items list, or collapsible to save screen space?

Recommendation: Make search and filter controls persistent at the top of the items list on desktop, but collapsible on mobile. The search field should be always visible with filter controls expandable via a "Filters" button on mobile. This balances the PRD's requirement for real-time filtering (US-025 to US-030) with mobile screen space constraints.

6. Should the image gallery in detail views use a lightbox/modal for full-size viewing or inline expansion?

Recommendation: Use a lightbox/modal overlay for full-size image viewing (US-038). This provides better focus on images, supports swipe gestures on mobile, allows navigation between images without scrolling, and is consistent with modern web patterns for image galleries.

7. Should the application support inline editing of items/containers/categories in list views, or require navigation to dedicated edit pages?

Recommendation: Require navigation to dedicated edit pages/forms rather than inline editing. Given the complexity of each entity (multiple fields, image management, validation requirements), dedicated edit forms provide better UX, clearer validation feedback, and easier implementation of the PRD's requirements for pre-populated forms (US-008, US-020).

8. Should form validation errors display inline next to fields or in a summary banner at the top of the form?

Recommendation: Use inline validation next to fields with real-time feedback as users interact with each field, plus a summary banner at the top when submit is attempted with errors. This approach aligns with US-031 requirements and provides immediate, contextual feedback while also giving an overview of all validation issues.

9. Should the application maintain filter state only during the session or persist it in localStorage across browser sessions?

Recommendation: Persist filter state in localStorage across browser sessions, not just during the session. While US-026 to US-029 specify "during session," extending this to localStorage provides better UX as users often return to the same filtered views. Make the state clearable and include a version key to handle schema changes.

10. Should empty states (no items, no containers, no categories) include quick action buttons to create the first entity, or just display informational messages?

Recommendation: Include prominent quick action buttons in empty states (US-018, US-006, US-012 mention empty states). For example, "You don't have any items yet. Create your first item" with a large "Add Item" button. However, for items specifically, also check if categories and containers exist first and guide users to create those if needed, respecting the pre-creation workflow.

11. Should the application use optimistic UI updates (immediate UI feedback before API confirmation) or wait for server responses?

Recommendation: Use optimistic UI updates for simple operations (toggling in/out status, updating display order) but wait for server confirmation for complex operations (creating/deleting entities, uploading images). This balances perceived performance with data integrity and error handling requirements (US-033).

12. Should delete confirmations be modal dialogs or inline confirmation patterns (e.g., "Are you sure?" expanding below the delete button)?

Recommendation: Use modal dialogs for delete confirmations (US-009, US-021). This prevents accidental deletions, provides space for clear messaging (especially important for showing error messages like "Cannot delete [name] because it contains X items" from US-010), and is more consistent across desktop and mobile experiences.

13. Should the mobile navigation use a hamburger menu in the header or a bottom navigation bar?

Recommendation: Use a bottom navigation bar for mobile. This provides easier thumb access on larger phones, keeps primary navigation always visible without an extra tap, and is more suitable for the 4-5 primary sections (Dashboard, Items, Containers, Categories, Profile) mentioned in US-042.

14. Should thumbnail images in list views have a fixed aspect ratio (potentially cropping) or preserve original aspect ratio with constrained dimensions?

Recommendation: Use a fixed aspect ratio with object-fit: cover for thumbnails in list views. This ensures consistent, predictable grid layouts, prevents layout shifts, and provides a cleaner visual appearance. The PRD specifies that image #1 serves as the thumbnail (US-022), so users can select the most appropriate image and crop it as the thumbnail.

15. Should the application provide a loading skeleton/placeholder during data fetching or a simple spinner?

Recommendation: Use loading skeletons for list views and content areas, and spinners only for actions (buttons during submit). Skeletons provide better perceived performance, reduce layout shift, and give users a sense of the content structure while data loads, which is important given the image-heavy nature of the application.

16. Should image uploads show progress indicators, and should multiple images be uploadable simultaneously or sequentially?

Recommendation: Show individual progress indicators for each image upload and allow multiple images to be uploaded simultaneously (up to the limit of 5). This provides better UX for US-022 and US-037, especially on mobile where users may want to take multiple photos in sequence. Queue the uploads and show status for each.

17. Should the API error messages be displayed directly to users or translated to more user-friendly language?

Recommendation: Translate API error messages to user-friendly language on the frontend. While the API Plan provides good error messages, the frontend should have a translation layer to ensure consistency in tone, support for future internationalization, and contextual help. For example, network errors (US-033) should include retry options and troubleshooting hints.

18. Should the container and category dropdowns in item forms be searchable/filterable for users with many entries?

Recommendation: Yes, implement searchable/filterable dropdowns (combobox pattern) for container and category selection in item forms. As users accumulate more containers and categories over time, standard dropdowns become unwieldy. This isn't explicitly required in Phase 1 but significantly improves usability without adding complexity.

19. Should the application track and display "items out" as a notification or badge in the navigation?

Recommendation: Yes, display a badge on the dashboard navigation item showing the count of items currently out (when > 0). This provides at-a-glance visibility of items that need to be returned to storage, leveraging the API's itemsOut statistic from the dashboard endpoint without requiring an additional view.

20. Should the recent items section on the dashboard be static or interactive (clickable to navigate to item details)?

Recommendation: Make recent items interactive and clickable, navigating directly to item detail pages. The API Plan's dashboard endpoint returns recent items with full details (US-041), so leveraging this data for quick access provides value. Each recent item card should show thumbnail, name, category, and container just like the list view.
</questions>

---

**User**

1. Yes, dashboard should be default landing page after login.
2. Yes, in they should be accessible dedicated pages.
3. Use a top navigation bar for desktop that collapses to a hamburger menu on mobile.
4. Use separate pages for detail views.
5. Make search and filter controls persistent at the top of the items list on desktop, but collapsible on mobile.
6. Use a lightbox/modal overlay for full-size image viewing.
7. Require navigation to dedicated edit pages/forms rather than inline editing. 
8. Use inline validation next to fields with real-time feedback as users interact with each field, plus a summary banner at the top when submit is attempted with errors.
9.Persist filter state in localStorage across browser sessions, not just during the session. 
10. Include prominent quick action buttons in empty states
11. Use optimistic UI updates for simple operations but wait for server confirmation for complex operations.
12. Use modal dialogs for delete confirmations.
13.Use a bottom navigation bar for mobile.
14. Use a fixed aspect ratio with object-fit: cover for thumbnails in list views.
15. Use loading skeletons for list views and content areas, and spinners only for actions (buttons during submit).
16. Show individual progress indicators for each image upload and allow multiple images to be uploaded simultaneously.
17. Translate API error messages to user-friendly language on the frontend.
18. Yes, implement searchable/filterable dropdowns (combobox pattern) for container and category selection in item forms. 
19. Yes, display a badge on the dashboard navigation item showing the count of items currently out (when > 0). 
20.  Make recent items interactive and clickable, navigating directly to item detail pages.




---

**Cursor**

Thank you for confirming those decisions. Let me continue with the next set of questions and recommendations, building on the established UI architecture foundation.

<questions>
21. Should the items list view support multiple layout modes (grid view with large thumbnails vs. list view with smaller thumbnails and more metadata)?

Recommendation: Implement both grid and list view modes with a toggle button. Grid view emphasizes visual identification (useful when browsing), while list view shows more metadata at once (category, container, status). Store the preference in localStorage. This accommodates different use cases mentioned in the PRD - visual identification vs. quick information scanning.

22. Should the dashboard statistics (total items, containers, categories, items out) be static numbers or interactive elements that navigate to filtered views?

Recommendation: Make statistics interactive. Clicking "Items Out: 5" should navigate to the items list pre-filtered to show only items with isIn=false. Clicking "Total Containers: 12" navigates to the containers list. This provides quick access to relevant subsets of data and makes the dashboard more actionable.

23. Should the category and container selection dropdowns in forms show item counts next to each option?

Recommendation: Yes, display item counts next to category and container names in dropdowns (e.g., "Outdoor Gear (25)"). This information is already available from the API (itemCount field) and helps users make informed decisions when assigning items, especially when deciding which categories/containers to delete.

24. Should the image reordering interface (US-039) use drag-and-drop on desktop and a different pattern on mobile, or use a unified approach?

Recommendation: Use drag-and-drop on desktop (with mouse/trackpad) and on mobile (with touch). Modern libraries support both seamlessly. As a fallback for mobile, also provide up/down arrow buttons next to each image. This ensures the feature works reliably across all devices while providing the most intuitive interaction method available.

25. Should the application implement keyboard navigation and shortcuts for power users (e.g., "/" to focus search, "n" for new item)?

Recommendation: Yes, implement basic keyboard navigation for Phase 1: "/" to focus search, "Escape" to close modals/overlays, arrow keys for image gallery navigation, and "Enter" to submit forms. While not in PRD, this is a low-effort, high-value addition for desktop users. More advanced shortcuts (like "n" for new) can be added in later phases.

26. Should the "in/out" status toggle in item forms be a checkbox, radio buttons, or a toggle switch?

Recommendation: Use a toggle switch component (from Shadcn/ui) with clear labels "In" and "Out". Toggle switches are more intuitive for binary states than checkboxes, visually communicate the current state better than radio buttons, and work well on both desktop and mobile interfaces.

27. Should the application display a global loading state (progress bar at top of page) during API calls, or only local loading states?

Recommendation: Use both: a subtle progress bar at the very top of the page for navigation and data fetching, plus local loading states (skeletons, spinners) in specific areas. The top progress bar provides feedback during page transitions, while local states indicate specific operations. This follows modern web app patterns and sets clear expectations.

28. Should container and category edit forms be on separate pages or use the same page as the detail view with an "edit mode" toggle?

Recommendation: Use the same page with an edit mode toggle. Unlike items (which have many fields and images), containers and categories have simpler forms. An edit button on the detail view can switch the page to edit mode inline, reducing navigation overhead. This is especially beneficial on mobile where extra page transitions add friction.

29. Should the items list support bulk selection for future bulk operations, or omit this functionality since bulk operations are out of scope for Phase 1?

Recommendation: Omit bulk selection for Phase 1. The PRD explicitly excludes bulk operations (section 4.2), and adding selection UI without functionality creates confusion and maintenance overhead. Focus on perfecting single-item operations. Bulk selection can be added in a future phase when bulk operations are implemented.

30. Should the search field in the items list show search suggestions or recent searches as users type?

Recommendation: No, implement simple text search without suggestions for Phase 1. The API uses case-insensitive partial matching on item names (section 4.2 of API Plan), which is straightforward. Search suggestions would require additional API endpoints and complexity. Focus on making the basic search fast and responsive (300ms debounce as specified in US-025).

31. Should the application show the last updated timestamp on items, containers, and categories in list and detail views?

Recommendation: Show "created at" timestamp in detail views but not in list views. List views should prioritize essential information (thumbnail, name, category, container, status). The API returns both createdAt and updatedAt, but for Phase 1, creation date is more relevant. Updated timestamp is less meaningful when there's no edit history tracking (which is out of scope per section 4.2).

32. Should image upload areas support drag-and-drop in addition to click-to-browse on desktop?

Recommendation: Yes, implement drag-and-drop for image uploads on desktop. This is standard for modern file upload interfaces and significantly improves UX. Mobile browsers will automatically fall back to the native file picker. Use a clear drop zone with visual feedback (border highlight, text change) during drag operations.

33. Should the application implement route-based modal dialogs (with unique URLs) or component-state-based modals (no URL change)?

Recommendation: Use component-state-based modals without URL changes for Phase 1. Route-based modals add complexity and aren't necessary since we're using separate pages for detail/edit views (confirmed in question 4). Simple modals for delete confirmations, image lightbox, and error messages can be state-based. This keeps routing simple and navigation predictable.

34. Should the mobile bottom navigation show labels under icons or icons only?

Recommendation: Show both icons and labels in the bottom navigation on mobile. With only 4-5 sections (Dashboard, Items, Containers, Categories, Profile), there's sufficient space for both. Labels improve clarity and reduce cognitive load, especially for new users. This follows iOS and Android mobile design guidelines for primary navigation.

35. Should the application implement a "back to top" button for long scrollable lists?

Recommendation: Yes, implement a floating "back to top" button that appears after scrolling down in long lists (items, containers). This improves navigation efficiency, especially on mobile where scrolling back up is more tedious. The button should appear after scrolling ~2 viewport heights and smoothly scroll to the top when clicked.

36. Should form submission buttons be disabled during validation errors, or remain enabled with error feedback on click?

Recommendation: Keep submit buttons enabled but show validation errors when clicked with invalid data. Disabled buttons create confusion about why submission isn't possible. Following US-031, display inline field errors and a summary banner when submission is attempted. The button can show a loading spinner during API submission to prevent double-submission.

37. Should the quantity field for items use a standard number input or a specialized input with increment/decrement buttons?

Recommendation: Use a standard number input field with type="number". The quantity field is optional and should be simple. Increment/decrement buttons add visual complexity without significant benefit for this use case. Users can type values directly, which is faster for larger quantities. Mobile devices will show appropriate numeric keyboards.

38. Should the image gallery in lightbox mode support keyboard navigation (arrow keys) in addition to on-screen navigation?

Recommendation: Yes, implement keyboard navigation in the image lightbox: left/right arrows to navigate between images, Escape to close. This is essential for desktop accessibility and matches user expectations from other image gallery implementations. On mobile, swipe gestures handle navigation, while the close button remains available.

39. Should error messages for network failures (US-033) include automatic retry functionality or require manual retry via a button?

Recommendation: Provide a "Retry" button rather than automatic retry. Automatic retry can be frustrating if the network issue persists, and users may want to cancel or modify their action. The error message should clearly explain the issue ("Unable to connect. Check your internet connection.") with an obvious "Retry" button and an option to dismiss or cancel.

40. Should the application implement a confirmation dialog when users navigate away from forms with unsaved changes?

Recommendation: Yes, implement "unsaved changes" warning when navigating away from create/edit forms with modifications. Use the browser's beforeunload event for page navigation and custom logic for SPA navigation. This prevents accidental data loss, which is important given the multi-field forms with image uploads. The warning is standard UX practice for forms.
</questions>

---

**User**

21. Implement both grid and list view modes with a toggle button.
22. Make statistics interactive. 
23. Yes, display item counts next to category and container names in dropdowns.
24. Use drag-and-drop on desktop (with mouse/trackpad) and on mobile (with touch).
25. No, skip all keyboard navigation or shortcuts in phase 1.
26. Use a toggle switch component (from Shadcn/ui) with clear labels "In" and "Out".
27. Use both: a subtle progress bar at the very top of the page for navigation and data fetching, plus local loading states (skeletons, spinners) in specific areas. 
28. Use the same page with an edit mode toggle.
29. Omit bulk selection for Phase 1.
30. No, implement simple text search without suggestions for Phase 1.
31. Show "created at" timestamp in detail views but not in list views. 
32. Yes, implement drag-and-drop for image uploads on desktop.
33. Use component-state-based modals without URL changes for Phase 1. 
34. Show both icons and labels in the bottom navigation on mobile. With only 4 (Dashboard, Items, Containers, Categories)
35. Not in phase 1.
36. Keep submit buttons enabled but show validation errors when clicked with invalid data. 
37. Use a standard number input field with type="number".
38. Yes, implement keyboard navigation in the image lightbox: left/right arrows to navigate between images, Escape to close.
39. Provide a "Retry" button rather than automatic retry.
40. Yes, implement "unsaved changes" warning when navigating away from create/edit forms with modifications.


---

You are an AI assistant whose task is to summarize the conversation about UI architecture planning for MVP and prepare a concise summary for the next stage of development. In the conversation history you will find the following information:
1. Product Requirements Document (PRD)
2. Tech stack information
3. API plan
4. Conversation history containing questions and answers
5. UI architecture recommendations

Your task is to:
1. Summarize the conversation history, focusing on all decisions related to UI architecture planning.
2. Match the model's recommendations to the answers given in the conversation history. Identify which recommendations are relevant based on the discussion.
3. Prepare a detailed conversation summary that includes:
   a. Main UI architecture requirements
   b. Key views, screens, and user flows
   c. API integration and state management strategy
   d. Responsiveness, accessibility, and security considerations
   e. Any unresolved issues or areas requiring further clarification
4. Format the results in the following way:

<conversation_summary>
<decisions>
[List decisions made by the user, numbered].
</decisions>
<matched_recommendations>
[List of the most relevant recommendations matched to the conversation, numbered]
</matched_recommendations>
<ui_architecture_planning_summary>
[Provide a detailed conversation summary, including the elements listed in step 3].
</ui_architecture_planning_summary>
<unresolved_issues>
[List any unresolved issues or areas requiring further clarification, if any exist]
</unresolved_issues>
</conversation_summary>

The final output should contain only content in markdown format. Ensure your summary is clear, concise, and provides valuable information for the next stage of UI architecture planning and API integration.


---

**Cursor**

<conversation_summary>

<decisions>

## Navigation and Layout
1. Dashboard should be the default landing page after login
2. Category and container management accessible through dedicated pages in main navigation
3. Use a top navigation bar for desktop that collapses to a hamburger menu on mobile
4. Use a bottom navigation bar for mobile with 4 sections: Dashboard, Items, Containers, Categories (showing both icons and labels)
5. Use separate pages for detail views rather than modal overlays
6. Use component-state-based modals without URL changes for Phase 1 (for confirmations, lightbox)

## Items List View
7. Make search and filter controls persistent at the top of the items list on desktop, but collapsible on mobile
8. Implement both grid and list view modes with a toggle button (store preference in localStorage)
9. Persist filter state in localStorage across browser sessions
10. Show "created at" timestamp in detail views but not in list views
11. Use a fixed aspect ratio with object-fit: cover for thumbnails in list views
12. Omit bulk selection functionality for Phase 1

## Forms and Validation
13. Require navigation to dedicated edit pages/forms rather than inline editing for items
14. Use the same page with an edit mode toggle for containers and categories (simpler forms)
15. Use inline validation next to fields with real-time feedback, plus a summary banner at the top when submit is attempted with errors
16. Keep submit buttons enabled but show validation errors when clicked with invalid data
17. Implement "unsaved changes" warning when navigating away from create/edit forms with modifications
18. Use a standard number input field with type="number" for item quantity

## Form Components
19. Implement searchable/filterable dropdowns (combobox pattern) for container and category selection in item forms
20. Display item counts next to category and container names in dropdowns (e.g., "Outdoor Gear (25)")
21. Use a toggle switch component (from Shadcn/ui) with clear labels "In" and "Out" for status

## Image Management
22. Use a lightbox/modal overlay for full-size image viewing
23. Implement keyboard navigation in the image lightbox: left/right arrows to navigate between images, Escape to close
24. Use drag-and-drop for image reordering on both desktop (mouse/trackpad) and mobile (touch)
25. Implement drag-and-drop for image uploads on desktop (with visual feedback during drag)
26. Show individual progress indicators for each image upload and allow multiple images to be uploaded simultaneously (up to 5)

## Dashboard and Statistics
27. Make dashboard statistics interactive (clicking navigates to filtered views)
28. Display a badge on the dashboard navigation item showing the count of items currently out (when > 0)
29. Make recent items interactive and clickable, navigating directly to item detail pages
30. Include prominent quick action buttons in empty states

## Loading and Error States
31. Use loading skeletons for list views and content areas, and spinners only for actions (buttons during submit)
32. Use both: a subtle progress bar at the very top of the page for navigation and data fetching, plus local loading states (skeletons, spinners) in specific areas
33. Translate API error messages to user-friendly language on the frontend
34. Provide a "Retry" button rather than automatic retry for network errors

## UI Interactions
35. Use optimistic UI updates for simple operations (toggling in/out status, updating display order) but wait for server confirmation for complex operations (creating/deleting entities, uploading images)
36. Use modal dialogs for delete confirmations

## Features Excluded from Phase 1
37. No keyboard navigation shortcuts (e.g., "/" for search, "n" for new item)
38. No "back to top" button for long scrollable lists
39. No search suggestions or recent searches
40. No bulk operations or bulk selection UI

</decisions>

<matched_recommendations>

## Core Architecture Patterns
1. **Progressive Enhancement**: Use Astro's static rendering with React for interactive components (aligns with tech stack: Astro 5 + React 19)
2. **Mobile-First Responsive Design**: Start with mobile layout, enhance for desktop (PRD specifies mobile-responsive design as priority)
3. **Component Library**: Leverage Shadcn/ui for consistent UI components (specified in tech stack)
4. **Type Safety**: Use TypeScript 5 throughout for type-safe development

## State Management Strategy
5. **Local State**: Use React state for component-level interactions and form data
6. **URL State**: Use URL parameters for shareable filter states on list views
7. **Persistent State**: Use localStorage for user preferences (view mode, filter state)
8. **Server State**: Fetch fresh data from API endpoints, implement optimistic updates for simple operations
9. **Form State**: Use controlled components with real-time validation

## Layout and Navigation Structure
10. **Desktop Navigation**: Top horizontal navigation bar with logo, main sections, user profile/logout
11. **Mobile Navigation**: Bottom tab bar (Dashboard, Items, Containers, Categories) + hamburger for secondary items
12. **Consistent Header**: Logo and page title on all pages
13. **Breadcrumb Navigation**: Not necessary for Phase 1 due to flat hierarchy
14. **Footer**: Minimal or none for Phase 1

## View Hierarchy
15. **Dashboard** (default landing page)
    - Summary statistics cards (interactive)
    - Recent items section (clickable cards)
    - Quick action buttons
    - Badge showing items out count

16. **Items Section**
    - List view (with grid/list toggle)
    - Filters (persistent on desktop, collapsible on mobile)
    - Item detail page
    - Item create/edit page
    - Image gallery lightbox

17. **Containers Section**
    - List view
    - Container detail/edit page (inline edit mode)
    - Image management

18. **Categories Section**
    - List view (simple, alphabetical)
    - Inline edit mode for category details

## Component Specifications

### List View Components
19. **Item Card** (grid mode): Large thumbnail, name, category badge, container badge, in/out icon
20. **Item Row** (list mode): Small thumbnail, name, category, container, status, created date
21. **Filter Bar**: Search input, category multi-select, container multi-select, status toggle, clear filters button
22. **View Toggle**: Grid/list icon button with active state indicator
23. **Empty State**: Illustration/icon, message, prominent CTA button

### Form Components
24. **Text Input**: With inline error messages, character count for constrained fields
25. **Searchable Dropdown**: Combobox with filter, showing item counts
26. **Toggle Switch**: Clear visual state for in/out status
27. **Image Upload Zone**: Drag-and-drop area with click-to-browse fallback, preview thumbnails, progress bars
28. **Image Gallery Editor**: Drag-to-reorder (desktop/mobile), delete buttons, order indicators
29. **Number Input**: Standard HTML5 number input for quantity

### Modal Components
30. **Delete Confirmation**: Clear warning, entity name, item count (if deletion blocked), cancel/confirm buttons
31. **Image Lightbox**: Full-size image, navigation arrows, close button, image counter (e.g., "2 of 5")
32. **Error Dialog**: User-friendly message, retry button, dismiss option

### Loading States
33. **Skeleton Loader**: Match layout of content being loaded (cards, rows)
34. **Progress Bar**: Thin bar at top of viewport for page transitions
35. **Button Spinner**: Replace button text during submission
36. **Image Upload Progress**: Individual progress bar per image

## API Integration Patterns

### Authentication Flow
37. Use Supabase Auth for login/logout/registration
38. Store session token, include in Authorization header for API requests
39. Redirect to login page if authentication fails
40. Handle token refresh automatically via Supabase client

### Data Fetching Strategy
41. **Initial Page Load**: Fetch data server-side in Astro components where possible
42. **Client-Side Updates**: Use React components with fetch/SWR/React Query for dynamic updates
43. **Real-Time Filtering**: Debounce search input (300ms), trigger API call on filter changes
44. **Pagination**: Implement offset-based pagination (page/limit params)

### Error Handling
45. Catch API errors in try-catch blocks
46. Map error codes to user-friendly messages
47. Display inline errors for validation failures
48. Show modal/toast for network errors with retry option
49. Log errors for debugging (console.error in development)

### Optimistic Updates
50. **Simple Operations**: Update UI immediately, revert on error (e.g., toggle in/out status)
51. **Complex Operations**: Show loading state, update on success (e.g., create item, delete entity)
52. **Image Uploads**: Show progress, display uploaded images immediately on success

## Responsive Design Specifications

### Breakpoints
53. Mobile: < 768px (bottom nav, collapsible filters, stacked layouts)
54. Tablet: 768px - 1024px (adaptive layouts)
55. Desktop: > 1024px (top nav, persistent filters, multi-column layouts)

### Mobile Optimizations
56. Touch targets minimum 44x44 pixels
57. Bottom navigation for easy thumb access
58. Collapsible filter panel (slide-up drawer or expandable section)
59. Swipe gestures for image gallery
60. Native file picker for image uploads
61. Full-width forms with adequate spacing

### Desktop Enhancements
62. Multi-column grid layouts for items/containers
63. Hover states for interactive elements
64. Drag-and-drop for images
65. Wider forms with side-by-side field groups where appropriate

## Performance Considerations

### Image Optimization
66. Use API's thumbnail URLs for list views (smaller file size)
67. Lazy load images below the fold
68. Fixed aspect ratio prevents layout shift
69. WebP format where supported

### Loading Performance
70. Server-side render static content with Astro
71. Code-split React components (dynamic imports)
72. Debounce search input (300ms) to reduce API calls
73. Cache API responses in memory during session where appropriate

### User Experience
74. Loading skeletons prevent perceived blank states
75. Optimistic updates make app feel faster
76. Progress indicators set clear expectations
77. Local state updates (view mode, filters) are instant

## Data Flow and State Management

### Filter State Flow
78. User interacts with filter controls → Update local state → Debounce search text (300ms) → Trigger API call with all filter params → Update URL query params → Save to localStorage → Display filtered results

### Form Submission Flow
79. User fills form → Real-time inline validation → User clicks submit → Validate all fields → Show errors if invalid → API request with loading state → Handle success (redirect to detail view) or error (show message, keep form data) → Optionally update cache

### Image Upload Flow
80. User selects/drops files → Validate format and size → Create preview thumbnails → Upload files in parallel → Show individual progress bars → On success, add images to entity → On error, show per-file error messages

### Authentication Flow
81. User logs in via Supabase Auth → Session established → Token stored → Redirect to dashboard → Middleware validates token on protected routes → Inject user context → API calls include Authorization header

## Design System Foundations

### Color Scheme
82. Leverage Tailwind 4's CSS variables for theming
83. Primary color for CTAs and interactive elements
84. Neutral grays for text hierarchy
85. Semantic colors: success (green), error (red), warning (yellow), info (blue)
86. In/Out status: distinct colors or icons for clear differentiation

### Typography
87. Clear hierarchy: h1 (page title), h2 (section title), h3 (card title), body, caption
88. Use Tailwind's font utilities for consistency
89. Readable font sizes (minimum 16px for body on mobile)

### Spacing and Layout
90. Consistent spacing scale (Tailwind's spacing utilities)
91. Adequate white space between sections
92. Card-based design for list items, containers, statistics
93. Forms with clear field grouping and spacing

### Interactive States
94. Hover states for clickable elements (desktop)
95. Active/pressed states for all buttons
96. Focus states for keyboard navigation (outline, ring)
97. Disabled states with reduced opacity
98. Loading states with spinners or skeletons

## Security and Data Validation

### Client-Side Validation
99. Required field checks
100. String length validation (names, descriptions)
101. File type and size validation (images)
102. Format validation (ensure proper data types)
103. Display inline error messages for failed validation

### Server-Side Validation
104. All validation repeated on server (never trust client)
105. API returns structured error responses
106. Frontend translates error codes to user messages

### Data Integrity
107. Warn before navigation away from unsaved forms
108. Confirm destructive actions (delete)
109. Show clear error messages when deletion blocked (e.g., container has items)
110. Prevent double submission with button loading states

## Accessibility Considerations (Minimal for Phase 1)

### Basic Accessibility
111. Semantic HTML elements (nav, main, section, article)
112. Alt text for images (use item/container names)
113. Proper heading hierarchy
114. Form labels associated with inputs
115. Focus management for modals (trap focus, restore on close)
116. Keyboard navigation for lightbox (arrows, Escape)

### Intentionally Deferred
117. Full WCAG compliance (explicitly out of scope for Phase 1)
118. Screen reader optimization
119. High contrast mode
120. Reduced motion preferences

</matched_recommendations>

<ui_architecture_planning_summary>

# UI Architecture Planning Summary - Home Storage System MVP

## 1. Main UI Architecture Requirements

### Application Structure
The Home Storage System is a **mobile-responsive web application** built with **Astro 5** (for static page rendering) and **React 19** (for interactive components), styled with **Tailwind 4** and **Shadcn/ui** components. The architecture follows a **mobile-first approach** with progressive enhancement for desktop, utilizing **TypeScript 5** for type safety throughout.

### Core Architectural Decisions
- **Rendering Strategy**: Astro for server-side rendering of static content, React components for interactive features
- **State Management**: React state for component interactions, localStorage for user preferences, URL parameters for shareable filters
- **Routing**: File-based routing via Astro pages
- **Authentication**: Supabase Auth with JWT tokens, validated via Astro middleware
- **API Integration**: RESTful API endpoints (defined in api-plan.md), accessed from both server and client components

## 2. Key Views, Screens, and User Flows

### Navigation Structure

**Desktop Navigation:**
- Top horizontal bar with logo, main navigation links (Dashboard, Items, Containers, Categories), and user profile/logout
- Collapses to hamburger menu on mobile devices

**Mobile Navigation:**
- Bottom tab bar with 4 primary sections: Dashboard, Items, Containers, Categories
- Each tab shows icon + label for clarity
- Hamburger menu in header for secondary actions (profile, logout)

### Primary Views

#### 1. Dashboard (Default Landing Page)
**Purpose:** Provide overview and quick access to key functions

**Components:**
- **Summary Statistics Cards** (interactive, clicking navigates to filtered views)
  - Total Items
  - Total Containers
  - Total Categories
  - Items Out (with badge in navigation when > 0)
- **Recent Items Section** (5 most recently created items)
  - Clickable cards showing thumbnail, name, category, container
  - Navigate directly to item detail on click
- **Quick Action Buttons**
  - "Add New Item"
  - "Add Container"
  - "Add Category"

**User Flow:**
Login → Dashboard → Click statistic/recent item to navigate → OR → Click quick action to create

#### 2. Items Section

**Items List View:**
- **Dual Layout Modes:**
  - **Grid View**: Large thumbnails (fixed aspect ratio with object-fit: cover), item name below, category and container badges, in/out icon
  - **List View**: Small thumbnail, name, category, container, status icon in rows
  - Toggle button to switch modes (preference stored in localStorage)

- **Filter Controls:**
  - **Desktop**: Persistent filter bar at top with search input, category dropdown, container dropdown, status toggle, clear filters button
  - **Mobile**: Collapsible filter panel (expandable with button)
  - Real-time filtering with 300ms debounce on search
  - Filter state persists in localStorage and URL query parameters
  - All filters combine with AND logic

- **Loading States**: Skeleton loaders matching grid/list layout
- **Empty State**: Icon/illustration, message, "Create Your First Item" button

**Item Detail View:**
- Full image gallery (all up to 5 images)
- Image lightbox on click (modal overlay with keyboard navigation: arrows, Escape)
- Item name (large heading)
- Category badge (clickable to filter by category)
- Container badge (clickable to filter by container)
- In/Out status with visual indicator
- Description (full text)
- Quantity
- Created timestamp
- Action buttons: Edit, Delete

**Item Create/Edit Page:**
- Dedicated form page (not inline editing)
- **Fields:**
  - Name (text input, required)
  - Category (searchable dropdown with item counts, required)
  - Container (searchable dropdown with item counts, required)
  - Status (toggle switch "In"/"Out", required, defaults to "In")
  - Description (textarea, optional)
  - Quantity (number input, optional)
  - Images (drag-drop upload zone, up to 5 images, drag to reorder)
  
- **Validation:**
  - Inline validation with real-time feedback as users interact
  - Summary error banner at top if submit attempted with errors
  - Submit button remains enabled (shows errors on click)
  
- **Image Upload:**
  - Drag-drop zone on desktop with visual feedback
  - Click to browse fallback
  - Simultaneous upload of multiple files (up to 5)
  - Individual progress bars per image
  - Preview thumbnails with drag-to-reorder and delete buttons
  
- **Form Behavior:**
  - Pre-populates with existing data on edit
  - "Unsaved changes" warning if navigating away
  - Spinner on submit button during API call
  - Redirect to detail view on success

**User Flows:**

*Creating an Item:*
1. Dashboard/Items List → Click "Add Item" button
2. Fill form (ensure categories and containers exist first)
3. Upload images (optional)
4. Submit → Loading state → Redirect to item detail view
5. If error: Show message, keep form data, offer retry

*Finding and Editing an Item:*
1. Items List → Apply filters/search (300ms debounce)
2. Click item card → Item Detail View
3. Click "Edit" → Item Edit Page (form pre-populated)
4. Modify fields, reorder/add/remove images
5. Submit → Update → Redirect to detail view

*Deleting an Item:*
1. Item Detail View → Click "Delete"
2. Modal confirmation dialog → Confirm
3. API call → Success → Redirect to items list with confirmation message

#### 3. Containers Section

**Containers List View:**
- Similar to items list (grid/list toggle)
- Each container shows: thumbnail, name, item count
- Sorted by creation date or alphabetically
- Empty state with "Add Container" CTA

**Container Detail/Edit View:**
- **Inline Edit Mode**: Same page toggles between view and edit mode (click "Edit" button)
- **View Mode:**
  - Image gallery (up to 5 images)
  - Container name
  - Description
  - Item count
  - List of items in container (clickable)
  - Edit and Delete buttons
  
- **Edit Mode:**
  - Name input field
  - Description textarea
  - Image upload/management (same as items)
  - Save and Cancel buttons
  
**User Flow:**
Containers List → Click container → Detail View → Click "Edit" → Edit Mode → Modify → Save → View Mode updated

#### 4. Categories Section

**Categories List View:**
- Simple list (alphabetical order)
- Each category shows: name, item count
- Inline "Edit" and "Delete" icons/buttons
- "Add Category" button at top
- Empty state with "Add Category" CTA

**Category Edit (Inline):**
- Click edit → Name field becomes editable input
- Save/Cancel buttons appear
- Real-time validation (unique name, required)
- On save: API call → Update list

**Delete Flow:**
- Click delete → Modal confirmation
- If category has items: Error message in modal "Cannot delete [name] because it contains X items"
- If empty: Confirm → Delete → Remove from list

**User Flow:**
Categories List → Click "Add Category" → Inline form appears → Enter name → Save → Added to list

### Cross-Cutting User Flows

**Empty State Onboarding:**
1. New user logs in → Dashboard (empty)
2. Clicks "Add Item" → Item Form
3. Sees empty category/container dropdowns
4. Error message: "Create categories and containers first"
5. Links to create category and container pages
6. User creates category and container
7. Returns to item creation

**Filter State Persistence:**
1. User applies filters on items list → URL updated with query params → Saved to localStorage
2. User navigates away → Returns to items list → Filters restored from localStorage
3. User shares URL → Recipient sees same filtered view (from query params)

## 3. API Integration and State Management Strategy

### API Integration Architecture

**Authentication Layer:**
- Supabase Auth handles login/logout/registration
- JWT tokens stored and managed by Supabase client
- Astro middleware validates tokens on protected routes
- All API requests include `Authorization: Bearer <token>` header
- Row-Level Security (RLS) on database ensures data isolation per user

**Data Fetching Patterns:**

1. **Server-Side Fetching (Astro Components):**
   - Initial page loads fetch data server-side where possible
   - Reduces client-side JavaScript
   - Better SEO and initial load performance

2. **Client-Side Fetching (React Components):**
   - Used for interactive features (filtering, searching, real-time updates)
   - Implement with fetch API or React Query/SWR for caching
   - Handle loading and error states explicitly

3. **API Request Flow:**
   ```
   Component → Request with filters → API Endpoint (validates token) 
   → Service Layer → Database (RLS enforced) → Response 
   → Update Component State → Render
   ```

**State Management Strategy:**

1. **Local Component State (React useState/useReducer):**
   - Form inputs
   - Modal open/close
   - Temporary UI states (hover, focus)
   - Filtered data before API response

2. **Persistent State (localStorage):**
   - User preferences: view mode (grid/list)
   - Filter state (search term, selected categories/containers, status)
   - Theme preferences (if implemented)
   - **Key format**: `storage-app-<feature>-<key>` (e.g., `storage-app-items-view-mode`)

3. **URL State (Query Parameters):**
   - Current filter parameters (shareable)
   - Pagination state (page number)
   - Sort options (field, order)
   - **Synced with localStorage** on changes

4. **Server State (API Data):**
   - Items, containers, categories, dashboard stats
   - Fetched from API, cached temporarily
   - Invalidated on mutations (create, update, delete)

**Optimistic Updates:**

- **Simple Operations** (immediate UI update, revert on error):
  - Toggle in/out status
  - Reorder images (drag-drop)
  - Inline category name edit

- **Complex Operations** (wait for API confirmation):
  - Create new item/container/category
  - Delete entity
  - Upload images
  - Update with multiple fields

**Error Handling Strategy:**

1. **Network Errors:**
   - Catch in try-catch blocks
   - Display user-friendly modal/toast: "Unable to connect. Check your internet connection."
   - Provide "Retry" button
   - Preserve form data

2. **Validation Errors (400):**
   - Parse API error response
   - Display inline errors next to relevant fields
   - Show summary banner at top of form
   - Keep form in editable state

3. **Business Logic Errors (409):**
   - e.g., "Cannot delete [Container Name] because it contains 15 items"
   - Display in modal dialog with clear explanation
   - Provide guidance on resolution

4. **Authentication Errors (401):**
   - Clear session
   - Redirect to login page
   - Preserve intended destination for post-login redirect

5. **Not Found Errors (404):**
   - Display "Resource not found" message
   - Provide navigation to relevant list view

**Caching Strategy:**

- **Categories and Containers**: Cache for session duration, invalidate on mutations
- **Items List**: Short cache (1-2 minutes), invalidate on item mutations
- **Dashboard Stats**: Cache for 5 minutes, acceptable slight staleness
- **Detail Views**: Fetch fresh on navigation, cache during session

**API Call Patterns:**

1. **List with Filtering:**
   ```
   GET /api/items?page=1&limit=20&search=tent&category=uuid1,uuid2&status=in&sort=created_at&order=desc
   ```
   - Debounce search input (300ms)
   - Combine all active filters
   - Update URL and localStorage

2. **Create Entity:**
   ```
   POST /api/items
   Body: { name, categoryId, containerId, isIn, description, quantity }
   ```
   - Validate client-side before API call
   - Show loading state
   - On success: redirect to detail view, invalidate items list cache
   - On error: display errors, keep form data

3. **Upload Images:**
   ```
   POST /api/items/:id/images
   Content-Type: multipart/form-data
   ```
   - Upload files in parallel
   - Show individual progress bars
   - On success: add image to UI
   - On error: show per-file error message

4. **Optimistic Toggle:**
   ```
   PATCH /api/items/:id
   Body: { isIn: !currentStatus }
   ```
   - Update UI immediately
   - API call in background
   - Revert UI if API call fails

## 4. Responsiveness, Accessibility, and Security Considerations

### Responsiveness

**Breakpoint Strategy:**
- **Mobile**: < 768px
  - Bottom tab navigation (4 items)
  - Single column layouts
  - Collapsible filters (expandable panel)
  - Stacked form fields
  - Touch-optimized interactions (44px minimum touch targets)
  - Full-width cards
  
- **Tablet**: 768px - 1024px
  - Adaptive grid (2 columns for items/containers)
  - Top navigation bar appears
  - Filters start to show persistently
  - Side-by-side form fields where appropriate
  
- **Desktop**: > 1024px
  - Multi-column grids (3-4 columns)
  - Persistent filter sidebar/bar
  - Hover states and interactions
  - Wider forms with grouped fields
  - Drag-and-drop optimizations

**Mobile-Specific Optimizations:**
- **Navigation**: Bottom tab bar for easy thumb access
- **Filters**: Slide-up drawer or expandable panel
- **Forms**: Full-width inputs, adequate spacing between fields
- **Image Gallery**: Swipe gestures for navigation
- **File Upload**: Native camera/photo picker integration
- **Touch Interactions**: 44x44px minimum touch targets, appropriate tap delays
- **Viewport**: Meta viewport tag for proper scaling

**Desktop Enhancements:**
- **Hover States**: Interactive feedback for clickable elements
- **Drag-and-Drop**: Image reordering and uploads
- **Multi-Column**: Efficient use of screen space
- **Keyboard Shortcuts**: Image lightbox navigation (arrows, Escape)
- **Wider Modals**: Better use of screen real estate

**Image Handling:**
- **Thumbnails**: Fixed aspect ratio (e.g., 16:9 or 1:1) with object-fit: cover
- **Lazy Loading**: Images below the fold load on scroll
- **Responsive Images**: Serve appropriate sizes (thumbnail in list, full-size in detail)
- **Format**: WebP with JPEG/PNG fallback

### Accessibility (Minimal for Phase 1)

**In Scope:**
- **Semantic HTML**: Proper use of nav, main, section, article, header, footer
- **Heading Hierarchy**: Logical h1 → h2 → h3 structure on each page
- **Form Labels**: All inputs have associated labels (explicit or aria-label)
- **Alt Text**: Images use item/container names as alt text
- **Focus Management**:
  - Visible focus indicators (outline/ring)
  - Trap focus in modals
  - Restore focus when modal closes
  - Return focus to trigger element
- **Keyboard Navigation**:
  - Image lightbox: arrow keys, Escape to close
  - Modals: Escape to close, Tab to cycle through buttons
  - Forms: Tab order follows visual order
- **Color Contrast**: Use Tailwind's default colors (generally WCAG AA compliant)
- **Touch Targets**: Minimum 44x44px on mobile

**Explicitly Out of Scope for Phase 1:**
- Full WCAG 2.1 AA/AAA compliance
- Screen reader optimization (ARIA labels, live regions, announcements)
- High contrast mode
- Reduced motion preferences
- Keyboard-only navigation throughout app
- Comprehensive keyboard shortcuts

**Future Considerations:**
- Add ARIA labels and descriptions for complex components
- Implement skip links
- Add screen reader announcements for dynamic updates
- Test with screen readers (NVDA, JAWS, VoiceOver)

### Security Considerations

**Authentication and Authorization:**
- **Supabase Auth**: Industry-standard JWT-based authentication
- **Token Validation**: Astro middleware validates tokens on every protected route
- **Session Management**: Secure HTTP-only cookies or localStorage (configured in Supabase)
- **Password Requirements**: Minimum 8 characters (Supabase default)
- **Row-Level Security**: PostgreSQL RLS policies ensure users only access own data

**Input Validation:**
- **Client-Side** (first line of defense, UX benefit):
  - Required field checks
  - String length limits (names, descriptions)
  - File type and size validation
  - Format validation (email, numbers)
- **Server-Side** (authoritative, security boundary):
  - All client validation repeated
  - Parameterized queries via Supabase client
  - Sanitization of user inputs
  - Business logic validation (e.g., category uniqueness)

**Image Upload Security:**
- **File Type Validation**: Accept only JPEG, PNG, WebP
- **File Size Limit**: 5MB maximum per image
- **Count Limit**: 5 images per entity
- **Storage**: Supabase Storage with user-scoped paths (`user_id/entity_type/entity_id/`)
- **Filename Sanitization**: Use generated UUIDs, not user-provided filenames

**API Security:**
- **HTTPS Only**: All production traffic encrypted
- **CORS Configuration**: Restrict to authorized domains
- **Rate Limiting**: (Future consideration) Implement on API endpoints
- **SQL Injection Prevention**: Use Supabase client with parameterized queries
- **XSS Prevention**: React escapes output by default, sanitize user HTML if needed
- **CSRF Protection**: Supabase handles via token validation

**Data Integrity:**
- **Referential Integrity**: Database foreign key constraints (ON DELETE RESTRICT)
- **Unique Constraints**: Category names unique per user (case-insensitive)
- **Confirmation Dialogs**: Require confirmation for destructive actions (delete)
- **Unsaved Changes Warning**: Prevent accidental data loss in forms

**Error Handling:**
- **Generic Error Messages**: Don't expose internal system details to users
- **Logging**: Log detailed errors server-side for debugging
- **User-Friendly Messages**: Translate technical errors to helpful language
- **No Sensitive Data**: Never log or expose tokens, passwords, or sensitive user data

## 5. Technical Implementation Details

### Component Architecture

**Astro Pages** (Server-Rendered):
- `src/pages/index.astro` - Dashboard
- `src/pages/items/index.astro` - Items list
- `src/pages/items/[id].astro` - Item detail
- `src/pages/items/new.astro` - Create item
- `src/pages/items/[id]/edit.astro` - Edit item
- `src/pages/containers/index.astro` - Containers list
- `src/pages/containers/[id].astro` - Container detail/edit
- `src/pages/categories/index.astro` - Categories list
- `src/pages/login.astro` - Login page
- `src/pages/register.astro` - Registration page

**React Components** (Interactive):
- `ItemsList.tsx` - Filterable items list with grid/list toggle
- `ItemCard.tsx` - Item display in grid/list view
- `FilterBar.tsx` - Search and filter controls
- `ItemForm.tsx` - Create/edit item form with validation
- `ImageUploader.tsx` - Drag-drop upload with progress bars
- `ImageGallery.tsx` - Image display with reordering
- `ImageLightbox.tsx` - Full-size image viewer modal
- `CategorySelector.tsx` - Searchable category dropdown
- `ContainerSelector.tsx` - Searchable container dropdown
- `StatusToggle.tsx` - In/Out toggle switch
- `DeleteConfirmationModal.tsx` - Confirmation dialog
- `LoadingSkeleton.tsx` - Skeleton loader components
- `EmptyState.tsx` - Empty state with CTA

**Shared Components** (Shadcn/ui):
- Button, Input, Textarea, Label
- Select, Combobox, Toggle
- Dialog (Modal), Alert
- Card, Badge
- Progress, Skeleton
- Dropdown Menu, Tabs

### Data Flow Examples

**Example 1: Filtering Items**
```
User types in search → 
Update local state (React) → 
Debounce 300ms → 
Construct API URL with all filters → 
Update URL query params → 
Save to localStorage → 
Call GET /api/items?... → 
Display loading skeleton → 
Receive response → 
Update items state → 
Render filtered list
```

**Example 2: Creating an Item**
```
User navigates to /items/new → 
Page loads with form (fetch categories and containers for dropdowns) → 
User fills form (real-time inline validation) → 
User uploads images (progress bars) → 
User clicks Submit → 
Validate all fields → 
If invalid: show inline errors + summary banner → 
If valid: Show spinner on button → 
POST /api/items → 
Receive response with created item → 
Invalidate items list cache → 
Redirect to /items/[id] (detail view) → 
Show success toast
```

**Example 3: Optimistic Status Toggle**
```
User clicks In/Out toggle on item detail → 
Immediately update UI (optimistic) → 
PATCH /api/items/[id] { isIn: newStatus } → 
If success: no additional action needed → 
If error: Revert UI, show error toast with "Retry" → 
Invalidate items list cache
```

### Performance Optimization

**Initial Load:**
- Server-render static content with Astro
- Minimize JavaScript bundle size
- Code-split React components (lazy load)
- Inline critical CSS

**Runtime:**
- Debounce search input (300ms)
- Throttle scroll events (if needed for infinite scroll in future)
- Use loading skeletons for perceived performance
- Implement optimistic updates for instant feedback

**Images:**
- Use thumbnail URLs for list views (smaller files)
- Lazy load images below fold
- Serve WebP with fallback
- Fixed aspect ratio prevents layout shift

**Caching:**
- Cache category/container lists during session
- Short cache for items list
- Cache dashboard stats with timeout

**API Efficiency:**
- Pagination to limit data transfer (page size 20-100)
- Return only necessary fields in list views
- Batch image uploads

### Error Scenarios and Handling

**Scenario 1: Network Failure During Form Submission**
- User submits form → Network error
- Display modal: "Unable to connect. Check your internet connection."
- Provide "Retry" button
- Keep form data intact
- On retry: attempt submission again

**Scenario 2: Validation Error from API**
- User submits form → API returns 400 with validation errors
- Parse error response: `{ error: { details: [{ field: 'name', message: '...' }] } }`
- Display inline error next to 'name' field
- Show summary banner at top: "Please fix the errors below"
- Focus on first invalid field

**Scenario 3: Attempting to Delete Container with Items**
- User clicks Delete on container detail → Confirmation modal
- User confirms → DELETE /api/containers/[id]
- API returns 409: "Cannot delete [name] because it contains 15 items"
- Display error in modal with explanation
- Close modal on dismiss
- User remains on detail page

**Scenario 4: Session Expiration During Use**
- User makes API request → Token expired (401)
- Middleware/client detects 401
- Clear local session
- Redirect to login page
- Store intended destination
- After re-login: redirect to intended page

**Scenario 5: Image Upload Failure**
- User uploads 3 images → 2 succeed, 1 fails (file too large)
- Show success for 2 images (thumbnails appear)
- Show error for 1 image: "File exceeds 5MB limit"
- Allow user to remove failed upload and try again
- Form remains valid (images are optional)

### Testing Considerations

**Manual Testing Checklist:**
- Test all user flows on mobile (iOS Safari, Android Chrome)
- Test all user flows on desktop (Chrome, Firefox, Safari)
- Test form validation (client and server)
- Test error scenarios (network failures, validation errors, business logic conflicts)
- Test image upload (various file types and sizes)
- Test filter combinations and persistence
- Test authentication flows (login, logout, session expiration)
- Verify data isolation (users only see their own data)

**Automated Testing (Future):**
- Unit tests for validation logic and utilities
- Integration tests for API endpoints
- E2E tests for critical user flows (create item, filter, delete)
- Visual regression tests for UI components

</ui_architecture_planning_summary>

<unresolved_issues>

## Technical Decisions Requiring Further Clarification

1. **React State Management Library**: Should the app use a state management library (React Query, SWR, Zustand) or rely on built-in React state? For Phase 1 with simple requirements, vanilla React state may suffice, but a library like React Query could simplify caching and error handling.

2. **Image Thumbnail Generation**: Should thumbnails be generated client-side (before upload) or server-side (after upload to Supabase Storage)? Server-side is more reliable but adds complexity. Client-side is faster for preview but may have inconsistent results.

3. **Form Library**: Should forms use a library like React Hook Form for validation and state management, or build custom form handling? React Hook Form could simplify complex forms and validation but adds a dependency.

4. **Toast/Notification System**: What component/library should be used for success/error notifications (toasts)? Shadcn/ui includes a Toast component, but implementation details need definition.

5. **Loading Progress Bar**: What library should be used for the top-of-page loading progress bar (e.g., NProgress, custom implementation)?

6. **Icon Library**: Which icon library should be used (Lucide, Heroicons, Phosphor)? Shadcn/ui typically uses Lucide React.

7. **Date Formatting**: How should timestamps be formatted in the UI (e.g., "Jan 15, 2026" vs "2 days ago")? Should a library like date-fns be used?

8. **Pagination UI**: What should the pagination controls look like (previous/next only, page numbers, infinite scroll)? The API supports offset-based pagination but UI pattern needs definition.

9. **Profile/Settings Page**: What features should be included on the profile/settings page? The PRD doesn't specify, but navigation includes a Profile option.

10. **Password Reset Flow**: What pages and UI are needed for the password reset flow (US-004)? This flow is in the PRD but not detailed in the UI plan.

11. **Initial Categories/Containers**: Should the app seed new users with default categories/containers, or require them to create everything from scratch?

12. **Image Lightbox Library**: Should a library be used for the image lightbox (e.g., react-image-lightbox, photoswipe) or build custom?

13. **Drag-and-Drop Library**: What library should be used for drag-and-drop (react-beautiful-dnd, dnd-kit)? Needs to support both desktop and mobile touch.

14. **Color Scheme**: What specific colors should be used for primary, secondary, success, error, etc.? Tailwind defaults or custom brand colors?

15. **Logo and Branding**: Does the application have a logo, name, and brand identity? This affects header, favicon, etc.

## Feature Scope Clarifications

16. **Registration Flow**: Should new user registration include email verification? The PRD mentions registration (US-001) but not verification.

17. **Search Scope**: Should search only match item names, or also search descriptions, category names, container names? API Plan specifies name only, but this may limit usefulness.

18. **Container List Filtering**: Should the containers list support filtering/searching similar to items? PRD doesn't specify but could be useful.

19. **Category Sorting**: Should categories support sorting beyond alphabetical (e.g., by item count, recently used)? PRD specifies alphabetical only.

20. **Dashboard Recent Items**: How many recent items should show on the dashboard? API Plan shows 5 in example but not specified as a requirement.

21. **Item Quantity Display**: How should quantity be displayed in list views (always show, only show if > 1, hide)? PRD says quantity is optional.

22. **Empty Container/Category Deletion**: Should empty containers/categories have a quick "delete" action in the list view, or only on detail page?

23. **Image Display Order**: When images are reordered, should the change save immediately (optimistic update) or require a "Save" button?

24. **Mobile Camera**: Should the mobile upload trigger the camera by default or ask user to choose between camera and photo library?

25. **Filter Clear Behavior**: Should "Clear Filters" reset to default state or clear all (including localStorage)?

## Design and UX Details

26. **Card vs. Table Layout**: For list view mode, should it be a table with columns or cards in a single column?

27. **Badge Styling**: How should category and container badges be visually differentiated (color, icon, shape)?

28. **In/Out Status Visual**: Beyond the toggle switch in forms, how should in/out status be displayed in list/detail views (icon, color, text, badge)?

29. **Loading Skeleton Styling**: Should skeletons animate (pulse, shimmer) or be static?

30. **Modal Animation**: Should modals fade in, slide up, or use another animation?

31. **Empty State Illustrations**: Should empty states include custom illustrations or just icons/text?

32. **Error Message Style**: Should validation errors be red text below fields, tooltips, or inline alerts?

33. **Form Layout**: Should forms be single column on all devices, or use multi-column on desktop?

34. **Image Gallery Layout**: Should the image gallery in detail view show all images in a row/grid, or one large image with thumbnails?

35. **Container/Category Item List**: In container/category detail views, how should the list of items be displayed (simple list, cards, table)?

## Data and API Questions

36. **Initial Data Load**: Should the dashboard make separate API calls for each statistic or have a single `/api/dashboard` endpoint that returns everything? API Plan shows `/api/dashboard/stats` but could consolidate.

37. **Dropdown Data Loading**: Should category and container dropdowns load data when the form opens, or preload on page load?

38. **Stale Data Handling**: If a user has the app open for hours, should data auto-refresh periodically or only on user action?

39. **Image Reorder API**: How does the API handle image reordering? Does it accept a PATCH with all new orders or individual updates?

40. **Delete Cascade Clarity**: When an item is deleted, the API Plan says images are removed from storage. Is this automatic via database trigger or explicit in the API endpoint?

</unresolved_issues>

</conversation_summary>

