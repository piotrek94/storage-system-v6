import { z } from 'zod';

/**
 * Validation schema for creating a new category
 * 
 * Enforces:
 * - Name is required and must be a string
 * - Name length between 1 and 255 characters
 * - Name cannot be only whitespace
 * - Automatically trims whitespace from name
 */
export const createCategorySchema = z.object({
  name: z
    .string({
      required_error: 'Name is required',
      invalid_type_error: 'Name must be a string',
    })
    .min(1, 'Name must be between 1 and 255 characters')
    .max(255, 'Name must be between 1 and 255 characters')
    .refine(
      (val) => val.trim().length > 0,
      'Name cannot be only whitespace'
    )
    .transform((val) => val.trim()),
});

export type CreateCategorySchema = z.infer<typeof createCategorySchema>;

/**
 * Validation schema for listing categories with sorting options
 * 
 * Query Parameters:
 * - sort: Field to sort by ("name" | "created_at"), defaults to "name"
 * - order: Sort direction ("asc" | "desc"), defaults to "asc"
 * 
 * Both parameters are case-insensitive for values
 */
export const listCategoriesQuerySchema = z.object({
  sort: z
    .enum(['name', 'created_at'], {
      errorMap: () => ({ message: "Invalid enum value. Expected 'name' | 'created_at'" }),
    })
    .default('name'),
  order: z
    .enum(['asc', 'desc'], {
      errorMap: () => ({ message: "Invalid enum value. Expected 'asc' | 'desc'" }),
    })
    .default('asc'),
});

export type ListCategoriesQuerySchema = z.infer<typeof listCategoriesQuerySchema>;

/**
 * Validation schema for category ID route parameter
 * 
 * Enforces:
 * - ID must be a valid UUID format
 */
export const categoryIdParamSchema = z.object({
  id: z.string().uuid('Invalid category ID format'),
});

export type CategoryIdParamSchema = z.infer<typeof categoryIdParamSchema>;

/**
 * Validation schema for updating a category
 * 
 * Enforces:
 * - Name is required and must be a string
 * - Name length between 1 and 255 characters
 * - Name cannot be only whitespace
 * - Automatically trims whitespace from name
 * 
 * Note: Uses same validation rules as createCategorySchema
 */
export const updateCategorySchema = z.object({
  name: z
    .string({
      required_error: 'Name is required',
      invalid_type_error: 'Name must be a string',
    })
    .min(1, 'Name must be between 1 and 255 characters')
    .max(255, 'Name must be between 1 and 255 characters')
    .refine(
      (val) => val.trim().length > 0,
      'Name cannot be only whitespace'
    )
    .transform((val) => val.trim()),
});

export type UpdateCategorySchema = z.infer<typeof updateCategorySchema>;
