import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const employeeSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
})

export async function GET() {
  const { data, error } = await supabase.from('employees').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = employeeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = user.user_metadata.tenant_id
  if (!tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 400 })

  const { data, error } = await supabase.from('employees').insert({ ...parsed.data, tenant_id: tenantId }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
