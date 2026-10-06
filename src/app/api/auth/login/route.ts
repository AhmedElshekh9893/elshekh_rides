import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Cookie-bound client: signInWithPassword writes the session cookies through
  // the setAll callback, so the browser stays authenticated afterwards.
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  const appMeta = (data.user.app_metadata ?? {}) as Record<string, unknown>

  return NextResponse.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      role: (appMeta.role as string) ?? '',
      tenantId: (appMeta.tenant_id as string) ?? '',
    },
  })
}
