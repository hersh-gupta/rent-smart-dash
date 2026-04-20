import { describe, expect, it } from 'vitest'
import { RECENT_DAYS, isRecent, countRecent } from '../src/lib/recency'

const NOW = new Date('2026-04-20T12:00:00')

describe('recency', () => {
  it(`flags dates within the last ${RECENT_DAYS} days`, () => {
    expect(isRecent('2026-04-10', NOW)).toBe(true)
    expect(isRecent('2026-04-10T09:00:00', NOW)).toBe(true)
  })

  it('rejects older dates, bad input, and empties', () => {
    expect(isRecent('2025-01-01', NOW)).toBe(false)
    expect(isRecent('', NOW)).toBe(false)
    expect(isRecent(null, NOW)).toBe(false)
    expect(isRecent(undefined, NOW)).toBe(false)
  })

  it('countRecent tallies items with a recent date', () => {
    const items = [
      { date: '2026-04-19' },
      { date: '2025-12-01' },
      { date: '' },
      { date: '2026-02-10' },
    ]
    expect(countRecent(items, NOW)).toBe(2)
  })
})
