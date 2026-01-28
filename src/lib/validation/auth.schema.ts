import { z } from 'zod';

/**
 * Email validation schema
 * 
 * Enforces:
 * - Email is required
 * - Valid email format
 * - Maximum 255 characters
 * - Automatically trims whitespace
 */
export const emailSchema = z
  .string({
    required_error: 'Email is required',
    invalid_type_error: 'Email must be a string',
  })
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email is too long')
  .trim()
  .toLowerCase();

/**
 * Password validation schema
 * 
 * Enforces:
 * - Password is required
 * - Minimum 8 characters
 * - Maximum 255 characters for safety
 */
export const passwordSchema = z
  .string({
    required_error: 'Password is required',
    invalid_type_error: 'Password must be a string',
  })
  .min(8, 'Password must be at least 8 characters')
  .max(255, 'Password is too long');

/**
 * Login validation schema
 * Used for: POST /api/auth/login
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type LoginSchema = z.infer<typeof loginSchema>;

/**
 * Registration validation schema
 * Used for: POST /api/auth/register
 * 
 * Includes password confirmation check
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    passwordConfirm: passwordSchema,
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords don't match",
    path: ['passwordConfirm'],
  });

export type RegisterSchema = z.infer<typeof registerSchema>;

/**
 * Password reset request validation schema
 * Used for: POST /api/auth/reset-password
 */
export const resetPasswordRequestSchema = z.object({
  email: emailSchema,
});

export type ResetPasswordRequestSchema = z.infer<typeof resetPasswordRequestSchema>;

/**
 * Password reset confirmation validation schema
 * Used for: POST /api/auth/reset-password/confirm
 * 
 * Includes password confirmation check
 */
export const resetPasswordConfirmSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
    passwordConfirm: passwordSchema,
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords don't match",
    path: ['passwordConfirm'],
  });

export type ResetPasswordConfirmSchema = z.infer<typeof resetPasswordConfirmSchema>;
