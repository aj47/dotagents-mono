import { existsSync, mkdirSync, readFileSync } from "fs"
import { dirname } from "path"
import { safeWriteJsonFileSync } from "./agents-files/safe-file"
import { logApp } from "./debug"

export function loadPersistedJson<T>(filePath: string, label: string): T | undefined {
  try {
    if (!existsSync(filePath)) {
      return undefined
    }

    return JSON.parse(readFileSync(filePath, "utf8")) as T
  } catch (error) {
    logApp(`[${label}] Failed to load persisted state:`, error)
    return undefined
  }
}

export function savePersistedJson(filePath: string, value: unknown, label: string): void {
  try {
    mkdirSync(dirname(filePath), { recursive: true })
    safeWriteJsonFileSync(filePath, value)
  } catch (error) {
    logApp(`[${label}] Failed to persist state:`, error)
  }
}
