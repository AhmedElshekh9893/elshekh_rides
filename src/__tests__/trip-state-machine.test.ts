import { describe, it, expect } from 'vitest'
import { canTransition, getNextStatuses, TripStatus } from '../lib/trip-state-machine'

describe('Trip State Machine', () => {
  describe('valid transitions', () => {
    it('should allow draft → scheduled', () => {
      expect(canTransition('draft', 'scheduled')).toBe(true)
    })

    it('should allow scheduled → assigned', () => {
      expect(canTransition('scheduled', 'assigned')).toBe(true)
    })

    it('should allow assigned → ready', () => {
      expect(canTransition('assigned', 'ready')).toBe(true)
    })

    it('should allow ready → in_progress', () => {
      expect(canTransition('ready', 'in_progress')).toBe(true)
    })

    it('should allow in_progress → completed', () => {
      expect(canTransition('in_progress', 'completed')).toBe(true)
    })

    it('should allow scheduled → cancelled', () => {
      expect(canTransition('scheduled', 'cancelled')).toBe(true)
    })

    it('should allow assigned → cancelled', () => {
      expect(canTransition('assigned', 'cancelled')).toBe(true)
    })

    it('should allow ready → cancelled', () => {
      expect(canTransition('ready', 'cancelled')).toBe(true)
    })

    it('should allow assigned → failed', () => {
      expect(canTransition('assigned', 'failed')).toBe(true)
    })

    it('should allow ready → failed', () => {
      expect(canTransition('ready', 'failed')).toBe(true)
    })

    it('should allow in_progress → failed', () => {
      expect(canTransition('in_progress', 'failed')).toBe(true)
    })
  })

  describe('invalid transitions', () => {
    it('should NOT allow scheduled → completed', () => {
      expect(canTransition('scheduled', 'completed')).toBe(false)
    })

    it('should NOT allow completed → in_progress', () => {
      expect(canTransition('completed', 'in_progress')).toBe(false)
    })

    it('should NOT allow completed → cancelled', () => {
      expect(canTransition('completed', 'cancelled')).toBe(false)
    })

    it('should NOT allow cancelled → in_progress', () => {
      expect(canTransition('cancelled', 'in_progress')).toBe(false)
    })

    it('should NOT allow draft → in_progress', () => {
      expect(canTransition('draft', 'in_progress')).toBe(false)
    })

    it('should NOT allow no_show → completed', () => {
      expect(canTransition('no_show', 'completed')).toBe(false)
    })
  })

  describe('getNextStatuses', () => {
    it('should return correct next statuses for draft', () => {
      expect(getNextStatuses('draft')).toEqual(['scheduled', 'cancelled'])
    })

    it('should return correct next statuses for scheduled', () => {
      expect(getNextStatuses('scheduled')).toEqual(['assigned', 'cancelled'])
    })

    it('should return empty array for completed', () => {
      expect(getNextStatuses('completed')).toEqual([])
    })

    it('should return empty array for cancelled', () => {
      expect(getNextStatuses('cancelled')).toEqual([])
    })
  })
})
