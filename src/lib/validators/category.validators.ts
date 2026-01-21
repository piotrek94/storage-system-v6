import { z } from "zod";

/**
 * Validation schema for GET /api/categories query parameters
 */
export const getCategoriesQuerySchema = z.object({
  sort: z.enum(["name", "created_at"]).optional().default("name"),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
});

export type GetCategoriesQuery = z.infer<typeof getCategoriesQuerySchema>;

/**
 * Validation schema for POST /api/categories request body
 */
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must not exceed 255 characters")
    .refine((val) => val.trim().length > 0, "Name cannot be only whitespace")
    .transform((val) => val.trim()),
});

export type CreateCategoryBody = z.infer<typeof createCategorySchema>;
