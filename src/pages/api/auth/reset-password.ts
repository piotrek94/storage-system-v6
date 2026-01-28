import type { APIRoute } from 'astro';

import { AuthService } from '@/lib/services/auth.service';
import { resetPasswordRequestSchema } from '@/lib/validation/auth.schema';
import type { ErrorResponseDTO, ResetPasswordResponseDTO } from '@/types';

export const prerender = false;

/**
 * POST /api/auth/reset-password
 * 
 * Request password reset email
 * 
 * Request body:
 * - email: string (required)
 * 
 * Response:
 * - 200: { message: "If an account exists..." } (always same message for security)
 * - 400: Validation error
 * - 429: Too many requests
 * - 500: Server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid JSON payload',
          },
        } satisfies ErrorResponseDTO),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate input
    const validation = resetPasswordRequestSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: validation.error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        } satisfies ErrorResponseDTO),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { email } = validation.data;

    // Build redirect URL for password reset confirmation
    const siteUrl = import.meta.env.AUTH_SITE_URL || 'http://localhost:4321';
    const redirectTo = `${siteUrl}/reset-password/confirm`;

    // Request password reset
    await AuthService.requestPasswordReset(locals.supabase, email, redirectTo);

    // Always return success message (don't reveal if email exists)
    return new Response(
      JSON.stringify({
        message: 'If an account exists with this email, a password reset link has been sent.',
      } satisfies ResetPasswordResponseDTO),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    // Log error for debugging
    console.error('[POST /api/auth/reset-password] Error:', {
      message: error?.message,
      status: error?.status,
      timestamp: new Date().toISOString(),
    });

    // Rate limiting error
    if (error?.status === 429) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many attempts. Please try again later.',
          },
        } satisfies ErrorResponseDTO),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Default to generic error
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
