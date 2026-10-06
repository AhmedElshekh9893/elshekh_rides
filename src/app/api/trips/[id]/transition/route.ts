import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const transitionSchema = z.object({
  action: z.enum(['publish', 'assign', 'confirm', 'start', 'complete', 'cancel', 'fail']),
})

const validTransitions: Record<string, string[]> = {
  draft: ['scheduled', 'cancelled'],
  scheduled: ['assigned', 'cancelled'],
  assigned: ['ready', 'cancelled', 'failed'],
  ready: ['in_progress', 'cancelled', 'failed'],
  in_progress: ['completed', 'failed'],
  completed: [],
  cancelled: [],
  no_show: [],
  failed: [],
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const parsed = transitionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: trip, error: fetchError } = await supabase.from('trips').select('*').eq('id', id).single()
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

  const currentStatus = trip.status
  const nextStatus = parsed.data.action === 'publish' ? 'scheduled'
    : parsed.data.action === 'assign' ? 'assigned'
    : parsed.data.action === 'confirm' ? 'ready'
    : parsed.data.action === 'start' ? 'in_progress'
    : parsed.data.action === 'complete' ? 'completed'
    : parsed.data.action === 'cancel' ? 'cancelled'
    : 'failed'

  if (!validTransitions[currentStatus]?.includes(nextStatus)) {
    return NextResponse.json({ error: `Invalid transition: ${currentStatus} → ${nextStatus}` }, { status: 400 })
  }

  const updates: Record<string, unknown> = { status: nextStatus }
  if (nextStatus === 'in_progress') updates.started_at = new Date().toISOString()
  if (nextStatus === 'completed') updates.completed_at = new Date().toISOString()

  const { data, error } = await supabase.from('trips').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
