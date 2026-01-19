# PostgreSQL MVP schema planning
_Exported on 19/01/2026 at 20:44:47 CET from Cursor (2.3.41)_

---

**User**

You are an AI assistant whose task is to help plan a PostgreSQL database schema for an MVP (Minimum Viable Product) based on the provided information. Your goal is to generate a list of questions and recommendations that will be used in subsequent prompting to create the database schema, relationships, and row-level security (RLS) policies.

Please carefully review the following information:

<product_requirements>
@.ai/prd.md 
</product_requirements>

<tech_stack>
@.cursor/rules/tech-stack.md 
</tech_stack>

Analyze the provided information, focusing on aspects relevant to database design. Consider the following issues:

1. Identify key entities and their attributes based on product requirements.
2. Determine potential relationships between entities.
3. Consider data types and constraints that may be necessary.
4. Think about scalability and performance impact.
5. Assess security requirements and their impact on database design.
6. Consider any specific PostgreSQL features that might be beneficial for the project.

Based on your analysis, generate a list of 10 questions and recommendations in a combined form (question + recommendation). These should address any ambiguities, potential issues, or areas where more information is needed to create an effective database schema. Consider questions regarding:

1. Entity relationships and cardinality
2. Data types and constraints
3. Indexing strategies
4. Partitioning (if applicable)
5. Row-level security requirements
6. Performance considerations
7. Scalability concerns
8. Data integrity and consistency

The output should have the following structure:

<questions>
List your questions and recommendations here, numbered for clarity:

For example:
1. Should the `users` entity have a relationship with `posts`?

Recommendation: Yes, the `users` entity should have a relationship with `posts` because users can create posts.
</questions>

Remember that your goal is to provide a comprehensive list of questions and recommendations that will help create a solid PostgreSQL database schema for the MVP. Focus on clarity, relevance, and accuracy of your outputs. Do not include any additional comments or explanations beyond the specified output format.

Continue this process, generating new questions and recommendations based on the provided context and user responses, until the user explicitly requests a summary.

Remember to focus on clarity, relevance, and accuracy of outputs. Do not include any additional comments or explanations beyond the specified output format.

---

**Cursor**

I'll analyze the product requirements and tech stack to help you plan the PostgreSQL database schema. Let me read the relevant documents.

Now let me check if there are any existing database files or schemas to understand the current state.

Based on my analysis of the product requirements document and tech stack, I can now provide you with a comprehensive list of questions and recommendations for planning your PostgreSQL database schema.

<questions>
1. Should the `users` table be managed by Supabase Auth or should we create a custom `users` table with additional profile information?

Recommendation: Use Supabase Auth's built-in `auth.users` table for authentication. Create a separate `profiles` table in the public schema with a foreign key to `auth.users(id)` for any additional user-specific settings or metadata. This follows Supabase best practices and leverages their authentication system while allowing extensibility.

2. Should the `containers` table have a self-referencing foreign key to support nested containers (containers within containers)?

Recommendation: No, do not implement nested containers for MVP. The PRD explicitly states "Out of Scope for Phase 1: Location hierarchy beyond container level (rooms, buildings, storage areas)". Keep the containers table flat with only id, user_id, name, description, created_at, and updated_at fields.

3. Should the `categories` table enforce case-insensitive uniqueness for category names per user?

Recommendation: Yes, create a unique constraint using `LOWER(name)` and `user_id` to enforce case-insensitive uniqueness. The PRD states "Category names must be unique" and validation should be case-insensitive (US-034). Use a unique index: `CREATE UNIQUE INDEX idx_categories_unique_name_per_user ON categories(user_id, LOWER(name))`.

4. Should the `items` table use an ENUM type or a boolean field for the in/out status?

Recommendation: Use a boolean field named `is_in` (or `status_is_in`) with a NOT NULL constraint and a default value of `true`. While an ENUM provides extensibility, the PRD clearly defines only two states ("In" and "Out") for MVP. A boolean is simpler, more performant, and sufficient for the current requirements.

5. Should the `images` table be a separate table with polymorphic associations to both items and containers, or should we use two separate tables?

Recommendation: Use a single `images` table with a polymorphic design. Include columns: `id`, `user_id`, `entity_type` (ENUM: 'item' or 'container'), `entity_id` (UUID), `storage_path` (text), `display_order` (integer 1-5), `created_at`. Add a composite index on `(entity_type, entity_id, display_order)` for efficient queries. This approach is DRY and easier to maintain.

