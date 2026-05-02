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

  it("unwraps nested error objects to show the user-facing message", () => {
    expect(
      getErrorMessage({ error: { message: "Invalid API key" } }, "Fallback message"),
    ).toBe("Invalid API key")
  })

  it("falls back to cause and errors arrays when top-level messages are empty", () => {
    const errorWithCause = new Error("", { cause: new Error("Tunnel connection failed") })
    const aggregateLikeError = { errors: [{ message: "Primary provider unavailable" }] }

    expect(getErrorMessage(errorWithCause, "Fallback message")).toBe("Tunnel connection failed")
    expect(getErrorMessage(aggregateLikeError, "Fallback message")).toBe("Primary provider unavailable")
  })

  it("uses the fallback when Error.cause forms a cycle", () => {
    const error = new Error("") as Error & { cause?: unknown }
    error.cause = error

    expect(getErrorMessage(error, "Fallback message")).toBe("Fallback message")
  })

  it("skips cyclic Error.errors entries and still finds later nested messages", () => {
    const error = new Error("") as Error & { errors?: unknown[] }
    error.errors = [error, new Error("Primary provider unavailable")]

    expect(getErrorMessage(error, "Fallback message")).toBe("Primary provider unavailable")
  })

  it("appends nested details when an error message is truncated", () => {
    const aggregateCause = new AggregateError(
      [new Error("connect ECONNREFUSED ::1:44444"), new Error("connect ECONNREFUSED 127.0.0.1:44444")],
      "",
    )
    const error = new Error("Cannot connect to API:") as Error & { cause?: unknown }
    error.cause = aggregateCause

    expect(getErrorMessage(error, "Fallback message")).toBe(
      "Cannot connect to API: connect ECONNREFUSED ::1:44444",
    )
  })

  it("pulls nested lastError details into retry wrapper messages", () => {
    const apiError = new Error("Cannot connect to API:") as Error & { cause?: unknown }
    apiError.cause = new AggregateError([new Error("connect ECONNREFUSED ::1:44444")], "")

    const retryError = new Error("Failed after 3 attempts. Last error: Cannot connect to API:") as Error & {
      lastError?: unknown
    }
    retryError.lastError = apiError

    expect(getErrorMessage(retryError, "Fallback message")).toBe(
      "Failed after 3 attempts. Last error: Cannot connect to API: connect ECONNREFUSED ::1:44444",
    )
  })

  it("appends nested socket detail for generic terminated transport errors", () => {
    const error = new TypeError("terminated", {
      cause: new Error("read ECONNRESET"),
    })

    expect(getErrorMessage(error, "Fallback message")).toBe("terminated: read ECONNRESET")
  })

  it("uses the fallback when a blank Error only stringifies to its constructor name", () => {
    expect(getErrorMessage(new Error(""), "Fallback message")).toBe("Fallback message")
    expect(getErrorMessage(new TypeError(""), "Fallback message")).toBe("Fallback message")
  })

  it("normalizes nullish values to Error with fallback message", () => {
    const normalizedNull = normalizeError(null, "Request failed")
    const normalizedUndefined = normalizeError(undefined, "Request failed")

    expect(normalizedNull).toBeInstanceOf(Error)
    expect(normalizedNull.message).toBe("Request failed")
    expect(normalizedUndefined).toBeInstanceOf(Error)
    expect(normalizedUndefined.message).toBe("Request failed")
  })

  it("normalizes nested error objects to a readable Error message", () => {
    const normalized = normalizeError({ error: { message: "Provider returned 401" } }, "Request failed")

    expect(normalized).toBeInstanceOf(Error)
    expect(normalized.message).toBe("Provider returned 401")
  })

  it("rewraps blank Error instances with a readable nested cause message", () => {
    const original = new TypeError("", { cause: new Error("Streaming request failed") })

    const normalized = normalizeError(original, "Fallback message")

    expect(normalized).toBeInstanceOf(Error)
    expect(normalized).not.toBe(original)
    expect(normalized.name).toBe("TypeError")
    expect(normalized.message).toBe("Streaming request failed")
    expect((normalized as Error & { cause?: unknown }).cause).toBe(original)
  })

  it("rewraps blank Error instances with the fallback message when no nested details exist", () => {
    const original = new Error("")

    const normalized = normalizeError(original, "Fallback message")

    expect(normalized).toBeInstanceOf(Error)
    expect(normalized).not.toBe(original)
    expect(normalized.message).toBe("Fallback message")
    expect((normalized as Error & { cause?: unknown }).cause).toBe(original)
  })
})
