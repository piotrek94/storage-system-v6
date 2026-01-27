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

      // Query 5: Fetch 5 most recent items with category and container
      // Note: Images are fetched separately due to polymorphic relationship
      supabase
        .from('items')
        .select(`
          id,
          name,
          is_in,
          created_at,
          categories!inner(name),
          containers!inner(name)
        `)
        .eq('user_id', userId)
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

    // If there are recent items, fetch their thumbnails
    // Polymorphic relationship requires separate query
    let itemThumbnails: Map<string, string | null> = new Map();
    
    if (recentItemsResult.data && recentItemsResult.data.length > 0) {
      const itemIds = recentItemsResult.data.map((item) => item.id);
      
      // Fetch thumbnails (display_order = 1) for recent items
      const { data: thumbnailsData, error: thumbnailsError } = await supabase
        .from('images')
        .select('entity_id, storage_path')
        .eq('entity_type', 'item')
        .eq('display_order', 1)
        .in('entity_id', itemIds);

      if (thumbnailsError) {
        // Log error but continue without thumbnails
        console.error('Failed to fetch thumbnails:', thumbnailsError);
      } else if (thumbnailsData) {
        // Build map of item_id -> thumbnail URL
        for (const thumbnail of thumbnailsData) {
          try {
            const { data } = supabase.storage
              .from('item-images')
              .getPublicUrl(thumbnail.storage_path);
            itemThumbnails.set(thumbnail.entity_id, data.publicUrl);
          } catch (error) {
            // If URL generation fails, set to null
            console.error('Failed to generate thumbnail URL:', error);
            itemThumbnails.set(thumbnail.entity_id, null);
          }
        }
      }
    }

    // Transform recent items to DTOs
    const recentItems: RecentItemDTO[] = (recentItemsResult.data ?? []).map((item) => {
      return {
        id: item.id,
        name: item.name,
        thumbnail: itemThumbnails.get(item.id) ?? null,
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