6. Should we add database-level constraints to enforce the maximum of 5 images per item/container?

Recommendation: Yes, implement a CHECK constraint or trigger to enforce the 5-image limit at the database level. While application-level validation is necessary, database constraints provide an additional safety layer. Create a trigger that counts existing images before INSERT and raises an exception if the limit would be exceeded.

7. Should deletion of containers and categories with associated items be prevented using database foreign key constraints or application logic?

Recommendation: Use both approaches. Set foreign keys with `ON DELETE RESTRICT` to prevent database-level deletion of containers/categories with associated items. Additionally, implement application logic to check for associated items and return user-friendly error messages like "Cannot delete [name] because it contains X items" as specified in the PRD (US-010, US-016).

8. Should we implement soft deletes (deleted_at timestamp) or hard deletes for items, containers, and categories?

Recommendation: Implement hard deletes for MVP. The PRD does not mention item history tracking, archiving, or undo functionality for Phase 1. Soft deletes add complexity without clear business requirements. When items are deleted, also cascade delete their associated images from both the database and Supabase Storage.

9. Should we add database indexes for the search and filtering operations on items?

Recommendation: Yes, create the following indexes for optimal query performance:
- `CREATE INDEX idx_items_user_name ON items(user_id, LOWER(name))` for name search
- `CREATE INDEX idx_items_user_category ON items(user_id, category_id)` for category filtering
- `CREATE INDEX idx_items_user_container ON items(user_id, container_id)` for container filtering  
- `CREATE INDEX idx_items_user_status ON items(user_id, is_in)` for status filtering
- Consider a composite index on `(user_id, category_id, container_id, is_in)` for combined filters

10. Should Row-Level Security (RLS) policies be implemented to ensure users can only access their own data?

Recommendation: Yes, RLS is critical for data security in a multi-tenant application. Enable RLS on all tables (items, containers, categories, images, profiles) and create policies that filter by `user_id = auth.uid()`. Policies should allow users to SELECT, INSERT, UPDATE, and DELETE only their own records. This prevents data leaks even if application logic has bugs.

11. Should the `items` table include a full-text search index using PostgreSQL's tsvector for name and description fields?

Recommendation: Not for MVP. The PRD specifies simple case-insensitive text search with 300ms debounce (US-025). Use `ILIKE '%search_term%'` queries with the `LOWER()` function and standard B-tree indexes initially. Full-text search can be added in a future phase if needed for performance optimization with large datasets.

12. Should timestamps (created_at, updated_at) be added to all tables for audit trail purposes?

Recommendation: Yes, add `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` and `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` to all core tables (items, containers, categories, images, profiles). Create a database trigger to automatically update `updated_at` on row modifications. This supports future features like sorting by creation date and provides valuable audit information.

13. Should the database schema include a separate `item_count` column on containers and categories tables for performance optimization?

Recommendation: No, do not denormalize with count columns for MVP. Calculate counts dynamically using SQL COUNT queries. The PRD does not indicate massive scale requirements for Phase 1 testing. Denormalized counts add complexity and risk data inconsistency. If performance becomes an issue, add count columns later with triggers to maintain accuracy.

14. Should quantity in the `items` table be stored as an INTEGER or DECIMAL type?

Recommendation: Use `INTEGER` type with a CHECK constraint `quantity > 0` if the field is populated. The PRD describes quantity as optional and doesn't specify fractional quantities. For items like "batteries" or "screws", integer counts are most appropriate. If future requirements need fractional quantities (e.g., "2.5 meters of rope"), the schema can be migrated to DECIMAL.

15. Should we enforce that containers and categories exist before allowing item creation using database foreign key constraints?

Recommendation: Yes, absolutely. Create foreign key constraints: `items.container_id REFERENCES containers(id) ON DELETE RESTRICT` and `items.category_id REFERENCES categories(id) ON DELETE RESTRICT`. This enforces the pre-creation workflow specified in the PRD: "Items must be assigned to pre-existing containers and categories" and prevents orphaned items if containers/categories are deleted.
</questions>

---

**User**

