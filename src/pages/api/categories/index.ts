import type { APIRoute } from 'astro';
import { createCategorySchema, listCategoriesQuerySchema } from '../../../lib/validation/category.schema';
import { CategoryService } from '../../../lib/services/category.service';
import type { CreateCategoryCommand, ErrorResponseDTO, CategoryListResponseDTO } from '../../../types';
import { loginTestUser } from '@/lib/utils';

export const prerender = false;

/**
 * POST /api/categories
 * 
 * Creates a new category for the authenticated user.
 * 
 * Request Body:
 * - name: string (required, 1-255 characters, trimmed)
 * 
 * Response:
 * - 201: CategoryListItemDTO
 * - 401: Unauthorized (no valid session)
 * - 400: Bad Request (validation error)
 * - 409: Conflict (duplicate category name)
 * - 500: Internal Server Error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  console.log('[POST /api/categories] Request received');
  console.log(request);

  try {
    // Step 1: Authentication check
    const supabase = locals.supabase;
    const USER_ID: string = loginTestUser(supabase);
    
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
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 2: Parse request body
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
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 3: Validate with Zod schema
    const validation = createCategorySchema.safeParse(body);
    
    if (!validation.success) {
      const details = validation.error.errors.map((err) => ({
        field: err.path.join('.') || 'name',
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details,
          },
        } satisfies ErrorResponseDTO),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 4: Create command object
    const command: CreateCategoryCommand = {
      name: validation.data.name, // Already trimmed by Zod
    };

    // Step 5: Call service layer
    const category = await CategoryService.createCategory(
      supabase,
      USER_ID,
      command
    );

    // Step 6: Return success response
    return new Response(
      JSON.stringify(category),
      { 
        status: 201, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    // Handle unique constraint violation (duplicate category name)
    if (error?.code === '23505') {
      return new Response(
        JSON.stringify({
          error: {
            code: 'CONFLICT',
            message: 'A category with this name already exists',
          },
        } satisfies ErrorResponseDTO),
        { 
          status: 409, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Log unexpected errors with context for debugging
    console.error('[POST /api/categories] Unexpected error:', {
      userId: error?.user?.id || 'unknown',
      error: error?.message || 'Unknown error',
      code: error?.code || 'N/A',
      timestamp: new Date().toISOString(),
    });

    // Return generic error response (never expose internal details)
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      } satisfies ErrorResponseDTO),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};

/**
 * GET /api/categories
 * 
 * Retrieves all categories for the authenticated user with item counts.
 * 
 * Query Parameters:
 * - sort: string (optional, default: "name") - Field to sort by ("name" | "created_at")
 * - order: string (optional, default: "asc") - Sort direction ("asc" | "desc")
 * 
 * Response:
 * - 200: CategoryListResponseDTO with array of categories
 * - 401: Unauthorized (no valid session)
 * - 400: Bad Request (invalid query parameters)
 * - 500: Internal Server Error
 */
export const GET: APIRoute = async ({ request, locals }) => {
  console.log('[GET /api/categories] Request received');
  console.log(request);
  
  try {
    // Step 1: Authentication check (guard clause)
    const supabase = locals.supabase;
    const USER_ID: string = loginTestUser(supabase);
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
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 2: Extract query parameters
    const url = new URL(request.url);
    const queryParams = {
      sort: url.searchParams.get('sort') ?? 'name',
      order: url.searchParams.get('order') ?? 'asc',
    };

    // Step 3: Validate query parameters with Zod schema
    const validation = listCategoriesQuerySchema.safeParse(queryParams);
    
    if (!validation.success) {
      const details = validation.error.errors.map((err) => ({
        field: err.path.join('.') || 'unknown',
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details,
          },
        } satisfies ErrorResponseDTO),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 4: Call service layer to retrieve categories
    const categories = await CategoryService.listCategories(
      supabase,
      USER_ID,
      validation.data.sort,
      validation.data.order
    );

    // Step 5: Return success response
    const response: CategoryListResponseDTO = {
      data: categories,
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    // Log unexpected errors with context for debugging
    console.error('[GET /api/categories] Unexpected error:', {
      error: error?.message || 'Unknown error',
      code: error?.code || 'N/A',
      timestamp: new Date().toISOString(),
    });

    // Return generic error response (never expose internal details)
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      } satisfies ErrorResponseDTO),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};
