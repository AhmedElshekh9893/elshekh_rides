import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    role: user.user_metadata.role,
    tenantId: user.user_metadata.tenant_id,
    name: user.user_metadata.name,
  })
}
