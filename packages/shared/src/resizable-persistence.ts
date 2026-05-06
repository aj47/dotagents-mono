export const RESIZABLE_STORAGE_KEY_PREFIX = "dotagents-resizable-"

export type ResizableStorageLike = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export type ResizableSize = {
  width: number
  height: number
}

export type PersistedResizableSize = {
  width?: number
  height?: number
}

function getDefaultResizableStorage(): ResizableStorageLike | undefined {
  return (globalThis as { localStorage?: ResizableStorageLike }).localStorage
}

export function getResizableStorageKey(storageKey: string): string {
  return `${RESIZABLE_STORAGE_KEY_PREFIX}${storageKey}`
}

export function parsePersistedResizableSize(stored: string | null): PersistedResizableSize | null {
  if (!stored) return null

  try {
    const parsed: unknown = JSON.parse(stored)
    if (!parsed || typeof parsed !== "object") return null

    const size = parsed as { width?: unknown; height?: unknown }
    if (typeof size.width === "number" && typeof size.height === "number") {
      return { width: size.width, height: size.height }
    }
  } catch {
    return null
  }

  return null
}

export function loadPersistedResizableSize(
  storageKey: string,
  storage: ResizableStorageLike | undefined = getDefaultResizableStorage(),
): PersistedResizableSize | null {
  if (!storage) return null

  try {
    return parsePersistedResizableSize(storage.getItem(getResizableStorageKey(storageKey)))
  } catch {
    return null
  }
}

export function savePersistedResizableSize(
  storageKey: string,
  size: ResizableSize,
  storage: ResizableStorageLike | undefined = getDefaultResizableStorage(),
): void {
  if (!storage) return

  try {
    storage.setItem(getResizableStorageKey(storageKey), JSON.stringify(size))
  } catch {}
}

export function clearPersistedResizableSize(
  storageKey: string,
  storage: ResizableStorageLike | undefined = getDefaultResizableStorage(),
): boolean {
  if (!storage) return false

  try {
    const fullKey = getResizableStorageKey(storageKey)
    if (storage.getItem(fullKey) === null) return false

    storage.removeItem(fullKey)
    return true
  } catch {
    return false
  }
}
