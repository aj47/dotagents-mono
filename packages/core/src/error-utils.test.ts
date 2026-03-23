import { describe, expect, it } from "vitest"
import { getErrorMessage } from "./error-utils"

describe("error-utils", () => {
  it("appends nested transport details when the top-level API connection error is truncated", () => {
    const error = new Error("Cannot connect to API:", {
      cause: new Error("connect ECONNREFUSED 127.0.0.1:12345"),
    })

    expect(getErrorMessage(error, "Fallback message")).toBe(
      "Cannot connect to API: connect ECONNREFUSED 127.0.0.1:12345",
    )
  })

  it("keeps nested detail from generic error-like objects", () => {
    const error = {
      message: "Cannot connect to API:",
      cause: { message: "connect ECONNREFUSED 127.0.0.1:12345" },
    }

    expect(getErrorMessage(error, "Fallback message")).toBe(
      "Cannot connect to API: connect ECONNREFUSED 127.0.0.1:12345",
    )
  })

  it("does not duplicate nested detail already present in the top-level message", () => {
    const error = new Error("Cannot connect to API: connect ECONNREFUSED 127.0.0.1:12345", {
      cause: new Error("connect ECONNREFUSED 127.0.0.1:12345"),
    })

    expect(getErrorMessage(error, "Fallback message")).toBe(
      "Cannot connect to API: connect ECONNREFUSED 127.0.0.1:12345",
    )
  })

  it("appends nested socket detail for terminated transport errors", () => {
    const error = new TypeError("terminated", {
      cause: new Error("read ECONNRESET"),
    })

    expect(getErrorMessage(error, "Fallback message")).toBe("terminated: read ECONNRESET")
  })
})
