import { describe, expect, it } from "vitest"
import { getErrorMessage, normalizeError } from "./error-utils"

describe("error-utils", () => {
  it("returns fallback for nullish thrown values", () => {
    expect(getErrorMessage(null, "Fallback message")).toBe("Fallback message")
    expect(getErrorMessage(undefined, "Fallback message")).toBe("Fallback message")
  })

  it("keeps explicit non-nullish error strings", () => {
    expect(getErrorMessage("Network timeout", "Fallback message")).toBe("Network timeout")
  })

  it("normalizes nullish values to Error with fallback message", () => {
    const normalizedNull = normalizeError(null, "Request failed")
    const normalizedUndefined = normalizeError(undefined, "Request failed")

    expect(normalizedNull).toBeInstanceOf(Error)
    expect(normalizedNull.message).toBe("Request failed")
    expect(normalizedUndefined).toBeInstanceOf(Error)
    expect(normalizedUndefined.message).toBe("Request failed")
  })
})
