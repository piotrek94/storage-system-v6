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

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        createdAt: data.user.created_at,
      },
      session: data.session
        ? {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
          }
        : null,
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
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
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
    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession();

    if (error || !session) {
      throw new Error('Session refresh failed');
    }

    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
    };
  }
}
