# View Implementation Plan: Dashboard

## 1. Overview

The Dashboard view serves as the default landing page after user authentication. It provides an at-a-glance overview of the storage system with summary statistics, quick access to main features through action buttons, and displays the 5 most recently added items. The view acts as the central hub for navigation and gives users immediate insight into the current state of their storage system.

**Key Purposes:**
- Display aggregated statistics (total items, containers, categories, items out)
- Provide quick access to create new items, containers, and categories
- Show recent activity through the latest items
- Enable navigation to detailed views via clickable statistic cards

## 2. View Routing

**Path:** `/` (root path, default landing page after login)

**Route Configuration:**
- Accessible only to authenticated users (enforced by Astro middleware)
- Unauthenticated users redirected to login page
- No query parameters required
- Server-side rendering with dynamic data fetching

## 3. Component Structure

```
DashboardPage (index.astro)
├── Layout (Layout.astro)
│   ├── Header with Navigation
│   └── Main Content Area
│       ├── Page Header (h1: "Dashboard")
│       ├── Statistics Section
│       │   └── StatsGrid (React component)
│       │       ├── StatCard (Total Items)
│       │       ├── StatCard (Total Containers)
│       │       ├── StatCard (Total Categories)
│       │       └── StatCard (Items Out)
│       ├── Quick Actions Section
│       │   └── QuickActions (Astro component)
│       │       ├── Button (Add New Item)
│       │       ├── Button (Add Container)
│       │       └── Button (Add Category)
│       └── Recent Items Section
│           └── RecentItems (React component)
│               ├── Section Header (h2: "Recently Added Items")
│               ├── RecentItemCard (× 5)
│               │   ├── Thumbnail Image
│               │   ├── Item Name
│               │   ├── Category Badge
│               │   └── Container Badge
│               └── EmptyState (when no items)
```

## 4. Component Details

### DashboardPage (index.astro)

**Component Description:**
The main page component that orchestrates the entire dashboard view. It fetches dashboard data server-side, handles loading and error states, and composes all child components. This is an Astro component that provides the page structure and passes data to interactive React components.

**Main Elements:**
- `<Layout>` wrapper providing consistent page structure
- `<main>` element with semantic HTML
- `<h1>` page heading: "Dashboard"
- `<section>` for statistics with `<StatsGrid>` component
- `<section>` for quick actions with `<QuickActions>` component
- `<section>` for recent items with `<RecentItems>` component
- Loading skeleton states (during data fetch)
- Error message container (if data fetch fails)

**Handled Events:**
- None directly (server-side rendered, data fetched in frontmatter)

**Validation Conditions:**
- Verify user authentication (via `context.locals.user`)
- Handle API response validation
- Check if dashboard data structure matches expected `DashboardStatsDTO`

**Types:**
- `DashboardStatsDTO` (from `src/types.ts`)
- `RecentItemDTO` (from `src/types.ts`)

**Props:**
- None (root page component)

---

### StatsGrid (React Component)

**Component Description:**
A responsive grid container that displays four clickable statistic cards. Each card represents a key metric (total items, total containers, total categories, items out). The grid adapts from a single column on mobile to a 2×2 grid on larger screens. This component manages the layout and passes click handlers to individual stat cards.

**Main Elements:**
- Container `<div>` with responsive grid layout (CSS Grid or Flexbox)
- Four `<StatCard>` components, each configured with:
  - Icon (from icon library, e.g., Lucide React)
  - Label (e.g., "Total Items")
  - Count value (number)
  - Navigation path (e.g., "/items")
  - Variant/color theme (optional differentiation)

**Handled Events:**
- Click events on stat cards trigger navigation (handled by child `StatCard` components)

**Validation Conditions:**
- Ensure all numeric values are non-negative
- Handle undefined or null counts gracefully (display 0)

**Types:**
- `DashboardStatsDTO` (received as props)
- Internal type for stat card configuration:
  ```typescript
  type StatCardConfig = {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    count: number;
    href: string;
    variant?: 'default' | 'warning'; // 'warning' for items out
  }
  ```

**Props:**
```typescript
interface StatsGridProps {
  totalItems: number;
  totalContainers: number;
  totalCategories: number;
  itemsOut: number;
  isLoading?: boolean;
}
```

---

### StatCard (React Component)

**Component Description:**
An individual statistic card that displays an icon, numeric value, and label. The card is interactive (clickable) and navigates to the corresponding section when clicked. It includes hover effects, keyboard accessibility, and visual feedback. The card can also display a "warning" variant when showing items out count (if > 0).

**Main Elements:**
- Clickable container: `<a>` or `<Link>` element wrapping the card
- Icon container: `<div>` with icon component
- Count display: `<span>` or `<p>` with large numeric text
- Label: `<span>` or `<p>` with descriptive text
- Optional badge: For items out count when > 0

**Handled Events:**
- `onClick`: Navigate to target path (e.g., `/items`, `/containers`, `/categories`)
- `onKeyDown`: Handle Enter/Space for keyboard navigation

**Validation Conditions:**
- Count must be a non-negative number
- `href` must be a valid path string
- Label must not be empty

**Types:**
```typescript
interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  href: string;
  variant?: 'default' | 'warning';
}
```

**Props:**
As defined in the interface above.

---

### QuickActions (Astro Component)

**Component Description:**
A static section containing three action buttons for creating new items, containers, and categories. This component uses Astro for static rendering since it requires no client-side state. Buttons use the shadcn/ui Button component with appropriate variants and icons.

**Main Elements:**
- Container `<section>` with heading "Quick Actions" (optional, or integrated into layout)
- Three `<Button>` components from shadcn/ui:
  - "Add New Item" (primary variant, large size, icon: Plus)
  - "Add Container" (outline variant, icon: Box)
  - "Add Category" (outline variant, icon: Tag)

