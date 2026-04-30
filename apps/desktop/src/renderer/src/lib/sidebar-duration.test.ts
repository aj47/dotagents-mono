import { describe, expect, it } from "vitest"

import { formatSidebarDuration } from "./sidebar-duration"

const NOW = Date.UTC(2026, 0, 15, 12, 0, 0)
const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR
const WEEK = 7 * DAY

describe("formatSidebarDuration", () => {
  it("returns null for missing or non-finite timestamps", () => {
    expect(formatSidebarDuration(0, NOW)).toBeNull()
    expect(formatSidebarDuration(Number.NaN, NOW)).toBeNull()
    expect(formatSidebarDuration(Number.POSITIVE_INFINITY, NOW)).toBeNull()
  })

  it("formats sub-hour durations in minutes", () => {
    expect(formatSidebarDuration(NOW, NOW)).toBe("0m")
    expect(formatSidebarDuration(NOW - 1 * MIN, NOW)).toBe("1m")
    expect(formatSidebarDuration(NOW - 5 * MIN, NOW)).toBe("5m")
    expect(formatSidebarDuration(NOW - 59 * MIN, NOW)).toBe("59m")
  })

  it("formats hour-scale durations with optional minutes", () => {
    expect(formatSidebarDuration(NOW - 1 * HOUR, NOW)).toBe("1h")
    expect(formatSidebarDuration(NOW - (2 * HOUR + 30 * MIN), NOW)).toBe("2h 30m")
    expect(formatSidebarDuration(NOW - 23 * HOUR, NOW)).toBe("23h")
    expect(formatSidebarDuration(NOW - (23 * HOUR + 59 * MIN), NOW)).toBe("23h 59m")
  })

  it("switches to day labels at the 24h boundary", () => {
    expect(formatSidebarDuration(NOW - 24 * HOUR, NOW)).toBe("1d")
    expect(formatSidebarDuration(NOW - (24 * HOUR + 1 * MIN), NOW)).toBe("1d")
    expect(formatSidebarDuration(NOW - (47 * HOUR + 59 * MIN), NOW)).toBe("1d")
    expect(formatSidebarDuration(NOW - 2 * DAY, NOW)).toBe("2d")
    expect(formatSidebarDuration(NOW - 6 * DAY, NOW)).toBe("6d")
  })

  it("does not roll a 23h59m duration into a day", () => {
    expect(formatSidebarDuration(NOW - (23 * HOUR + 59 * MIN), NOW)).not.toMatch(/d$/)
  })

  it("switches to week labels at the 7d boundary", () => {
    expect(formatSidebarDuration(NOW - 7 * DAY, NOW)).toBe("1w")
    expect(formatSidebarDuration(NOW - (7 * DAY + 1 * MIN), NOW)).toBe("1w")
    expect(formatSidebarDuration(NOW - (13 * DAY + 23 * HOUR), NOW)).toBe("1w")
    expect(formatSidebarDuration(NOW - 2 * WEEK, NOW)).toBe("2w")
    expect(formatSidebarDuration(NOW - 5 * WEEK, NOW)).toBe("5w")
  })

  it("clamps negative deltas (clock skew) to 0m", () => {
    expect(formatSidebarDuration(NOW + 5 * MIN, NOW)).toBe("0m")
  })
})
