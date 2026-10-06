import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authorize, parsePaging } from '@/lib/api-auth'
import { logAudit } from '@/lib/audit-server'

const tripSchema = z.object({
  route_id: z.string().uuid(),
  schedule_id: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  driver_id: z.string().uuid().optional(),
  vehicle_id: z.string().uuid().optional(),
})

export async function GET(req: NextRequest) {
  const auth = await authorize('trips', 'read')
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const status = searchParams.get('status')
  const { limit, offset } = parsePaging(req)

  let query = auth.supabase
    .from('trips')
    .select('*, routes(*), drivers:users(*), vehicles(*)')

  // Drivers and customers only see trips assigned to them.
  if (auth.role === 'driver') {
    query = query.eq('driver_id', auth.userId)
  } else if (auth.role === 'customer') {
    query = query.eq('tenant_id', auth.tenantId)
  } else if (auth.role !== 'super_admin') {
    query = query.eq('tenant_id', auth.tenantId)
  }

  if (date) query = query.eq('date', date)
  if (status) query = query.eq('status', status)

  query = query.order('date', { ascending: false }).range(offset, offset + limit - 1)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const auth = await authorize('trips', 'write')
  if (!auth.ok) return auth.response

  const body = await req.json()
  const parsed = tripSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await auth.supabase
    .from('trips')
    .insert({ ...parsed.data, tenant_id: auth.tenantId, status: 'scheduled' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit(auth, 'trip_created', 'trip', data.id, null, data)

  return NextResponse.json(data, { status: 201 })
}
