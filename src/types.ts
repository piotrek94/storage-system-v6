/**
 * DTO (Data Transfer Object) and Command Model Type Definitions
 *
 * This file contains all type definitions for API requests and responses.
 * All DTOs are derived from database entity types to maintain type safety
 * and consistency with the underlying data model.
 */

import type { Tables, TablesInsert, TablesUpdate, Enums } from "./db/database.types";

// =============================================================================
// Base Entity Types (Aliases for Database Tables)
// =============================================================================

export type Category = Tables<"categories">;
export type Container = Tables<"containers">;
export type Item = Tables<"items">;
export type Image = Tables<"images">;
export type Profile = Tables<"profiles">;

export type EntityType = Enums<"entity_type_enum">;

// =============================================================================
// Common/Shared DTOs
// =============================================================================

/**
 * Pagination metadata for list endpoints
 */
export interface PaginationMetaDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Generic paginated response wrapper
 * Used by endpoints that return lists with pagination
 */
export interface PaginatedResponseDTO<T> {
  data: T[];
  pagination: PaginationMetaDTO;
}

/**
 * Simple reference to a category (used in nested objects)
 * Derived from: Categories table (subset of fields)
 */
export type CategoryRefDTO = Pick<Category, "id" | "name">;

/**
 * Simple reference to a container (used in nested objects)
 * Derived from: Containers table (subset of fields)
 */
export type ContainerRefDTO = Pick<Container, "id" | "name">;

// =============================================================================
// Image DTOs
// =============================================================================

/**
 * Image data transfer object with computed URLs
 * Derived from: Images table + computed URL fields
 *
 * Note: url and thumbnailUrl are computed from storage_path
 */
export interface ImageDTO {
  id: Image["id"];
  url: string;
  thumbnailUrl: string;
  displayOrder: Image["display_order"];
  createdAt?: Image["created_at"];
  updatedAt?: Image["updated_at"];
}

/**
 * Command for uploading a new image
 * Used for: POST /api/items/:id/images and POST /api/containers/:id/images
 *
 * Note: This represents multipart/form-data payload
 */
export interface UploadImageCommand {
  file: File;
  displayOrder?: number; // 1-5, auto-assigned if not provided
}

/**
 * Command for updating image display order
 * Derived from: Images Update type (partial)
 * Used for: PATCH /api/items/:itemId/images/:imageId
 */
export type UpdateImageDisplayOrderCommand = Pick<TablesUpdate<"images">, "display_order"> & {
  displayOrder: number; // Make required for this command
};

// =============================================================================
// Dashboard DTOs
// =============================================================================

/**
 * Recent item summary for dashboard
 * Derived from: Items table + related entities
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

/**
 * Dashboard statistics response
 * Used for: GET /api/dashboard/stats
 *
 * Contains aggregated statistics from multiple entities
 */
export interface DashboardStatsDTO {
  totalItems: number;
  totalContainers: number;
  totalCategories: number;
  itemsOut: number;
  recentItems: RecentItemDTO[];
}

// =============================================================================
// Container DTOs
// =============================================================================

/**
 * Container list item with computed fields
 * Derived from: Containers table + computed aggregations
 * Used for: GET /api/containers (list response)
 */
export interface ContainerListItemDTO {
  id: Container["id"];
  name: Container["name"];
  description: Container["description"];
  thumbnail: string | null;
  imageCount: number;
  itemCount: number;
  createdAt: Container["created_at"];
  updatedAt: Container["updated_at"];
}

/**
 * Item summary for container detail view
 * Derived from: Items table + category reference
 */
export interface ContainerItemSummaryDTO {
  id: Item["id"];
  name: Item["name"];
  thumbnail: string | null;
  category: CategoryRefDTO["name"];
  isIn: Item["is_in"];
}

/**
 * Detailed container information with related data
 * Derived from: Containers table + related images + related items
 * Used for: GET /api/containers/:id (single item response)
 */
export interface ContainerDetailDTO {
  id: Container["id"];
  name: Container["name"];
  description: Container["description"];
  images: ImageDTO[];
  items: ContainerItemSummaryDTO[];
  itemCount: number;
  createdAt: Container["created_at"];
  updatedAt: Container["updated_at"];
}

