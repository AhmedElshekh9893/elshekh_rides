import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

/**
 * Session refresh is handled by the middleware on every protected request.
 * This endpoint exists for clients that want to refresh explicitly; it reports
 * the current session state rather than accepting a raw token, so the refresh
 * token never travels through a JSON body.
 */
export async function POST() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Refresh failed' }, { status: 401 })
  }

  const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: (appMeta.role as string) ?? '',
      tenantId: (appMeta.tenant_id as string) ?? '',
    },
  })
}
