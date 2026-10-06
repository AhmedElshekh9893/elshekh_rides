import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authorize, parsePaging } from '@/lib/api-auth'

const routeSchema = z.object({
  name: z.string().min(1),
  origin: z.string().min(1),
  destination: z.string().min(1),
  distance_km: z.number().positive().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
})

export async function GET(req: NextRequest) {
  const auth = await authorize('routes', 'read')
  if (!auth.ok) return auth.response

  const { limit, offset } = parsePaging(req)
  let query = auth.supabase
    .from('routes')
    .select('*, route_stops(*)')

  if (auth.role !== 'super_admin') {
    query = query.eq('tenant_id', auth.tenantId)
  }

  query = query.order('name').range(offset, offset + limit - 1)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const auth = await authorize('routes', 'write')
  if (!auth.ok) return auth.response

  const body = await req.json()
  const parsed = routeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await auth.supabase
    .from('routes')
    .insert({ ...parsed.data, tenant_id: auth.tenantId, })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
