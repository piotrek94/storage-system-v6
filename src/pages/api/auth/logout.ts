import type { APIRoute } from 'astro';

import { AuthService } from '@/lib/services/auth.service';
import type { ErrorResponseDTO, LogoutResponseDTO } from '@/types';

export const prerender = false;

/**
 * POST /api/auth/logout
 * 
 * Sign out current user and clear session cookies
 * 
 * Response:
 * - 200: { message: "Logged out successfully" }
 * - 401: No valid session
 * - 500: Server error
 */
export const POST: APIRoute = async ({ locals }) => {
  try {
    // Check if user is authenticated
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message: 'No active session',
          },
        } satisfies ErrorResponseDTO),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Logout user
    await AuthService.logoutUser(locals.supabase);

    // Return success
    return new Response(
      JSON.stringify({
        message: 'Logged out successfully',
      } satisfies LogoutResponseDTO),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    // Log error for debugging
    console.error('[POST /api/auth/logout] Error:', {
      message: error?.message,
      timestamp: new Date().toISOString(),
    });

    // Return generic error
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred. Please try again.',
        },
      } satisfies ErrorResponseDTO),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
