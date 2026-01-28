import { defineMiddleware } from 'astro:middleware';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';

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
        getAll() {
          return parseCookieHeader(context.request.headers.get('Cookie') ?? '');
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            context.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Attach Supabase client to locals (available in all routes)
  context.locals.supabase = supabase;

  // Get current session (will auto-refresh if needed)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Make user data available to all routes
  context.locals.user = user;

  // Continue to route handler
  return next();
});