**Handled Events:**
- Button clicks navigate to respective creation pages:
  - Add Item → `/items/new`
  - Add Container → `/containers/new`
  - Add Category → `/categories/new`

**Validation Conditions:**
- None (static navigation links)

**Types:**
- None specific (uses standard Astro and Button component types)

**Props:**
- None

---

### RecentItems (React Component)

**Component Description:**
Displays a list of the 5 most recently added items in card format. Each item card shows a thumbnail, name, category badge, and container badge. The component handles both the populated state (with items) and empty state (no items exist). It provides visual feedback and navigation to item detail pages.

**Main Elements:**
- Section header: `<h2>` with text "Recently Added Items"
- Container `<div>` for item cards grid/list
- Five (or fewer) `<RecentItemCard>` components
- `<EmptyState>` component when no items exist
- Loading skeleton cards while data is being fetched

**Handled Events:**
- Click on item card navigates to item detail page (`/items/:id`)

**Validation Conditions:**
- Verify `recentItems` array is valid (may be empty)
- Ensure each item has required fields (id, name, category, container)
- Handle missing thumbnail gracefully (use placeholder image)

**Types:**
- `RecentItemDTO[]` (from `src/types.ts`)
  ```typescript
  interface RecentItemDTO {
    id: string;
    name: string;
    thumbnail: string | null;
    category: string;
    container: string;
    isIn: boolean;
    createdAt: string;
  }
  ```

**Props:**
```typescript
interface RecentItemsProps {
  items: RecentItemDTO[];
  isLoading?: boolean;
}
```

---

### RecentItemCard (React Component)

**Component Description:**
A card component representing a single recently added item. It displays a thumbnail image, item name, category badge, and container badge. The card is clickable and navigates to the item's detail page. It includes hover effects and keyboard accessibility.

**Main Elements:**
- Clickable container: `<a>` or `<Link>` wrapper
- Thumbnail: `<img>` element with fallback for missing images
- Item name: `<h3>` or `<p>` with item name text
- Category badge: `<span>` or Badge component with category name
- Container badge: `<span>` or Badge component with container name
- Optional status indicator: Icon or badge showing if item is in/out

**Handled Events:**
- `onClick`: Navigate to `/items/:id`
- `onKeyDown`: Handle Enter/Space for keyboard navigation

**Validation Conditions:**
- `id` must be a valid UUID string
- `name` must not be empty
- `category` and `container` must not be empty
- `thumbnail` can be null (use placeholder)

**Types:**
```typescript
interface RecentItemCardProps {
  item: RecentItemDTO;
}
```

**Props:**
As defined in the interface above.

---

### EmptyState (React/Astro Component)

**Component Description:**
A friendly message and call-to-action displayed when no items exist in the system. It encourages users to create their first item and provides a prominent "Add First Item" button.

**Main Elements:**
- Container `<div>` with centered content
- Icon: Large illustrative icon (e.g., Inbox, Package)
- Heading: `<h3>` with text like "No items yet"
- Description: `<p>` with text like "Get started by adding your first item"
- Action button: Primary `<Button>` with text "Add First Item"

**Handled Events:**
- Button click navigates to `/items/new`

**Validation Conditions:**
- None (static content)

**Types:**
- None specific

**Props:**
- None (or optional custom message props)

---

### LoadingSkeleton Components

**Component Description:**
Placeholder components that display during data fetching to provide visual feedback and improve perceived performance. Separate skeletons for stats grid and recent items section.

**StatsSkeleton:**
- Four card-shaped skeletons in grid layout
- Animated shimmer/pulse effect

**RecentItemsSkeleton:**
- Five card-shaped skeletons in list/grid layout
- Animated shimmer/pulse effect

**Main Elements:**
- Container divs matching the actual component layout
- Skeleton boxes using shadcn/ui Skeleton component or custom CSS

**Handled Events:**
- None

**Validation Conditions:**
- None

**Types:**
- None

**Props:**
- None

## 5. Types

### Existing Types (from `src/types.ts`)

**DashboardStatsDTO:**
```typescript
interface DashboardStatsDTO {
  totalItems: number;          // Count of all items belonging to user
  totalContainers: number;     // Count of all containers belonging to user
  totalCategories: number;     // Count of all categories belonging to user
  itemsOut: number;            // Count of items with isIn = false
  recentItems: RecentItemDTO[]; // Array of 5 most recent items (max)
}
```

**RecentItemDTO:**
```typescript
interface RecentItemDTO {
  id: string;                  // UUID of the item
  name: string;                // Item name (1-255 characters)
  thumbnail: string | null;    // URL to thumbnail image or null
  category: string;            // Category name
  container: string;           // Container name
  isIn: boolean;               // Whether item is currently in storage
  createdAt: string;           // ISO 8601 timestamp of creation
}
```

### New ViewModel Types

**DashboardViewModel:**
This type represents the fully loaded dashboard state passed to the view after data fetching and transformation.

```typescript
interface DashboardViewModel {
  stats: {
    totalItems: number;
    totalContainers: number;
    totalCategories: number;
    itemsOut: number;
  };
  recentItems: RecentItemViewModel[];
  isLoading: boolean;
  error: string | null;
}
```

**RecentItemViewModel:**
Enhanced version of `RecentItemDTO` with computed display properties.

