import type { APIRoute } from 'astro';

import { AuthService } from '@/lib/services/auth.service';
import { loginSchema } from '@/lib/validation/auth.schema';
import type { ErrorResponseDTO, LoginResponseDTO } from '@/types';

export const prerender = false;

/**
 * POST /api/auth/login
 * 
 * Authenticate user with email and password
 * 
 * Request body:
 * - email: string (required)
 * - password: string (required)
 * 
 * Response:
 * - 200: { user: { id, email } }
 * - 400: Validation error
 * - 401: Invalid credentials
 * - 429: Too many attempts
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
    const validation = loginSchema.safeParse(body);
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

    // Attempt login
    const result = await AuthService.loginUser(locals.supabase, email, password);

    // Return success
    return new Response(
      JSON.stringify({
        user: {
          id: result.user.id,
          email: result.user.email,
        },
      } satisfies LoginResponseDTO),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    // Log error for debugging (never expose to client)
    console.error('[POST /api/auth/login] Error:', {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      timestamp: new Date().toISOString(),
    });

    // Map Supabase errors to generic user-friendly messages
    // Security: Never reveal if email exists or specific failure reason
    if (
      error?.message?.includes('Invalid login credentials') ||
      error?.message?.includes('Email not confirmed') ||
      error?.message?.includes('invalid_credentials') ||
      error?.status === 400
    ) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        } satisfies ErrorResponseDTO),
        {
          status: 401,
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
