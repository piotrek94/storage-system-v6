import type { APIRoute } from 'astro';

import { AuthService } from '@/lib/services/auth.service';
import { resetPasswordConfirmSchema } from '@/lib/validation/auth.schema';
import type { ErrorResponseDTO, ResetPasswordResponseDTO } from '@/types';

export const prerender = false;

/**
 * POST /api/auth/reset-password/confirm
 * 
 * Complete password reset with token
 * 
 * Request body:
 * - token: string (required, from email link)
 * - password: string (required, min 8 chars)
 * - passwordConfirm: string (required, must match password)
 * 
 * Response:
 * - 200: { message: "Password reset successfully" }
 * - 400: Validation error or invalid token format
 * - 401: Invalid or expired token
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
    const validation = resetPasswordConfirmSchema.safeParse(body);
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

    const { token, password } = validation.data;

    // Confirm password reset
    await AuthService.confirmPasswordReset(locals.supabase, token, password);

    // Return success
    return new Response(
      JSON.stringify({
        message: 'Password reset successfully',
      } satisfies ResetPasswordResponseDTO),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    // Log error for debugging
    console.error('[POST /api/auth/reset-password/confirm] Error:', {
      message: error?.message,
      timestamp: new Date().toISOString(),
    });

    // Invalid or expired token
    if (
      error?.message?.includes('Invalid') ||
      error?.message?.includes('expired') ||
      error?.message?.includes('invalid')
    ) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_TOKEN',
            message: 'This password reset link is invalid or has expired',
          },
        } satisfies ErrorResponseDTO),
        {
          status: 401,
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
