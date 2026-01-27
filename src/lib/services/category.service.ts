import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type { CreateCategoryCommand, UpdateCategoryCommand, CategoryListItemDTO } from '../../types';

/**
 * Service layer for category-related operations
 * 
 * Handles business logic for category management including creation,
 * retrieval, updates, and deletion while maintaining data integrity
 * and enforcing business rules.
 */
export class CategoryService {
  /**
   * Creates a new category for the authenticated user
   * 
   * Business Rules:
   * - Category names must be unique per user (case-insensitive)
   * - New categories always have itemCount of 0
   * - User ID is automatically associated from authentication context
   * 
   * @param supabase - Supabase client with user session
   * @param userId - ID of the authenticated user
   * @param command - Category creation command with validated name
   * @returns Created category as CategoryListItemDTO
   * @throws {Error} If category name already exists (code: '23505')
   * @throws {Error} If database operation fails
   */
  static async createCategory(
    supabase: SupabaseClient<Database>,
    userId: string,
    command: CreateCategoryCommand
  ): Promise<CategoryListItemDTO> {
    // Insert category into database
    // RLS policy automatically enforces user_id = auth.uid()
    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: userId,
        name: command.name, // Already trimmed by Zod transform
      })
      .select()
      .single();

    // Handle database errors - let route handler determine response code
    if (error) {
      throw error;
    }

    // Transform database row to DTO
    // New categories always have 0 items
    return {
      id: data.id,
      name: data.name,
      itemCount: 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Lists all categories for the authenticated user with item counts
   * 
   * Business Rules:
   * - Returns all user's categories (no pagination in MVP)
   * - Each category includes computed item count via aggregation
   * - RLS policies automatically filter to user's categories
   * - Supports sorting by name or creation date
   * - Supports ascending or descending order
   * 
   * @param supabase - Supabase client with user session
   * @param userId - ID of the authenticated user
   * @param sort - Field to sort by ("name" | "created_at")
   * @param order - Sort direction ("asc" | "desc")
   * @returns Array of categories with item counts as CategoryListItemDTO[]
   * @throws {Error} If database operation fails
   */
  static async listCategories(
    supabase: SupabaseClient<Database>,
    userId: string,
    sort: 'name' | 'created_at',
    order: 'asc' | 'desc'
  ): Promise<CategoryListItemDTO[]> {
    // Query categories with item count aggregation
    // Using Supabase's count() function for items
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, created_at, updated_at, items(count)')
      .eq('user_id', userId) // Explicit filter (RLS also enforces this)
      .order(sort, { ascending: order === 'asc' });

    // Handle database errors
    if (error) {
      throw error;
    }

    // Transform database rows to DTOs
    // Map snake_case to camelCase and extract item count
    return data.map((category) => ({
      id: category.id,
      name: category.name,
      itemCount: category.items?.[0]?.count ?? 0, // Extract count from aggregation
      createdAt: category.created_at,
      updatedAt: category.updated_at,
    }));
  }

  /**
   * Updates an existing category name
   * 
   * Business Rules:
   * - Only the category name can be updated
   * - Category must exist and belong to the authenticated user
   * - New name must be unique per user (case-insensitive)
   * - RLS policies enforce user ownership
   * - Returns updated category with current item count
   * 
   * @param supabase - Supabase client with user session
   * @param userId - ID of the authenticated user
   * @param categoryId - ID of the category to update
   * @param command - Category update command with validated name
   * @returns Updated category as CategoryListItemDTO, or null if not found
   * @throws {Error} If new name conflicts with existing category (code: '23505')
   * @throws {Error} If database operation fails
   */
  static async updateCategory(
    supabase: SupabaseClient<Database>,
    userId: string,
    categoryId: string,
    command: UpdateCategoryCommand
  ): Promise<CategoryListItemDTO | null> {
    // Update and fetch with item count in single query
    const { data, error } = await supabase
      .from('categories')
      .update({ name: command.name })
      .eq('id', categoryId)
      .eq('user_id', userId)
      .select('id, name, created_at, updated_at, items(count)')
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      itemCount: data.items?.[0]?.count ?? 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Deletes a category if it has no associated items
   * 
   * Business Rules:
   * - Category must exist and belong to the authenticated user
   * - Category must have zero associated items (enforces referential integrity)
   * - RLS policies enforce user ownership at database level
   * - Returns category details on success, null if not found
   * 
   * @param supabase - Supabase client with user session
   * @param userId - ID of the authenticated user
   * @param categoryId - UUID of the category to delete
   * @returns Object with category id and name if successful, null if not found
   * @throws {Error} If category has associated items (with descriptive message)
   * @throws {Error} If database operation fails
   */
  static async deleteCategory(
    supabase: SupabaseClient<Database>,
    userId: string,
    categoryId: string
  ): Promise<{ id: string; name: string } | null> {
    // Step 1: Fetch category and verify ownership
    const { data: category, error: fetchError } = await supabase
      .from('categories')
      .select('id, name, user_id')
      .eq('id', categoryId)
      .eq('user_id', userId)
      .single();

    // Return null if category not found or doesn't belong to user
    if (fetchError || !category) {
      return null;
    }

    // Step 2: Count associated items
    const { count, error: countError } = await supabase
      .from('items')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', categoryId)
      .eq('user_id', userId);

    // Handle counting error
    if (countError) {
      throw countError;
    }

    // Step 3: Check if category has items (business rule enforcement)
    if (count && count > 0) {
      const itemWord = count === 1 ? 'item' : 'items';
      throw new Error(`Cannot delete ${category.name} because it contains ${count} ${itemWord}`);
    }

    // Step 4: Delete category
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)
      .eq('user_id', userId);

    // Handle deletion error
    if (deleteError) {
      throw deleteError;
    }

    // Return deleted category details
    return {
      id: category.id,
      name: category.name,
    };
  }
}
