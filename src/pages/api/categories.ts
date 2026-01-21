import type { APIRoute } from "astro";
import { CategoryService } from "../../lib/services/category.service";
import { getCategoriesQuerySchema, createCategorySchema } from "../../lib/validators/category.validators";
import { handleError, createErrorResponse } from "../../lib/utils/error-handler";

export const prerender = false;

/**
 * GET /api/categories
 * Lists all categories for the authenticated user
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    
    // 1. Check authentication (handled by middleware)
    const supabase = locals.supabase;

    await supabase.auth.signInWithPassword({
      email: 'nspiotrek94@gmail.com',
      password: 'qwerqwer'
    });
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // return new Response(JSON.stringify(user), {
    //   status: 401,
    //   headers: { "Content-Type": "application/json" },
    // });

    console.log(user);

    if (!user) {
      return new Response(JSON.stringify(createErrorResponse("AUTHENTICATION_ERROR", "Authentication required")), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      sort: url.searchParams.get("sort") || undefined,
      order: url.searchParams.get("order") || undefined,
    };

    const validatedQuery = getCategoriesQuerySchema.parse(queryParams);

    // 3. Execute business logic
    const categoryService = new CategoryService(supabase);
    const result = await categoryService.listCategories(user.id, validatedQuery.sort, validatedQuery.order);

    // 4. Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=300", // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error("[GET /api/categories] Error:", error);
    return handleError(error);
  }
};

/**
 * POST /api/categories
 * Creates a new category for the authenticated user
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Check authentication (handled by middleware)
    const supabase = locals.supabase;
    await supabase.auth.signInWithPassword({
      email: 'nspiotrek94@gmail.com',
      password: 'qwerqwer'
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify(createErrorResponse("AUTHENTICATION_ERROR", "Authentication required")), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Validate Content-Type
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return new Response(
        JSON.stringify(createErrorResponse("VALIDATION_ERROR", "Content-Type must be application/json")),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify(createErrorResponse("VALIDATION_ERROR", "Invalid request body")), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validatedBody = createCategorySchema.parse(body);

    // 4. Execute business logic
    const categoryService = new CategoryService(supabase);
    const result = await categoryService.createCategory(user.id, {
      name: validatedBody.name,
    });

    // 5. Return success response
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        Location: `/api/categories/${result.id}`,
      },
    });
  } catch (error) {
    console.error("[POST /api/categories] Error:", error);
    return handleError(error);
  }
};
