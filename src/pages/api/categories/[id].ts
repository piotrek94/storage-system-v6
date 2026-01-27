import type { APIRoute } from 'astro';
import { updateCategorySchema, categoryIdParamSchema } from '../../../lib/validation/category.schema';
import { CategoryService } from '../../../lib/services/category.service';
import type { UpdateCategoryCommand, ErrorResponseDTO, CategoryListItemDTO, DeleteResponseDTO } from '../../../types';
import { loginTestUser } from '@/lib/utils';

export const prerender = false;

/**
 * PATCH /api/categories/:id
 * 
 * Updates an existing category name for the authenticated user.
 * 
 * Route Parameters:
 * - id: string (UUID) - ID of the category to update
 * 
 * Request Body:
 * - name: string (required, 1-255 characters, trimmed)
 * 
 * Response:
 * - 200: CategoryListItemDTO with updated data
 * - 401: Unauthorized (no valid session)
 * - 400: Bad Request (validation error)
 * - 404: Not Found (category doesn't exist or user doesn't own it)
 * - 409: Conflict (duplicate category name)
 * - 500: Internal Server Error
 */
export const PATCH: APIRoute = async ({ request, params, locals }) => {
  console.log('[PATCH /api/categories/:id] Request received');
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

    // Step 2: Validate route parameter (guard clause)
    const paramValidation = categoryIdParamSchema.safeParse({ id: params.id });
    
    if (!paramValidation.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid category ID format',
          },
        } satisfies ErrorResponseDTO),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    const categoryId = paramValidation.data.id;

    // Step 3: Parse request body (guard clause)
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

    // Step 4: Validate request body with Zod schema (guard clause)
    const validation = updateCategorySchema.safeParse(body);
    
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

    // Step 5: Create command object
    const command: UpdateCategoryCommand = {
      name: validation.data.name, // Already trimmed by Zod
    };

    // Step 6: Call service layer
    const category = await CategoryService.updateCategory(
      supabase,
      USER_ID,
      categoryId,
      command
    );

    // Step 7: Check if category was found (guard clause)
    if (!category) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'NOT_FOUND',
            message: 'Category not found',
          },
        } satisfies ErrorResponseDTO),
        { 
          status: 404, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 8: Return success response (happy path)
    return new Response(
      JSON.stringify(category),
      { 
        status: 200, 
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
    console.error('[PATCH /api/categories/:id] Unexpected error:', {
      userId: error?.user?.id || 'unknown',
      categoryId: params?.id || 'unknown',
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
 * DELETE /api/categories/:id
 * 
 * Deletes an existing category for the authenticated user.
 * Only categories with zero items can be deleted (enforces referential integrity).
 * 
 * Route Parameters:
 * - id: string (UUID) - ID of the category to delete
 * 
 * Request Body: None
 * 
 * Response:
 * - 200: DeleteResponseDTO with success message and category ID
 * - 401: Unauthorized (no valid session)
 * - 400: Bad Request (invalid UUID format)
 * - 404: Not Found (category doesn't exist or user doesn't own it)
 * - 409: Conflict (category contains items)
 * - 500: Internal Server Error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  console.log('[DELETE /api/categories/:id] Request received');

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

    // Step 2: Validate route parameter (guard clause)
    const paramValidation = categoryIdParamSchema.safeParse({ id: params.id });
    
    if (!paramValidation.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid category ID format',
          },
        } satisfies ErrorResponseDTO),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    const categoryId = paramValidation.data.id;

    // Step 3: Call service layer to delete category
    const result = await CategoryService.deleteCategory(
      supabase,
      USER_ID,
      categoryId
    );

    // Step 4: Check if category was found (guard clause)
    if (!result) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'NOT_FOUND',
            message: 'Category not found',
          },
        } satisfies ErrorResponseDTO),
        { 
          status: 404, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 5: Return success response (happy path)
    return new Response(
      JSON.stringify({
        message: 'Category deleted successfully',
        id: result.id,
      } satisfies DeleteResponseDTO),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    // Handle category with items conflict (business rule violation)
    if (error?.message?.includes('Cannot delete')) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'CONFLICT',
            message: error.message,
          },
        } satisfies ErrorResponseDTO),
        { 
          status: 409, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Log unexpected errors with context for debugging
    console.error('[DELETE /api/categories/:id] Unexpected error:', {
      userId: error?.user?.id || 'unknown',
      categoryId: params?.id || 'unknown',
      error: error?.message || 'Unknown error',
      code: error?.code || 'N/A',
      timestamp: new Date().toISOString(),
    });

    // Return generic error response (never expose internal details)
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while deleting the category',
        },
      } satisfies ErrorResponseDTO),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};
