import { describe, expect, it, vi } from "vitest"
import {
  clearPersistedResizableSize,
  getResizableStorageKey,
  loadPersistedResizableSize,
  parsePersistedResizableSize,
  savePersistedResizableSize,
} from "./resizable-persistence"

function createStorage(seed: Record<string, string> = {}) {
  const store = new Map(Object.entries(seed))
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key)
    }),
  }
}

describe("resizable persistence", () => {
  it("namespaces storage keys", () => {
    expect(getResizableStorageKey("session-tile")).toBe("dotagents-resizable-session-tile")
  })

  it("parses persisted dimensions", () => {
    expect(parsePersistedResizableSize(JSON.stringify({ width: 777, height: 666 }))).toEqual({
      width: 777,
      height: 666,
    })
  })

  it("ignores invalid persisted dimensions", () => {
    expect(parsePersistedResizableSize(null)).toBeNull()
    expect(parsePersistedResizableSize("{")).toBeNull()
    expect(parsePersistedResizableSize(JSON.stringify({ width: 777 }))).toBeNull()
    expect(parsePersistedResizableSize(JSON.stringify({ width: "777", height: 666 }))).toBeNull()
  })

  it("loads persisted dimensions from storage", () => {
    const storage = createStorage({
      "dotagents-resizable-session-tile": JSON.stringify({ width: 777, height: 666 }),
    })

    expect(loadPersistedResizableSize("session-tile", storage)).toEqual({ width: 777, height: 666 })
  })

  it("saves persisted dimensions under the namespaced key", () => {
    const storage = createStorage()

    savePersistedResizableSize("session-tile", { width: 900, height: 840 }, storage)

    expect(storage.setItem).toHaveBeenCalledWith(
      "dotagents-resizable-session-tile",
      JSON.stringify({ width: 900, height: 840 }),
    )
  })

  it("clears persisted dimensions when present", () => {
    const storage = createStorage({
      "dotagents-resizable-session-tile": JSON.stringify({ width: 777, height: 666 }),
    })

    expect(clearPersistedResizableSize("session-tile", storage)).toBe(true)
    expect(storage.removeItem).toHaveBeenCalledWith("dotagents-resizable-session-tile")
    expect(clearPersistedResizableSize("session-tile", storage)).toBe(false)
  })

  it("treats storage failures as non-fatal", () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new Error("blocked")
      }),
      setItem: vi.fn(() => {
        throw new Error("blocked")
      }),
      removeItem: vi.fn(() => {
        throw new Error("blocked")
      }),
    }

    expect(loadPersistedResizableSize("session-tile", storage)).toBeNull()
    expect(() => savePersistedResizableSize("session-tile", { width: 900, height: 840 }, storage)).not.toThrow()
    expect(clearPersistedResizableSize("session-tile", storage)).toBe(false)
  })
})
