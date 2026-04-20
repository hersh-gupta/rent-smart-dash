// "Recent" window for surfacing active problems. Change here = change everywhere
// (keep in sync with RECENT_DAYS in scripts/fetch-rentsmart.mjs).
export const RECENT_DAYS = 90

function cutoffISO(now) {
  const d = new Date(now)
  d.setDate(d.getDate() - RECENT_DAYS)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function isRecent(isoDate, now = new Date()) {
  if (typeof isoDate !== 'string' || !isoDate) return false
  return isoDate.slice(0, 10) >= cutoffISO(now)
}

export function countRecent(items, now = new Date()) {
  const cutoff = cutoffISO(now)
  let n = 0
  for (const item of items) {
    const d = item?.date
    if (typeof d === 'string' && d.slice(0, 10) >= cutoff) n++
  }
  return n
}
