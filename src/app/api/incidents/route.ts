import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authorize, parsePaging } from '@/lib/api-auth'

const incidentSchema = z.object({
  trip_id: z.string().uuid(),
  type: z.enum(['driver_absent', 'vehicle_breakdown', 'delay', 'no_show', 'other']),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  description: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const auth = await authorize('incidents', 'read')
  if (!auth.ok) return auth.response

  const { limit, offset } = parsePaging(req)
  let query = auth.supabase
    .from('incidents')
    .select('*, trips(*, routes(*))')

  if (auth.role !== 'super_admin') {
    query = query.eq('tenant_id', auth.tenantId)
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const auth = await authorize('incidents', 'write')
  if (!auth.ok) return auth.response

  const body = await req.json()
  const parsed = incidentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await auth.supabase
    .from('incidents')
    .insert({ ...parsed.data, tenant_id: auth.tenantId, })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
