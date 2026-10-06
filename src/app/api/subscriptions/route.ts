import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authorize, parsePaging } from '@/lib/api-auth'

const subscriptionSchema = z.object({
  employee_id: z.string().uuid(),
  route_id: z.string().uuid(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  price: z.number().positive(),
  status: z.enum(['active', 'expired', 'cancelled']).default('active'),
})

export async function GET(req: NextRequest) {
  const auth = await authorize('subscriptions', 'read')
  if (!auth.ok) return auth.response

  const { limit, offset } = parsePaging(req)
  let query = auth.supabase
    .from('subscriptions')
    .select('*, employees(*), routes(*)')

  if (auth.role !== 'super_admin') {
    query = query.eq('tenant_id', auth.tenantId)
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const auth = await authorize('subscriptions', 'write')
  if (!auth.ok) return auth.response

  const body = await req.json()
  const parsed = subscriptionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await auth.supabase
    .from('subscriptions')
    .insert({ ...parsed.data, tenant_id: auth.tenantId, })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
