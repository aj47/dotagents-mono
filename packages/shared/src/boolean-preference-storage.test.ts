import { describe, expect, it, vi } from "vitest"
import {
  ACTIVE_AGENTS_SIDEBAR_EXPANDED_STORAGE_KEY,
  readBooleanPreference,
  writeBooleanPreference,
} from "./boolean-preference-storage"

function createStorage(seed: Record<string, string> = {}) {
  const store = new Map(Object.entries(seed))
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value)
    }),
  }
}

describe("boolean preference storage", () => {
  it("uses the fallback when a preference is missing", () => {
    expect(readBooleanPreference(ACTIVE_AGENTS_SIDEBAR_EXPANDED_STORAGE_KEY, true, createStorage())).toEqual({
      rawValue: null,
      value: true,
    })
  })

  it("reads true only from the string true", () => {
    expect(readBooleanPreference("preference", false, createStorage({ preference: "true" })).value).toBe(true)
    expect(readBooleanPreference("preference", true, createStorage({ preference: "false" })).value).toBe(false)
    expect(readBooleanPreference("preference", true, createStorage({ preference: "unexpected" })).value).toBe(false)
  })

  it("writes a serialized boolean preference and returns the readback", () => {
    const storage = createStorage()

    expect(writeBooleanPreference("preference", false, storage)).toEqual({
      readBack: "false",
      success: true,
      value: "false",
    })
    expect(storage.setItem).toHaveBeenCalledWith("preference", "false")
  })

  it("treats storage failures as non-fatal", () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new Error("blocked")
      }),
      setItem: vi.fn(() => {
        throw new Error("blocked")
      }),
    }

    expect(readBooleanPreference("preference", true, storage)).toEqual({
      rawValue: null,
      value: true,
    })
    expect(writeBooleanPreference("preference", true, storage)).toEqual({
      error: "blocked",
      success: false,
      value: "true",
    })
  })
})
