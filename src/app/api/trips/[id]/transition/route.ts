import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authorize } from '@/lib/api-auth'
import { logAudit } from '@/lib/audit-server'
import {
  canPerformAction,
  resolveTransition,
  TRIP_ACTIONS,
  type TripStatus,
} from '@/lib/trip-state-machine'

const transitionSchema = z.object({
  action: z.enum(TRIP_ACTIONS as [string, ...string[]]),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize('trips', 'write')
  if (!auth.ok) return auth.response

  const { id } = await params
  const body = await req.json()
  const parsed = transitionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const action = parsed.data.action as (typeof TRIP_ACTIONS)[number]

  // Role gate: drivers may only execute, never dispatch.
  if (!canPerformAction(action, auth.role)) {
    return NextResponse.json(
      { error: `Forbidden: role '${auth.role}' cannot perform '${action}'` },
      { status: 403 }
    )
  }

  let fetch = auth.supabase.from('trips').select('*').eq('id', id)
  if (auth.role === 'driver') {
    fetch = fetch.eq('driver_id', auth.userId)
  } else if (auth.role !== 'super_admin') {
    fetch = fetch.eq('tenant_id', auth.tenantId)
  }

  const { data: trip, error: fetchError } = await fetch.single()
  if (fetchError || !trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  const currentStatus = trip.status as TripStatus

  // Single source of truth: the shared state machine.
  const nextStatus = resolveTransition(currentStatus, action)
  if (!nextStatus) {
    return NextResponse.json(
      { error: `Invalid transition: ${currentStatus} -> ${action}` },
      { status: 400 }
    )
  }

  const updates: Record<string, unknown> = { status: nextStatus }
  if (nextStatus === 'in_progress') updates.started_at = new Date().toISOString()
  if (nextStatus === 'completed') updates.completed_at = new Date().toISOString()

  let update = auth.supabase.from('trips').update(updates).eq('id', id)
  if (auth.role !== 'super_admin') update = update.eq('tenant_id', auth.tenantId)

  const { data, error } = await update.select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Constitution VI: every state transition leaves an audit trail.
  await logAudit(auth, `trip_${action}`, 'trip', id, trip, data)

  return NextResponse.json(data)
}
