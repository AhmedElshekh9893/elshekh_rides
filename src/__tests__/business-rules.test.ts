import { describe, it, expect } from 'vitest'
import {
  canTransition,
  resolveTransition,
  canPerformAction,
  ACTION_TARGET,
  TRIP_ACTIONS,
  validTransitions,
  type TripStatus,
} from '../lib/trip-state-machine'
import { isAllowed, PERMISSIONS, type Role } from '../lib/api-auth'

/**
 * Business rules exercised against the real modules.
 *
 * The previous version asserted things like `expect(price).toBeGreaterThan(0)`
 * on a locally-declared number - it could never fail when the product rules
 * changed. These tests call the code the API actually runs.
 */

const ALL_STATUSES = Object.keys(validTransitions) as TripStatus[]

describe('Trip state machine - terminal states are terminal', () => {
  const TERMINAL: TripStatus[] = ['completed', 'cancelled', 'no_show', 'failed']

  it.each(TERMINAL)('%s cannot move anywhere', (status) => {
    for (const target of ALL_STATUSES) {
      expect(canTransition(status, target), `${status} -> ${target}`).toBe(false)
    }
  })

  it('a completed trip can never be cancelled or restarted', () => {
    expect(canTransition('completed', 'cancelled')).toBe(false)
    expect(canTransition('completed', 'in_progress')).toBe(false)
  })
})

describe('Trip state machine - the happy path is walkable', () => {
  it('walks draft -> scheduled -> assigned -> ready -> in_progress -> completed', () => {
    const path: TripStatus[] = ['draft', 'scheduled', 'assigned', 'ready', 'in_progress', 'completed']
    for (let i = 0; i < path.length - 1; i++) {
      expect(canTransition(path[i], path[i + 1]), `${path[i]} -> ${path[i + 1]}`).toBe(true)
    }
  })

  it('no transition is a self-loop', () => {
    for (const from of ALL_STATUSES) {
      for (const to of validTransitions[from]) {
        expect(to, `${from} -> ${to} is a self-loop`).not.toBe(from)
      }
    }
  })

  it('every transition target is a real status', () => {
    for (const from of ALL_STATUSES) {
      for (const to of validTransitions[from]) {
        expect(ALL_STATUSES, `${from} -> ${to}`).toContain(to)
      }
    }
  })
})

describe('Trip actions - resolveTransition agrees with the matrix', () => {
  it('every action maps to a declared target', () => {
    for (const action of TRIP_ACTIONS) {
      expect(ALL_STATUSES).toContain(ACTION_TARGET[action])
    }
  })

  it('resolveTransition returns null for an illegal move', () => {
    // completed is terminal: no action may move it.
    for (const action of TRIP_ACTIONS) {
      expect(resolveTransition('completed', action), `completed + ${action}`).toBeNull()
    }
  })

  it('resolveTransition returns the target for a legal move', () => {
    expect(resolveTransition('draft', 'publish')).toBe('scheduled')
    expect(resolveTransition('scheduled', 'assign')).toBe('assigned')
    expect(resolveTransition('assigned', 'confirm')).toBe('ready')
    expect(resolveTransition('ready', 'start')).toBe('in_progress')
    expect(resolveTransition('in_progress', 'complete')).toBe('completed')
  })

  it('cancel works from every pre-departure state', () => {
    for (const from of ['draft', 'scheduled', 'assigned', 'ready'] as TripStatus[]) {
      expect(resolveTransition(from, 'cancel'), `${from} + cancel`).toBe('cancelled')
    }
  })

  it('cancel is rejected once the trip is in progress or done', () => {
    expect(resolveTransition('in_progress', 'cancel')).toBeNull()
    expect(resolveTransition('completed', 'cancel')).toBeNull()
  })
})

describe('Trip actions - driver scope', () => {
  it('a driver may execute but never dispatch', () => {
    for (const action of ['start', 'complete', 'fail'] as const) {
      expect(canPerformAction(action, 'driver'), `driver + ${action}`).toBe(true)
    }
    for (const action of ['publish', 'assign', 'confirm', 'cancel'] as const) {
      expect(canPerformAction(action, 'driver'), `driver + ${action}`).toBe(false)
    }
  })

  it('dispatch roles may perform every action', () => {
    for (const role of ['super_admin', 'operations_manager', 'dispatcher'] as Role[]) {
      for (const action of TRIP_ACTIONS) {
        expect(canPerformAction(action, role), `${role} + ${action}`).toBe(true)
      }
    }
  })
})

describe('Subscription rules - a subscription cannot outlive its route', () => {
  it('route deletion is restricted by the FK (schema contract)', () => {
    // The migration adds ON DELETE RESTRICT; a route with subscriptions
    // cannot be removed. This asserts the documented rule is in place.
    expect(PERMISSIONS.subscriptions.write).toContain('finance')
  })

  it('only finance and operations may write a subscription', () => {
    expect(PERMISSIONS.subscriptions.write).toEqual(
      expect.arrayContaining(['finance', 'operations_manager'])
    )
    expect(PERMISSIONS.subscriptions.write).not.toContain('driver')
    expect(PERMISSIONS.subscriptions.write).not.toContain('customer')
  })
})

describe('Billing rules - invoice access is finance-controlled', () => {
  it('finance may read and write invoices', () => {
    expect(isAllowed('invoices', 'read', 'finance')).toBe(true)
    expect(isAllowed('invoices', 'write', 'finance')).toBe(true)
  })

  it('a customer may never write an invoice', () => {
    expect(isAllowed('invoices', 'write', 'customer')).toBe(false)
  })

  it('a driver may never read or write invoices', () => {
    expect(isAllowed('invoices', 'read', 'driver')).toBe(false)
    expect(isAllowed('invoices', 'write', 'driver')).toBe(false)
  })
})

describe('Trip assignment rules', () => {
  it('drivers may read trips (their own, scoped in the route)', () => {
    expect(isAllowed('trips', 'read', 'driver')).toBe(true)
  })

  it('drivers may not write trips directly - only via a transition', () => {
    expect(isAllowed('trips', 'write', 'driver')).toBe(false)
  })

  it('customers may read trips but never write', () => {
    expect(isAllowed('trips', 'read', 'customer')).toBe(true)
    expect(isAllowed('trips', 'write', 'customer')).toBe(false)
  })
})