/**
 * Command for creating a new container
 * Derived from: Containers Insert type (user-provided fields only)
 * Used for: POST /api/containers
 */
export type CreateContainerCommand = Pick<TablesInsert<"containers">, "name" | "description">;

/**
 * Command for updating an existing container
 * Derived from: Containers Update type (user-modifiable fields only)
 * Used for: PATCH /api/containers/:id
 */
export type UpdateContainerCommand = Pick<TablesUpdate<"containers">, "name" | "description">;

// =============================================================================
// Category DTOs
// =============================================================================

/**
 * Category list item with computed fields
 * Derived from: Categories table + computed item count
 * Used for: GET /api/categories (list response)
 */
export interface CategoryListItemDTO {
  id: Category["id"];
  name: Category["name"];
  itemCount: number;
  createdAt: Category["created_at"];
  updatedAt: Category["updated_at"];
}

/**
 * Detailed category information
 * Derived from: Categories table + computed item count
 * Used for: GET /api/categories/:id (single item response)
 *
 * Note: Currently identical to CategoryListItemDTO, but kept separate
 * for potential future divergence
 */
export type CategoryDetailDTO = CategoryListItemDTO;

/**
 * Command for creating a new category
 * Derived from: Categories Insert type (user-provided fields only)
 * Used for: POST /api/categories
 */
export type CreateCategoryCommand = Pick<TablesInsert<"categories">, "name">;

/**
 * Command for updating an existing category
 * Derived from: Categories Update type (user-modifiable fields only)
 * Used for: PATCH /api/categories/:id
 */
export type UpdateCategoryCommand = Pick<TablesUpdate<"categories">, "name">;

// =============================================================================
// Item DTOs
// =============================================================================

/**
 * Item list item with related entity references
 * Derived from: Items table + category + container references
 * Used for: GET /api/items (list response)
 */
export interface ItemListItemDTO {
  id: Item["id"];
  name: Item["name"];
  thumbnail: string | null;
  category: CategoryRefDTO;
  container: ContainerRefDTO;
  isIn: Item["is_in"];
  quantity: Item["quantity"];
  createdAt: Item["created_at"];
  updatedAt: Item["updated_at"];
}

/**
 * Detailed item information with related data
 * Derived from: Items table + category + container + images
 * Used for: GET /api/items/:id (single item response)
 */
export interface ItemDetailDTO {
  id: Item["id"];
  name: Item["name"];
  description: Item["description"];
  category: CategoryRefDTO;
  container: ContainerRefDTO;
  isIn: Item["is_in"];
  quantity: Item["quantity"];
  images: ImageDTO[];
  createdAt: Item["created_at"];
  updatedAt: Item["updated_at"];
}

/**
 * Command for creating a new item
 * Derived from: Items Insert type (user-provided fields)
 * Used for: POST /api/items
 *
 * Note: Uses camelCase for API consistency (categoryId vs category_id)
 */
export interface CreateItemCommand {
  name: Item["name"];
  description?: Item["description"];
  categoryId: Item["category_id"];
  containerId: Item["container_id"];
  isIn: Item["is_in"];
  quantity?: Item["quantity"];
}

/**
 * Command for updating an existing item
 * Derived from: Items Update type (user-modifiable fields)
 * Used for: PATCH /api/items/:id
 *
 * Note: All fields are optional for partial updates
 */
export interface UpdateItemCommand {
  name?: Item["name"];
  description?: Item["description"];
  categoryId?: Item["category_id"];
  containerId?: Item["container_id"];
  isIn?: Item["is_in"];
  quantity?: Item["quantity"];
}

// =============================================================================
// API Response Wrappers
// =============================================================================

/**
 * Standard success response for list endpoints
 */
export type ContainerListResponseDTO = PaginatedResponseDTO<ContainerListItemDTO>;
export interface CategoryListResponseDTO {
  data: CategoryListItemDTO[];
}
export type ItemListResponseDTO = PaginatedResponseDTO<ItemListItemDTO>;

/**
 * Standard success response for delete operations
 */
export interface DeleteResponseDTO {
  message: string;
  id: string;
}

/**
 * Standard error response structure
 */
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
