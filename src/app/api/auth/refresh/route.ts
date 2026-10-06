import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const refreshSchema = z.object({
  refresh_token: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = refreshSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: parsed.data.refresh_token,
  })

  if (error || !data.user || !data.session) {
    return NextResponse.json({ error: 'Refresh failed' }, { status: 401 })
  }

  return NextResponse.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      role: data.user.user_metadata.role,
      tenantId: data.user.user_metadata.tenant_id,
    },
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
  })
}
