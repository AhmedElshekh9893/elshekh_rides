import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authorize, parsePaging } from '@/lib/api-auth'

const tenantSchema = z.object({
  name: z.string().min(1),
  status: z.enum(['active', 'suspended']).default('active'),
})

export async function GET(req: NextRequest) {
  const auth = await authorize('tenants', 'read')
  if (!auth.ok) return auth.response

  const { limit, offset } = parsePaging(req)
  let query = auth.supabase
    .from('tenants')
    .select('*')

  // tenants has no tenant_id column — scope by primary key for non-super-admins.
  if (auth.role !== 'super_admin') {
    query = query.eq('id', auth.tenantId)
  }

  query = query.order('name').range(offset, offset + limit - 1)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const auth = await authorize('tenants', 'write')
  if (!auth.ok) return auth.response

  const body = await req.json()
  const parsed = tenantSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await auth.supabase
    .from('tenants')
    .insert({ ...parsed.data, })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
