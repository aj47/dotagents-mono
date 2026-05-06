import { describe, expect, it, vi } from "vitest"
import {
  DEFAULT_THEME_PREFERENCE,
  DESKTOP_THEME_PREFERENCE_STORAGE_KEY,
  THEME_PREFERENCE_VALUES,
  isThemePreference,
  loadThemePreference,
  normalizeThemePreference,
  resolveThemePreference,
  saveThemePreference,
} from "./theme-preference"

function createStorage(seed: Record<string, string> = {}) {
  const store = new Map(Object.entries(seed))
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value)
    }),
  }
}

describe("theme preference", () => {
  it("validates known theme preference values", () => {
    expect(DEFAULT_THEME_PREFERENCE).toBe("system")
    expect(THEME_PREFERENCE_VALUES).toEqual(["system", "light", "dark"])
    expect(isThemePreference("system")).toBe(true)
    expect(isThemePreference("light")).toBe(true)
    expect(isThemePreference("dark")).toBe(true)
    expect(isThemePreference("blue")).toBe(false)
  })

  it("normalizes invalid theme preferences to the fallback", () => {
    expect(normalizeThemePreference("dark")).toBe("dark")
    expect(normalizeThemePreference("blue")).toBe("system")
    expect(normalizeThemePreference(undefined, "light")).toBe("light")
  })

  it("resolves system theme preferences from the system dark flag", () => {
    expect(resolveThemePreference("light", true)).toBe("light")
    expect(resolveThemePreference("dark", false)).toBe("dark")
    expect(resolveThemePreference("system", true)).toBe("dark")
    expect(resolveThemePreference("system", false)).toBe("light")
  })

  it("loads and saves theme preferences under the desktop storage key", () => {
    const storage = createStorage({
      [DESKTOP_THEME_PREFERENCE_STORAGE_KEY]: "dark",
    })

    expect(loadThemePreference(storage)).toBe("dark")
    saveThemePreference("light", storage)

    expect(storage.setItem).toHaveBeenCalledWith(DESKTOP_THEME_PREFERENCE_STORAGE_KEY, "light")
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

    expect(loadThemePreference(storage)).toBe("system")
    expect(() => saveThemePreference("dark", storage)).not.toThrow()
  })
})
