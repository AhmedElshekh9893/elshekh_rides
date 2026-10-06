import { NextResponse } from 'next/server'
import { getAuthContext } from './supabase-server'

export type Role =
  | 'super_admin'
  | 'operations_manager'
  | 'dispatcher'
  | 'fleet_manager'
  | 'finance'
  | 'support'
  | 'company_admin'
  | 'driver'
  | 'customer'

/**
 * Which roles may reach each resource, and whether they may write.
 * Read = GET. Write = POST/PATCH/DELETE.
 *
 * `super_admin` is implicitly allowed everywhere (see isAllowed).
 */
export const PERMISSIONS: Record<string, { read: Role[]; write: Role[] }> = {
  tenants: {
    read: ['company_admin'],
    write: [],
  },
  users: {
    read: ['company_admin', 'operations_manager'],
    write: ['company_admin'],
  },
  employees: {
    read: ['company_admin', 'operations_manager', 'dispatcher', 'support'],
    write: ['company_admin', 'operations_manager'],
  },
  subscriptions: {
    read: ['company_admin', 'operations_manager', 'finance'],
    write: ['company_admin', 'operations_manager', 'finance'],
  },
  routes: {
    read: ['operations_manager', 'dispatcher', 'fleet_manager'],
    write: ['operations_manager', 'fleet_manager'],
  },
  schedules: {
    read: ['operations_manager', 'dispatcher'],
    write: ['operations_manager'],
  },
  trips: {
    read: ['operations_manager', 'dispatcher', 'fleet_manager', 'support', 'driver', 'customer'],
    write: ['operations_manager', 'dispatcher'],
  },
  vehicles: {
    read: ['operations_manager', 'dispatcher', 'fleet_manager'],
    write: ['fleet_manager', 'operations_manager'],
  },
  incidents: {
    read: ['operations_manager', 'dispatcher', 'support', 'driver'],
    write: ['operations_manager', 'dispatcher', 'support', 'driver'],
  },
  invoices: {
    read: ['operations_manager', 'finance', 'company_admin'],
    write: ['finance', 'operations_manager'],
  },
  expenses: {
    read: ['finance', 'operations_manager'],
    write: ['finance'],
  },
}

export type AuthResult =
  | {
      ok: true
      supabase: Awaited<ReturnType<typeof getAuthContext>> extends infer T
        ? T extends { supabase: infer S }
          ? S
          : never
        : never
      userId: string
      role: Role
      tenantId: string
    }
  | { ok: false; response: NextResponse }

/**
 * Authenticate + authorize a request for a resource.
 *
 * Returns 401 when unauthenticated, 403 when the role lacks the permission,
 * and 400 when the caller has no tenant (except super_admin, who is global).
 */
export async function authorize(
  resource: keyof typeof PERMISSIONS,
  mode: 'read' | 'write'
): Promise<AuthResult> {
  const auth = await getAuthContext()
  if (!auth) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const role = auth.role as Role
  if (!isAllowed(resource, mode, role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Forbidden: role '${role || 'unknown'}' cannot ${mode} ${resource}` },
        { status: 403 }
      ),
    }
  }

  // super_admin is cross-tenant and does not need a tenant_id.
  if (!auth.tenantId && role !== 'super_admin') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'No tenant' }, { status: 400 }),
    }
  }

  return {
    ok: true,
    supabase: auth.supabase,
    userId: auth.userId,
    role,
    tenantId: auth.tenantId,
  }
}

export function isAllowed(
  resource: keyof typeof PERMISSIONS,
  mode: 'read' | 'write',
  role: Role
): boolean {
  const rules = PERMISSIONS[resource]
  // Unknown resource is a programming error: fail closed for everyone,
  // including super_admin, so a typo can never silently grant access.
  if (!rules) return false
  if (role === 'super_admin') return true
  return rules[mode].includes(role)
}

/** Standard pagination guard (Constitution XIII — free-tier conscious). */
export function parsePaging(req: Request, defaultLimit = 50, maxLimit = 200) {
  const { searchParams } = new URL(req.url)
  const rawLimit = Number(searchParams.get('limit'))
  const rawOffset = Number(searchParams.get('offset'))
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, maxLimit) : defaultLimit
  const offset = Number.isFinite(rawOffset) && rawOffset > 0 ? rawOffset : 0
  return { limit, offset }
}
