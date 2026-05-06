export const ACTIVE_AGENTS_SIDEBAR_EXPANDED_STORAGE_KEY = "active-agents-sidebar-expanded"
export const SIDEBAR_TASKS_SECTION_EXPANDED_STORAGE_KEY = "sidebar-tasks-section-expanded"

export type BooleanPreferenceStorageLike = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export type BooleanPreferenceReadResult = {
  rawValue: string | null
  value: boolean
}

export type BooleanPreferenceWriteResult = {
  error?: string
  readBack?: string | null
  success: boolean
  value: string
}

function getDefaultBooleanPreferenceStorage(): BooleanPreferenceStorageLike | undefined {
  return (globalThis as { localStorage?: BooleanPreferenceStorageLike }).localStorage
}

export function readBooleanPreference(
  key: string,
  fallback: boolean,
  storage: BooleanPreferenceStorageLike | undefined = getDefaultBooleanPreferenceStorage(),
): BooleanPreferenceReadResult {
  if (!storage) return { rawValue: null, value: fallback }

  try {
    const rawValue = storage.getItem(key)
    return {
      rawValue,
      value: rawValue === null ? fallback : rawValue === "true",
    }
  } catch {
    return { rawValue: null, value: fallback }
  }
}

export function writeBooleanPreference(
  key: string,
  value: boolean,
  storage: BooleanPreferenceStorageLike | undefined = getDefaultBooleanPreferenceStorage(),
): BooleanPreferenceWriteResult {
  const serializedValue = String(value)
  if (!storage) {
    return {
      error: "storage unavailable",
      success: false,
      value: serializedValue,
    }
  }

  try {
    storage.setItem(key, serializedValue)
    return {
      readBack: storage.getItem(key),
      success: true,
      value: serializedValue,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      success: false,
      value: serializedValue,
    }
  }
}
