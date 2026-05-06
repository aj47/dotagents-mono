import { describe, expect, it } from 'vitest'
import {
  computeTurnDurations,
  formatTurnDuration,
  type TurnDurationMessage,
} from './turn-duration'

describe('computeTurnDurations', () => {
  it('computes completed turn durations from user messages to latest non-user response before the next user message', () => {
    const messages: TurnDurationMessage[] = [
      { role: 'user', timestamp: 1_000 },
      { role: 'assistant', timestamp: 2_000 },
      { role: 'tool', timestamp: 3_000 },
      { role: 'user', timestamp: 5_000 },
      { role: 'assistant', timestamp: 8_000 },
    ]

    const result = computeTurnDurations(messages, true, 10_000)

    expect(result.byUserIndex.get(0)).toEqual({ durationMs: 2_000, isLive: false })
    expect(result.byUserTimestamp.get(1_000)).toEqual({ durationMs: 2_000, isLive: false })
    expect(result.byUserIndex.get(3)).toEqual({ durationMs: 3_000, isLive: false })
    expect(result.totalMs).toBe(5_000)
    expect(result.hasLive).toBe(false)
  })

  it('uses now for the latest turn while the session is still running', () => {
    const result = computeTurnDurations([
      { role: 'user', timestamp: 1_000 },
      { role: 'assistant', timestamp: 2_000, isThinking: true },
    ], false, 6_000)

    expect(result.byUserIndex.get(0)).toEqual({ durationMs: 5_000, isLive: true })
    expect(result.totalMs).toBe(5_000)
    expect(result.hasLive).toBe(true)
  })

  it('ignores thinking placeholders when choosing the completed response timestamp', () => {
    const result = computeTurnDurations([
      { role: 'user', timestamp: 1_000 },
      { role: 'assistant', timestamp: 2_000 },
      { role: 'assistant', timestamp: 4_000, isThinking: true },
      { role: 'user', timestamp: 5_000 },
    ], true, 10_000)

    expect(result.byUserIndex.get(0)).toEqual({ durationMs: 1_000, isLive: false })
  })

  it('falls back to the next user timestamp when a completed turn has no non-thinking response', () => {
    const result = computeTurnDurations([
      { role: 'user', timestamp: 1_000 },
      { role: 'assistant', timestamp: 2_000, isThinking: true },
      { role: 'user', timestamp: 5_000 },
    ], true, 10_000)

    expect(result.byUserIndex.get(0)).toEqual({ durationMs: 4_000, isLive: false })
  })

  it('clamps negative durations to zero', () => {
    const result = computeTurnDurations([
      { role: 'user', timestamp: 5_000 },
      { role: 'assistant', timestamp: 4_000 },
    ], true, 10_000)

    expect(result.byUserIndex.get(0)).toEqual({ durationMs: 0, isLive: false })
    expect(result.totalMs).toBe(0)
  })
})

describe('formatTurnDuration', () => {
  it('formats sub-minute durations in seconds', () => {
    expect(formatTurnDuration(Number.NaN)).toBe('0s')
    expect(formatTurnDuration(0)).toBe('0s')
    expect(formatTurnDuration(800)).toBe('1s')
    expect(formatTurnDuration(12_400)).toBe('12s')
  })

  it('formats minute and hour scale durations compactly', () => {
    expect(formatTurnDuration(60_000)).toBe('1m')
    expect(formatTurnDuration(75_000)).toBe('1m 15s')
    expect(formatTurnDuration(3_600_000)).toBe('1h')
    expect(formatTurnDuration(3_700_000)).toBe('1h 1m')
  })
})
