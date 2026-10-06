export type TripStatus = 'draft' | 'scheduled' | 'assigned' | 'ready' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'failed'

export const validTransitions: Record<TripStatus, TripStatus[]> = {
  draft: ['scheduled', 'cancelled'],
  scheduled: ['assigned', 'cancelled'],
  assigned: ['ready', 'cancelled', 'failed'],
  ready: ['in_progress', 'cancelled', 'failed'],
  in_progress: ['completed', 'failed'],
  completed: [],
  cancelled: [],
  no_show: [],
  failed: [],
}

export function canTransition(from: TripStatus, to: TripStatus): boolean {
  return validTransitions[from]?.includes(to) ?? false
}

export function getNextStatuses(currentStatus: TripStatus): TripStatus[] {
  return validTransitions[currentStatus] || []
}

/** The actions a user may request on a trip. */
export type TripAction = 'publish' | 'assign' | 'confirm' | 'start' | 'complete' | 'cancel' | 'fail'

export const TRIP_ACTIONS: TripAction[] = [
  'publish',
  'assign',
  'confirm',
  'start',
  'complete',
  'cancel',
  'fail',
]

/** Maps a user-facing action onto the status it produces. */
export const ACTION_TARGET: Record<TripAction, TripStatus> = {
  publish: 'scheduled',
  assign: 'assigned',
  confirm: 'ready',
  start: 'in_progress',
  complete: 'completed',
  cancel: 'cancelled',
  fail: 'failed',
}

/**
 * Drivers execute trips; they do not dispatch them. Letting a driver publish,
 * assign or cancel would bypass the dispatcher's control of the schedule.
 */
export const DRIVER_ALLOWED_ACTIONS: ReadonlySet<TripAction> = new Set([
  'start',
  'complete',
  'fail',
])

export function canPerformAction(action: TripAction, role: string): boolean {
  if (role === 'driver') return DRIVER_ALLOWED_ACTIONS.has(action)
  return true
}

/**
 * Resolves an action against a current status.
 * Returns the target status, or null when the transition is not allowed.
 */
export function resolveTransition(current: TripStatus, action: TripAction): TripStatus | null {
  const target = ACTION_TARGET[action]
  return canTransition(current, target) ? target : null
}

