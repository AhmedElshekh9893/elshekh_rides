import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authorize, parsePaging } from '@/lib/api-auth'

const vehicleSchema = z.object({
  plate: z.string().min(1),
  type: z.string().min(1),
  capacity: z.number().int().positive(),
  status: z.enum(['available', 'in_use', 'maintenance', 'retired']).default('available'),
})

export async function GET(req: NextRequest) {
  const auth = await authorize('vehicles', 'read')
  if (!auth.ok) return auth.response

  const { limit, offset } = parsePaging(req)
  let query = auth.supabase
    .from('vehicles')
    .select('*')
  if (auth.role !== 'super_admin') {
    query = query.eq('tenant_id', auth.tenantId)
  }
  query = query.order('plate')
    .range(offset, offset + limit - 1)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const auth = await authorize('vehicles', 'write')
  if (!auth.ok) return auth.response

  const body = await req.json()
  const parsed = vehicleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await auth.supabase
    .from('vehicles')
    .insert({ ...parsed.data, tenant_id: auth.tenantId, })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
