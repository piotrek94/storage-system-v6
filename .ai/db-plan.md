# Database Schema - Home Storage System

## 1. Tables

### 1.1 profiles

Extends Supabase Auth with minimal user metadata. One-to-one relationship with `auth.users`.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE ON UPDATE CASCADE | User identifier, links to Supabase Auth |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Account creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Last update timestamp |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `id` REFERENCES `auth.users(id)` ON DELETE CASCADE ON UPDATE CASCADE

**Triggers:**
- `update_profiles_updated_at` - Automatically updates `updated_at` on row modification

---

### 1.2 containers

Represents physical storage locations (flat structure, no nesting).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique container identifier |
| user_id | UUID | NOT NULL REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE CASCADE | Owner of the container |
| name | VARCHAR(255) | NOT NULL CHECK (length(trim(name)) >= 1 AND length(name) <= 255) | Container name |
| description | TEXT | CHECK (length(description) <= 10000) | Optional detailed description |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Last update timestamp |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `user_id` REFERENCES `profiles(id)` ON DELETE CASCADE ON UPDATE CASCADE
- Check: Name must have at least 1 non-whitespace character and max 255 characters
- Check: Description max 10,000 characters

**Triggers:**
- `update_containers_updated_at` - Automatically updates `updated_at` on row modification

---

### 1.3 categories

Logical classification system for items.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique category identifier |
| user_id | UUID | NOT NULL REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE CASCADE | Owner of the category |
| name | VARCHAR(255) | NOT NULL CHECK (length(trim(name)) >= 1 AND length(name) <= 255) | Category name |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Last update timestamp |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `user_id` REFERENCES `profiles(id)` ON DELETE CASCADE ON UPDATE CASCADE
- Check: Name must have at least 1 non-whitespace character and max 255 characters
- Unique: Case-insensitive unique constraint on `(user_id, LOWER(name))` via unique index

**Triggers:**
- `update_categories_updated_at` - Automatically updates `updated_at` on row modification

---

### 1.4 items

Core entity representing stored physical items.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique item identifier |
| user_id | UUID | NOT NULL REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE CASCADE | Owner of the item |
| name | VARCHAR(255) | NOT NULL CHECK (length(trim(name)) >= 1 AND length(name) <= 255) | Item name |
| category_id | UUID | NOT NULL REFERENCES categories(id) ON DELETE RESTRICT | Category assignment (required) |
| container_id | UUID | NOT NULL REFERENCES containers(id) ON DELETE RESTRICT | Container location (required) |
| is_in | BOOLEAN | NOT NULL DEFAULT true | In/out status (true = in storage, false = out) |
| description | TEXT | CHECK (length(description) <= 10000) | Optional detailed description/notes |
| quantity | INTEGER | CHECK (quantity > 0) | Optional quantity (must be positive) |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Last update timestamp |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `user_id` REFERENCES `profiles(id)` ON DELETE CASCADE ON UPDATE CASCADE
- Foreign Key: `category_id` REFERENCES `categories(id)` ON DELETE RESTRICT
- Foreign Key: `container_id` REFERENCES `containers(id)` ON DELETE RESTRICT
- Check: Name must have at least 1 non-whitespace character and max 255 characters
- Check: Description max 10,000 characters
- Check: Quantity must be positive if provided

**Triggers:**
- `update_items_updated_at` - Automatically updates `updated_at` on row modification

**Notes:**
- ON DELETE RESTRICT on categories and containers prevents deletion when items are assigned
- Enforces pre-creation workflow: containers and categories must exist before items can reference them

---

### 1.5 images

Polymorphic table storing image metadata for both items and containers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique image identifier |
| user_id | UUID | NOT NULL REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE CASCADE | Owner of the image |
| entity_type | entity_type_enum | NOT NULL | Type of parent entity ('item' or 'container') |
| entity_id | UUID | NOT NULL | ID of parent entity (item or container) |
| storage_path | TEXT | NOT NULL | Relative path within Supabase Storage bucket |
| display_order | INTEGER | NOT NULL CHECK (display_order >= 1 AND display_order <= 5) | Image order (1-5, 1 is thumbnail) |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Upload timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Last update timestamp |

**ENUM Type:**
```sql
CREATE TYPE entity_type_enum AS ENUM ('item', 'container');
```

**Constraints:**
- Primary Key: `id`
- Foreign Key: `user_id` REFERENCES `profiles(id)` ON DELETE CASCADE ON UPDATE CASCADE
- Check: `display_order >= 1 AND display_order <= 5`
- Unique: `(entity_type, entity_id, display_order)` - prevents duplicate ordering per entity

