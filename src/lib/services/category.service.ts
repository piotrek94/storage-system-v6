import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type {
  CategoryListItemDTO,
  CategoryDetailDTO,
  CategoryListResponseDTO,
  CreateCategoryCommand,
} from "../../types";

/**
 * Service layer for category operations
 * Handles all business logic and database interactions for categories
 */
export class CategoryService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Retrieves all categories for a user with sorting
   * Includes computed item count for each category
   */
  async listCategories(
    userId: string,
    sort: "name" | "created_at" = "name",
    order: "asc" | "desc" = "asc"
  ): Promise<CategoryListResponseDTO> {
    // Query categories with sorting
    const { data: categories, error } = await this.supabase
      .from("categories")
      .select(
        `
        id,
        name,
        created_at,
        updated_at
      `
      )
      .eq("user_id", userId)
      .order(sort === "name" ? "name" : "created_at", { ascending: order === "asc" });

    if (error) {
      console.error("[CategoryService] Error fetching categories:", error);
      throw new Error("Failed to retrieve categories");
    }

    // Get item counts for each category
    const categoryIds = categories.map((c) => c.id);

    // If no categories, return empty array
    if (categoryIds.length === 0) {
      return { data: [] };
    }

    const { data: itemCounts, error: countError } = await this.supabase
      .from("items")
      .select("category_id")
      .in("category_id", categoryIds);

    if (countError) {
      console.error("[CategoryService] Error fetching item counts:", countError);
      throw new Error("Failed to retrieve categories");
    }

    // Map counts to categories
    const countMap = new Map<string, number>();
    itemCounts?.forEach((item) => {
      countMap.set(item.category_id, (countMap.get(item.category_id) || 0) + 1);
    });

    // Build response DTOs
    const data: CategoryListItemDTO[] = categories.map((category) => ({
      id: category.id,
      name: category.name,
      itemCount: countMap.get(category.id) || 0,
      createdAt: category.created_at,
      updatedAt: category.updated_at,
    }));

    return { data };
  }

  /**
   * Creates a new category for a user
   * Enforces case-insensitive uniqueness
   */
  async createCategory(userId: string, command: CreateCategoryCommand): Promise<CategoryDetailDTO> {
    const trimmedName = command.name.trim();

    // Insert category and let database handle uniqueness constraint
    const { data: category, error } = await this.supabase
      .from("categories")
      .insert({
        user_id: userId,
        name: trimmedName,
      })
      .select()
      .single();

    // Handle errors
    if (error) {
      // PostgreSQL unique constraint violation error code
      if (error.code === "23505") {
        console.warn("[CategoryService] Duplicate category name:", {
          userId,
          name: trimmedName,
        });
        throw new ConflictError("A category with this name already exists");
      }

      console.error("[CategoryService] Error creating category:", error);
      throw new Error("Failed to create category");
    }

    // Build response DTO (new categories always have 0 items)
    return {
      id: category.id,
      name: category.name,
      itemCount: 0,
      createdAt: category.created_at,
      updatedAt: category.updated_at,
    };
  }
}

/**
 * Custom error for conflict scenarios
 */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}
