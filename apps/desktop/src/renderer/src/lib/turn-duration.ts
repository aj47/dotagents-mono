/**
 * Desktop wrapper for shared per-turn duration accounting plus the renderer-only
 * ticking hook used by live progress views.
 */

import { useEffect, useState } from "react"
export {
  computeTurnDurations,
  formatTurnDuration,
} from "@dotagents/shared/turn-duration"
export type {
  TurnDurationEntry,
  TurnDurationMessage,
  TurnDurationsResult,
} from "@dotagents/shared/turn-duration"

/**
 * React hook returning a wall-clock timestamp that refreshes every
 * `intervalMs` while `enabled` is true. Returns a stable timestamp when
 * disabled so memoized consumers do not re-render unnecessarily.
 */
export function useNowTick(enabled: boolean, intervalMs = 1000): number {
  const [now, setNow] = useState<number>(() => Date.now())

  useEffect(() => {
    if (!enabled) return undefined
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [enabled, intervalMs])

  return now
}
