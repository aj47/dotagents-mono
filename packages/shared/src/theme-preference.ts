import type { ThemePreference } from "./api-types"

export type ThemePreferenceValue = ThemePreference
export type ResolvedThemePreference = "light" | "dark"

export type ThemePreferenceOption = {
  label: string
  value: ThemePreferenceValue
}

export type DesktopThemePreferenceFieldMetadata = {
  label: string
  pendingLabel: string
  formatSuccessMessage: (label: string) => string
  formatButtonAccessibilityLabel: (label: string) => string
}

export const THEME_PREFERENCE_VALUES: readonly ThemePreferenceValue[] = ["system", "light", "dark"]
export const DEFAULT_THEME_PREFERENCE: ThemePreferenceValue = "system"
export const THEME_PREFERENCE_OPTIONS: readonly ThemePreferenceOption[] = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
]
export const DESKTOP_THEME_PREFERENCE_FIELD_METADATA: DesktopThemePreferenceFieldMetadata = {
  label: "Desktop Theme",
  pendingLabel: "desktop theme",
  formatSuccessMessage: (label) => `Desktop theme set to ${label}.`,
  formatButtonAccessibilityLabel: (label) => `Set desktop theme to ${label}`,
}
export const DESKTOP_THEME_PREFERENCE_STORAGE_KEY = "theme-preference"
export const MOBILE_THEME_PREFERENCE_STORAGE_KEY = "dotagents-theme-preference"
export const THEME_PREFERENCE_CHANGED_EVENT = "theme-preference-changed"

export type ThemePreferenceStorageLike = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

function getDefaultThemePreferenceStorage(): ThemePreferenceStorageLike | undefined {
  return (globalThis as { localStorage?: ThemePreferenceStorageLike }).localStorage
}

export function isThemePreference(value: unknown): value is ThemePreferenceValue {
  return typeof value === "string" && (THEME_PREFERENCE_VALUES as readonly string[]).includes(value)
}

export function normalizeThemePreference(
  value: unknown,
  fallback: ThemePreferenceValue = DEFAULT_THEME_PREFERENCE,
): ThemePreferenceValue {
  return isThemePreference(value) ? value : fallback
}

export function resolveThemePreference(
  preference: ThemePreferenceValue,
  systemPrefersDark: boolean,
): ResolvedThemePreference {
  if (preference === "light") return "light"
  if (preference === "dark") return "dark"
  return systemPrefersDark ? "dark" : "light"
}

export function loadThemePreference(
  storage: ThemePreferenceStorageLike | undefined = getDefaultThemePreferenceStorage(),
  storageKey = DESKTOP_THEME_PREFERENCE_STORAGE_KEY,
): ThemePreferenceValue {
  if (!storage) return DEFAULT_THEME_PREFERENCE

  try {
    return normalizeThemePreference(storage.getItem(storageKey))
  } catch {
    return DEFAULT_THEME_PREFERENCE
  }
}

export function saveThemePreference(
  preference: ThemePreferenceValue,
  storage: ThemePreferenceStorageLike | undefined = getDefaultThemePreferenceStorage(),
  storageKey = DESKTOP_THEME_PREFERENCE_STORAGE_KEY,
): void {
  if (!storage) return

  try {
    storage.setItem(storageKey, preference)
  } catch {}
}
