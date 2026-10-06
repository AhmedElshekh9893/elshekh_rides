import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const tripSchema = z.object({
  route_id: z.string().uuid(),
  schedule_id: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['draft', 'scheduled', 'assigned', 'ready', 'in_progress', 'completed', 'cancelled', 'no_show', 'failed']).default('scheduled'),
  driver_id: z.string().uuid().optional(),
  vehicle_id: z.string().uuid().optional(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const status = searchParams.get('status')

  let query = supabase.from('trips').select('*, routes(*), drivers:users(*), vehicles(*)')

  if (date) query = query.eq('date', date)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = tripSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = user.user_metadata.tenant_id
  if (!tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 400 })

  const { data, error } = await supabase.from('trips').insert({ ...parsed.data, tenant_id: tenantId }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
