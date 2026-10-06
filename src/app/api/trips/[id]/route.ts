import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authorize } from '@/lib/api-auth'
import { logAudit } from '@/lib/audit-server'

/**
 * Status is deliberately NOT editable here. It may only change through the
 * state machine (/api/trips/[id]/transition) so every transition is validated
 * against validTransitions and recorded in the audit log.
 */
const updateSchema = z.object({
  driver_id: z.string().uuid().nullable().optional(),
  vehicle_id: z.string().uuid().nullable().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize('trips', 'read')
  if (!auth.ok) return auth.response

  const { id } = await params
  let query = auth.supabase.from('trips').select('*, routes(*), drivers:users(*), vehicles(*)').eq('id', id)

  if (auth.role === 'driver') {
    query = query.eq('driver_id', auth.userId)
  } else if (auth.role !== 'super_admin') {
    query = query.eq('tenant_id', auth.tenantId)
  }

  const { data, error } = await query.single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize('trips', 'write')
  if (!auth.ok) return auth.response

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  let fetch = auth.supabase.from('trips').select('*').eq('id', id)
  if (auth.role !== 'super_admin') fetch = fetch.eq('tenant_id', auth.tenantId)

  const { data: before, error: fetchError } = await fetch.single()
  if (fetchError || !before) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  let query = auth.supabase.from('trips').update(parsed.data).eq('id', id)
  if (auth.role !== 'super_admin') query = query.eq('tenant_id', auth.tenantId)

  const { data, error } = await query.select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  await logAudit(auth, 'trip_assignment_updated', 'trip', id, before, data)

  return NextResponse.json(data)
}

/**
 * Constitution VII - no hard delete. The trip is cancelled instead, preserving
 * the operational and billing history.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize('trips', 'write')
  if (!auth.ok) return auth.response

  const { id } = await params
  let fetch = auth.supabase.from('trips').select('*').eq('id', id)
  if (auth.role !== 'super_admin') fetch = fetch.eq('tenant_id', auth.tenantId)

  const { data: before, error: fetchError } = await fetch.single()
  if (fetchError || !before) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  let query = auth.supabase.from('trips').update({ status: 'cancelled' }).eq('id', id)
  if (auth.role !== 'super_admin') query = query.eq('tenant_id', auth.tenantId)

  const { data, error } = await query.select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  await logAudit(auth, 'trip_cancelled', 'trip', id, before, data)

  return NextResponse.json({ success: true, status: data.status })
}
