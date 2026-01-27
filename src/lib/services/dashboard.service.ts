import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type { DashboardStatsDTO, RecentItemDTO } from '../../types';

/**
 * Service layer for dashboard-related operations
 * 
 * Handles business logic for dashboard statistics including aggregated counts
 * and recent items with optimized parallel query execution.
 */
export class DashboardService {
  /**
   * Retrieves comprehensive dashboard statistics for the authenticated user
   * 
   * Executes parallel database queries for optimal performance:
   * - Total items count
   * - Total containers count
   * - Total categories count
   * - Items currently checked out count (is_in = false)
   * - 5 most recent items with category, container, and thumbnail
   * 
   * Business Rules:
   * - All data is user-scoped via RLS policies
   * - Recent items limited to 5 most recent by creation date
   * - Items without thumbnails have null thumbnail field
   * - Thumbnail URLs generated from storage_path using Supabase Storage
   * 
   * @param supabase - Supabase client with user session
   * @param userId - ID of the authenticated user
   * @returns Dashboard statistics as DashboardStatsDTO
   * @throws {Error} If any database operation fails
   */
  static async getStatistics(
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<DashboardStatsDTO> {
    // Execute all queries in parallel for optimal performance
    // Using Promise.all to minimize total response time
    const [
      itemsCountResult,
      containersCountResult,
      categoriesCountResult,
      itemsOutCountResult,
      recentItemsResult,
    ] = await Promise.all([
      // Query 1: Count total items
      supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),

      // Query 2: Count total containers
      supabase
        .from('containers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),

      // Query 3: Count total categories
      supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),

      // Query 4: Count items that are checked out (is_in = false)
      supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_in', false),

      // Query 5: Fetch 5 most recent items with related data
      // Uses LEFT JOIN to include items without images
      supabase
        .from('items')
        .select(`
          id,
          name,
          is_in,
          created_at,
          categories!inner(name),
          containers!inner(name),
          images!left(storage_path)
        `)
        .eq('user_id', userId)
        .eq('images.entity_type', 'item')
        .eq('images.display_order', 1)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    // Handle errors from count queries
    if (itemsCountResult.error) {
      throw itemsCountResult.error;
    }
    if (containersCountResult.error) {
      throw containersCountResult.error;
    }
    if (categoriesCountResult.error) {
      throw categoriesCountResult.error;
    }
    if (itemsOutCountResult.error) {
      throw itemsOutCountResult.error;
    }
    if (recentItemsResult.error) {
      throw recentItemsResult.error;
    }

    // Transform recent items to DTOs
    const recentItems: RecentItemDTO[] = (recentItemsResult.data ?? []).map((item) => {
      // Extract thumbnail storage path
      // Items can have multiple images, we only need the first one (display_order = 1)
      const storagePath = Array.isArray(item.images) && item.images.length > 0
        ? item.images[0]?.storage_path
        : null;

      // Generate public URL for thumbnail if storage_path exists
      let thumbnailUrl: string | null = null;
      if (storagePath) {
        try {
          const { data } = supabase.storage
            .from('item-images')
            .getPublicUrl(storagePath);
          thumbnailUrl = data.publicUrl;
        } catch (error) {
          // If URL generation fails, fallback to null
          // Log error but don't fail the entire request
          console.error('Failed to generate thumbnail URL:', error);
        }
      }

      return {
        id: item.id,
        name: item.name,
        thumbnail: thumbnailUrl,
        category: Array.isArray(item.categories) ? item.categories[0]?.name : item.categories?.name,
        container: Array.isArray(item.containers) ? item.containers[0]?.name : item.containers?.name,
        isIn: item.is_in,
        createdAt: item.created_at,
      };
    });

    // Aggregate all statistics into response DTO
    return {
      totalItems: itemsCountResult.count ?? 0,
      totalContainers: containersCountResult.count ?? 0,
      totalCategories: categoriesCountResult.count ?? 0,
      itemsOut: itemsOutCountResult.count ?? 0,
      recentItems,
    };
  }
}
