import { describe, expect, it } from "vitest"

import {
  OPERATOR_EMPTY_VALUE_LABEL,
  formatOperatorAuditDetails,
  formatOperatorAuditSource,
  formatOperatorDurationSeconds,
  formatOperatorLogSummary,
  formatOperatorTimestamp,
  formatOperatorYesNo,
  getOperatorTunnelStateLabel,
} from "./operator-display-utils"

describe("operator display utils", () => {
  it("formats timestamps with the empty fallback", () => {
    expect(formatOperatorTimestamp()).toBe(OPERATOR_EMPTY_VALUE_LABEL)
    expect(formatOperatorTimestamp(0)).toBe(OPERATOR_EMPTY_VALUE_LABEL)
    expect(formatOperatorTimestamp(Date.UTC(2026, 4, 6, 16, 30, 0))).toBeTruthy()
  })

  it("formats operator durations from seconds", () => {
    expect(formatOperatorDurationSeconds(45)).toBe("45s")
    expect(formatOperatorDurationSeconds(120)).toBe("2m")
    expect(formatOperatorDurationSeconds(3720)).toBe("1h 2m")
    expect(formatOperatorDurationSeconds(7200)).toBe("2h")
  })

  it("formats booleans and tunnel state labels", () => {
    expect(formatOperatorYesNo()).toBe(OPERATOR_EMPTY_VALUE_LABEL)
    expect(formatOperatorYesNo(true)).toBe("Yes")
    expect(formatOperatorYesNo(false)).toBe("No")
    expect(getOperatorTunnelStateLabel(null)).toBe("Unknown")
    expect(getOperatorTunnelStateLabel({ running: true, starting: false } as any)).toBe("Running")
    expect(getOperatorTunnelStateLabel({ running: false, starting: true } as any)).toBe("Starting")
    expect(getOperatorTunnelStateLabel({ running: false, starting: false } as any)).toBe("Stopped")
  })

  it("formats operator log summaries", () => {
    expect(formatOperatorLogSummary()).toBe(OPERATOR_EMPTY_VALUE_LABEL)
    expect(formatOperatorLogSummary({
      total: 12,
      errorCount: 2,
      warningCount: 3,
      infoCount: 7,
    })).toBe("12 total • 2 error • 3 warning • 7 info")
  })

  it("formats audit source and detail summaries", () => {
    expect(formatOperatorAuditSource({
      timestamp: 1,
      action: "rotate",
      path: "/operator",
      success: true,
      deviceId: "device-1",
      source: { ip: "127.0.0.1", origin: "app" },
    })).toBe("device-1 • 127.0.0.1 • app")

    expect(formatOperatorAuditDetails({
      ok: true,
      count: 2,
      nested: { value: "x" },
    })).toBe('ok: true • count: 2 • nested: {"value":"x"}')
    expect(formatOperatorAuditDetails()).toBeNull()
  })
})
