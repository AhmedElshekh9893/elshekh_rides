import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authorize } from '@/lib/api-auth'

const scheduleUpdateSchema = z.object({
  days: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])).optional(),
  departure_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  return_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  status: z.enum(['active', 'inactive']).optional(),
})

/** Schedules are scoped through their parent route's tenant. */
async function scopedRouteIds(
  auth: Extract<Awaited<ReturnType<typeof authorize>>, { ok: true }>
) {
  const { data: routeIds } = await auth.supabase
    .from('routes')
    .select('id')
    .eq('tenant_id', auth.tenantId)

  return (routeIds ?? []).map((r) => r.id)
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize('schedules', 'read')
  if (!auth.ok) return auth.response

  const { id } = await params
  let query = auth.supabase.from('schedules').select('*, routes(*)').eq('id', id)

  if (auth.role !== 'super_admin') {
    const ids = await scopedRouteIds(auth)
    query = query.in('route_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
  }

  const { data, error } = await query.single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize('schedules', 'write')
  if (!auth.ok) return auth.response

  const { id } = await params
  const body = await req.json()
  const parsed = scheduleUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await auth.supabase
    .from('schedules')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

/**
 * Constitution VII — no hard delete. The schedule is deactivated instead so
 * generated trips keep their schedule reference.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize('schedules', 'write')
  if (!auth.ok) return auth.response

  const { id } = await params
  const { data, error } = await auth.supabase
    .from('schedules')
    .update({ status: 'inactive' })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ success: true, status: data.status })
}
