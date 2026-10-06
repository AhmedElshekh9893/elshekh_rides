import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authorize, parsePaging } from '@/lib/api-auth'

const expenseSchema = z.object({
  category: z.enum(['fuel', 'maintenance', 'salary', 'other']),
  amount: z.number().positive(),
  description: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

/**
 * Expenses are stored as audit_logs rows with entity_type='expense' until a
 * dedicated table exists (see convergence task T075).
 */
export async function GET(req: NextRequest) {
  const auth = await authorize('expenses', 'read')
  if (!auth.ok) return auth.response

  const { limit, offset } = parsePaging(req)
  let query = auth.supabase
    .from('audit_logs')
    .select('*')
    .eq('entity_type', 'expense')

  if (auth.role !== 'super_admin') {
    query = query.eq('tenant_id', auth.tenantId)
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const auth = await authorize('expenses', 'write')
  if (!auth.ok) return auth.response

  const body = await req.json()
  const parsed = expenseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await auth.supabase
    .from('audit_logs')
    .insert({
      tenant_id: auth.tenantId,
      actor_id: auth.userId,
      action: 'expense_created',
      entity_type: 'expense',
      entity_id: crypto.randomUUID(),
      new_value: parsed.data,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
