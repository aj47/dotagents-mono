import { describe, expect, it, vi } from "vitest"
import {
  SIDEBAR_STORAGE_KEY,
  clampSidebarWidth,
  clearPersistedSidebarState,
  loadPersistedSidebarState,
  parsePersistedSidebarState,
  savePersistedSidebarState,
} from "./sidebar-persistence"

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

describe("sidebar persistence", () => {
  it("clamps sidebar widths to the supported range", () => {
    expect(clampSidebarWidth(80)).toBe(120)
    expect(clampSidebarWidth(240)).toBe(240)
    expect(clampSidebarWidth(800)).toBe(400)
  })

  it("parses persisted sidebar state", () => {
    expect(parsePersistedSidebarState(JSON.stringify({ isCollapsed: true, width: 240 }))).toEqual({
      isCollapsed: true,
      width: 240,
    })
  })

  it("ignores invalid persisted sidebar state", () => {
    expect(parsePersistedSidebarState(null)).toBeNull()
    expect(parsePersistedSidebarState("{")).toBeNull()
    expect(parsePersistedSidebarState(JSON.stringify({ isCollapsed: true }))).toBeNull()
    expect(parsePersistedSidebarState(JSON.stringify({ isCollapsed: "true", width: 240 }))).toBeNull()
  })

  it("loads persisted sidebar state from storage", () => {
    const storage = createStorage({
      [SIDEBAR_STORAGE_KEY]: JSON.stringify({ isCollapsed: false, width: 220 }),
    })

    expect(loadPersistedSidebarState(storage)).toEqual({ isCollapsed: false, width: 220 })
  })

  it("saves persisted sidebar state under the sidebar key", () => {
    const storage = createStorage()

    savePersistedSidebarState({ isCollapsed: true, width: 220 }, storage)

    expect(storage.setItem).toHaveBeenCalledWith(
      SIDEBAR_STORAGE_KEY,
      JSON.stringify({ isCollapsed: true, width: 220 }),
    )
  })

  it("clears persisted sidebar state when present", () => {
    const storage = createStorage({
      [SIDEBAR_STORAGE_KEY]: JSON.stringify({ isCollapsed: false, width: 220 }),
    })

    expect(clearPersistedSidebarState(storage)).toBe(true)
    expect(storage.removeItem).toHaveBeenCalledWith(SIDEBAR_STORAGE_KEY)
    expect(clearPersistedSidebarState(storage)).toBe(false)
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

    expect(loadPersistedSidebarState(storage)).toBeNull()
    expect(() => savePersistedSidebarState({ isCollapsed: true, width: 220 }, storage)).not.toThrow()
    expect(clearPersistedSidebarState(storage)).toBe(false)
  })
})
