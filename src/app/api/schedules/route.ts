import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const scheduleSchema = z.object({
  route_id: z.string().uuid(),
  days: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])).min(1),
  departure_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  return_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
})

export async function GET() {
  const { data, error } = await supabase.from('schedules').select('*, routes(*)')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = scheduleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase.from('schedules').insert(parsed.data).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
