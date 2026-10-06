import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/supabase-server'

export async function GET() {
  const auth = await getAuthContext()
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    id: auth.userId,
    email: auth.email,
    role: auth.role,
    tenantId: auth.tenantId,
  })
}
