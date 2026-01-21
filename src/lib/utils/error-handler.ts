import type { ErrorResponseDTO } from "../../types";
import { ZodError } from "zod";
import { ConflictError } from "../services/category.service";

/**
 * Formats Zod validation errors into ErrorResponseDTO format
 */
export function formatZodErrors(error: ZodError): ErrorResponseDTO["error"]["details"] {
  return error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: ErrorResponseDTO["error"]["details"]
): ErrorResponseDTO {
  return {
    error: {
      code,
      message,
      details,
    },
  };
}

/**
 * Handles errors and returns appropriate Response object
 */
export function handleError(error: unknown): Response {
  // Zod validation errors
  if (error instanceof ZodError) {
    return new Response(
      JSON.stringify(createErrorResponse("VALIDATION_ERROR", "Validation failed", formatZodErrors(error))),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Conflict errors (duplicate category name)
  if (error instanceof ConflictError) {
    return new Response(JSON.stringify(createErrorResponse("CONFLICT", error.message)), {
      status: 409,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Generic errors
  const message = error instanceof Error ? error.message : "An unexpected error occurred";
  return new Response(JSON.stringify(createErrorResponse("SERVER_ERROR", message)), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