1. Yes, I will use Supabase Auth. Apply recommendation.
2. No, no nested containers. Apply recommendation.
3. Apply recommendation.
4. Use boolean. Apply recommendation.
5. Apply recommendation. It is more extensible if in the future other objects also allow image upload.
6. Yes, trigger can be added. Apply recommendation.
7. Yes, use ON DELETE RESTRICT. Apply recommendation.
8. Hard delete only. Apply recommendation.
9. Apply recommendation.
10. Apply recommendation.
11. Yes, more advanced search in next phases. Apply recommendation.
12. Yes, add timestamps. Apply recommendation.
13. Apply recommendation.
14. Apply recommendation.
15. Apply recommendation.

---

**Cursor**

Thank you for confirming all the recommendations. I've noted your decisions on all 15 points. Based on your confirmations, here's a summary of the core database schema structure we've established:

## Confirmed Schema Design

**Core Tables:**
- `profiles` - User profile data (linked to `auth.users`)
- `containers` - Storage locations (flat, no nesting)
- `categories` - Item classification (case-insensitive unique per user)
- `items` - Stored items (with boolean `is_in` status, optional integer `quantity`)
- `images` - Polymorphic image storage for items and containers

**Key Design Decisions:**
- Supabase Auth integration with separate profiles table
- Hard deletes with `ON DELETE RESTRICT` for data integrity
- RLS policies on all tables filtering by `user_id`
- Timestamps (`created_at`, `updated_at`) on all tables
- Polymorphic images table with `entity_type` + `entity_id`
- Trigger to enforce 5-image limit per entity
- Standard B-tree indexes for search/filtering (no full-text search yet)
- No denormalized count columns

---

Now I need to gather more specific implementation details. Here are the next set of questions:

<questions>
16. Should the `profiles` table include any additional fields beyond the basic `user_id` reference, or should it be minimal for MVP?

Recommendation: Keep it minimal for MVP with only `id` (UUID, FK to `auth.users(id)`), `created_at`, and `updated_at`. The PRD doesn't specify user preferences, settings, or profile customization for Phase 1. Additional fields can be added later when features like user preferences or settings are implemented.

17. Should all UUID primary keys use `gen_random_uuid()` as the default value, or should the application generate UUIDs?

Recommendation: Use database-generated UUIDs with `DEFAULT gen_random_uuid()`. This ensures consistency, reduces application complexity, and guarantees uniqueness at the database level. Supabase Auth already uses UUIDs for `auth.users(id)`, so maintaining this pattern across all tables is consistent.

18. Should the `storage_path` field in the `images` table store the full URL or just the path within the Supabase Storage bucket?

Recommendation: Store only the path within the Supabase Storage bucket (e.g., `user_id/items/item_id/image_1.jpg`), not the full URL. This provides flexibility if the storage location or CDN changes, and the full URL can be constructed in the application using Supabase Storage SDK methods. The path should be `TEXT NOT NULL`.

19. Should the `display_order` field in the `images` table use a constraint to ensure values are only 1-5?

Recommendation: Yes, add a CHECK constraint: `CHECK (display_order >= 1 AND display_order <= 5)`. Additionally, create a unique constraint on `(entity_type, entity_id, display_order)` to prevent duplicate ordering numbers for the same entity. This enforces the "maximum 5 images" rule and ensures proper ordering.

20. Should the `entity_id` in the `images` table have a foreign key constraint, or should it be validated only at the application level?

Recommendation: Do not create a foreign key constraint on `entity_id` due to the polymorphic nature (it could reference either `items.id` or `containers.id`). Instead, validate the entity existence at the application level before inserting images. However, add a partial index for performance: `CREATE INDEX idx_images_items ON images(entity_id) WHERE entity_type = 'item'` and similarly for containers.

21. Should the RLS policies allow users to view/modify data only when authenticated, or should there be read-only public access to any data?

Recommendation: All data should be private and accessible only to authenticated users who own the data. RLS policies should use `auth.uid()` to match `user_id` for all operations (SELECT, INSERT, UPDATE, DELETE). No public access for MVP as specified - this is a single-user personal storage system with no sharing features in Phase 1.

22. Should we add a database trigger to automatically update the `updated_at` timestamp, or handle this in the application layer?

