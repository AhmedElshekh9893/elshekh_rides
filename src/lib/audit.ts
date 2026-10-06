import { supabase } from './supabase'

export async function logAudit(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  oldValue?: Record<string, unknown> | null,
  newValue?: Record<string, unknown> | null
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const tenantId = user.user_metadata.tenant_id
  if (!tenantId) return

  await supabase.from('audit_logs').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    old_value: oldValue,
    new_value: newValue,
  })
}