**Triggers:**
- `update_images_updated_at` - Automatically updates `updated_at` on row modification
- `enforce_image_limit` - Prevents more than 5 images per entity

**Notes:**
- No foreign key constraint on `entity_id` - validated at application level
- Storage path format: `user_id/entity_type/entity_id/image_name.ext`
- Maximum 5MB per image, JPEG/PNG/WebP formats (enforced at application level)
- First image (display_order = 1) serves as thumbnail

---

## 2. Relationships

### 2.1 User → Profiles (1:1)
- `auth.users(id)` ← `profiles(id)`
- One-to-one relationship extending Supabase Auth
- CASCADE on delete and update

### 2.2 Profiles → Containers (1:N)
- `profiles(id)` → `containers(user_id)`
- One user can have many containers
- CASCADE on delete and update

### 2.3 Profiles → Categories (1:N)
- `profiles(id)` → `categories(user_id)`
- One user can have many categories
- CASCADE on delete and update

### 2.4 Profiles → Items (1:N)
- `profiles(id)` → `items(user_id)`
- One user can have many items
- CASCADE on delete and update

### 2.5 Profiles → Images (1:N)
- `profiles(id)` → `images(user_id)`
- One user can have many images
- CASCADE on delete and update

### 2.6 Containers → Items (1:N)
- `containers(id)` → `items(container_id)`
- One container can hold many items
- RESTRICT on delete (prevents deleting containers with items)

### 2.7 Categories → Items (1:N)
- `categories(id)` → `items(category_id)`
- One category can classify many items
- RESTRICT on delete (prevents deleting categories with items)

### 2.8 Items ← Images (Polymorphic N:N via entity_type/entity_id)
- `items(id)` ← `images(entity_id WHERE entity_type = 'item')`
- One item can have up to 5 images
- Images are deleted when parent entity is deleted (handled at application level)

### 2.9 Containers ← Images (Polymorphic N:N via entity_type/entity_id)
- `containers(id)` ← `images(entity_id WHERE entity_type = 'container')`
- One container can have up to 5 images
- Images are deleted when parent entity is deleted (handled at application level)

---

## 3. Indexes

### 3.1 Primary Key Indexes (Automatic)
- `profiles_pkey` on `profiles(id)`
- `containers_pkey` on `containers(id)`
- `categories_pkey` on `categories(id)`
- `items_pkey` on `items(id)`
- `images_pkey` on `images(id)`

### 3.2 Foreign Key Indexes (Automatic)
- `containers_user_id_idx` on `containers(user_id)`
- `categories_user_id_idx` on `categories(user_id)`
- `items_user_id_idx` on `items(user_id)`
- `items_category_id_idx` on `items(category_id)`
- `items_container_id_idx` on `items(container_id)`
- `images_user_id_idx` on `images(user_id)`

### 3.3 Search and Filter Indexes
```sql
-- Case-insensitive item name search per user
CREATE INDEX idx_items_user_name ON items(user_id, LOWER(name));

-- Filter items by category within user scope
CREATE INDEX idx_items_user_category ON items(user_id, category_id);

-- Filter items by container within user scope
CREATE INDEX idx_items_user_container ON items(user_id, container_id);

-- Filter items by in/out status within user scope
CREATE INDEX idx_items_user_status ON items(user_id, is_in);

-- Composite index for combined multi-filter queries
CREATE INDEX idx_items_user_filters ON items(user_id, category_id, container_id, is_in);
```

### 3.4 Unique Constraint Indexes
```sql
-- Case-insensitive unique category names per user
CREATE UNIQUE INDEX idx_categories_user_name_unique ON categories(user_id, LOWER(name));

-- Unique image ordering per entity
CREATE UNIQUE INDEX idx_images_entity_order_unique ON images(entity_type, entity_id, display_order);
```

### 3.5 Partial Indexes (Polymorphic Relationships)
```sql
-- Optimize queries for item images
CREATE INDEX idx_images_items ON images(entity_id) WHERE entity_type = 'item';

-- Optimize queries for container images
CREATE INDEX idx_images_containers ON images(entity_id) WHERE entity_type = 'container';
```

---

## 4. PostgreSQL Row-Level Security (RLS) Policies

### 4.1 Enable RLS on All Tables
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
```

### 4.2 Profiles Table Policies
```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);
```

### 4.3 Containers Table Policies
```sql
-- Users can view their own containers
CREATE POLICY "Users can view own containers"
  ON containers FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own containers
CREATE POLICY "Users can insert own containers"
  ON containers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own containers
CREATE POLICY "Users can update own containers"
  ON containers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own containers
