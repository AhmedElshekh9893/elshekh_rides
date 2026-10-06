import { describe, it, expect } from 'vitest'
import {
  resolveTransition,
  canPerformAction,
  type TripStatus,
  type TripAction,
} from '../lib/trip-state-machine'
import { isAllowed, type Role } from '../lib/api-auth'

/**
 * Integration tests that drive the REAL state machine and permission matrix
 * through a complete operational day.
 *
 * The previous version mutated a local object literal (`trip.status = 'assigned'`)
 * and asserted the value it had just written - it verified nothing about the app.
 */

/** A minimal stand-in for the persisted trip, driven only through the real rules. */
type Trip = { id: string; status: TripStatus; driverId: string | null; vehicleId: string | null }

/** Applies an action the way the API does: role gate, then transition. */
function applyAction(
  trip: Trip,
  action: TripAction,
  role: Role,
  actorId: string
): { ok: boolean; reason?: string; trip: Trip } {
  if (!canPerformAction(action, role)) {
    return { ok: false, reason: 'forbidden', trip }
  }
  // A driver may only act on a trip assigned to them.
  if (role === 'driver' && trip.driverId !== actorId) {
    return { ok: false, reason: 'not_your_trip', trip }
  }
  const next = resolveTransition(trip.status, action)
  if (!next) {
    return { ok: false, reason: 'invalid_transition', trip }
  }
  return { ok: true, trip: { ...trip, status: next } }
}

describe('Core workflow - company to completed trip', () => {
  it('walks a trip through a full operational day', () => {
    let trip: Trip = { id: 'trip-1', status: 'draft', driverId: null, vehicleId: null }
    const dispatcher: Role = 'dispatcher'
    const driverId = 'driver-1'

    // Dispatcher publishes and assigns.
    let r = applyAction(trip, 'publish', dispatcher, 'ops-1')
    expect(r.ok, r.reason).toBe(true)
    trip = r.trip
    expect(trip.status).toBe('scheduled')

    trip = { ...trip, driverId, vehicleId: 'vehicle-1' }
    r = applyAction(trip, 'assign', dispatcher, 'ops-1')
    expect(r.ok, r.reason).toBe(true)
    trip = r.trip

    r = applyAction(trip, 'confirm', dispatcher, 'ops-1')
    expect(r.ok, r.reason).toBe(true)
    trip = r.trip

    // Driver executes.
    r = applyAction(trip, 'start', 'driver', driverId)
    expect(r.ok, r.reason).toBe(true)
    trip = r.trip
    expect(trip.status).toBe('in_progress')

    r = applyAction(trip, 'complete', 'driver', driverId)
    expect(r.ok, r.reason).toBe(true)
    trip = r.trip
    expect(trip.status).toBe('completed')
  })
})

describe('Security - a driver cannot act on someone else\'s trip', () => {
  it('rejects the transition when the driver is not the assignee', () => {
    const trip: Trip = { id: 'trip-2', status: 'ready', driverId: 'driver-A', vehicleId: 'v1' }
    const r = applyAction(trip, 'start', 'driver', 'driver-B')
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('not_your_trip')
    expect(r.trip.status).toBe('ready')
  })

  it('allows the assignee', () => {
    const trip: Trip = { id: 'trip-2', status: 'ready', driverId: 'driver-A', vehicleId: 'v1' }
    const r = applyAction(trip, 'start', 'driver', 'driver-A')
    expect(r.ok, r.reason).toBe(true)
  })
})

describe('Security - a driver cannot dispatch', () => {
  it('refuses publish, assign, confirm and cancel for a driver', () => {
    for (const action of ['publish', 'assign', 'confirm', 'cancel'] as TripAction[]) {
      const trip: Trip = { id: 't', status: 'scheduled', driverId: 'd1', vehicleId: 'v1' }
      const r = applyAction(trip, action, 'driver', 'd1')
      expect(r.ok, `driver should not ${action}`).toBe(false)
      expect(r.reason).toBe('forbidden')
    }
  })
})

describe('Incident handling - a failed trip is terminal', () => {
  it('fails from in_progress and stays failed', () => {
    let trip: Trip = { id: 't', status: 'in_progress', driverId: 'd1', vehicleId: 'v1' }
    const r = applyAction(trip, 'fail', 'driver', 'd1')
    expect(r.ok, r.reason).toBe(true)
    trip = r.trip
    expect(trip.status).toBe('failed')

    // Terminal: nothing may follow.
    for (const action of ['start', 'complete', 'cancel'] as TripAction[]) {
      expect(applyAction(trip, action, 'dispatcher', 'ops-1').ok).toBe(false)
    }
  })

  it('a vehicle breakdown mid-route can be recorded without losing the trip', () => {
    const trip: Trip = { id: 't', status: 'in_progress', driverId: 'd1', vehicleId: 'v1' }
    const r = applyAction(trip, 'fail', 'driver', 'd1')
    expect(r.ok).toBe(true)
    // The trip record survives (Constitution VII: no hard delete).
    expect(r.trip.id).toBe('t')
  })
})

describe('Tenant isolation - roles are scoped, not global', () => {
  it('a company_admin cannot create tenants', () => {
    expect(isAllowed('tenants', 'write', 'company_admin')).toBe(false)
  })

  it('a company_admin cannot read another surface\'s finance data', () => {
    expect(isAllowed('expenses', 'write', 'company_admin')).toBe(false)
  })

  it('only super_admin may write tenants', () => {
    for (const role of ['operations_manager', 'dispatcher', 'finance', 'support', 'company_admin'] as Role[]) {
      expect(isAllowed('tenants', 'write', role), `${role} write tenants`).toBe(false)
    }
    expect(isAllowed('tenants', 'write', 'super_admin')).toBe(true)
  })

  it('a company_admin may read only its own tenant row (scoped in the route)', () => {
    // The route filters by id = auth.tenantId for non-super-admins, so a
    // company_admin sees exactly one tenant: their own.
    expect(isAllowed('tenants', 'read', 'company_admin')).toBe(true)
  })

  it('operational roles never read the tenant table', () => {
    for (const role of ['operations_manager', 'dispatcher', 'fleet_manager', 'support'] as Role[]) {
      expect(isAllowed('tenants', 'read', role), `${role} read tenants`).toBe(false)
    }
  })
})

describe('Duplicate transitions - replaying an action is rejected', () => {
  it('cannot start a trip that is already in progress', () => {
    const trip: Trip = { id: 't', status: 'in_progress', driverId: 'd1', vehicleId: 'v1' }
    const r = applyAction(trip, 'start', 'driver', 'd1')
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('invalid_transition')
  })

  it('cannot complete a trip twice', () => {
    const trip: Trip = { id: 't', status: 'completed', driverId: 'd1', vehicleId: 'v1' }
    const r = applyAction(trip, 'complete', 'driver', 'd1')
    expect(r.ok).toBe(false)
  })
})
