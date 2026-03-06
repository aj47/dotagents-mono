import { describe, expect, it } from "vitest"
import { normalizeApiBaseUrl } from "@dotagents/shared"

describe("normalizeApiBaseUrl", () => {
  it("adds scheme and /v1 for bare local remote-server URLs", () => {
    expect(normalizeApiBaseUrl("127.0.0.1:3210")).toBe("http://127.0.0.1:3210/v1")
  })

  it("preserves existing /v1 paths", () => {
    expect(normalizeApiBaseUrl("http://127.0.0.1:3210/v1")).toBe("http://127.0.0.1:3210/v1")
  })

  it("keeps explicit non-root paths unchanged", () => {
    expect(normalizeApiBaseUrl("api.example.com/custom-root")).toBe("https://api.example.com/custom-root")
  })
})