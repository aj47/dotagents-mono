import { describe, expect, it } from "vitest"
import { isRetryableError, normalizeApiBaseUrl } from "@dotagents/shared"

describe("normalizeApiBaseUrl", () => {
  it("adds scheme and /v1 for bare local remote-server URLs", () => {
    expect(normalizeApiBaseUrl("127.0.0.1:3210")).toBe("http://127.0.0.1:3210/v1")
  })

  it("uses http for bracketed IPv6 loopback remote-server URLs", () => {
    expect(normalizeApiBaseUrl("[::1]:3210")).toBe("http://[::1]:3210/v1")
  })

  it("uses http for bracketed local IPv6 network URLs", () => {
    expect(normalizeApiBaseUrl("[fd12:3456::5]:3210")).toBe("http://[fd12:3456::5]:3210/v1")
  })

  it("uses http for bracketed local IPv6 ULA URLs with short first hextets", () => {
    expect(normalizeApiBaseUrl("[fd1::1]:3210")).toBe("http://[fd1::1]:3210/v1")
  })

  it("does not treat malformed bracketed IPv6 URLs without a closing bracket as local", () => {
    expect(normalizeApiBaseUrl("[fd12::1")).toBe("https://[fd12::1")
  })

  it("preserves existing /v1 paths", () => {
    expect(normalizeApiBaseUrl("http://127.0.0.1:3210/v1")).toBe("http://127.0.0.1:3210/v1")
  })

  it("keeps explicit non-root paths unchanged", () => {
    expect(normalizeApiBaseUrl("api.example.com/custom-root")).toBe("https://api.example.com/custom-root")
  })

  it("keeps public IPv6 endpoints on https by default", () => {
    expect(normalizeApiBaseUrl("[2606:4700:4700::1111]"))
      .toBe("https://[2606:4700:4700::1111]/v1")
  })
})

describe("isRetryableError", () => {
  it("does not retry AbortError instances", () => {
    const abortError = new Error("The operation was aborted")
    abortError.name = "AbortError"

    expect(isRetryableError(abortError)).toBe(false)
  })

  it("still retries transient network failures", () => {
    expect(isRetryableError(new Error("Network request failed"))).toBe(true)
  })
})