```typescript
interface RecentItemViewModel {
  id: string;
  name: string;
  thumbnailUrl: string;        // Always defined (uses placeholder if null)
  categoryName: string;
  categoryBadgeVariant: 'default' | 'secondary';
  containerName: string;
  containerBadgeVariant: 'outline';
  statusIcon: React.ComponentType;
  statusLabel: 'In Storage' | 'Out';
  createdAt: string;
  createdAtRelative: string;   // e.g., "2 hours ago"
}
```

**StatCardViewModel:**
Configuration object for each statistic card.

```typescript
interface StatCardViewModel {
  id: string;                  // Unique identifier (e.g., 'total-items')
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  href: string;
  variant: 'default' | 'warning';
  ariaLabel: string;           // Accessibility label (e.g., "View all 25 items")
}
```

### Type Transformation Logic

**DashboardStatsDTO → DashboardViewModel:**
```typescript
function transformDashboardData(dto: DashboardStatsDTO): DashboardViewModel {
  return {
    stats: {
      totalItems: dto.totalItems,
      totalContainers: dto.totalContainers,
      totalCategories: dto.totalCategories,
      itemsOut: dto.itemsOut,
    },
    recentItems: dto.recentItems.map(transformRecentItem),
    isLoading: false,
    error: null,
  };
}
```

**RecentItemDTO → RecentItemViewModel:**
```typescript
function transformRecentItem(dto: RecentItemDTO): RecentItemViewModel {
  return {
    id: dto.id,
    name: dto.name,
    thumbnailUrl: dto.thumbnail || '/images/placeholder-item.png',
    categoryName: dto.category,
    categoryBadgeVariant: 'default',
    containerName: dto.container,
    containerBadgeVariant: 'outline',
    statusIcon: dto.isIn ? CheckCircle : XCircle,
    statusLabel: dto.isIn ? 'In Storage' : 'Out',
    createdAt: dto.createdAt,
    createdAtRelative: formatDistanceToNow(new Date(dto.createdAt), { addSuffix: true }),
  };
}
```

## 6. State Management

### Data Fetching Strategy

**Server-Side Data Fetching (Astro Frontmatter):**
- Dashboard data is fetched server-side in the Astro page frontmatter
- No client-side state management needed for initial data load
- Data passed as props to React components for interactivity

**Implementation:**
```typescript
---
// src/pages/index.astro frontmatter
import type { DashboardStatsDTO } from '@/types';

// Authentication check
const user = Astro.locals.user;
if (!user) {
  return Astro.redirect('/login');
}

// Fetch dashboard data
let dashboardData: DashboardStatsDTO | null = null;
let error: string | null = null;
let isLoading = false;

try {
  // TODO: Uncomment when API endpoint is implemented
  // const response = await fetch(`${Astro.url.origin}/api/dashboard/stats`, {
  //   headers: {
  //     'Cookie': Astro.request.headers.get('Cookie') || '',
  //   },
  // });
  
  // if (!response.ok) {
  //   throw new Error('Failed to fetch dashboard data');
  // }
  
  // dashboardData = await response.json();
  
  // MOCK DATA (remove when API is ready)
  dashboardData = {
    totalItems: 150,
    totalContainers: 12,
    totalCategories: 8,
    itemsOut: 5,
    recentItems: [
      {
        id: '1',
        name: 'Camping Tent',
        thumbnail: null,
        category: 'Outdoor Gear',
        container: 'Garage Box A',
        isIn: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
      },
      // ... 4 more mock items
    ],
  };
} catch (err) {
  error = err instanceof Error ? err.message : 'An unexpected error occurred';
  console.error('Dashboard data fetch error:', err);
}
---
```

### Component State

**StatsGrid Component:**
- No internal state required (receives data via props)
- Stateless functional component

**RecentItems Component:**
- No internal state required (receives data via props)
- Stateless functional component

**StatCard Component:**
- Possible hover state (managed by CSS)
- No React state needed

**RecentItemCard Component:**
- Possible hover state (managed by CSS)
- No React state needed

### Custom Hooks

**No custom hooks required for MVP** since:
- Data is fetched server-side
- No client-side refetching needed
- No complex state management required
- Navigation handled by standard links

**Future Considerations (Post-MVP):**
- `useDashboardData()`: Custom hook for client-side data refetching with React Query/SWR
- `useRealtimeUpdates()`: Hook for real-time dashboard updates via Supabase subscriptions
- `useStatistics()`: Hook for managing and caching statistics data

## 7. API Integration

### Endpoint Information

**Endpoint:** `GET /api/dashboard/stats`

**Description:** Retrieves aggregated statistics and recent items for the authenticated user's dashboard.

**Authentication:** Required (session-based, enforced by Astro middleware)

**Request:**
- Method: `GET`
- Headers: Session cookie (automatically included)
- Query Parameters: None
- Request Body: None

**Response Type:** `DashboardStatsDTO`

```typescript
interface DashboardStatsDTO {
  totalItems: number;
  totalContainers: number;
  totalCategories: number;
  itemsOut: number;
  recentItems: RecentItemDTO[];
}
```

**Success Response:**
- Status: `200 OK`
- Body: `DashboardStatsDTO` object with all statistics and recent items array

**Error Responses:**
- `401 Unauthorized`: User not authenticated (redirected to login)
- `500 Internal Server Error`: Database or server error

### Integration Implementation

**Server-Side Fetch (Astro Page):**
```typescript
// In src/pages/index.astro frontmatter
const response = await fetch(`${Astro.url.origin}/api/dashboard/stats`, {
  headers: {
    'Cookie': Astro.request.headers.get('Cookie') || '',
  },
});

if (!response.ok) {
  if (response.status === 401) {
    return Astro.redirect('/login');
  }
  throw new Error(`API error: ${response.status}`);
}

const dashboardData: DashboardStatsDTO = await response.json();
```

