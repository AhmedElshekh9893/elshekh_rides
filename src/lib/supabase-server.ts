import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Server-side Supabase client bound to the caller's session cookies.
 *
 * Uses the anon key plus the user's JWT from cookies, so `auth.getUser()`
 * resolves and every query runs as that user — RLS applies as designed.
 * The service role key is never used here (Constitution VIII).
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component render — cookies are read-only there.
            // Session refresh is handled by middleware instead.
          }
        },
      },
    }
  )
}

/**
 * Returns the authenticated user with role + tenantId resolved from
 * app_metadata (the trusted, server-controlled claim — never user_metadata).
 *
 * Returns null when unauthenticated. Callers must treat null as 401.
 */
export async function getAuthContext() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>

  return {
    supabase,
    user,
    userId: user.id,
    email: user.email ?? '',
    role: (appMeta.role as string) ?? '',
    tenantId: (appMeta.tenant_id as string) ?? '',
  }
}
