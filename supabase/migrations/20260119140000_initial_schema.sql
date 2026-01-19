-- =====================================================
-- Migration: Initial Home Storage System Schema
-- Created: 2026-01-19
-- Description: Creates complete database schema including:
--   - profiles table (extends auth.users)
--   - containers table (physical storage locations)
--   - categories table (logical item classification)
--   - items table (stored items)
--   - images table (polymorphic image metadata)
--   - entity_type_enum (enum for polymorphic relationships)
--   - All indexes, triggers, and RLS policies
-- =====================================================

-- =====================================================
-- 1. ENUM TYPES
-- =====================================================

-- Define entity type enum for polymorphic image relationships
-- Used by images table to reference either items or containers
create type entity_type_enum as enum ('item', 'container');

-- =====================================================
-- 2. TABLES
-- =====================================================

-- -----------------------------------------------------
-- 2.1 profiles
-- Extends Supabase Auth with minimal user metadata
-- One-to-one relationship with auth.users
-- -----------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade on update cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;

-- Add comment explaining table purpose
comment on table profiles is 'Extends Supabase Auth users table with minimal metadata. One-to-one relationship with auth.users.';

-- -----------------------------------------------------
-- 2.2 containers
-- Physical storage locations (flat structure, no nesting)
-- -----------------------------------------------------
create table containers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade on update cascade,
  name varchar(255) not null check (length(trim(name)) >= 1 and length(name) <= 255),
  description text check (length(description) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table containers enable row level security;

-- Add comment explaining table purpose
comment on table containers is 'Physical storage locations. Flat structure without nesting. Each container belongs to one user.';

-- -----------------------------------------------------
-- 2.3 categories
-- Logical classification system for items
-- -----------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade on update cascade,
  name varchar(255) not null check (length(trim(name)) >= 1 and length(name) <= 255),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table categories enable row level security;

-- Add comment explaining table purpose
comment on table categories is 'Logical classification system for items. Each user can define their own categories with case-insensitive unique names.';

-- -----------------------------------------------------
-- 2.4 items
-- Core entity representing stored physical items
-- -----------------------------------------------------
create table items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade on update cascade,
  name varchar(255) not null check (length(trim(name)) >= 1 and length(name) <= 255),
  category_id uuid not null references categories(id) on delete restrict,
  container_id uuid not null references containers(id) on delete restrict,
  is_in boolean not null default true,
  description text check (length(description) <= 10000),
  quantity integer check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table items enable row level security;

-- Add comments explaining table purpose and constraints
comment on table items is 'Core entity for stored items. Each item must belong to a category and container. ON DELETE RESTRICT prevents deletion of categories/containers that have items.';
comment on column items.is_in is 'Tracks if item is currently in storage (true) or taken out (false)';
comment on column items.category_id is 'Required reference to categories. ON DELETE RESTRICT prevents category deletion if items exist.';
comment on column items.container_id is 'Required reference to containers. ON DELETE RESTRICT prevents container deletion if items exist.';

-- -----------------------------------------------------
-- 2.5 images
-- Polymorphic table storing image metadata for items and containers
-- -----------------------------------------------------
create table images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade on update cascade,
  entity_type entity_type_enum not null,
  entity_id uuid not null,
  storage_path text not null,
  display_order integer not null check (display_order >= 1 and display_order <= 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table images enable row level security;

-- Add comments explaining table purpose and design decisions
comment on table images is 'Polymorphic table for image metadata. Stores paths to images in Supabase Storage. Max 5 images per entity (item or container). Display order 1 is the thumbnail.';
comment on column images.entity_type is 'Type of parent entity: item or container';
comment on column images.entity_id is 'ID of parent entity. No FK constraint - validated at application level for polymorphic flexibility.';
comment on column images.storage_path is 'Relative path within Supabase Storage bucket. Format: user_id/entity_type/entity_id/image_name.ext';
comment on column images.display_order is 'Image order from 1-5. Order 1 serves as thumbnail. Unique per entity via index.';

-- =====================================================
-- 3. INDEXES
-- =====================================================

-- -----------------------------------------------------
-- 3.1 Foreign Key Indexes
-- These optimize JOIN operations and foreign key lookups
-- -----------------------------------------------------

-- Containers foreign key indexes
create index idx_containers_user_id on containers(user_id);

-- Categories foreign key indexes
create index idx_categories_user_id on categories(user_id);

-- Items foreign key indexes
create index idx_items_user_id on items(user_id);
create index idx_items_category_id on items(category_id);
create index idx_items_container_id on items(container_id);

-- Images foreign key indexes
create index idx_images_user_id on images(user_id);

-- -----------------------------------------------------
-- 3.2 Search and Filter Indexes
-- These optimize common query patterns for items
-- -----------------------------------------------------

-- Case-insensitive item name search per user
-- Supports ILIKE queries on item names within user scope
create index idx_items_user_name on items(user_id, lower(name));

-- Filter items by category within user scope
-- Optimizes category-based filtering
create index idx_items_user_category on items(user_id, category_id);

-- Filter items by container within user scope
-- Optimizes container-based filtering
create index idx_items_user_container on items(user_id, container_id);

-- Filter items by in/out status within user scope
-- Optimizes status-based filtering (items in storage vs. taken out)
create index idx_items_user_status on items(user_id, is_in);

-- Composite index for combined multi-filter queries
-- Supports queries combining category, container, and status filters
-- Most selective column (user_id) first, then frequently combined filters
create index idx_items_user_filters on items(user_id, category_id, container_id, is_in);

-- -----------------------------------------------------
-- 3.3 Unique Constraint Indexes
-- These enforce business rules at database level
-- -----------------------------------------------------

-- Case-insensitive unique category names per user
-- Prevents duplicate categories like "Tools" and "tools" for same user
create unique index idx_categories_user_name_unique on categories(user_id, lower(name));

-- Unique image ordering per entity
-- Ensures no duplicate display_order values for the same entity
-- Prevents multiple images with same position
create unique index idx_images_entity_order_unique on images(entity_type, entity_id, display_order);

-- -----------------------------------------------------
-- 3.4 Partial Indexes (Polymorphic Relationships)
-- These optimize queries filtered by entity_type
-- -----------------------------------------------------

-- Optimize queries for item images
-- Only indexes images where entity_type = 'item'
create index idx_images_items on images(entity_id) where entity_type = 'item';

-- Optimize queries for container images
-- Only indexes images where entity_type = 'container'
create index idx_images_containers on images(entity_id) where entity_type = 'container';

-- =====================================================
-- 4. FUNCTIONS
-- =====================================================

-- -----------------------------------------------------
-- 4.1 Reusable function to automatically update updated_at timestamp
-- This function is called by triggers before any UPDATE operation
-- -----------------------------------------------------
create or replace function update_updated_at_column()
returns trigger as $$
begin
  -- Set updated_at to current timestamp whenever row is updated
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add comment explaining function purpose
comment on function update_updated_at_column is 'Trigger function to automatically update updated_at column on row modification. Used by all tables with updated_at columns.';

-- -----------------------------------------------------
-- 4.2 Function to enforce maximum 5 images per entity
-- Prevents adding more than 5 images to any item or container
-- -----------------------------------------------------
create or replace function enforce_image_limit()
returns trigger as $$
declare
  image_count integer;
begin
  -- Count existing images for this entity
  select count(*)
  into image_count
  from images
  where entity_type = new.entity_type
    and entity_id = new.entity_id;
  
  -- Reject insert if limit would be exceeded
  -- This check happens BEFORE the new row is inserted
  if image_count >= 5 then
    raise exception 'Cannot add more than 5 images per %', new.entity_type;
  end if;
  
  return new;
end;
$$ language plpgsql;

-- Add comment explaining function purpose
comment on function enforce_image_limit is 'Trigger function to enforce maximum 5 images per entity (item or container). Raises exception if limit would be exceeded.';

-- =====================================================
-- 5. TRIGGERS
-- =====================================================

-- -----------------------------------------------------
-- 5.1 Triggers for automatic updated_at timestamp updates
-- These run BEFORE UPDATE on each table to maintain updated_at
-- -----------------------------------------------------

-- Profiles table trigger
create trigger update_profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at_column();

-- Containers table trigger
create trigger update_containers_updated_at
  before update on containers
  for each row
  execute function update_updated_at_column();

-- Categories table trigger
create trigger update_categories_updated_at
  before update on categories
  for each row
  execute function update_updated_at_column();

-- Items table trigger
create trigger update_items_updated_at
  before update on items
  for each row
  execute function update_updated_at_column();

-- Images table trigger
create trigger update_images_updated_at
  before update on images
  for each row
  execute function update_updated_at_column();

-- -----------------------------------------------------
-- 5.2 Trigger to enforce image limit
-- Runs BEFORE INSERT to prevent exceeding 5 images per entity
-- -----------------------------------------------------

create trigger enforce_image_limit_trigger
  before insert on images
  for each row
  execute function enforce_image_limit();

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- -----------------------------------------------------
-- 6.1 Profiles Table Policies
-- Users can only access their own profile data
-- auth.uid() returns the authenticated user's ID
-- -----------------------------------------------------

-- SELECT: Users can view their own profile
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

-- INSERT: Users can insert their own profile
-- This allows profile creation during user signup
create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- UPDATE: Users can update their own profile
-- USING clause checks ownership, WITH CHECK ensures they don't change ownership
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- DELETE: Users can delete their own profile
-- This allows users to delete their account data
create policy "Users can delete own profile"
  on profiles for delete
  using (auth.uid() = id);

-- -----------------------------------------------------
-- 6.2 Containers Table Policies
-- Users can only access their own containers
-- -----------------------------------------------------

-- SELECT: Users can view their own containers
create policy "Users can view own containers"
  on containers for select
  using (auth.uid() = user_id);

-- INSERT: Users can insert their own containers
-- WITH CHECK ensures user_id matches authenticated user
create policy "Users can insert own containers"
  on containers for insert
  with check (auth.uid() = user_id);

-- UPDATE: Users can update their own containers
-- Both USING and WITH CHECK ensure ownership
create policy "Users can update own containers"
  on containers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- DELETE: Users can delete their own containers
-- Note: ON DELETE RESTRICT on items table prevents deleting containers with items
create policy "Users can delete own containers"
  on containers for delete
  using (auth.uid() = user_id);

-- -----------------------------------------------------
-- 6.3 Categories Table Policies
-- Users can only access their own categories
-- -----------------------------------------------------

-- SELECT: Users can view their own categories
create policy "Users can view own categories"
  on categories for select
  using (auth.uid() = user_id);

-- INSERT: Users can insert their own categories
-- WITH CHECK ensures user_id matches authenticated user
create policy "Users can insert own categories"
  on categories for insert
  with check (auth.uid() = user_id);

-- UPDATE: Users can update their own categories
-- Both USING and WITH CHECK ensure ownership
create policy "Users can update own categories"
  on categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- DELETE: Users can delete their own categories
-- Note: ON DELETE RESTRICT on items table prevents deleting categories with items
create policy "Users can delete own categories"
  on categories for delete
  using (auth.uid() = user_id);

-- -----------------------------------------------------
-- 6.4 Items Table Policies
-- Users can only access their own items
-- -----------------------------------------------------

-- SELECT: Users can view their own items
create policy "Users can view own items"
  on items for select
  using (auth.uid() = user_id);

-- INSERT: Users can insert their own items
-- WITH CHECK ensures user_id matches authenticated user
-- Note: Referenced category_id and container_id must also belong to user (validated by app)
create policy "Users can insert own items"
  on items for insert
  with check (auth.uid() = user_id);

-- UPDATE: Users can update their own items
-- Both USING and WITH CHECK ensure ownership
create policy "Users can update own items"
  on items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- DELETE: Users can delete their own items
create policy "Users can delete own items"
  on items for delete
  using (auth.uid() = user_id);

-- -----------------------------------------------------
-- 6.5 Images Table Policies
-- Users can only access their own images
-- -----------------------------------------------------

-- SELECT: Users can view their own images
create policy "Users can view own images"
  on images for select
  using (auth.uid() = user_id);

-- INSERT: Users can insert their own images
-- WITH CHECK ensures user_id matches authenticated user
-- Note: entity_id ownership must be validated at application level (polymorphic)
create policy "Users can insert own images"
  on images for insert
  with check (auth.uid() = user_id);

-- UPDATE: Users can update their own images
-- Both USING and WITH CHECK ensure ownership
-- Primarily used for reordering images (changing display_order)
create policy "Users can update own images"
  on images for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- DELETE: Users can delete their own images
-- Application must also delete corresponding file from Supabase Storage
create policy "Users can delete own images"
  on images for delete
  using (auth.uid() = user_id);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- This migration has created:
-- - 1 enum type (entity_type_enum)
-- - 5 tables (profiles, containers, categories, items, images)
-- - 13 indexes (6 foreign key, 5 search/filter, 2 unique constraint, 2 partial)
-- - 2 functions (update_updated_at_column, enforce_image_limit)
-- - 6 triggers (5 for updated_at, 1 for image limit)
-- - 20 RLS policies (4 per table × 5 tables)
--
-- All tables have Row Level Security enabled
-- All data is isolated by user_id for multi-tenant security
-- Foreign key constraints ensure referential integrity
-- Check constraints validate data at insert/update time
