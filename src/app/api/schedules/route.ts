import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authorize, parsePaging } from '@/lib/api-auth'

const scheduleSchema = z.object({
  route_id: z.string().uuid(),
  days: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])).min(1),
  departure_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  return_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
})

export async function GET(req: NextRequest) {
  const auth = await authorize('schedules', 'read')
  if (!auth.ok) return auth.response

  const { limit, offset } = parsePaging(req)
  let query = auth.supabase.from('schedules').select('*, routes(*)')

  // Schedules have no tenant_id; scope through the parent route's tenant.
  if (auth.role !== 'super_admin') {
    const { data: routeIds } = await auth.supabase
      .from('routes')
      .select('id')
      .eq('tenant_id', auth.tenantId)
    const ids = (routeIds ?? []).map((r) => r.id)
    query = query.in('route_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const auth = await authorize('schedules', 'write')
  if (!auth.ok) return auth.response

  const body = await req.json()
  const parsed = scheduleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // The parent route must belong to the caller's tenant.
  if (auth.role !== 'super_admin') {
    const { data: route } = await auth.supabase
      .from('routes')
      .select('id')
      .eq('id', parsed.data.route_id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!route) {
      return NextResponse.json({ error: 'Route not found in your tenant' }, { status: 404 })
    }
  }

  const { data, error } = await auth.supabase
    .from('schedules')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
