import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authorize } from '@/lib/api-auth'

const employeeUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize('employees', 'read')
  if (!auth.ok) return auth.response

  const { id } = await params
  let query = auth.supabase.from('employees').select('*').eq('id', id)
  if (auth.role !== 'super_admin') query = query.eq('tenant_id', auth.tenantId)

  const { data, error } = await query.single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize('employees', 'write')
  if (!auth.ok) return auth.response

  const { id } = await params
  const body = await req.json()
  const parsed = employeeUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  let query = auth.supabase.from('employees').update(parsed.data).eq('id', id)
  if (auth.role !== 'super_admin') query = query.eq('tenant_id', auth.tenantId)

  const { data, error } = await query.select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

/**
 * Constitution VII — no hard delete. Records are deactivated instead, so
 * history, reports, and audit references stay intact.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize('employees', 'write')
  if (!auth.ok) return auth.response

  const { id } = await params
  let query = auth.supabase.from('employees').update({ status: 'inactive' }).eq('id', id)
  if (auth.role !== 'super_admin') query = query.eq('tenant_id', auth.tenantId)

  const { data, error } = await query.select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ success: true, deactivated: data.id })
}
