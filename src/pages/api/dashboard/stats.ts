import type { APIRoute } from 'astro';
import { DashboardService } from '../../../lib/services/dashboard.service';
import type { DashboardStatsDTO, ErrorResponseDTO } from '../../../types';
import { loginTestUser } from '@/lib/utils';

export const prerender = false;

/**
 * GET /api/dashboard/stats
 * 
 * Retrieves aggregated dashboard statistics for the authenticated user.
 * 
 * No query parameters or request body required.
 * 
 * Response:
 * - 200: DashboardStatsDTO with counts and recent items
 * - 401: Unauthorized (no valid session)
 * - 500: Internal Server Error
 */
export const GET: APIRoute = async ({ locals }) => {
  console.log('[GET /api/dashboard/stats] Request received');

  try {
    // Step 1: Authentication check (guard clause)
    // Extract Supabase client from middleware-injected locals
    const supabase = locals.supabase;
    const USER_ID: string = loginTestUser(supabase);

    // Verify user session is valid
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        } satisfies ErrorResponseDTO),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 2: Call service layer to fetch dashboard statistics
    // Service executes parallel queries for optimal performance
    const stats: DashboardStatsDTO = await DashboardService.getStatistics(
      supabase,
      USER_ID
    );

    // Step 3: Return success response with statistics
    return new Response(
      JSON.stringify(stats),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    // Log unexpected errors with context for debugging
    console.error('[GET /api/dashboard/stats] Unexpected error:', {
      error: error?.message || 'Unknown error',
      code: error?.code || 'N/A',
      timestamp: new Date().toISOString(),
    });

    // Return generic error response (never expose internal details)
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while fetching dashboard statistics',
        },
      } satisfies ErrorResponseDTO),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