Recommendation: Create a reusable database function and triggers for all tables with `updated_at` fields. This ensures consistency and reduces application code. Example:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```
Then create triggers on each table.

23. Should the `description` fields in items and containers have a maximum length constraint?

Recommendation: Add a reasonable length constraint to prevent abuse and ensure database performance. Use `TEXT` type with a CHECK constraint: `CHECK (length(description) <= 10000)` for items and containers. This allows substantial detail (roughly 1,500-2,000 words) while preventing extremely large text blobs. Adjust based on real-world usage patterns.

24. Should the database include a migration versioning strategy, and should we use Supabase's migration system?

Recommendation: Yes, use Supabase's built-in migration system with sequential versioning (e.g., `20260119000001_initial_schema.sql`). Place migrations in `supabase/migrations/` directory. Each migration should be idempotent where possible, include both UP and DOWN operations in comments, and follow a clear naming convention: `timestamp_descriptive_name.sql`.

25. Should we create database views for common queries like "items with their container and category names" to simplify application queries?

Recommendation: Not for MVP. Keep the schema simple and perform JOINs in the application layer or use Supabase's automatic foreign key resolution in queries. Database views add complexity and can impact performance if not properly maintained. Consider views in future phases if query patterns become complex or performance optimization is needed.

26. Should we add any database-level validations for the container and category names (e.g., minimum length, no special characters)?

Recommendation: Add minimal constraints: `CHECK (length(trim(name)) >= 1 AND length(name) <= 255)` for both containers and categories. This prevents empty/whitespace-only names and sets a reasonable upper limit. Do not restrict special characters at the database level - let users name their containers/categories naturally (e.g., "Tool Drawer #3", "Kid's Toys"). More specific validation can be handled in the application if needed.

27. Should the database schema include any audit tables or logs for tracking changes to items, containers, or categories?

Recommendation: No audit tables for MVP. The PRD explicitly states "Out of Scope for Phase 1: Item movement history tracking". The `created_at` and `updated_at` timestamps provide basic temporal information. Implement comprehensive audit logging in future phases if regulatory requirements or user needs emerge.

28. Should we create a separate table for managing valid `entity_type` values, or use a PostgreSQL ENUM type?

Recommendation: Use a PostgreSQL ENUM type: `CREATE TYPE entity_type AS ENUM ('item', 'container')`. For MVP with only two entity types, an ENUM is simpler and more performant than a lookup table. If future phases require dynamic entity types or metadata, migrate to a reference table. The ENUM ensures type safety at the database level.

29. Should we implement database-level cascading updates if a user's ID changes in the auth system?

Recommendation: Use `ON UPDATE CASCADE` for all foreign keys referencing `auth.users(id)`. While Supabase Auth UUIDs rarely change, this provides safety if they do. Example: `profiles.id REFERENCES auth.users(id) ON DELETE CASCADE ON UPDATE CASCADE`. This ensures referential integrity is maintained automatically without application intervention.

30. Should we add a database constraint to prevent the `name` field in items from being excessively long?

Recommendation: Yes, add a reasonable length limit: `CHECK (length(trim(name)) >= 1 AND length(name) <= 255)`. Item names should be concise identifiers, not full descriptions. 255 characters is a standard VARCHAR length that accommodates most naming needs while preventing abuse. The separate `description` field can hold longer text (up to 10,000 characters as per question 23).
</questions>

---

**User**

16. Apply recommendation.
17. Apply recommendation.
18. Only path within the Supabase Storage bucket. Apply recommendation.
19. Apply recommendation.
20. Apply recommendation.
21. Apply recommendation.
22. Apply recommendation.
23. Apply recommendation.
24. Use Supabase's builtin migration system. Apply recommendation.
25. Not in phase 1. Apply recommendation.
26. Apply recommendation.
27. No in MVP. Apply recommendation.
28. Use enum. Apply recommendation.
29. Apply recommendation.
30. Apply recommendation.

---

You are an AI assistant whose task is to summarize the conversation about database planning for MVP and prepare a concise summary for the next stage of development. In the conversation history, you will find the following information:
1. Product Requirements Document (PRD)
2. Information about the tech stack
3. Conversation history containing questions and answers
4. Model recommendations

Your tasks are:
1. Summarize the conversation history, focusing on all decisions related to database planning.
2. Match model recommendations to the answers given in the conversation history. Identify which recommendations are relevant based on the discussion.
3. Prepare a detailed conversation summary that includes:
   a. Main requirements for the database schema
   b. Key entities and their relationships
   c. Important security and scalability concerns
   d. Any unresolved issues or areas requiring further clarification
4. Format the results as follows:

<conversation_summary>
<decisions>
[List decisions made by the user, numbered].
</decisions>

<matched_recommendations>
[List of the most relevant recommendations matched to the conversation, numbered]
</matched_recommendations>

<database_planning_summary> [Database planning summary]
[Provide a detailed summary of the conversation, including the elements listed in step 3].
</database_planning_summary>

<unresolved_issues>
[List any unresolved issues or areas requiring further clarification, if any exist]
</unresolved_issues>
</conversation_summary>

The final output should contain only the content in markdown format. Ensure that your summary is clear, concise, and provides valuable information for the next stage of database planning.

---

**Cursor**

<conversation_summary>

<decisions>

1. Use Supabase Auth's built-in `auth.users` table with a separate `profiles` table in the public schema
2. No nested containers - keep the containers table flat
3. Enforce case-insensitive uniqueness for category names per user using `LOWER(name)` index
4. Use boolean field (`is_in`) for item in/out status instead of ENUM
5. Use single polymorphic `images` table for both items and containers
6. Add database trigger to enforce 5-image limit per entity
7. Use foreign keys with `ON DELETE RESTRICT` for containers and categories
8. Implement hard deletes only (no soft deletes)
9. Add comprehensive B-tree indexes for search and filtering operations
10. Implement Row-Level Security (RLS) policies on all tables filtering by `user_id`
11. Use simple case-insensitive text search for MVP (no full-text search)
12. Add `created_at` and `updated_at` timestamps to all tables
13. No denormalized count columns - calculate counts dynamically
14. Store quantity as `INTEGER` type with `CHECK (quantity > 0)` constraint
15. Enforce pre-creation workflow using foreign key constraints on items table
16. Keep `profiles` table minimal with only `id`, `created_at`, and `updated_at`
17. Use database-generated UUIDs with `DEFAULT gen_random_uuid()`
18. Store only storage path (not full URL) in `images.storage_path` field
19. Add `CHECK (display_order >= 1 AND display_order <= 5)` constraint on images table
20. No foreign key constraint on polymorphic `entity_id`, validate at application level
21. All data private - RLS policies require authentication and user ownership
22. Create database function and triggers to automatically update `updated_at` timestamps
23. Add `CHECK (length(description) <= 10000)` constraint on description fields
24. Use Supabase's built-in migration system with sequential timestamp-based naming
25. No database views in MVP - perform JOINs in application layer
26. Add name validation: `CHECK (length(trim(name)) >= 1 AND length(name) <= 255)`
27. No audit tables or change tracking in MVP
28. Use PostgreSQL ENUM type for `entity_type` values ('item', 'container')
29. Use `ON UPDATE CASCADE` for all foreign keys referencing `auth.users(id)`
30. Add `CHECK (length(trim(name)) >= 1 AND length(name) <= 255)` constraint on item names

</decisions>

<matched_recommendations>

**Authentication & User Management**
- Leverage Supabase Auth for authentication with minimal `profiles` table extension
- Use `auth.uid()` in RLS policies to ensure users only access their own data
- Implement `ON UPDATE CASCADE` on foreign keys to `auth.users(id)`

**Core Entity Design**
- Flat container structure without hierarchy (aligns with MVP scope)
- Polymorphic images table using `entity_type` ENUM and `entity_id` UUID pattern
- Boolean status tracking for items (`is_in`) rather than extensible ENUM
- Optional integer quantity field with positive value constraint

**Data Integrity Constraints**
- Case-insensitive unique index on category names per user: `(user_id, LOWER(name))`
- Foreign keys with `ON DELETE RESTRICT` to prevent deletion of containers/categories with items
- Name length validation (1-255 characters, trimmed) across all entities
- Description length limit (10,000 characters) to prevent abuse
- Unique constraint on `(entity_type, entity_id, display_order)` for image ordering
- Check constraint limiting `display_order` to 1-5 range
- Database trigger enforcing maximum 5 images per entity

**Performance Optimization**
- Comprehensive B-tree indexes for search/filter operations:
  - `idx_items_user_name` on `(user_id, LOWER(name))`
  - `idx_items_user_category` on `(user_id, category_id)`
  - `idx_items_user_container` on `(user_id, container_id)`
  - `idx_items_user_status` on `(user_id, is_in)`
  - Composite index on `(user_id, category_id, container_id, is_in)` for combined filters
- Partial indexes on images: `(entity_id) WHERE entity_type = 'item'` and for containers
- Dynamic count calculations (no denormalization) for MVP simplicity

**Security Implementation**
- RLS policies on all tables (profiles, containers, categories, items, images)
- All operations (SELECT, INSERT, UPDATE, DELETE) filtered by `user_id = auth.uid()`
- No public access - authentication required for all data operations
- Multi-layered security: RLS + application validation + foreign key constraints

**Temporal & Audit Features**
- Standard timestamps (`created_at`, `updated_at`) on all core tables
- Reusable `update_updated_at_column()` trigger function
- Database-generated timestamps using `DEFAULT NOW()`
- No comprehensive audit logging in MVP (deferred to future phases)

**Storage Management**
- Store relative paths within Supabase Storage bucket (not full URLs)
- Path format: `user_id/entity_type/entity_id/image_name.ext`
- Maximum 5MB per image, validated at application level
- Support for JPEG, PNG, WebP formats

**Migration Strategy**
- Use Supabase migration system with timestamp-based sequential naming
- Pattern: `YYYYMMDDHHMMSS_descriptive_name.sql`
- Migrations stored in `supabase/migrations/` directory
- Idempotent migrations where possible

**Simplicity for MVP**
- Hard deletes only (no soft delete complexity)
- No database views (JOINs in application layer)
- No full-text search (simple ILIKE queries sufficient)
- No audit tables or change history
- No location hierarchy beyond containers
- No denormalized data or materialized views

</matched_recommendations>

<database_planning_summary>

## Overview
The Home Storage System MVP requires a PostgreSQL database schema designed for single-user personal item organization with Supabase as the Backend-as-a-Service provider. The schema emphasizes data integrity, security through Row-Level Security, and simplicity appropriate for Phase 1 testing.

## Key Entities and Relationships

**1. Profiles Table**
- Extends Supabase Auth with minimal user metadata
- One-to-one relationship with `auth.users`
- Fields: `id` (UUID, FK to auth.users), `created_at`, `updated_at`

**2. Containers Table**
- Represents physical storage locations (flat structure, no nesting)
- One-to-many relationship with items
- Many-to-many relationship with images (via polymorphic images table)
- Fields: `id`, `user_id`, `name`, `description`, `created_at`, `updated_at`
- Constraints: Name 1-255 characters, description max 10,000 characters
- Cannot be deleted if items assigned (`ON DELETE RESTRICT`)

**3. Categories Table**
- Logical classification system for items
- One-to-many relationship with items
- Fields: `id`, `user_id`, `name`, `created_at`, `updated_at`
- Constraints: Case-insensitive unique names per user via index on `(user_id, LOWER(name))`
- Name length 1-255 characters
- Cannot be deleted if items assigned (`ON DELETE RESTRICT`)

**4. Items Table**
- Core entity representing stored physical items
- Many-to-one relationships with containers and categories
- Many-to-many relationship with images (via polymorphic images table)
- Fields: `id`, `user_id`, `name`, `category_id` (FK, NOT NULL), `container_id` (FK, NOT NULL), `is_in` (boolean, NOT NULL, default true), `description`, `quantity` (integer, optional, positive), `created_at`, `updated_at`
- Constraints: Name 1-255 characters, description max 10,000 characters, quantity > 0 if provided
- Foreign keys require pre-existing containers and categories

**5. Images Table (Polymorphic)**
- Stores image metadata for both items and containers
- Polymorphic design using `entity_type` ENUM ('item', 'container') and `entity_id`
- Fields: `id`, `user_id`, `entity_type`, `entity_id`, `storage_path`, `display_order` (1-5), `created_at`, `updated_at`
- Constraints: 
  - Maximum 5 images per entity (enforced via trigger)
  - Unique `(entity_type, entity_id, display_order)` to prevent duplicate ordering
  - Check constraint: `display_order >= 1 AND display_order <= 5`
- Storage path format: relative path within Supabase Storage bucket
- No foreign key on `entity_id` (validated at application level)

## Database Schema Architecture

**Primary Keys & Identifiers**
- All tables use UUID primary keys with `DEFAULT gen_random_uuid()`
- Consistent with Supabase Auth's UUID usage
- Ensures globally unique identifiers

**Foreign Key Strategy**
- All foreign keys include `ON DELETE RESTRICT` to maintain referential integrity
- User references include `ON UPDATE CASCADE` for safety
- Pre-creation workflow enforced: containers and categories must exist before items can reference them

**Timestamp Management**
- All tables include `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- All tables include `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- Automatic `updated_at` maintenance via database trigger function
- Provides basic temporal tracking without full audit complexity

## Security Architecture

**Row-Level Security (RLS)**
- Enabled on all tables: profiles, containers, categories, items, images
- Policy pattern: `user_id = auth.uid()` for all operations
- Separate policies for SELECT, INSERT, UPDATE, DELETE operations
- No public access - authentication required
- Multi-tenant isolation at database level

**Data Privacy**
- Every table includes `user_id` column for ownership tracking
- Users can only access their own data
- Even with application bugs, RLS prevents data leaks
- Appropriate for single-user Phase 1 architecture

**Cascading Security**
- Images inherit security from parent entities via `user_id` field
- No cross-user data visibility at any level
- Foreign key constraints prevent orphaned records

## Performance Considerations

**Indexing Strategy**
- User-scoped indexes for all filtered queries
- Name search optimized with `LOWER(name)` index
- Category and container filtering via foreign key indexes
- Status filtering via boolean index
- Composite index for combined multi-filter queries
- Partial indexes on polymorphic image relationships

**Query Patterns**
- Simple case-insensitive text search using `ILIKE` with debounce (300ms)
- AND-logic filter combinations on category, container, status
- Real-time filtering with instant visual feedback
- Dynamic count calculations (no cached values)

**Scalability Approach**
- Optimized for single-user workloads (Phase 1 testing)
- Index strategy supports hundreds to thousands of items per user
- No premature optimization (full-text search, materialized views)
- Room for future enhancement without schema redesign

## Data Integrity Rules

**Deletion Protection**
- Containers with assigned items cannot be deleted
- Categories with assigned items cannot be deleted
- Error messages indicate item count and suggest reassignment

**Image Management**
- Maximum 5 images per item or container (trigger-enforced)
- Ordered 1-5 with unique positions per entity
- First image serves as thumbnail in list views
- Images cascade delete when entity deleted

**Validation Layers**
1. Database constraints (CHECK, NOT NULL, UNIQUE)
2. Foreign key relationships with RESTRICT
3. RLS policies for access control
4. Application-level business logic
5. Triggers for complex rules (image limits)

## Migration Management

**Supabase Migration System**
- Sequential timestamp-based naming: `YYYYMMDDHHMMSS_descriptive_name.sql`
- Stored in `supabase/migrations/` directory
- Version controlled with application code
- Clear naming convention for maintainability
- Idempotent where possible

## Technical Constraints & Boundaries

**In Scope for MVP**
- Single-user data isolation
- Basic CRUD operations with referential integrity
- Multi-image support with ordering
- Search and filtering with simple indexes
- Hard deletes only
- Standard PostgreSQL features (no extensions required)

**Deferred to Future Phases**
- Multi-user/sharing capabilities
- Location hierarchy (rooms, buildings)
- Movement/change history tracking
- Full-text search optimization
- Audit tables and comprehensive logging
- Database views for complex queries
- Soft deletes and archiving
- Denormalized performance columns
- Advanced PostgreSQL features (partitioning, etc.)

## Data Type Decisions

- **Text fields**: VARCHAR with CHECK constraints for lengths
- **Descriptions**: TEXT with 10,000 character limit
- **Status tracking**: BOOLEAN for simplicity
- **Quantities**: INTEGER with positive constraint
- **Timestamps**: TIMESTAMPTZ for timezone awareness
- **Entity types**: PostgreSQL ENUM for type safety
- **IDs**: UUID for consistency with Supabase Auth

</database_planning_summary>

<unresolved_issues>

No unresolved issues. All 30 questions have been answered with confirmed decisions. The database schema is fully specified and ready for implementation with:

- Complete entity definitions
- All relationships mapped
- Constraints and validations defined
- Indexing strategy established
- Security policies planned
- Migration approach confirmed

The schema design aligns with the PRD requirements for MVP Phase 1 and follows Supabase/PostgreSQL best practices.

</unresolved_issues>

</conversation_summary>

