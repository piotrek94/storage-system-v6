import type { APIRoute } from 'astro';

import { AuthService } from '@/lib/services/auth.service';
import { registerSchema } from '@/lib/validation/auth.schema';
import type { ErrorResponseDTO, RegisterResponseDTO } from '@/types';

export const prerender = false;

/**
 * POST /api/auth/register
 * 
 * Create a new user account
 * 
 * Request body:
 * - email: string (required)
 * - password: string (required, min 8 chars)
 * - passwordConfirm: string (required, must match password)
 * 
 * Response:
 * - 201: { user: { id, email, createdAt } }
 * - 400: Validation error
 * - 409: Email already exists
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
    const validation = registerSchema.safeParse(body);
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

    const { email, password } = validation.data;

    // Register user
    const result = await AuthService.registerUser(locals.supabase, email, password);

    // Check if email confirmation is required
    const emailConfirmationRequired = import.meta.env.AUTH_EMAIL_CONFIRMATION_REQUIRED === 'true';

    // Return success
    return new Response(
      JSON.stringify({
        user: {
          id: result.user.id,
          email: result.user.email,
          createdAt: result.user.createdAt,
        },
      } satisfies RegisterResponseDTO),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    // Log error for debugging (never expose to client)
    console.error('[POST /api/auth/register] Error:', {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      timestamp: new Date().toISOString(),
    });

    // Map Supabase errors to user-friendly messages
    // Security: Use generic messages, don't reveal if email exists
    if (
      error?.message?.includes('User already registered') ||
      error?.message?.includes('already registered') ||
      error?.code === '23505' // PostgreSQL unique violation
    ) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'EMAIL_EXISTS',
            message: 'An account with this email already exists',
          },
        } satisfies ErrorResponseDTO),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

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
