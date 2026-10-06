import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const incidentSchema = z.object({
  trip_id: z.string().uuid(),
  type: z.enum(['driver_absent', 'vehicle_breakdown', 'delay', 'no_show', 'other']),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  description: z.string().optional(),
})

export async function GET() {
  const { data, error } = await supabase.from('incidents').select('*, trips(*, routes(*))')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = incidentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = user.user_metadata.tenant_id
  if (!tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 400 })

  const { data, error } = await supabase.from('incidents').insert({ ...parsed.data, tenant_id: tenantId }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
