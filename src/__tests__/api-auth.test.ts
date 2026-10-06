import { describe, it, expect } from 'vitest'
import { isAllowed, parsePaging, PERMISSIONS, type Role } from '../lib/api-auth'

/**
 * These tests exercise the real authorization module (not literals).
 * A regression in the permission matrix must fail here — this is the only
 * automated guard between a refactor and a privilege-escalation bug.
 */

const ALL_ROLES: Role[] = [
  'super_admin',
  'operations_manager',
  'dispatcher',
  'fleet_manager',
  'finance',
  'support',
  'company_admin',
  'driver',
  'customer',
]

describe('isAllowed — super_admin bypass', () => {
  it('grants super_admin every resource in both modes', () => {
    for (const resource of Object.keys(PERMISSIONS)) {
      expect(isAllowed(resource, 'read', 'super_admin')).toBe(true)
      expect(isAllowed(resource, 'write', 'super_admin')).toBe(true)
    }
  })
})

describe('isAllowed — deny by default', () => {
  it('denies unknown resources', () => {
    expect(isAllowed('not_a_resource', 'read', 'operations_manager')).toBe(false)
    expect(isAllowed('not_a_resource', 'write', 'super_admin')).toBe(false)
  })

  it('never lets a customer write anything', () => {
    for (const resource of Object.keys(PERMISSIONS)) {
      expect(isAllowed(resource, 'write', 'customer')).toBe(false)
    }
  })

  it('never lets a driver write trips or invoices directly', () => {
    expect(isAllowed('trips', 'write', 'driver')).toBe(false)
    expect(isAllowed('invoices', 'write', 'driver')).toBe(false)
  })
})

describe('isAllowed — tenant administration is super_admin only', () => {
  it('denies tenant creation to company_admin', () => {
    expect(isAllowed('tenants', 'write', 'company_admin')).toBe(false)
  })

  it('denies tenant reads to operations_manager', () => {
    expect(isAllowed('tenants', 'read', 'operations_manager')).toBe(false)
  })
})

describe('isAllowed — expected grants', () => {
  it('lets company_admin manage employees', () => {
    expect(isAllowed('employees', 'read', 'company_admin')).toBe(true)
    expect(isAllowed('employees', 'write', 'company_admin')).toBe(true)
  })

  it('lets finance write invoices but not routes', () => {
    expect(isAllowed('invoices', 'write', 'finance')).toBe(true)
    expect(isAllowed('routes', 'write', 'finance')).toBe(false)
  })

  it('lets fleet_manager manage vehicles but not invoices', () => {
    expect(isAllowed('vehicles', 'write', 'fleet_manager')).toBe(true)
    expect(isAllowed('invoices', 'write', 'fleet_manager')).toBe(false)
  })

  it('lets support read incidents but not write invoices', () => {
    expect(isAllowed('incidents', 'read', 'support')).toBe(true)
    expect(isAllowed('invoices', 'write', 'support')).toBe(false)
  })
})

describe('PERMISSIONS — matrix integrity', () => {
  it('every resource declares read and write role lists', () => {
    for (const [resource, rules] of Object.entries(PERMISSIONS)) {
      expect(Array.isArray(rules.read), `${resource}.read`).toBe(true)
      expect(Array.isArray(rules.write), `${resource}.write`).toBe(true)
    }
  })

  it('every listed role is a valid role name', () => {
    for (const [resource, rules] of Object.entries(PERMISSIONS)) {
      for (const role of [...rules.read, ...rules.write]) {
        expect(ALL_ROLES, `${resource} lists '${role}'`).toContain(role)
      }
    }
  })

  it('no non-super_admin role can write tenants', () => {
    const writers = PERMISSIONS.tenants.write
    expect(writers).toEqual([])
  })
})

describe('parsePaging', () => {
  const req = (qs: string) => new Request(`http://localhost/api/x${qs}`)

  it('applies the default limit when absent', () => {
    expect(parsePaging(req(''))).toEqual({ limit: 50, offset: 0 })
  })

  it('reads an explicit limit and offset', () => {
    expect(parsePaging(req('?limit=10&offset=25'))).toEqual({ limit: 10, offset: 25 })
  })

  it('clamps the limit to maxLimit', () => {
    expect(parsePaging(req('?limit=9999')).limit).toBe(200)
  })

  it('honours a custom default and max', () => {
    expect(parsePaging(req(''), 10, 20)).toEqual({ limit: 10, offset: 0 })
    expect(parsePaging(req('?limit=500'), 10, 20).limit).toBe(20)
  })

  it('falls back to defaults on garbage input', () => {
    expect(parsePaging(req('?limit=abc&offset=xyz'))).toEqual({ limit: 50, offset: 0 })
  })

  it('rejects negative and zero values', () => {
    expect(parsePaging(req('?limit=-5&offset=-1'))).toEqual({ limit: 50, offset: 0 })
    expect(parsePaging(req('?limit=0')).limit).toBe(50)
  })
})