**Error Handling:**
```typescript
try {
  // Fetch data
} catch (error) {
  console.error('Failed to load dashboard:', error);
  // Pass error to component for display
  const errorMessage = error instanceof Error 
    ? error.message 
    : 'Unable to load dashboard data';
}
```

**Mock Data (During Development):**
Since the API endpoint will be implemented later, use mock data that conforms to `DashboardStatsDTO`:

```typescript
const mockDashboardData: DashboardStatsDTO = {
  totalItems: 150,
  totalContainers: 12,
  totalCategories: 8,
  itemsOut: 5,
  recentItems: [
    {
      id: 'uuid-1',
      name: 'Camping Tent',
      thumbnail: null,
      category: 'Outdoor Gear',
      container: 'Garage Box A',
      isIn: true,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'uuid-2',
      name: 'Cordless Drill',
      thumbnail: null,
      category: 'Tools',
      container: 'Basement Shelf 2',
      isIn: false,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'uuid-3',
      name: 'Winter Jacket',
      thumbnail: null,
      category: 'Clothing',
      container: 'Closet Box 3',
      isIn: true,
      createdAt: new Date(Date.now() - 10800000).toISOString(),
    },
    {
      id: 'uuid-4',
      name: 'Board Game Collection',
      thumbnail: null,
      category: 'Entertainment',
      container: 'Living Room Cabinet',
      isIn: true,
      createdAt: new Date(Date.now() - 14400000).toISOString(),
    },
    {
      id: 'uuid-5',
      name: 'Camping Stove',
      thumbnail: null,
      category: 'Outdoor Gear',
      container: 'Garage Box A',
      isIn: true,
      createdAt: new Date(Date.now() - 18000000).toISOString(),
    },
  ],
};
```

**Comment Out API Call:**
```typescript
// TODO: Uncomment when /api/dashboard/stats is implemented
// const response = await fetch(`${Astro.url.origin}/api/dashboard/stats`, {
//   headers: { 'Cookie': Astro.request.headers.get('Cookie') || '' },
// });
// const dashboardData = await response.json();

// TEMPORARY: Using mock data
const dashboardData = mockDashboardData;
```

## 8. User Interactions

### Statistics Cards

**Interaction:** Click on any statistic card

**Expected Outcome:**
- User navigates to the corresponding list view:
  - "Total Items" → `/items`
  - "Total Containers" → `/containers`
  - "Total Categories" → `/categories`
  - "Items Out" → `/items?filter=out` (filtered to show only items with isIn=false)

**Visual Feedback:**
- Hover: Card slightly elevates (shadow increase), cursor changes to pointer
- Focus: Card receives visible focus ring (keyboard navigation)
- Active: Card slightly depresses (scale down effect)

**Accessibility:**
- Cards are keyboard accessible (Tab to focus, Enter/Space to activate)
- Each card has appropriate `aria-label` (e.g., "View all 150 items")
- Cards are marked as links semantically (`<a>` tag or `role="link"`)

---

### Quick Action Buttons

**Interaction:** Click "Add New Item" button

**Expected Outcome:**
- Navigate to `/items/new` (item creation page)

**Interaction:** Click "Add Container" button

**Expected Outcome:**
- Navigate to `/containers/new` (container creation page)

**Interaction:** Click "Add Category" button

**Expected Outcome:**
- Navigate to `/categories/new` (category creation page)

**Visual Feedback:**
- Hover: Button background color darkens slightly
- Focus: Button receives focus ring
- Active: Button slightly scales down

**Accessibility:**
- Buttons have clear labels with icons
- Keyboard accessible (Tab to focus, Enter/Space to activate)
- ARIA labels include full context (e.g., "Add new item to storage")

---

### Recent Item Cards

**Interaction:** Click on a recent item card

**Expected Outcome:**
- Navigate to `/items/:id` (item detail page for that specific item)
- User can view full item details, edit, or delete the item

**Visual Feedback:**
- Hover: Card background changes, slight shadow elevation
- Focus: Focus ring appears around card
- Active: Card slightly scales down

**Accessibility:**
- Each card is keyboard accessible
- Card has appropriate `aria-label` (e.g., "View details for Camping Tent")
- Image includes `alt` text describing the item

---

### Empty State Action

**Interaction:** Click "Add First Item" button (when no items exist)

**Expected Outcome:**
- Navigate to `/items/new`
- User can create their first item

**Visual Feedback:**
- Same as other primary action buttons

**Accessibility:**
- Clear call-to-action
- Button is prominently visible and keyboard accessible

---

### Navigation (from header/layout)

**Interaction:** Click navigation links

**Expected Outcome:**
- Navigate to respective sections (Items, Containers, Categories, Profile)
- Dashboard link highlights when on dashboard page

**Accessibility:**
- Current page indicated with `aria-current="page"`
- Navigation is keyboard accessible

---

### Loading States

**User Experience During Load:**
- Skeleton components display immediately
- Smooth transition from skeleton to actual content when data loads
- No layout shift (skeleton matches final layout)

---

### Error States

**Interaction:** Dashboard fails to load data

**Expected Outcome:**
- Error message displays: "Unable to load dashboard. Please try again."
- Retry button allows user to refresh the page
- User can still access navigation to other parts of the app

**Visual Feedback:**
- Error message in prominent but non-alarming styling
- Icon indicating error state
- Retry button clearly visible

## 9. Conditions and Validation

### Authentication Condition

**Condition:** User must be authenticated to view dashboard

**Validation Location:** Server-side in Astro page frontmatter

**Implementation:**
```typescript
if (!Astro.locals.user) {
  return Astro.redirect('/login');
}
```

