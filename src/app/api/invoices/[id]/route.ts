import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authorize } from '@/lib/api-auth'

const updateSchema = z.object({
  status: z.enum(['draft', 'issued', 'paid', 'overdue', 'cancelled']).optional(),
  amount: z.number().positive().optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize('invoices', 'read')
  if (!auth.ok) return auth.response

  const { id } = await params
  let query = auth.supabase.from('invoices').select('*, subscriptions(*, employees(*))').eq('id', id)
  if (auth.role !== 'super_admin') query = query.eq('tenant_id', auth.tenantId)

  const { data, error } = await query.single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize('invoices', 'write')
  if (!auth.ok) return auth.response

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  let query = auth.supabase.from('invoices').update(parsed.data).eq('id', id)
  if (auth.role !== 'super_admin') query = query.eq('tenant_id', auth.tenantId)

  const { data, error } = await query.select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

/**
 * Constitution VII — no hard delete. The record is moved to its terminal
 * status instead, preserving history, reports, and audit references.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize('invoices', 'write')
  if (!auth.ok) return auth.response

  const { id } = await params
  let query = auth.supabase.from('invoices').update({ status: 'cancelled' }).eq('id', id)
  if (auth.role !== 'super_admin') query = query.eq('tenant_id', auth.tenantId)

  const { data, error } = await query.select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ success: true, status: data.status })
}
