# Authentication System Architecture Specification

**Document Version:** 1.0  
**Created:** 2026-01-28  
**Project:** Home Storage System v6  
**Scope:** User Registration, Login, Logout, and Password Recovery (US-001, US-002, US-003, US-004)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [User Interface Architecture](#user-interface-architecture)
4. [Backend Logic](#backend-logic)
5. [Authentication System](#authentication-system)
6. [Data Models](#data-models)
7. [Security Considerations](#security-considerations)
8. [Error Handling](#error-handling)
9. [Integration Points](#integration-points)
10. [Testing Strategy](#testing-strategy)

---

## 1. Executive Summary

This specification defines the authentication architecture for the Home Storage System, implementing user registration, login, logout, and password recovery functionality using Supabase Auth integrated with Astro 5 server-side rendering. The design maintains compatibility with existing application behavior while introducing session-based authentication with secure cookie management.

### Key Design Principles

- **Server-First Architecture**: Leverage Astro SSR for secure session management
- **Seamless Integration**: Minimal disruption to existing codebase
- **Security by Default**: Secure cookie handling, CSRF protection, proper session management
- **Developer Experience**: Clear separation of concerns, type-safe contracts
- **User Experience**: Fast page loads, clear error messages, smooth navigation

---

## 2. System Overview

### 2.1 Technology Stack

- **Frontend Framework**: Astro 5 (SSR mode)
- **Interactive Components**: React 19
- **Styling**: Tailwind CSS 4 + Shadcn/ui
- **Backend**: Supabase Auth + PostgreSQL
- **Type Safety**: TypeScript 5
- **Validation**: Zod schemas
- **Cookie Management**: Astro.cookies API

### 2.2 Current State Analysis

**Existing Implementation:**
- Server-side rendering enabled (`output: "server"` in `astro.config.mjs`)
- Supabase client initialized in middleware (`src/middleware/index.ts`)
- Temporary test user bypass (`loginTestUser` in `src/lib/utils.ts`)
- Auth checks implemented in some pages (e.g., `categories.astro`)
- Database schema includes `profiles` table with `user_id` relationships

**What Needs to Change:**
- Remove test user bypass mechanism
- Implement proper session management in middleware
- Create authentication pages and components
- Add authentication service layer
- Update middleware for cookie-based session handling
- Protect all existing routes that require authentication

---

## 3. User Interface Architecture

### 3.1 Page Structure

#### 3.1.1 Public Pages (No Authentication Required)

**Landing Page** (`/`)
- **File**: `src/pages/index.astro`
- **State**: Currently shows dashboard mockup
- **Changes Required**: 
  - Check for existing session
  - If authenticated: redirect to `/dashboard`
  - If not authenticated: show marketing/welcome content with CTA buttons
  - Display "Login" and "Register" buttons in navigation
- **Components**: 
  - `Welcome.astro` (existing, may need updates)
  - Navigation links to auth pages

**Login Page** (`/login`)
- **File**: `src/pages/login.astro` (NEW)
- **Purpose**: User authentication entry point
- **Layout**: Centered form layout with minimal chrome
- **Components**:
  - `LoginForm` (React component for interactivity)
  - Link to password reset page
  - Link to registration page
- **Behavior**:
  - Check for existing session on load
  - If already authenticated: redirect to `/dashboard`
  - On successful login: redirect to `/dashboard` or original destination
  - Display validation errors inline
  - Show server errors in toast/alert

**Registration Page** (`/register`)
- **File**: `src/pages/register.astro` (NEW)
- **Purpose**: New user account creation
- **Layout**: Centered form layout
- **Components**:
  - `RegisterForm` (React component for interactivity)
  - Link to login page
- **Behavior**:
  - Check for existing session on load
  - If already authenticated: redirect to `/dashboard`
  - On successful registration: redirect to `/dashboard`
  - Email confirmation may be required (configurable in Supabase)
  - Display validation errors inline
  - Show server errors in toast/alert

**Password Reset Request Page** (`/reset-password`)
- **File**: `src/pages/reset-password.astro` (NEW)
- **Purpose**: Initiate password recovery
- **Layout**: Centered form layout
- **Components**:
  - `ResetPasswordRequestForm` (React component)
  - Link back to login page
- **Behavior**:
  - User enters email address
  - System sends password reset link via email
  - Success message displayed (same message whether email exists or not for security)
  - No authentication check needed (public page)

**Password Reset Confirmation Page** (`/reset-password/confirm`)
- **File**: `src/pages/reset-password/confirm.astro` (NEW)
- **Purpose**: Complete password reset with token
- **Layout**: Centered form layout
- **Components**:
  - `ResetPasswordConfirmForm` (React component)
- **Behavior**:
  - Extract token from URL query parameters
  - Validate token on page load
  - Display form if token valid, error if invalid/expired
  - On successful password reset: redirect to `/login` with success message
  - Token expires after 24 hours

#### 3.1.2 Protected Pages (Authentication Required)

All existing and new pages that require authentication will follow this pattern:

**Dashboard Page** (`/dashboard`)
- **File**: `src/pages/index.astro` → renamed/moved to `src/pages/dashboard.astro`
- **Changes**:
  - Remove test user bypass
  - Keep existing auth check pattern: `await supabase.auth.getUser()`
  - If not authenticated: redirect to `/login`
  - Remove mock data, use real API calls

**Categories Page** (`/categories`)
- **File**: `src/pages/categories.astro` (EXISTING)
- **Changes**:
  - Already has auth check implemented
  - Update redirect destination from `/` to `/login`
  - Remove any test user references

**Items Page** (`/items`)
- **File**: `src/pages/items.astro` (FUTURE)
- **Pattern**: Same auth check as categories

**Containers Page** (`/containers`)
- **File**: `src/pages/containers.astro` (FUTURE)
- **Pattern**: Same auth check as categories

### 3.2 Component Architecture

#### 3.2.1 Authentication Forms (React Components)

All auth forms follow these patterns:
- **Location**: `src/components/auth/`
- **Framework**: React 19 with hooks
- **Validation**: Client-side validation before submission
- **State Management**: Local component state with hooks
- **Error Handling**: Display inline field errors and global errors
- **Loading States**: Disable form and show loading indicator during submission

**LoginForm Component** (`src/components/auth/LoginForm.tsx`)

```typescript
// Component Contract
interface LoginFormProps {
  redirectTo?: string; // Optional redirect destination after login
}

// Form Fields
- email: string (required, email validation)
- password: string (required, min 8 characters)

// Actions
- onSubmit: POST to /api/auth/login
- Forgot password link: Navigate to /reset-password
- Don't have account link: Navigate to /register

// Validation Rules
- Email: Valid email format, not empty
- Password: Min 8 characters, not empty
- Client-side validation on blur
- Server-side validation on submit

// Error Handling
- Field-level errors display below each input
- Auth errors (invalid credentials) display as alert above form
- Network errors display as toast notification
```

**RegisterForm Component** (`src/components/auth/RegisterForm.tsx`)

```typescript
// Component Contract
interface RegisterFormProps {
  redirectTo?: string; // Optional redirect destination after registration
}

// Form Fields
- email: string (required, email validation)
- password: string (required, min 8 characters)
- passwordConfirm: string (required, must match password)

// Actions
- onSubmit: POST to /api/auth/register
- Already have account link: Navigate to /login

// Validation Rules
- Email: Valid email format, not empty, max 255 characters
- Password: Min 8 characters, not empty
- Password Confirm: Must match password field
- Client-side validation on blur and on change (for password match)
- Server-side validation on submit

// Error Handling
- Field-level errors display below each input
- Registration errors (email exists) display as alert above form
- Network errors display as toast notification
```

**ResetPasswordRequestForm Component** (`src/components/auth/ResetPasswordRequestForm.tsx`)

```typescript
// Component Contract
interface ResetPasswordRequestFormProps {
  // No props needed
}

// Form Fields
- email: string (required, email validation)

// Actions
- onSubmit: POST to /api/auth/reset-password
- Back to login link: Navigate to /login

// Validation Rules
- Email: Valid email format, not empty

// Success Handling
- Display success message (generic for security)
- Message: "If an account exists with this email, a password reset link has been sent."
- Automatically redirect to /login after 5 seconds

// Error Handling
- Network errors display as toast notification
- Never reveal if email exists or not
```

**ResetPasswordConfirmForm Component** (`src/components/auth/ResetPasswordConfirmForm.tsx`)

```typescript
// Component Contract
interface ResetPasswordConfirmFormProps {
  token: string; // Password reset token from URL
}

// Form Fields
- password: string (required, min 8 characters)
- passwordConfirm: string (required, must match password)

// Actions
- onSubmit: POST to /api/auth/reset-password/confirm
- On success: Navigate to /login with success message

// Validation Rules
- Password: Min 8 characters, not empty
- Password Confirm: Must match password field
- Token: Validated on component mount

// Error Handling
- Invalid/expired token: Show error message, link to request new reset
- Field-level errors display below each input
- Network errors display as toast notification
```

#### 3.2.2 Layout Components

**AuthLayout Component** (`src/layouts/AuthLayout.astro`)

```typescript
// Purpose: Shared layout for all authentication pages
// Features:
- Centered content container
- Minimal navigation (logo/brand only)
- Responsive design (mobile-first)
- Clean, focused UI without distractions

// Structure:
- Header: Logo/Brand (links to /)
- Main: Centered form container (max-width: 400px)
- Footer: Optional copyright/links

// Usage:
import AuthLayout from '@/layouts/AuthLayout.astro';

<AuthLayout title="Login">
  <LoginForm />
</AuthLayout>
```

**MainLayout Component** (`src/layouts/Layout.astro` - EXISTING)

```typescript
// Updates Required:
- Add navigation component with user menu
- Display user email in nav (from session)
- Add logout button in user menu
- Maintain existing slot-based content area

// Navigation Structure:
- Logo/Brand (left)
- Main navigation links: Dashboard, Items, Containers, Categories
- User menu (right):
  - Display user email
  - Logout button
  - Optional: Settings/Profile link (future)
```

#### 3.2.3 Navigation Component

**UserMenu Component** (`src/components/UserMenu.tsx`)

```typescript
// Component Contract
interface UserMenuProps {
  userEmail: string; // From session
  userName?: string; // Optional display name (future)
}

// Features:
- Dropdown menu (using Shadcn/ui DropdownMenu)
- Display user email/name
- Logout button
- Future: Settings, Profile links

// Logout Action:
- onClick: POST to /api/auth/logout
- On success: Redirect to /login
- Show loading state during logout
```

### 3.3 Form Validation Strategy

#### 3.3.1 Client-Side Validation (React Components)

**Validation Library**: Zod (for schema definition and validation)

**Common Validation Schemas** (`src/lib/validation/auth.schema.ts`)

```typescript
import { z } from 'zod';

// Email validation schema
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email is too long')
  .trim();

// Password validation schema
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(255, 'Password is too long');

// Login form schema
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// Registration form schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  passwordConfirm: passwordSchema,
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Passwords don't match",
  path: ["passwordConfirm"],
});

// Password reset request schema
export const resetPasswordRequestSchema = z.object({
  email: emailSchema,
});

// Password reset confirm schema
export const resetPasswordConfirmSchema = z.object({
  password: passwordSchema,
  passwordConfirm: passwordSchema,
  token: z.string().min(1, 'Reset token is required'),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Passwords don't match",
  path: ["passwordConfirm"],
});
```

**Validation Timing:**
- `onBlur`: Validate individual field when user leaves input
- `onChange`: Validate password confirmation in real-time
- `onSubmit`: Validate entire form before API call

**Error Display:**
- Display errors below each input field
- Use red text color and border highlight
- Clear errors when user starts typing (for that field)
- Maintain errors for other fields until validated

#### 3.3.2 Server-Side Validation (API Endpoints)

All API endpoints validate input using Zod schemas before processing:

```typescript
// Pattern used in all auth endpoints
const validation = loginSchema.safeParse(requestBody);

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
    { status: 400 }
  );
}
```

### 3.4 Error Message Standards

#### 3.4.1 Validation Error Messages

**Email Field:**
- Empty: "Email is required"
- Invalid format: "Please enter a valid email address"
- Too long: "Email is too long"

**Password Field:**
- Empty: "Password is required"
- Too short: "Password must be at least 8 characters"
- Too long: "Password is too long"

**Password Confirmation Field:**
- Empty: "Please confirm your password"
- Mismatch: "Passwords don't match"

#### 3.4.2 Authentication Error Messages

**Login Errors:**
- Invalid credentials: "Invalid email or password"
- Too many attempts: "Too many login attempts. Please try again in a few minutes."
- Email not confirmed: "Please confirm your email address before logging in"
- Account disabled: "Your account has been disabled. Please contact support."

**Registration Errors:**
- Email exists: "An account with this email already exists"
- Weak password: "Password must be at least 8 characters"
- Registration failed: "Registration failed. Please try again."

**Password Reset Errors:**
- Invalid token: "This password reset link is invalid or has expired"
- Token expired: "This password reset link has expired. Please request a new one."
- Request failed: "Failed to send password reset email. Please try again."

**General Errors:**
- Network error: "Unable to connect. Please check your internet connection."
- Server error: "An unexpected error occurred. Please try again."

### 3.5 User Experience Flows

#### 3.5.1 Registration Flow

1. User navigates to `/register`
2. Page checks for existing session → redirect to `/dashboard` if authenticated
3. User enters email, password, password confirmation
4. Client validates fields on blur
5. User submits form
6. Client validates all fields
7. If validation fails: display errors, stop
8. If validation passes: disable form, show loading state
9. POST to `/api/auth/register`
10. On success:
    - Supabase creates user account
    - Supabase may send confirmation email (configurable)
    - Server creates session
    - Server sets auth cookies
    - Client redirects to `/dashboard`
11. On error:
    - Display error message
    - Enable form
    - User can retry

#### 3.5.2 Login Flow

1. User navigates to `/login`
2. Page checks for existing session → redirect to `/dashboard` if authenticated
3. User enters email and password
4. Client validates fields on blur
5. User submits form
6. Client validates all fields
7. If validation fails: display errors, stop
8. If validation passes: disable form, show loading state
9. POST to `/api/auth/login`
10. On success:
    - Supabase authenticates user
    - Server creates session
    - Server sets auth cookies
    - Client redirects to `/dashboard` or `redirectTo` URL
11. On error:
    - Display error message
    - Enable form
    - User can retry

#### 3.5.3 Logout Flow

1. User clicks logout in user menu
2. Disable logout button, show loading state
3. POST to `/api/auth/logout`
4. Server calls `supabase.auth.signOut()`
5. Server clears auth cookies
6. Client redirects to `/login`
7. Success message displayed: "You have been logged out"

#### 3.5.4 Password Reset Flow

**Request Reset:**
1. User clicks "Forgot password?" on login page
2. Navigate to `/reset-password`
3. User enters email address
4. Client validates email format
5. User submits form
6. POST to `/api/auth/reset-password`
7. Server calls Supabase password reset API
8. Supabase sends email with reset link
9. Display success message (generic, doesn't reveal if email exists)
10. Auto-redirect to `/login` after 5 seconds

**Confirm Reset:**
1. User clicks link in email → navigates to `/reset-password/confirm?token=xxx`
2. Page extracts token from URL
3. Page validates token format
4. If token invalid/expired: show error, offer to request new reset
5. If token valid: show password reset form
6. User enters new password, password confirmation
7. Client validates fields
8. User submits form
9. POST to `/api/auth/reset-password/confirm` with token + new password
10. On success:
    - Supabase updates password
    - Redirect to `/login` with success message
11. On error:
    - Display error message
    - User can retry

---

## 4. Backend Logic

### 4.1 API Endpoints

All authentication endpoints follow REST conventions and existing codebase patterns.

**Base Path**: `/api/auth/`  
**Response Format**: JSON  
**Error Format**: Consistent with existing `ErrorResponseDTO`

#### 4.1.1 POST /api/auth/register

**File**: `src/pages/api/auth/register.ts` (NEW)

**Purpose**: Create new user account

**Request Body:**
```typescript
{
  email: string;      // Valid email, required
  password: string;   // Min 8 chars, required
}
```

**Success Response (201 Created):**
```typescript
{
  user: {
    id: string;
    email: string;
    createdAt: string;
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation error (invalid email/password format)
- `409 Conflict`: Email already registered
- `500 Internal Server Error`: Registration failed

**Implementation Steps:**
1. Parse and validate request body with Zod schema
2. Call `supabase.auth.signUp({ email, password })`
3. If Supabase requires email confirmation, user receives email
4. If signup successful, create session
5. Set authentication cookies via `Astro.cookies`
6. Return user data
7. Frontend redirects to `/dashboard`

**Cookies Set:**
- `sb-access-token`: Supabase access token (httpOnly, secure, sameSite: lax)
- `sb-refresh-token`: Supabase refresh token (httpOnly, secure, sameSite: lax)

#### 4.1.2 POST /api/auth/login

**File**: `src/pages/api/auth/login.ts` (NEW)

**Purpose**: Authenticate existing user

**Request Body:**
```typescript
{
  email: string;      // Required
  password: string;   // Required
}
```

**Success Response (200 OK):**
```typescript
{
  user: {
    id: string;
    email: string;
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Email not confirmed (if confirmation required)
- `429 Too Many Requests`: Too many login attempts
- `500 Internal Server Error`: Login failed

**Implementation Steps:**
1. Parse and validate request body
2. Call `supabase.auth.signInWithPassword({ email, password })`
3. If authentication fails, return 401 error
4. If successful, extract session from response
5. Set authentication cookies
6. Return user data
7. Frontend redirects to `/dashboard` or original destination

**Cookies Set:**
- `sb-access-token`: Supabase access token
- `sb-refresh-token`: Supabase refresh token

#### 4.1.3 POST /api/auth/logout

**File**: `src/pages/api/auth/logout.ts` (NEW)

**Purpose**: End user session

**Request Body:** None (cookies used for authentication)

**Success Response (200 OK):**
```typescript
{
  message: "Logged out successfully"
}
```

**Error Responses:**
- `401 Unauthorized`: No valid session
- `500 Internal Server Error`: Logout failed

**Implementation Steps:**
1. Get current session from cookies
2. Call `supabase.auth.signOut()`
3. Clear authentication cookies via `Astro.cookies.delete()`
4. Return success message
5. Frontend redirects to `/login`

**Cookies Cleared:**
- `sb-access-token`
- `sb-refresh-token`

#### 4.1.4 POST /api/auth/reset-password

**File**: `src/pages/api/auth/reset-password.ts` (NEW)

**Purpose**: Initiate password reset process

**Request Body:**
```typescript
{
  email: string;  // Required
}
```

**Success Response (200 OK):**
```typescript
{
  message: "If an account exists with this email, a password reset link has been sent."
}
```

**Note**: Same response whether email exists or not (security best practice)

**Error Responses:**
- `400 Bad Request`: Validation error
- `429 Too Many Requests`: Too many reset requests
- `500 Internal Server Error`: Request failed

**Implementation Steps:**
1. Parse and validate request body
2. Call `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://yourdomain.com/reset-password/confirm' })`
3. Supabase sends email if account exists
4. Always return success message (don't reveal if email exists)
5. Frontend displays success message

**Email Configuration:**
- Reset link format: `{SITE_URL}/reset-password/confirm?token={TOKEN}`
- Token expiry: 24 hours (configured in Supabase)
- Email template: Configured in Supabase dashboard

#### 4.1.5 POST /api/auth/reset-password/confirm

**File**: `src/pages/api/auth/reset-password/confirm.ts` (NEW)

**Purpose**: Complete password reset with token

**Request Body:**
```typescript
{
  token: string;      // Reset token from email, required
  password: string;   // New password, min 8 chars, required
}
```

**Success Response (200 OK):**
```typescript
{
  message: "Password reset successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Validation error or invalid token format
- `401 Unauthorized`: Invalid or expired token
- `500 Internal Server Error`: Password update failed

**Implementation Steps:**
1. Parse and validate request body
2. Verify token with Supabase: `supabase.auth.verifyOtp({ token_hash: token, type: 'recovery' })`
3. If token invalid/expired, return 401 error
4. If token valid, update password: `supabase.auth.updateUser({ password })`
5. Return success message
6. Frontend redirects to `/login` with success message

#### 4.1.6 GET /api/auth/session

**File**: `src/pages/api/auth/session.ts` (NEW)

**Purpose**: Retrieve current session information (optional utility endpoint)

**Request:** No body (uses cookies)

**Success Response (200 OK):**
```typescript
{
  user: {
    id: string;
    email: string;
    createdAt: string;
  } | null
}
```

**Error Responses:**
- `500 Internal Server Error`: Session check failed

**Implementation Steps:**
1. Get session from middleware-provided Supabase client
2. Call `supabase.auth.getUser()`
3. Return user data or null
4. No authentication required (returns null if not authenticated)

**Usage**: Frontend can call this to check authentication status without redirecting

### 4.2 Service Layer

**Location**: `src/lib/services/auth.service.ts` (NEW)

**Purpose**: Abstract authentication business logic from API routes

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/db/database.types';

/**
 * Authentication service handling user management and session operations
 * 
 * Encapsulates Supabase Auth interactions and provides type-safe methods
 * for authentication operations throughout the application.
 */
export class AuthService {
  /**
   * Register a new user account
   * 
   * Creates a new user with email/password authentication.
   * May require email confirmation depending on Supabase settings.
   * 
   * @param supabase - Supabase client instance
   * @param email - User's email address (already validated)
   * @param password - User's password (already validated)
   * @returns User data and session if successful
   * @throws {Error} If registration fails or email already exists
   */
  static async registerUser(
    supabase: SupabaseClient<Database>,
    email: string,
    password: string
  ): Promise<{
    user: { id: string; email: string; createdAt: string };
    session: { accessToken: string; refreshToken: string } | null;
  }> {
    // Call Supabase Auth signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error('Registration failed - no user returned');
    }

    // Return user data and session
    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        createdAt: data.user.created_at,
      },
      session: data.session ? {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      } : null,
    };
  }

  /**
   * Authenticate user with email and password
   * 
   * @param supabase - Supabase client instance
   * @param email - User's email address
   * @param password - User's password
   * @returns User data and session if successful
   * @throws {Error} If authentication fails
   */
  static async loginUser(
    supabase: SupabaseClient<Database>,
    email: string,
    password: string
  ): Promise<{
    user: { id: string; email: string };
    session: { accessToken: string; refreshToken: string };
  }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (!data.user || !data.session) {
      throw new Error('Login failed - no user or session returned');
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
      },
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      },
    };
  }

  /**
   * Sign out current user
   * 
   * @param supabase - Supabase client instance
   * @throws {Error} If logout fails
   */
  static async logoutUser(supabase: SupabaseClient<Database>): Promise<void> {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }
  }

  /**
   * Request password reset email
   * 
   * Sends password reset link to user's email if account exists.
   * Does not throw error if email doesn't exist (security best practice).
   * 
   * @param supabase - Supabase client instance
   * @param email - User's email address
   * @param redirectTo - URL to redirect to after reset
   */
  static async requestPasswordReset(
    supabase: SupabaseClient<Database>,
    email: string,
    redirectTo: string
  ): Promise<void> {
    // Note: This doesn't throw error if email doesn't exist
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    // Only throw on unexpected errors, not "user not found"
    if (error && error.status !== 400) {
      throw error;
    }
  }

  /**
   * Verify password reset token
   * 
   * @param supabase - Supabase client instance
   * @param token - Reset token from email
   * @returns True if token valid, false otherwise
   */
  static async verifyResetToken(
    supabase: SupabaseClient<Database>,
    token: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery',
      });
      
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Update user password with reset token
   * 
   * @param supabase - Supabase client instance
   * @param token - Reset token from email
   * @param newPassword - New password
   * @throws {Error} If token invalid or password update fails
   */
  static async confirmPasswordReset(
    supabase: SupabaseClient<Database>,
    token: string,
    newPassword: string
  ): Promise<void> {
    // First verify the token
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'recovery',
    });

    if (verifyError) {
      throw new Error('Invalid or expired reset token');
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      throw updateError;
    }
  }

  /**
   * Get current authenticated user
   * 
   * @param supabase - Supabase client instance
   * @returns User data if authenticated, null otherwise
   */
  static async getCurrentUser(
    supabase: SupabaseClient<Database>
  ): Promise<{ id: string; email: string } | null> {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return null;
    }

    return {
      id: data.user.id,
      email: data.user.email!,
    };
  }

  /**
   * Refresh user session
   * 
   * @param supabase - Supabase client instance with refresh token
   * @returns New session tokens
   * @throws {Error} If refresh fails
   */
  static async refreshSession(
    supabase: SupabaseClient<Database>
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { data, error } = await supabase.auth.refreshSession();

    if (error || !data.session) {
      throw new Error('Session refresh failed');
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }
}
```

### 4.3 Middleware Updates

**File**: `src/middleware/index.ts` (UPDATE EXISTING)

**Current Implementation:**
```typescript
export const onRequest = defineMiddleware((context, next) => {
  context.locals.supabase = supabaseClient;
  return next();
});
```

**Updated Implementation:**

```typescript
import { defineMiddleware } from 'astro:middleware';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '../db/database.types';

/**
 * Astro middleware for authentication and session management
 * 
 * Responsibilities:
 * 1. Create Supabase client with cookie handling for SSR
 * 2. Attach authenticated Supabase client to context.locals
 * 3. Automatically refresh session if needed
 * 4. Make user data available to all routes
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase client with SSR cookie handling
  const supabase = createServerClient<Database>(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY,
    {
      cookies: {
        get(key: string) {
          return context.cookies.get(key)?.value;
        },
        set(key: string, value: string, options: any) {
          context.cookies.set(key, value, options);
        },
        remove(key: string, options: any) {
          context.cookies.delete(key, options);
        },
      },
    }
  );

  // Attach Supabase client to locals (available in all routes)
  context.locals.supabase = supabase;

  // Get current session (will auto-refresh if needed)
  const { data: { user } } = await supabase.auth.getUser();
  
  // Make user data available to all routes
  context.locals.user = user;

  // Continue to route handler
  return next();
});
```

**Type Definitions Update** (`src/env.d.ts`):

```typescript
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    supabase: import('@supabase/supabase-js').SupabaseClient<import('./db/database.types').Database>;
    user: import('@supabase/supabase-js').User | null;
  }
}
```

**Key Changes:**
1. Use `@supabase/ssr` package for proper cookie handling
2. Pass Astro's cookie helpers to Supabase client
3. Automatically refresh session when needed
4. Make user available in `context.locals.user`
5. Remove hardcoded test user logic

### 4.4 Server-Side Rendering Strategy

**Principle**: Perform authentication checks at page load for security and UX

**Pattern for Protected Pages:**

```typescript
---
// Example: src/pages/dashboard.astro

import Layout from '@/layouts/Layout.astro';

// Authentication check (server-side, runs before page renders)
const user = Astro.locals.user;

if (!user) {
  // Not authenticated - redirect to login
  // Preserve intended destination for post-login redirect
  const returnTo = encodeURIComponent(Astro.url.pathname);
  return Astro.redirect(`/login?returnTo=${returnTo}`);
}

// User is authenticated - fetch page data
const supabase = Astro.locals.supabase;

// Fetch dashboard data
const { data: stats, error } = await fetch(`${Astro.url.origin}/api/dashboard/stats`, {
  headers: {
    'Cookie': Astro.request.headers.get('Cookie') || '',
  },
}).then(res => res.json());

if (error) {
  console.error('Failed to load dashboard:', error);
}
---

<Layout title="Dashboard">
  <h1>Welcome, {user.email}</h1>
  <!-- Rest of page content -->
</Layout>
```

**Pattern for Public Pages with Conditional Behavior:**

```typescript
---
// Example: src/pages/index.astro (landing page)

import Layout from '@/layouts/Layout.astro';
import Welcome from '@/components/Welcome.astro';

// Check if user is already authenticated
const user = Astro.locals.user;

if (user) {
  // Already logged in - redirect to dashboard
  return Astro.redirect('/dashboard');
}

// Not authenticated - show landing page
---

<Layout title="Home Storage System">
  <Welcome />
  <div class="cta-buttons">
    <a href="/register">Get Started</a>
    <a href="/login">Log In</a>
  </div>
</Layout>
```

**Benefits:**
- Fast: Authentication check happens server-side, no client-side redirect flash
- Secure: Protected routes never render without authentication
- SEO-friendly: No client-side redirects that confuse crawlers
- Better UX: Users see correct content immediately

---

## 5. Authentication System

### 5.1 Supabase Auth Integration

**Authentication Method**: Email/Password (Supabase Auth built-in)

**Supabase Configuration Required:**

1. **Auth Settings** (Supabase Dashboard → Authentication → Settings):
   - Enable Email provider
   - Configure email confirmation (optional for MVP):
     - `Enable email confirmations`: true/false
     - If enabled: Users must click link in email before login
     - If disabled: Users can login immediately after registration
   - Password requirements:
     - Minimum length: 8 characters (configurable)
   - Rate limiting:
     - Login attempts: 5 per hour per IP (default)
     - Password reset requests: 3 per hour per IP

2. **Email Templates** (Supabase Dashboard → Authentication → Email Templates):
   - **Confirm Signup**: (if email confirmation enabled)
     - Subject: "Confirm Your Email"
     - Body: Include `{{ .ConfirmationURL }}` link
     - Redirect: `{SITE_URL}/dashboard`
   
   - **Reset Password**:
     - Subject: "Reset Your Password"
     - Body: Include `{{ .ConfirmationURL }}` link
     - Redirect: `{SITE_URL}/reset-password/confirm`
     - Token expiry: 24 hours

3. **URL Configuration**:
   - Site URL: `https://yourdomain.com` (production)
   - Site URL: `http://localhost:4321` (development)
   - Redirect URLs: Add allowed callback URLs:
     - `https://yourdomain.com/dashboard`
     - `https://yourdomain.com/reset-password/confirm`
     - `http://localhost:4321/dashboard` (dev)
     - `http://localhost:4321/reset-password/confirm` (dev)

### 5.2 Session Management

**Session Storage**: HTTP-only cookies (secure, not accessible via JavaScript)

**Cookie Configuration:**

```typescript
// Cookie settings for Supabase tokens
const cookieOptions = {
  path: '/',
  httpOnly: true,    // Not accessible via JavaScript (XSS protection)
  secure: import.meta.env.PROD,  // HTTPS only in production
  sameSite: 'lax' as const,      // CSRF protection
  maxAge: 60 * 60 * 24 * 7,      // 7 days
};
```

**Cookies Used:**
1. `sb-access-token`: Short-lived access token (1 hour)
2. `sb-refresh-token`: Long-lived refresh token (7 days)

**Session Lifecycle:**

1. **Session Creation** (Login/Register):
   - Supabase returns `access_token` and `refresh_token`
   - Server sets both tokens as HTTP-only cookies
   - Tokens stored securely, not accessible to client JavaScript

2. **Session Validation** (Every Request):
   - Middleware reads `access_token` from cookie
   - Passes token to Supabase client
   - Supabase validates token
   - If valid: User data available in `context.locals.user`
   - If invalid/expired: Attempt refresh

3. **Session Refresh** (Access Token Expired):
   - Middleware detects expired `access_token`
   - Uses `refresh_token` to get new tokens
   - Updates both cookies with new values
   - Continues request with fresh session
   - Transparent to user (no re-login required)

4. **Session Termination** (Logout):
   - Server calls `supabase.auth.signOut()`
   - Server deletes both cookies
   - Supabase invalidates session
   - User redirected to login page

**Session Persistence:**
- Users remain logged in across browser sessions (cookies persist)
- Users remain logged in across tabs (shared cookies)
- Session expires after 7 days of inactivity (refresh token expiry)
- Session can be manually terminated via logout

### 5.3 Protected Routes Pattern

**Implementation**: Server-side authentication check in `.astro` pages

**Standard Pattern:**

```typescript
---
// Import types
import type { User } from '@supabase/supabase-js';

// Get user from middleware
const user: User | null = Astro.locals.user;

// Authentication guard
if (!user) {
  // Store intended destination for post-login redirect
  const returnTo = Astro.url.pathname + Astro.url.search;
  return Astro.redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
}

// User authenticated - continue with page logic
const supabase = Astro.locals.supabase;
---
```

**Routes Requiring Protection:**
- `/dashboard` - Main dashboard (rename from `/`)
- `/categories` - Category management (already has auth check, update redirect)
- `/items` - Item management (future)
- `/containers` - Container management (future)
- `/api/categories/*` - Category API endpoints (already protected)
- `/api/items/*` - Item API endpoints (future)
- `/api/containers/*` - Container API endpoints (future)
- `/api/dashboard/*` - Dashboard API endpoints (already protected)

**Routes Remaining Public:**
- `/` - Landing page (redirect to `/dashboard` if authenticated)
- `/login` - Login page (redirect to `/dashboard` if authenticated)
- `/register` - Registration page (redirect to `/dashboard` if authenticated)
- `/reset-password` - Password reset request (public)
- `/reset-password/confirm` - Password reset confirmation (public with token)

### 5.4 Security Measures

#### 5.4.1 Cookie Security

**HTTP-Only Cookies:**
- All auth cookies set with `httpOnly: true`
- Not accessible via JavaScript (`document.cookie`)
- Protects against XSS attacks stealing tokens

**Secure Cookies:**
- Production: `secure: true` (HTTPS only)
- Development: `secure: false` (allow HTTP for localhost)
- Prevents token interception over unencrypted connections

**SameSite Protection:**
- Set to `sameSite: 'lax'`
- Prevents CSRF attacks
- Cookies sent with same-site requests and top-level navigation
- Cookies NOT sent with cross-site POST requests

#### 5.4.2 Password Security

**Requirements:**
- Minimum 8 characters
- No maximum (within reason, e.g., 255 chars)
- No complexity requirements for MVP (improves usability)
- Supabase handles hashing with bcrypt

**Best Practices:**
- Never store plaintext passwords
- Never log passwords
- Never include passwords in error messages
- Never send passwords in URL parameters

#### 5.4.3 Email Security

**Password Reset Flow:**
- Don't reveal if email exists (same response always)
- Token-based reset (one-time use)
- Token expires after 24 hours
- Invalidate token after use
- Allow multiple reset requests (old tokens invalidated)

**Email Confirmation Flow** (if enabled):
- User cannot login until email confirmed
- Confirmation link expires after 24 hours
- Allow resend confirmation email
- Clear error message if attempting login before confirmation

#### 5.4.4 Rate Limiting

**Supabase Built-in Rate Limits:**
- Login attempts: 5 failures per hour per IP
- Password reset requests: 3 per hour per email
- Registration: 10 per hour per IP

**Error Messages:**
- When rate limited: "Too many attempts. Please try again later."
- Never reveal specific lockout duration

#### 5.4.5 Additional Security Headers

**Add to Response Headers** (in `astro.config.mjs` or middleware):

```typescript
// Security headers for all responses
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};
```

---

## 6. Data Models

### 6.1 User Table (Managed by Supabase Auth)

**Table**: `auth.users` (Supabase system table)

Supabase Auth automatically manages this table. Do not modify directly.

**Relevant Fields:**
- `id`: UUID (primary key)
- `email`: string (unique)
- `encrypted_password`: string (bcrypt hash)
- `email_confirmed_at`: timestamp (null until confirmed)
- `created_at`: timestamp
- `updated_at`: timestamp
- `last_sign_in_at`: timestamp

### 6.2 Profiles Table (Application User Data)

**Table**: `public.profiles` (EXISTING in database)

This table extends Supabase Auth users with application-specific data.

**Current Schema** (from `database.types.ts`):
```typescript
profiles: {
  Row: {
    id: string;          // UUID, matches auth.users.id
    created_at: string;  // timestamp
    updated_at: string;  // timestamp
  };
  Insert: {
    id: string;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    created_at?: string;
    updated_at?: string;
  };
}
```

**Database Constraints:**
- Primary key: `id`
- Foreign key: `id` references `auth.users(id)` ON DELETE CASCADE
- All user data tables (`categories`, `containers`, `items`, `images`) have `user_id` FK to `profiles.id`

**Automatic Profile Creation:**

When a user registers, a profile must be created automatically via database trigger:

```sql
-- Database trigger (run once in Supabase SQL editor)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**Future Extensions:**
Profile table can be extended with additional fields in future phases:
- `display_name`: string (optional)
- `avatar_url`: string (optional)
- `timezone`: string (optional)

### 6.3 Row Level Security (RLS) Policies

All existing tables already have `user_id` columns and should have RLS policies.

**Verify RLS Enabled** (on all user data tables):
```sql
-- Should already be enabled, verify:
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

**Standard RLS Policies** (should already exist, verify):

```sql
-- Categories: Users can only access their own categories
CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- Repeat for containers, items, images with same pattern
-- Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

### 6.4 Type Definitions

**Update** `src/types.ts` with authentication-related DTOs:

```typescript
// Add to existing types.ts

// =============================================================================
// Authentication DTOs
// =============================================================================

/**
 * User data returned from authentication operations
 */
export interface UserDTO {
  id: string;
  email: string;
  createdAt?: string;
}

/**
 * Login request body
 * Used for: POST /api/auth/login
 */
export interface LoginCommand {
  email: string;
  password: string;
}

/**
 * Registration request body
 * Used for: POST /api/auth/register
 */
export interface RegisterCommand {
  email: string;
  password: string;
}

/**
 * Password reset request body
 * Used for: POST /api/auth/reset-password
 */
export interface ResetPasswordCommand {
  email: string;
}

/**
 * Password reset confirmation body
 * Used for: POST /api/auth/reset-password/confirm
 */
export interface ResetPasswordConfirmCommand {
  token: string;
  password: string;
}

/**
 * Login response
 */
export interface LoginResponseDTO {
  user: UserDTO;
}

/**
 * Registration response
 */
export interface RegisterResponseDTO {
  user: UserDTO;
}

/**
 * Logout response
 */
export interface LogoutResponseDTO {
  message: string;
}

/**
 * Password reset response
 */
export interface ResetPasswordResponseDTO {
  message: string;
}

/**
 * Session response (from GET /api/auth/session)
 */
export interface SessionResponseDTO {
  user: UserDTO | null;
}
```

---

## 7. Security Considerations

### 7.1 Authentication Security Checklist

- [x] Passwords hashed with bcrypt (Supabase handles)
- [x] HTTP-only cookies for token storage
- [x] Secure cookies in production (HTTPS only)
- [x] SameSite cookie attribute for CSRF protection
- [x] Server-side session validation on every request
- [x] Automatic session refresh (transparent to user)
- [x] Rate limiting on authentication endpoints (Supabase)
- [x] Generic error messages (don't reveal if email exists)
- [x] Password reset tokens expire after 24 hours
- [x] One-time use password reset tokens
- [x] Email confirmation option (configurable)

### 7.2 Common Vulnerabilities & Mitigations

#### 7.2.1 Cross-Site Scripting (XSS)

**Risk**: Attacker injects malicious JavaScript to steal tokens

**Mitigation**:
- HTTP-only cookies (tokens not accessible via JavaScript)
- All user input sanitized before rendering
- React automatically escapes output
- Content Security Policy headers (future enhancement)

#### 7.2.2 Cross-Site Request Forgery (CSRF)

**Risk**: Attacker tricks user into making unwanted requests

**Mitigation**:
- SameSite cookie attribute set to 'lax'
- Supabase tokens validated on every request
- State-changing operations use POST (not GET)
- Future: Add CSRF tokens for extra protection

#### 7.2.3 Session Hijacking

**Risk**: Attacker steals or guesses session tokens

**Mitigation**:
- HTTPS in production (secure cookies)
- Short-lived access tokens (1 hour)
- Tokens cryptographically strong (Supabase)
- Session invalidated on logout
- No tokens in URLs or logs

#### 7.2.4 Brute Force Attacks

**Risk**: Attacker tries many password combinations

**Mitigation**:
- Rate limiting (5 failed logins per hour)
- Strong password requirements (min 8 chars)
- Account lockout after repeated failures (Supabase)
- No indication of correct username/email

#### 7.2.5 Email Enumeration

**Risk**: Attacker discovers which emails have accounts

**Mitigation**:
- Generic error messages on login ("Invalid email or password")
- Same response for reset regardless of email existence
- Rate limit password reset requests
- No different timing for existing vs. non-existing emails

### 7.3 Data Protection

**Personal Data Stored:**
- Email address (in `auth.users`)
- User ID (in `profiles` and all user data tables)

**Data Protection Measures:**
- All personal data access controlled by RLS policies
- Users can only access their own data
- Passwords never stored in plaintext
- Passwords never logged or transmitted in URLs
- Email addresses not exposed in error messages to other users

**GDPR Considerations** (future phases):
- Right to access: User can view their data
- Right to deletion: User can delete their account (cascade to all data)
- Right to portability: User can export their data
- Data retention: Define retention policy for deleted accounts

---

## 8. Error Handling

### 8.1 Error Response Format

All authentication endpoints use consistent error format (matching existing API pattern):

```typescript
interface ErrorResponseDTO {
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable error message
    details?: {             // Optional field-level errors
      field: string;
      message: string;
    }[];
  };
}
```

### 8.2 Error Codes

**Authentication Error Codes:**

| Code | HTTP Status | Description | User Message |
|------|-------------|-------------|--------------|
| `VALIDATION_ERROR` | 400 | Invalid input data | "Validation failed" + field details |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password | "Invalid email or password" |
| `UNAUTHORIZED` | 401 | Not authenticated | "Please log in to continue" |
| `EMAIL_NOT_CONFIRMED` | 403 | Email not verified | "Please confirm your email address" |
| `EMAIL_EXISTS` | 409 | Duplicate email | "An account with this email already exists" |
| `INVALID_TOKEN` | 401 | Invalid/expired reset token | "This reset link is invalid or expired" |
| `RATE_LIMITED` | 429 | Too many requests | "Too many attempts. Please try again later." |
| `INTERNAL_ERROR` | 500 | Server error | "An unexpected error occurred" |

### 8.3 Client-Side Error Handling

**Field-Level Errors:**
```typescript
// Display below input field
<input type="email" name="email" />
{errors.email && (
  <p class="text-sm text-destructive mt-1">{errors.email}</p>
)}
```

**Form-Level Errors:**
```typescript
// Display above form
{errors.form && (
  <div class="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded mb-4">
    {errors.form}
  </div>
)}
```

**Toast Notifications** (for network errors):
```typescript
import { toast } from 'sonner';

// On network error
toast.error('Unable to connect. Please check your internet connection.');
```

### 8.4 Server-Side Error Handling

**Pattern for All Auth Endpoints:**

```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Parse request body
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
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Validate with Zod
    const validation = schema.safeParse(body);
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
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Call service layer
    const result = await AuthService.someMethod(locals.supabase, ...);

    // Step 4: Return success
    return new Response(JSON.stringify(result), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error: any) {
    // Log error for debugging (never expose to client)
    console.error('[Endpoint] Error:', {
      message: error?.message,
      code: error?.code,
      timestamp: new Date().toISOString(),
    });

    // Map known errors to appropriate responses
    if (error?.message?.includes('Invalid login credentials')) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        } satisfies ErrorResponseDTO),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Default to generic error
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      } satisfies ErrorResponseDTO),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

---

## 9. Integration Points

### 9.1 Changes to Existing Files

**Files to Update:**

1. **`src/middleware/index.ts`** - Update for proper session handling
   - Add `@supabase/ssr` for cookie management
   - Implement session refresh logic
   - Attach user to `context.locals`

2. **`src/pages/index.astro`** - Update landing page behavior
   - Check if user authenticated
   - If yes: redirect to `/dashboard`
   - If no: show marketing/welcome content

3. **`src/pages/categories.astro`** - Update redirect destination
   - Change: `return Astro.redirect('/');`
   - To: `return Astro.redirect('/login');`

4. **`src/lib/utils.ts`** - Remove test user bypass
   - Delete `loginTestUser()` function
   - Remove any other temporary auth code

5. **`src/pages/api/categories/index.ts`** - Remove test user bypass
   - Remove: `const USER_ID: string = loginTestUser(supabase);`
   - Use: `const user = Astro.locals.user;` instead
   - Same pattern for other API endpoints

6. **`src/pages/api/dashboard/stats.ts`** - Update auth check
   - Same as categories endpoint

7. **`src/types.ts`** - Add authentication DTOs
   - Add types listed in section 6.4

8. **`src/env.d.ts`** - Update Locals interface
   - Add `user` property

9. **`src/layouts/Layout.astro`** - Add navigation with user menu
   - Add user menu component
   - Add logout button
   - Display user email

10. **`astro.config.mjs`** - No changes needed (already in SSR mode)

### 9.2 New Files to Create

**Authentication Pages:**
- `src/pages/login.astro`
- `src/pages/register.astro`
- `src/pages/reset-password.astro`
- `src/pages/reset-password/confirm.astro`
- `src/pages/dashboard.astro` (rename/move from `index.astro`)

**Authentication Components:**
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/RegisterForm.tsx`
- `src/components/auth/ResetPasswordRequestForm.tsx`
- `src/components/auth/ResetPasswordConfirmForm.tsx`
- `src/components/UserMenu.tsx`
- `src/layouts/AuthLayout.astro`

**Authentication API Endpoints:**
- `src/pages/api/auth/register.ts`
- `src/pages/api/auth/login.ts`
- `src/pages/api/auth/logout.ts`
- `src/pages/api/auth/reset-password.ts`
- `src/pages/api/auth/reset-password/confirm.ts`
- `src/pages/api/auth/session.ts` (optional)

**Authentication Service:**
- `src/lib/services/auth.service.ts`

**Authentication Validation:**
- `src/lib/validation/auth.schema.ts`

### 9.3 Dependencies

**New NPM Packages Required:**

```json
{
  "@supabase/ssr": "^0.5.0"
}
```

**Installation:**
```bash
npm install @supabase/ssr
```

**Existing Dependencies** (already installed):
- `@supabase/supabase-js` - Supabase client
- `zod` - Input validation
- `sonner` - Toast notifications (for error messages)

### 9.4 Environment Variables

**No new environment variables required**

Existing variables are sufficient:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anonymous/public key

### 9.5 Supabase Dashboard Configuration

**Required Setup Steps:**

1. **Enable Email Auth Provider**
   - Navigate to: Authentication → Providers
   - Enable "Email" provider

2. **Configure Email Settings**
   - Navigate to: Authentication → Settings
   - Set "Site URL" to production domain
   - Add "Redirect URLs" for auth callbacks
   - Configure "Email confirmation" (enable/disable)

3. **Customize Email Templates**
   - Navigate to: Authentication → Email Templates
   - Update "Confirm signup" template (if confirmation enabled)
   - Update "Reset password" template
   - Ensure redirect URLs point to your domain

4. **Verify Database Trigger**
   - Navigate to: Database → Functions
   - Ensure `handle_new_user()` function exists
   - Check trigger `on_auth_user_created` on `auth.users` table

5. **Verify RLS Policies**
   - Navigate to: Authentication → Policies
   - Verify policies on `categories`, `containers`, `items`, `images`, `profiles`

### 9.6 Breaking Changes

**Changes That May Affect Existing Functionality:**

1. **Landing Page Redirect**
   - Before: `/` shows dashboard mockup for everyone
   - After: `/` redirects authenticated users to `/dashboard`
   - Impact: Update any hardcoded links to `/` in navigation

2. **Dashboard URL Change**
   - Before: Dashboard at `/`
   - After: Dashboard at `/dashboard`
   - Impact: Update all internal links that point to dashboard

3. **Test User Removal**
   - Before: `loginTestUser()` bypasses authentication
   - After: Real authentication required for all protected routes
   - Impact: Cannot access app without registering/logging in

4. **API Endpoints Require Real Auth**
   - Before: API uses test user ID
   - After: API uses real user from session
   - Impact: Cannot call API endpoints without authentication

**Migration Plan:**
1. Create first real user account via registration
2. Remove test user code
3. Update all references from `/` to `/dashboard`
4. Test all protected routes work with real authentication

---

## 10. Testing Strategy

### 10.1 Manual Testing Checklist

**Registration Flow:**
- [ ] Navigate to `/register`
- [ ] Submit empty form → validation errors display
- [ ] Submit invalid email → validation error displays
- [ ] Submit short password → validation error displays
- [ ] Submit mismatched passwords → validation error displays
- [ ] Submit valid data → redirects to `/dashboard`
- [ ] Verify user can access protected routes
- [ ] Try to register same email again → error message displays
- [ ] If email confirmation enabled: verify email sent

**Login Flow:**
- [ ] Navigate to `/login`
- [ ] Submit empty form → validation errors display
- [ ] Submit invalid credentials → error message displays
- [ ] Submit valid credentials → redirects to `/dashboard`
- [ ] Close browser and reopen → user still logged in (session persists)
- [ ] Open in new tab → user logged in there too

**Logout Flow:**
- [ ] Click logout button → redirects to `/login`
- [ ] Try to access `/dashboard` → redirects to `/login`
- [ ] Try to access `/categories` → redirects to `/login`
- [ ] Login again → works correctly

**Password Reset Flow:**
- [ ] Navigate to `/reset-password`
- [ ] Submit empty form → validation error displays
- [ ] Submit invalid email format → validation error displays
- [ ] Submit valid email → success message displays
- [ ] Check email for reset link
- [ ] Click link → navigates to `/reset-password/confirm?token=xxx`
- [ ] Submit empty form → validation errors display
- [ ] Submit mismatched passwords → validation error displays
- [ ] Submit valid new password → success message, redirects to `/login`
- [ ] Login with new password → works correctly
- [ ] Try to reuse reset token → error message displays

**Protected Routes:**
- [ ] While logged out, try to access `/dashboard` → redirects to `/login`
- [ ] While logged out, try to access `/categories` → redirects to `/login`
- [ ] Login → can access all protected routes
- [ ] Logout → cannot access protected routes anymore

**Session Management:**
- [ ] Login → close browser → reopen → still logged in
- [ ] Login → wait for access token to expire (1 hour) → session auto-refreshes
- [ ] Login → manually delete cookies → next request redirects to login

**Error Handling:**
- [ ] Submit forms with JavaScript disabled → still works (server-side validation)
- [ ] Simulate network error → error message displays
- [ ] Attempt rate-limited action → rate limit error displays

### 10.2 Edge Cases to Test

**Email Handling:**
- [ ] Email with uppercase letters (should work, case-insensitive)
- [ ] Email with leading/trailing spaces (should be trimmed)
- [ ] Very long email (255+ chars) → validation error

**Password Handling:**
- [ ] 8-character password (minimum) → accepts
- [ ] 7-character password → validation error
- [ ] Password with spaces → accepts (spaces are valid)
- [ ] Very long password (255+ chars) → validation error

**Token Expiration:**
- [ ] Use password reset link after 24 hours → expired error
- [ ] Use password reset link multiple times → only first use works
- [ ] Request multiple resets → only latest link works

**Concurrent Sessions:**
- [ ] Login on multiple devices → all work independently
- [ ] Logout on one device → other devices remain logged in
- [ ] Change password → all sessions remain valid (Supabase behavior)

**Navigation:**
- [ ] Login with `returnTo` parameter → redirects to original destination
- [ ] Login without `returnTo` → redirects to `/dashboard`
- [ ] Access protected route while logged out → redirected to login with `returnTo`

### 10.3 User Acceptance Testing

**Test Users:**
Create multiple test accounts to validate:
- New user registration
- Returning user login
- Password reset flow
- Data isolation (users can't see each other's data)

**Real-World Scenarios:**
1. **First-time user**: Can register and start using app immediately
2. **Returning user**: Can login and access their data
3. **Forgot password**: Can reset password and regain access
4. **Multiple devices**: Can access from phone and desktop simultaneously
5. **Long absence**: Can return after weeks and still access data

### 10.4 Performance Testing

**Page Load Times:**
- [ ] Login page loads in < 1 second
- [ ] Registration page loads in < 1 second
- [ ] Dashboard loads in < 2 seconds (after authentication)
- [ ] Protected route redirects in < 500ms (when not authenticated)

**API Response Times:**
- [ ] POST `/api/auth/login` responds in < 1 second
- [ ] POST `/api/auth/register` responds in < 1 second
- [ ] POST `/api/auth/logout` responds in < 500ms
- [ ] Middleware auth check adds < 100ms to request time

### 10.5 Security Testing

**Authentication Security:**
- [ ] Passwords not visible in network requests (inspect Dev Tools)
- [ ] Tokens stored in HTTP-only cookies (not accessible via JavaScript)
- [ ] Session tokens not in URLs or logs
- [ ] HTTPS enforced in production (secure cookies)

**Authorization Security:**
- [ ] User A cannot access User B's categories via API
- [ ] User A cannot access User B's containers via API
- [ ] User A cannot access User B's items via API
- [ ] RLS policies correctly enforced at database level

**XSS Protection:**
- [ ] Inject `<script>alert('XSS')</script>` in email field → sanitized
- [ ] Inject HTML in password field → treated as literal text
- [ ] Check that React escapes all user input automatically

**CSRF Protection:**
- [ ] SameSite cookies prevent cross-origin requests
- [ ] State-changing operations only accept POST (not GET)

---

## Appendix A: Implementation Checklist

### Phase 1: Foundation (Core Authentication)

**Middleware & Configuration:**
- [ ] Install `@supabase/ssr` package
- [ ] Update `src/middleware/index.ts` for session handling
- [ ] Update `src/env.d.ts` with Locals interface
- [ ] Configure Supabase Auth in dashboard (enable email provider)
- [ ] Set up email templates in Supabase dashboard
- [ ] Verify database trigger for profile creation

**Validation Schemas:**
- [ ] Create `src/lib/validation/auth.schema.ts`
- [ ] Add email schema
- [ ] Add password schema
- [ ] Add login schema
- [ ] Add register schema
- [ ] Add reset password schemas

**Type Definitions:**
- [ ] Update `src/types.ts` with auth DTOs
- [ ] Add UserDTO
- [ ] Add LoginCommand, RegisterCommand
- [ ] Add ResetPasswordCommand, ResetPasswordConfirmCommand
- [ ] Add response DTOs

### Phase 2: Service Layer & API Endpoints

**Authentication Service:**
- [ ] Create `src/lib/services/auth.service.ts`
- [ ] Implement `registerUser()`
- [ ] Implement `loginUser()`
- [ ] Implement `logoutUser()`
- [ ] Implement `requestPasswordReset()`
- [ ] Implement `confirmPasswordReset()`
- [ ] Implement `getCurrentUser()`
- [ ] Implement `refreshSession()`

**API Endpoints:**
- [ ] Create `src/pages/api/auth/register.ts`
- [ ] Create `src/pages/api/auth/login.ts`
- [ ] Create `src/pages/api/auth/logout.ts`
- [ ] Create `src/pages/api/auth/reset-password.ts`
- [ ] Create `src/pages/api/auth/reset-password/confirm.ts`
- [ ] Create `src/pages/api/auth/session.ts` (optional)

### Phase 3: UI Components

**Layouts:**
- [ ] Create `src/layouts/AuthLayout.astro`
- [ ] Update `src/layouts/Layout.astro` with navigation

**Authentication Forms:**
- [ ] Create `src/components/auth/LoginForm.tsx`
- [ ] Create `src/components/auth/RegisterForm.tsx`
- [ ] Create `src/components/auth/ResetPasswordRequestForm.tsx`
- [ ] Create `src/components/auth/ResetPasswordConfirmForm.tsx`

**Navigation:**
- [ ] Create `src/components/UserMenu.tsx`

### Phase 4: Pages

**Authentication Pages:**
- [ ] Create `src/pages/login.astro`
- [ ] Create `src/pages/register.astro`
- [ ] Create `src/pages/reset-password.astro`
- [ ] Create `src/pages/reset-password/confirm.astro`

**Update Existing Pages:**
- [ ] Rename/move `src/pages/index.astro` to `src/pages/dashboard.astro`
- [ ] Update `src/pages/index.astro` as landing page
- [ ] Update `src/pages/categories.astro` redirect

### Phase 5: Integration & Cleanup

**Remove Test Code:**
- [ ] Remove `loginTestUser()` from `src/lib/utils.ts`
- [ ] Remove test user references from `src/pages/api/categories/index.ts`
- [ ] Remove test user references from other API endpoints

**Update Auth Checks:**
- [ ] Update all API endpoints to use real user from `Astro.locals.user`
- [ ] Update all protected pages to check `Astro.locals.user`
- [ ] Update redirect destinations from `/` to `/login` or `/dashboard`

### Phase 6: Testing & Validation

**Manual Testing:**
- [ ] Complete registration flow testing
- [ ] Complete login flow testing
- [ ] Complete logout flow testing
- [ ] Complete password reset flow testing
- [ ] Test protected routes
- [ ] Test session persistence
- [ ] Test error handling

**Security Testing:**
- [ ] Verify HTTP-only cookies
- [ ] Verify secure cookies in production
- [ ] Verify RLS policies
- [ ] Test data isolation between users
- [ ] Test XSS protection
- [ ] Test CSRF protection

**User Acceptance Testing:**
- [ ] Create test users
- [ ] Test real-world scenarios
- [ ] Verify performance
- [ ] Collect feedback

### Phase 7: Documentation & Deployment

**Documentation:**
- [ ] Update README with authentication setup
- [ ] Document environment variables
- [ ] Document Supabase configuration steps
- [ ] Create user guide for authentication features

**Deployment:**
- [ ] Set production environment variables
- [ ] Configure Supabase for production domain
- [ ] Enable secure cookies (HTTPS)
- [ ] Deploy to staging environment
- [ ] Test in staging
- [ ] Deploy to production

---

## Appendix B: File Structure

```
src/
├── components/
│   ├── auth/                          # NEW: Authentication form components
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── ResetPasswordRequestForm.tsx
│   │   └── ResetPasswordConfirmForm.tsx
│   ├── UserMenu.tsx                   # NEW: User menu with logout
│   ├── categories/                    # EXISTING
│   ├── ui/                            # EXISTING
│   └── ...
├── db/
│   ├── database.types.ts              # EXISTING
│   └── supabase.client.ts             # EXISTING
├── hooks/                             # EXISTING
├── layouts/
│   ├── AuthLayout.astro               # NEW: Layout for auth pages
│   └── Layout.astro                   # UPDATE: Add navigation with user menu
├── lib/
│   ├── services/
│   │   ├── auth.service.ts            # NEW: Authentication service
│   │   ├── category.service.ts        # EXISTING
│   │   └── dashboard.service.ts       # EXISTING
│   ├── validation/
│   │   ├── auth.schema.ts             # NEW: Auth validation schemas
│   │   └── category.schema.ts         # EXISTING
│   └── utils.ts                       # UPDATE: Remove loginTestUser()
├── middleware/
│   └── index.ts                       # UPDATE: Session management
├── pages/
│   ├── api/
│   │   ├── auth/                      # NEW: Authentication endpoints
│   │   │   ├── login.ts
│   │   │   ├── register.ts
│   │   │   ├── logout.ts
│   │   │   ├── reset-password.ts
│   │   │   ├── reset-password/
│   │   │   │   └── confirm.ts
│   │   │   └── session.ts
│   │   ├── categories/                # EXISTING (update auth checks)
│   │   └── dashboard/                 # EXISTING (update auth checks)
│   ├── reset-password/
│   │   └── confirm.astro              # NEW: Password reset confirm page
│   ├── dashboard.astro                # NEW/RENAMED: Main dashboard (from index.astro)
│   ├── index.astro                    # UPDATE: Landing page with conditional redirect
│   ├── login.astro                    # NEW: Login page
│   ├── register.astro                 # NEW: Registration page
│   ├── reset-password.astro           # NEW: Password reset request page
│   └── categories.astro               # UPDATE: Update redirect destination
├── styles/                            # EXISTING
├── env.d.ts                           # UPDATE: Add user to Locals
└── types.ts                           # UPDATE: Add auth DTOs
```

---

## Appendix C: Additional Resources

**Supabase Documentation:**
- Supabase Auth Guide: https://supabase.com/docs/guides/auth
- Auth Server-Side Rendering: https://supabase.com/docs/guides/auth/server-side-rendering
- Email Auth: https://supabase.com/docs/guides/auth/auth-email
- Password Reset: https://supabase.com/docs/guides/auth/auth-password-reset

**Astro Documentation:**
- Server-Side Rendering: https://docs.astro.build/en/guides/server-side-rendering/
- Middleware: https://docs.astro.build/en/guides/middleware/
- Cookies: https://docs.astro.build/en/reference/api-reference/#astrocookies

**Security Best Practices:**
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- OWASP Session Management: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html

---

**End of Specification**