export const SIDEBAR_DIMENSIONS = {
  width: {
    default: 176,
    min: 120,
    max: 400,
    collapsed: 48,
  },
} as const

export const SIDEBAR_STORAGE_KEY = "dotagents-sidebar"

export type SidebarStorageLike = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export type SidebarState = {
  isCollapsed: boolean
  width: number
}

function getDefaultSidebarStorage(): SidebarStorageLike | undefined {
  return (globalThis as { localStorage?: SidebarStorageLike }).localStorage
}

export function clampSidebarWidth(width: number): number {
  return Math.min(SIDEBAR_DIMENSIONS.width.max, Math.max(SIDEBAR_DIMENSIONS.width.min, width))
}

export function parsePersistedSidebarState(stored: string | null): SidebarState | null {
  if (!stored) return null

  try {
    const parsed: unknown = JSON.parse(stored)
    if (!parsed || typeof parsed !== "object") return null

    const state = parsed as { isCollapsed?: unknown; width?: unknown }
    if (typeof state.isCollapsed === "boolean" && typeof state.width === "number") {
      return {
        isCollapsed: state.isCollapsed,
        width: state.width,
      }
    }
  } catch {
    return null
  }

  return null
}

export function loadPersistedSidebarState(
  storage: SidebarStorageLike | undefined = getDefaultSidebarStorage(),
): SidebarState | null {
  if (!storage) return null

  try {
    return parsePersistedSidebarState(storage.getItem(SIDEBAR_STORAGE_KEY))
  } catch {
    return null
  }
}

export function savePersistedSidebarState(
  state: SidebarState,
  storage: SidebarStorageLike | undefined = getDefaultSidebarStorage(),
): void {
  if (!storage) return

  try {
    storage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

export function clearPersistedSidebarState(
  storage: SidebarStorageLike | undefined = getDefaultSidebarStorage(),
): boolean {
  if (!storage) return false

  try {
    if (storage.getItem(SIDEBAR_STORAGE_KEY) === null) return false

    storage.removeItem(SIDEBAR_STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