**UI Impact:**
- Unauthenticated users never see the dashboard
- Immediate redirect to login page
- After successful login, user returns to dashboard

---

### Data Loading Conditions

**Condition:** Dashboard data must be successfully fetched before rendering

**Validation Location:** Server-side in Astro page frontmatter

**Handling:**
```typescript
let dashboardData: DashboardStatsDTO | null = null;
let error: string | null = null;

try {
  // Fetch data
  dashboardData = await fetchDashboardData();
} catch (err) {
  error = 'Unable to load dashboard data';
  console.error(err);
}
```

**UI Impact:**
- If `error` is not null: Display error message with retry option
- If `dashboardData` is null: Display loading skeleton (shouldn't occur in SSR)
- If `dashboardData` is valid: Render full dashboard with data

---

### Statistics Validation

**Condition:** All statistic counts must be non-negative integers

**Validation Location:** Component level (StatsGrid)

**Implementation:**
```typescript
const safeCount = (count: number | undefined | null): number => {
  return typeof count === 'number' && count >= 0 ? Math.floor(count) : 0;
};
```

**UI Impact:**
- Invalid or missing counts display as 0
- Prevents display of negative numbers or non-integers

---

### Recent Items Validation

**Condition:** Recent items array must contain valid item objects

**Validation Location:** Component level (RecentItems)

**Implementation:**
```typescript
const validItems = items.filter(item => 
  item && 
  typeof item.id === 'string' && 
  typeof item.name === 'string' && 
  item.name.trim().length > 0
);
```

**UI Impact:**
- Invalid items are filtered out
- If no valid items remain, show empty state
- Prevents rendering broken item cards

---

### Image Validation

**Condition:** Thumbnail URLs must be valid or null

**Validation Location:** Component level (RecentItemCard)

**Implementation:**
```typescript
const thumbnailUrl = item.thumbnail && item.thumbnail.trim().length > 0
  ? item.thumbnail
  : '/images/placeholder-item.png';
```

**UI Impact:**
- Missing or invalid thumbnails display placeholder image
- Prevents broken image icons
- Consistent visual presentation

---

### Navigation Target Validation

**Condition:** All navigation links must point to valid routes

**Validation Location:** Component definition (StatCard, Quick Actions)

**Implementation:**
- Hard-coded paths in component configuration
- Type-safe route constants (optional)

**UI Impact:**
- Prevents 404 errors from broken links
- Ensures consistent navigation experience

---

### Items Out Warning

**Condition:** Display visual warning when `itemsOut > 0`

**Validation Location:** StatsGrid component

**Implementation:**
```typescript
const itemsOutVariant = itemsOut > 0 ? 'warning' : 'default';
```

**UI Impact:**
- "Items Out" card displays with warning styling (e.g., orange/yellow accent)
- Draws user attention to items currently out of storage
- No warning styling when `itemsOut === 0`

---

### Empty State Display

**Condition:** Show empty state when `recentItems.length === 0`

**Validation Location:** RecentItems component

**Implementation:**
```typescript
if (items.length === 0) {
  return <EmptyState />;
}
```

**UI Impact:**
- Empty state replaces item card grid
- Encourages user to add first item
- Provides clear call-to-action

## 10. Error Handling

### Network/API Errors

**Scenario:** API request to `/api/dashboard/stats` fails

**Causes:**
- Network connection issues
- Server error (500)
- Timeout

**Handling:**
```typescript
try {
  const response = await fetch('/api/dashboard/stats', {...});
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  dashboardData = await response.json();
} catch (error) {
  console.error('Dashboard fetch failed:', error);
  errorMessage = 'Unable to load dashboard. Please check your connection.';
}
```

**User Experience:**
- Error message displayed in place of dashboard content
- Message: "Unable to load dashboard. Please try again."
- Retry button triggers page reload
- Navigation remains accessible for accessing other sections

---

### Authentication Errors

**Scenario:** User session expires or is invalid

**Causes:**
- Session cookie expired
- User logged out in another tab
- Session invalidated server-side

**Handling:**
```typescript
if (!Astro.locals.user) {
  return Astro.redirect('/login?redirect=/');
}

// Or during API call
if (response.status === 401) {
  return Astro.redirect('/login?redirect=/');
}
```

**User Experience:**
- User immediately redirected to login page
- After login, redirected back to dashboard (via `redirect` query param)
- No partial dashboard content displayed

---

### Data Validation Errors

**Scenario:** API returns data that doesn't match expected schema

**Causes:**
- API contract changed
- Corrupted data in database
- Type mismatch between frontend and backend

**Handling:**
```typescript
function validateDashboardData(data: any): data is DashboardStatsDTO {
  return (
    typeof data === 'object' &&
    typeof data.totalItems === 'number' &&
    typeof data.totalContainers === 'number' &&
    typeof data.totalCategories === 'number' &&
    typeof data.itemsOut === 'number' &&
    Array.isArray(data.recentItems)
  );
}

if (!validateDashboardData(rawData)) {
  throw new Error('Invalid dashboard data format');
}
```

**User Experience:**
- Generic error message displayed
- Log detailed error for debugging
- Suggest user contact support if persistent

---

### Missing Data / Empty States

**Scenario:** User has no items, containers, or categories

**Handling:**
- Not an error condition, but expected state for new users
- All statistics display 0
- Empty state shown for recent items

**User Experience:**
- Welcome message: "Get started by adding your first item"
- Prominent "Add First Item" button
- Quick action buttons still available
- No negative or confusing messaging

---

### Partial Data Errors

**Scenario:** Some statistics load but recent items fail

**Handling:**
```typescript
// If possible, separate data fetching concerns
try {
  const stats = await fetchStats();
  let recentItems = [];
  try {
    recentItems = await fetchRecentItems();
  } catch (err) {
    console.error('Recent items failed:', err);
    // Continue with empty recent items
  }
  return { stats, recentItems };
} catch (err) {
  // Total failure - show error
  throw err;
}
```

**User Experience:**
- Statistics display successfully
- Recent items section shows empty state or error message
- User can still interact with statistics and quick actions
- Graceful degradation

---

### Image Loading Errors

**Scenario:** Thumbnail image fails to load

**Handling:**
```typescript
<img 
  src={thumbnailUrl} 
  alt={itemName}
  onError={(e) => {
    e.currentTarget.src = '/images/placeholder-item.png';
  }}
/>
```

**User Experience:**
- Broken images automatically replaced with placeholder
- No visual disruption
- Item card still functional and accessible

---

### Navigation Errors

**Scenario:** User clicks on stat card or item but route doesn't exist

**Prevention:**
- Use type-safe routing (string constants or typed router)
- Test all navigation paths
- 404 page handles invalid routes gracefully

**User Experience:**
- If route exists: Normal navigation
- If route doesn't exist: 404 page with link back to dashboard
- No broken links in production

---

### Timeout Handling

**Scenario:** API request takes too long

**Handling:**
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

try {
  const response = await fetch('/api/dashboard/stats', {
    signal: controller.signal,
    ...
  });
  clearTimeout(timeoutId);
} catch (error) {
  if (error.name === 'AbortError') {
    throw new Error('Request timeout. Please try again.');
  }
  throw error;
}
```

**User Experience:**
- Request cancelled after 10 seconds
- Error message: "Request took too long. Please try again."
- Retry option available

---

### Error Logging

**Implementation:**
```typescript
function logError(context: string, error: unknown) {
  console.error(`[Dashboard] ${context}:`, {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
  });
  
  // In production: send to error tracking service (Sentry, etc.)
}
```

**Data Collected:**
- Error message and stack trace
- Request context (API endpoint, method)
- User ID (for support purposes)
- Timestamp
- Browser/device information

## 11. Implementation Steps

### Step 1: Set Up Mock Data and Types

**Tasks:**
- Verify `DashboardStatsDTO` and `RecentItemDTO` exist in `src/types.ts`
- Create mock data object conforming to `DashboardStatsDTO`
- Create helper function for generating realistic timestamps
- Store mock data in a constant for reuse

**Files:**
- `src/types.ts` (verify existing types)
- `src/pages/index.astro` (add mock data)

**Testing:**
- Verify mock data type-checks correctly
- Ensure all required fields are present
- Check that timestamps are valid ISO 8601 strings

---

### Step 2: Create LoadingSkeleton Components

**Tasks:**
- Create `StatsSkeleton.tsx` component with 4 card skeletons in grid layout
- Create `RecentItemsSkeleton.tsx` component with 5 item card skeletons
- Use shadcn/ui Skeleton component or create custom skeleton CSS
- Implement shimmer/pulse animation effect
- Ensure skeleton layout matches final content (prevents layout shift)

**Files:**
- `src/components/ui/StatsSkeleton.tsx`
- `src/components/ui/RecentItemsSkeleton.tsx`

**Testing:**
- Verify skeleton layout matches actual components
- Test animation performance
- Check responsive behavior (mobile, tablet, desktop)

---

### Step 3: Implement StatCard Component

**Tasks:**
- Create `StatCard.tsx` React component in `src/components`
- Accept props: icon, label, count, href, variant
- Implement clickable card using `<a>` or Next.js Link equivalent for Astro
- Add hover, focus, and active styles
- Implement keyboard accessibility (Enter/Space)
- Add appropriate ARIA labels
- Support "warning" variant for items out

**Files:**
- `src/components/StatCard.tsx`

**Testing:**
- Test click navigation
- Test keyboard navigation (Tab, Enter, Space)
- Verify hover effects
- Test with screen reader (ARIA labels)
- Test both default and warning variants

---

### Step 4: Implement StatsGrid Component

**Tasks:**
- Create `StatsGrid.tsx` React component
- Accept dashboard statistics as props
- Create configuration for 4 stat cards (icons, labels, hrefs)
- Import icons from Lucide React or chosen icon library
- Implement responsive grid layout (1 column mobile, 2×2 desktop)
- Render 4 StatCard components with appropriate props
- Handle loading state (render StatsSkeleton if isLoading)

**Files:**
- `src/components/StatsGrid.tsx`

**Testing:**
- Verify all 4 cards render correctly
- Test responsive layout at different breakpoints
- Test navigation from each card
- Verify warning variant applies to "Items Out" when count > 0

---

### Step 5: Implement RecentItemCard Component

**Tasks:**
- Create `RecentItemCard.tsx` React component
- Accept single RecentItemDTO as prop
- Implement card layout with thumbnail, name, category badge, container badge
- Handle missing thumbnail (use placeholder)
- Implement image error handling (fallback to placeholder)
- Make card clickable (navigate to `/items/:id`)
- Add hover and focus styles
- Add keyboard accessibility

**Files:**
- `src/components/RecentItemCard.tsx`

**Testing:**
- Test with valid thumbnail URL
- Test with null thumbnail (verify placeholder displays)
- Test navigation on click
- Test keyboard navigation
- Verify badges display correctly

---

### Step 6: Implement EmptyState Component

**Tasks:**
- Create `EmptyState.tsx` or `EmptyState.astro` component
- Add centered layout with icon, heading, description
- Include "Add First Item" button (primary variant)
- Button navigates to `/items/new`
- Use friendly, encouraging messaging

**Files:**
- `src/components/EmptyState.tsx` or `.astro`

**Testing:**
- Verify centered layout
- Test button navigation
- Check responsive behavior

---

### Step 7: Implement RecentItems Component

**Tasks:**
- Create `RecentItems.tsx` React component
- Accept array of RecentItemDTO as props
- Render section heading: "Recently Added Items"
- Check if items array is empty
  - If empty: render EmptyState
  - If not empty: render grid/list of RecentItemCard components
- Implement loading state (render RecentItemsSkeleton)
- Handle validation (filter invalid items)

**Files:**
- `src/components/RecentItems.tsx`

**Testing:**
- Test with 5 items (full list)
- Test with 0 items (empty state)
- Test with 1-4 items (partial list)
- Test with invalid items (should be filtered out)
- Verify loading skeleton displays correctly

---

### Step 8: Implement QuickActions Component

**Tasks:**
- Create `QuickActions.astro` static component
- Import Button component from shadcn/ui
- Create 3 buttons:
  - "Add New Item" (primary variant, Plus icon)
  - "Add Container" (outline variant, Box icon)
  - "Add Category" (outline variant, Tag icon)
- Implement as static links (Astro link tags)
- Arrange buttons in horizontal row (wrap on mobile)

**Files:**
- `src/components/QuickActions.astro`

**Testing:**
- Test all 3 button navigations
- Verify responsive layout
- Test keyboard navigation
- Verify button styling matches design

---

### Step 9: Update Layout Component (if needed)

**Tasks:**
- Review existing `Layout.astro`
- Add navigation header if not present
- Ensure navigation includes Dashboard link
- Add responsive navigation (hamburger menu for mobile if needed)
- Implement current page highlighting
- Add "Items Out" badge on navigation if itemsOut > 0 (future enhancement)

**Files:**
- `src/layouts/Layout.astro`

**Testing:**
- Test navigation on all screen sizes
- Verify Dashboard link highlights when on dashboard
- Test mobile navigation (if applicable)

---

### Step 10: Implement Main Dashboard Page

**Tasks:**
- Update `src/pages/index.astro`
- Add authentication check in frontmatter
- Implement mock data (comment indicates future API integration)
- Add error handling with try-catch
- Pass data to React components as props
- Implement page structure:
  - Layout wrapper
  - Page heading (h1: "Dashboard")
  - StatsGrid component
  - QuickActions component
  - RecentItems component
- Add conditional rendering for error state

**Files:**
- `src/pages/index.astro`

**Implementation:**
```astro
---
import Layout from '@/layouts/Layout.astro';
import StatsGrid from '@/components/StatsGrid.tsx';
import QuickActions from '@/components/QuickActions.astro';
import RecentItems from '@/components/RecentItems.tsx';
import type { DashboardStatsDTO } from '@/types';

// Authentication check
if (!Astro.locals.user) {
  return Astro.redirect('/login');
}

// Mock dashboard data (replace with API call later)
const mockData: DashboardStatsDTO = {
  totalItems: 150,
  totalContainers: 12,
  totalCategories: 8,
  itemsOut: 5,
  recentItems: [ /* ... mock items ... */ ],
};

let dashboardData = mockData;
let error: string | null = null;

// TODO: Implement actual API call when endpoint is ready
// try {
//   const response = await fetch(`${Astro.url.origin}/api/dashboard/stats`, {
//     headers: { 'Cookie': Astro.request.headers.get('Cookie') || '' },
//   });
//   if (!response.ok) throw new Error('Failed to fetch');
//   dashboardData = await response.json();
// } catch (err) {
//   error = 'Unable to load dashboard';
//   console.error(err);
// }
---

<Layout title="Dashboard">
  <main class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">Dashboard</h1>
    
    {error ? (
      <div class="error-message">
        <p>{error}</p>
        <button onclick="location.reload()">Retry</button>
      </div>
    ) : (
      <>
        <section class="mb-8">
          <StatsGrid
            totalItems={dashboardData.totalItems}
            totalContainers={dashboardData.totalContainers}
            totalCategories={dashboardData.totalCategories}
            itemsOut={dashboardData.itemsOut}
            client:load
          />
        </section>
        
        <section class="mb-8">
          <QuickActions />
        </section>
        
        <section>
          <RecentItems items={dashboardData.recentItems} client:load />
        </section>
      </>
    )}
  </main>
</Layout>
```

**Testing:**
- Test authentication redirect (visit as unauthenticated user)
- Verify all sections render with mock data
- Test responsive layout
- Check console for any errors

---

### Step 11: Add Styling and Responsive Design

**Tasks:**
- Implement responsive grid layouts using Tailwind CSS
- Add hover/focus/active states to interactive elements
- Implement consistent spacing and alignment
- Add transitions and animations (subtle, performant)
- Test dark mode support (if implemented in design system)
- Ensure text is readable at all screen sizes
- Add appropriate shadows and borders for cards

**Files:**
- All component files (inline Tailwind classes)
- `src/styles/global.css` (if custom CSS needed)

**Testing:**
- Test on mobile (320px - 768px)
- Test on tablet (768px - 1024px)
- Test on desktop (1024px+)
- Test touch interactions on mobile devices
- Test keyboard navigation focus states

---

### Step 12: Implement Accessibility Features

**Tasks:**
- Add semantic HTML (main, section, article, nav)
- Implement proper heading hierarchy (h1 → h2 → h3)
- Add ARIA labels to all interactive elements
- Ensure all images have alt text
- Implement keyboard navigation (Tab, Enter, Space)
- Add focus indicators (visible focus rings)
- Test with screen reader (VoiceOver, NVDA, or JAWS)
- Add skip-to-content link (if not in layout)
- Ensure color contrast meets WCAG AA standards

**Files:**
- All component files

**Testing:**
- Run Lighthouse accessibility audit
- Test with keyboard only (no mouse)
- Test with screen reader
- Use browser DevTools accessibility inspector
- Verify tab order is logical

---

### Step 13: Add Error Boundary (Optional)

**Tasks:**
- Implement React error boundary for client-side errors
- Display user-friendly error message if component crashes
- Log errors for debugging
- Provide recovery option (reload button)

**Files:**
- `src/components/ErrorBoundary.tsx`

**Testing:**
- Trigger intentional error in component
- Verify error boundary catches and displays message
- Test recovery action

---

### Step 14: Test with Mock Data Variations

**Tasks:**
- Test with all zeros (new user scenario)
- Test with large numbers (1000+ items)
- Test with maximum recent items (5)
- Test with no recent items (empty array)
- Test with 1-2 recent items
- Test with missing thumbnails
- Test with very long item/category/container names

**Testing Scenarios:**
1. New user: All stats = 0, no recent items
2. Active user: All stats > 0, 5 recent items
3. Edge case: Long names, missing thumbnails
4. Warning state: itemsOut > 0

---

### Step 15: Performance Optimization

**Tasks:**
- Implement React.memo for StatCard if needed
- Optimize image loading (lazy loading, proper sizes)
- Ensure no unnecessary re-renders
- Check bundle size (components should be lightweight)
- Test page load performance with Lighthouse
- Ensure smooth animations (60fps)

**Tools:**
- React DevTools Profiler
- Lighthouse Performance Audit
- Network tab (check asset sizes)

**Targets:**
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Smooth animations (no jank)

---

### Step 16: Prepare for API Integration

**Tasks:**
- Document where mock data should be replaced
- Add clear TODO comments indicating API integration points
- Create placeholder function for API call (commented out)
- Ensure error handling is in place for future API calls
- Update implementation plan with API integration notes

**Files:**
- `src/pages/index.astro`

**Documentation:**
```typescript
// TODO: Replace mock data with API call when endpoint is implemented
// Uncomment the following code block and remove mockData

// try {
//   const response = await fetch(`${Astro.url.origin}/api/dashboard/stats`, {
//     headers: { 'Cookie': Astro.request.headers.get('Cookie') || '' },
//   });
//   if (!response.ok) {
//     if (response.status === 401) return Astro.redirect('/login');
//     throw new Error(`HTTP ${response.status}`);
//   }
//   dashboardData = await response.json();
// } catch (err) {
//   error = 'Unable to load dashboard';
//   console.error('Dashboard error:', err);
// }
```

---

### Step 17: Final Testing and QA

**Tasks:**
- Complete full user flow: Login → Dashboard → Navigate → Return
- Test all user interactions documented in Section 8
- Verify all error scenarios handled gracefully
- Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- Test on multiple devices (desktop, tablet, mobile)
- Test with different network speeds (throttle to 3G)
- Verify accessibility with screen reader
- Run Lighthouse audit (aim for 90+ in all categories)
- Check for console errors or warnings
- Verify type safety (no TypeScript errors)

**Test Checklist:**
- [ ] Authentication check works
- [ ] All 4 stat cards display correctly
- [ ] All stat cards navigate correctly
- [ ] Items Out card shows warning when > 0
- [ ] Quick action buttons navigate correctly
- [ ] Recent items display (when present)
- [ ] Empty state displays (when no items)
- [ ] All images handle errors gracefully
- [ ] Responsive layout works on all screen sizes
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces content correctly
- [ ] Loading states display properly (if applicable)
- [ ] Error states display and allow recovery
- [ ] No console errors
- [ ] Type checking passes
- [ ] Linter passes

---

### Step 18: Documentation and Handoff

**Tasks:**
- Document component APIs (props, events)
- Create usage examples for each component
- Document mock data structure
- Create API integration guide for backend team
- Update README with dashboard implementation details
- Document any known issues or future enhancements
- Create screenshots of dashboard for documentation

**Files:**
- `.ai/dashboard-view-implementation-plan.md` (this file)
- `README.md` (project overview)
- Component JSDoc comments

---

### Step 19: Code Review and Refinement

**Tasks:**
- Review all code for best practices
- Ensure consistent naming conventions
- Check for code duplication (DRY principle)
- Verify error handling is comprehensive
- Ensure comments are clear and helpful
- Check for hardcoded values (move to constants if needed)
- Verify accessibility implementation
- Review with another developer (if available)

**Code Quality Checklist:**
- [ ] No unused imports or variables
- [ ] Consistent formatting (Prettier)
- [ ] TypeScript types are accurate
- [ ] Error messages are user-friendly
- [ ] Comments explain "why" not "what"
- [ ] Functions are single-responsibility
- [ ] Components are appropriately sized
- [ ] No magic numbers or strings

---

### Step 20: Deployment Preparation

**Tasks:**
- Verify build succeeds without errors (`npm run build`)
- Test production build locally (`npm run preview`)
- Verify environment variables are configured
- Ensure assets are optimized (images, fonts)
- Check that routes are properly configured
- Verify authentication works in production mode
- Test on production-like environment (staging)
- Create deployment checklist

**Pre-Deployment Checklist:**
- [ ] Build succeeds
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] All tests pass (if tests exist)
- [ ] Environment variables set
- [ ] Database connection works
- [ ] Authentication works
- [ ] All routes accessible
- [ ] Assets load correctly
- [ ] Performance acceptable
- [ ] Error handling works

---

**Implementation Complete!**

The dashboard view is now ready for use with mock data. When the `/api/dashboard/stats` endpoint is implemented, uncomment the API call code and remove the mock data to complete the integration.