CREATE POLICY "Users can delete own containers"
  ON containers FOR DELETE
  USING (auth.uid() = user_id);
```

### 4.4 Categories Table Policies
```sql
-- Users can view their own categories
CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own categories
CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own categories
CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own categories
CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);
```

### 4.5 Items Table Policies
```sql
-- Users can view their own items
CREATE POLICY "Users can view own items"
  ON items FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own items
CREATE POLICY "Users can insert own items"
  ON items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own items
CREATE POLICY "Users can update own items"
  ON items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own items
CREATE POLICY "Users can delete own items"
  ON items FOR DELETE
  USING (auth.uid() = user_id);
```

### 4.6 Images Table Policies
```sql
-- Users can view their own images
CREATE POLICY "Users can view own images"
  ON images FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own images
CREATE POLICY "Users can insert own images"
  ON images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own images
CREATE POLICY "Users can update own images"
  ON images FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own images
CREATE POLICY "Users can delete own images"
  ON images FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 5. Database Functions and Triggers

### 5.1 Updated_at Trigger Function
```sql
-- Reusable function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 5.2 Trigger Assignments for updated_at
```sql
-- Profiles table
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Containers table
CREATE TRIGGER update_containers_updated_at
  BEFORE UPDATE ON containers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Categories table
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Items table
CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Images table
CREATE TRIGGER update_images_updated_at
  BEFORE UPDATE ON images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 5.3 Image Limit Enforcement Function
```sql
-- Function to enforce maximum 5 images per entity
CREATE OR REPLACE FUNCTION enforce_image_limit()
RETURNS TRIGGER AS $$
DECLARE
  image_count INTEGER;
BEGIN
  -- Count existing images for this entity
  SELECT COUNT(*)
  INTO image_count
  FROM images
  WHERE entity_type = NEW.entity_type
    AND entity_id = NEW.entity_id;
  
  -- Reject if limit would be exceeded
  IF image_count >= 5 THEN
    RAISE EXCEPTION 'Cannot add more than 5 images per %', NEW.entity_type;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 5.4 Image Limit Trigger
```sql
CREATE TRIGGER enforce_image_limit_trigger
  BEFORE INSERT ON images
  FOR EACH ROW
  EXECUTE FUNCTION enforce_image_limit();
```

---

## 6. Additional Notes and Design Decisions

### 6.1 Authentication Strategy
- Leverages Supabase Auth's built-in `auth.users` table
- Minimal `profiles` table extension with only timestamps
- `auth.uid()` function used in RLS policies for secure data isolation
- Foreign keys to auth.users include `ON UPDATE CASCADE` for safety

### 6.2 Data Integrity Approach
- **Hard deletes only** - no soft delete complexity for MVP
- **Foreign key constraints with ON DELETE RESTRICT** on items table prevents orphaned data
- **Check constraints** ensure valid data at database level
- **Unique indexes** enforce business rules (e.g., unique category names per user)
- **Trigger-based validation** for complex rules (5-image limit)

### 6.3 Security Architecture
- **Multi-layered security:**
  1. Row-Level Security (RLS) policies at database level
  2. Foreign key constraints preventing referential integrity violations
  3. Application-level business logic validation
  4. Storage bucket policies (configured separately)
- **No public access** - all data requires authentication
- **User isolation** - every table includes user_id for ownership tracking

### 6.4 Performance Optimization Strategy
- **Comprehensive indexing** for common query patterns
- **Partial indexes** on polymorphic relationships for efficiency
- **Case-insensitive search** using `LOWER()` with supporting indexes
- **No denormalization** - dynamic count calculations for MVP simplicity
- **Query patterns optimized for:**
  - Real-time text search with debounce (300ms)
  - Multi-filter combinations (category + container + status)
  - User-scoped queries (all indexes include user_id)

### 6.5 Image Management Design
- **Polymorphic pattern** using entity_type ENUM and entity_id
- **No foreign key on entity_id** - allows flexibility, validated at application level
- **Storage path format:** `user_id/entity_type/entity_id/image_name.ext`
- **Ordering system:** display_order 1-5 with unique constraint
- **Thumbnail convention:** display_order = 1 is the primary image
- **Cascade handling:** Application deletes images from storage when parent entity deleted

### 6.6 Deletion Protection
- Containers with items: ON DELETE RESTRICT prevents deletion
- Categories with items: ON DELETE RESTRICT prevents deletion
- Application should query item counts and display helpful error messages
- Suggested error format: "Cannot delete [name] because it contains X items"

### 6.7 Case-Insensitive Uniqueness
- Categories: Unique index on `(user_id, LOWER(name))`
- Enforces case-insensitive uniqueness at database level
- Prevents duplicate categories like "Tools" and "tools"

### 6.8 Timestamp Management
- All tables include `created_at` and `updated_at`
- Database-generated with `DEFAULT NOW()`
- Automatic updates via trigger function
- Timezone-aware using TIMESTAMPTZ

### 6.9 Validation Constraints
- **Names:** 1-255 characters, must have non-whitespace content
- **Descriptions:** Maximum 10,000 characters
- **Quantity:** Must be positive integer if provided
- **Display order:** Must be between 1 and 5
- **Entity type:** Limited to 'item' or 'container' via ENUM

### 6.10 Migration Strategy
- Use Supabase migration system
- Sequential timestamp-based naming: `YYYYMMDDHHMMSS_descriptive_name.sql`
- Migrations stored in `supabase/migrations/` directory
- Version controlled with application code
- Idempotent where possible (use IF NOT EXISTS, etc.)

### 6.11 Query Pattern Examples

**Search items by name (case-insensitive):**
```sql
SELECT * FROM items
WHERE user_id = auth.uid()
  AND LOWER(name) LIKE LOWER('%search_term%');
