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
