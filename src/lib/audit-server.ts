import type { SupabaseClient } from '@supabase/supabase-js'

type AuthOk = {
  supabase: SupabaseClient
  userId: string
  role: string
  tenantId: string
}

/**
 * Writes an audit_logs row for a sensitive operation (Constitution VI).
 *
 * Deliberately never throws: a failed audit write must not roll back or break
 * the business operation it is recording. Failures are logged for follow-up.
 */
export async function logAudit(
  auth: AuthOk,
  action: string,
  entityType: string,
  entityId: string,
  oldValue: unknown = null,
  newValue: unknown = null
): Promise<void> {
  if (!auth.tenantId) return

  const { error } = await auth.supabase.from('audit_logs').insert({
    tenant_id: auth.tenantId,
    actor_id: auth.userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    old_value: oldValue,
    new_value: newValue,
  })

  if (error) {
    console.error(`[audit] failed to log ${action} on ${entityType}/${entityId}:`, error.message)
  }
}