-- Uses idx_items_user_name index
```

**Filter items with multiple criteria:**
```sql
SELECT * FROM items
WHERE user_id = auth.uid()
  AND category_id = $1
  AND container_id = $2
  AND is_in = true;
-- Uses idx_items_user_filters composite index
```

**Get images for an item:**
```sql
SELECT * FROM images
WHERE entity_type = 'item'
  AND entity_id = $1
  AND user_id = auth.uid()
ORDER BY display_order;
-- Uses idx_images_items partial index
```

**Check if category can be deleted:**
```sql
SELECT COUNT(*) FROM items
WHERE category_id = $1 AND user_id = auth.uid();
-- Returns count to display in error message
```

### 6.12 Scalability Considerations
- **Optimized for single-user workloads** (Phase 1)
- Index strategy supports hundreds to thousands of items per user
- No premature optimization (no full-text search, materialized views)
- Room for future enhancements without schema redesign:
  - Add location hierarchy (rooms, buildings)
  - Implement full-text search with PostgreSQL tsvector
  - Add audit tables for change tracking
  - Introduce soft deletes if needed
  - Add denormalized count columns if performance requires

### 6.13 Out of Scope for MVP
- Multi-user/sharing capabilities
- Location hierarchy beyond containers
- Movement/change history tracking
- Full-text search optimization (using simple ILIKE)
- Audit tables and comprehensive logging
- Database views for complex queries
- Soft deletes and archiving
- Denormalized performance columns
- Advanced PostgreSQL features (partitioning, etc.)

### 6.14 Storage Management
- Images stored in Supabase Storage (not in database)
- Only metadata and paths stored in database
- Storage bucket configuration:
  - Maximum file size: 5MB
  - Allowed formats: JPEG, PNG, WebP
  - Bucket: private (requires authentication)
  - Path structure: `user_id/entity_type/entity_id/filename.ext`
- Application responsible for:
  - Image validation (format, size)
  - Thumbnail generation
  - Cleanup when entities deleted

### 6.15 Application-Level Responsibilities
- Validate image formats (JPEG, PNG, WebP)
- Enforce 5MB file size limit
- Generate and resize thumbnails
- Validate entity_id references (polymorphic constraint)
- Delete images from storage when entities deleted
- Display helpful error messages for RESTRICT violations
- Implement search debounce (300ms)
- Handle session-based filter state persistence

---

## 7. Schema Summary

**Total Tables:** 5 (profiles, containers, categories, items, images)
**Total ENUM Types:** 1 (entity_type_enum)
**Total Indexes:** 17 (5 primary keys, 6 foreign keys, 6 custom indexes)
**Total RLS Policies:** 20 (4 per table × 5 tables)
**Total Triggers:** 6 (5 for updated_at, 1 for image limit)
**Total Functions:** 2 (update_updated_at_column, enforce_image_limit)

**Relationships:**
- 1:1 - Users to Profiles
- 1:N - Profiles to Containers, Categories, Items, Images
- 1:N - Containers to Items (with RESTRICT)
- 1:N - Categories to Items (with RESTRICT)
- Polymorphic N:N - Items/Containers to Images (via entity_type/entity_id)

**Security Model:**
- Authentication required for all operations
- Row-Level Security on all tables
- User-scoped data isolation via user_id
- Multi-layered validation (database + application)

**Performance Features:**
- Comprehensive B-tree indexes for search/filter
- Case-insensitive search optimization
- Composite indexes for multi-filter queries
- Partial indexes for polymorphic relationships
- No denormalization for MVP simplicity
